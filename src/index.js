
"use strict";

//- require node modules
const is = require("is");
const util = require("util");
const multimatch = require("multimatch");

//- require local files
const Options = require("./Options.js");

//- plugin exports
module.exports = plugin;

//========//========//========//========//========//========//========//========

function plugin(userOptions) {
  const options = new Options();
  options.combine(userOptions);
  
  //- after:  settings.plugins := { ($configName: $definition)* }
  //  where definition := { plugin: $instance (, options: $options)?, ...}
  initializePlugins(options);
  
  return function main(files, metalsmith, done) {
    let keys = multimatch(Object.keys(files), options.pattern);
    
    for(let ix=0, ic=keys.length; ix<ic; ix++) {
      let filename = keys[ix];
      let file = files[filename];
      
      try {
        //- false - ignore this file
        //- true - use the default worker with non-file specific options
        //- config := { config: $configName (, options: $options)? }
        let flagValue = getFlagValue(filename, file, options);
        if(flagValue === false) continue;

        //- config := one of the settings.plugins $definition entries
        //- this will also apply flagValue.options (if available)
        let config = selectConfig(filename, flagValue, options);
        let instance = config.plugin;

        //- process the current file
        let root = instance.run(filename, file);
        
        //- finalize the tree structure
        finalizeDocTocTree(root);
        
        //- assign the tree to the selected property
        file[options.doctocTree] = root;
      } catch(error) {
        done(error);
        return;
      }
    }
    
    done();
  };
}

//========//========//========//========//========//========//========//========

function finalizeDocTocTree(root) {
  //- do final operations
}

//========//========//========//========//========//========//========//========

//- before: see description of Options.plugins
//- after:  settings.plugins := { ($configName: $definition)* }
//  where definition := { plugin: $instance (, options: $options)?, ...}
function initializePlugins(options) {
  let keys = Object.keys(options.plugins);
  
  for(let ix=0, ic=keys.length; ix<ic; ix++) {
    let configName = keys[ix];
    let definition = options.plugins[configName];
    
    //### turn ($name | $class) into $definition
    
    if(is.string(definition)) {
      //- the name of an integrated plugin
      definition = { plugin: definition };
      options.plugins[configName] = definition;
    }
    
    else if(is.fn(definition)) {
      //- a class type function
      definition = { plugin: definition };
      options.plugins[configName] = definition;
    }
    
    else if(!is.object(definition)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] has an invalid value", configName
      ));
    }
    
    else if(!definition.hasOwnProperty("plugin")) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] must have a plugin property", configName
      ));
    }
    
    //### initialize $definition.plugin
    
    let plugin = definition.plugin;
    
    if(is.string(plugin)) {
      try {//- the name of an integrated plugin
        plugin = resolveNameOfIntegratedPlugin(plugin);
        definition.plugin = plugin;
      } catch(error) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin: unknown identifier", configName
        ));
      }
    }
    
    if(is.fn(plugin)) {
      try {//- a class type function
        plugin = new plugin();
        definition.plugin = plugin;
      } catch(error) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin: failed to initialize", configName
        ));
      }
    }
    
    if(!is.object(plugin)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s].plugin must be an object", configName
      ));
    }
    
    //### apply $definition.options
    
    if(definition.hasOwnProperty("options")) {
      plugin.applyDefaultOptions(definition.options);
    }
  }//- for
}

//========//========//========//========//========//========//========//========

function resolveNameOfIntegratedPlugin(reference) {
  if(reference === "doctoc-default") {
    return require("./DefaultPlugin.js");
  }
  throw new Error(util.format(
    "doctoc: [%s] is an invalid plugin reference", reference
  ));
}

//========//========//========//========//========//========//========//========

//returns
//- false - ignore this file
//- true - use the default plugin with non-file specific options
//- config := { config: $configName (, options: $options)? }
function getFlagValue(filename, file, options) {
  if(options.ignoreFlag) {
    return true;//- use the default plugin
  }
  
  else if(!file.hasOwnProperty(options.doctocFlag)) {
    return false;//- ignore this file
  }
  
  let flagName = options.doctocFlag;
  let flagValue = file[flagName];
  
  if(flagValue === true) {
    return true;//- use the default plugin
  }
  
  else if (flagValue === false) {
    return false;//- ignore this file
  }
  
  else if(is.string(flagValue)) {
    //- use the specified plugin
    //  with non-file specific options
    return { config: flagValue };
  }
  
  if(is.object(flagValue)) {
    if(!flagValue.hasOwnProperty("config")) {
      throw new Error(util.format(
        "doctoc [%s]: file[%s] object must have a 'config' property",
        filename, flagName
      ));
    }
    
    if(!is.string(flagValue.config)) {
      throw new Error(util.format(
        "doctoc [%s]: file[%s].config must be a string value",
        filename, flagName
      ));
    }
    
    return flagValue;
  }
  
  throw new Error(util.format(
    "doctoc [%s]: file[%s] has an invalid value",
    filename, flagName
  ));
}

//========//========//========//========//========//========//========//========

//flagValue
//- true - default worker with non-file specific options
//- config := { config: $configName (, options: $options)? }
//returns
//- definition := one of the settings.plugins $definition entries
//- this will also apply flagValue.options (if available)
function selectConfig(filename, flagValue, options) {
  if(flagValue === true) {
    flagValue = { config: options.default };
  }
  
  let configName = flagValue.config;
  
  if(!options.plugins.hasOwnProperty(configName)) {
    throw new Error(util.format(
      "doctoc [%s]: file[%s].config has an invalid value",
      filename, options.doctocFlag
    ));
  }
  
  let definition = options.plugins[configName];
  
  if(flagValue.hasOwnProperty("options")) {
    definition.plugin.applyFileOptions(filename, flagValue.options);
  }
  
  return definition;
}
