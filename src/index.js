
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

function plugin(options) {
  const settings = new Options();
  settings.combine(options);
  
  initializePlugins(settings);
  
  return function main(files, metalsmith, done) {
    let keys = multimatch(Object.keys(files), settings.pattern);
    
    for(let ix=0, ic=keys.length; ix<ic; ix++) {
      let filename = keys[ix];
      let file = files[filename];
      
      try {
        //- false - ignore this file
        //- true - use the default worker with non-file specific options
        //- config := { config: $configName (, options: $options)? }
        let flagValue = getFlagValue(filename, file, settings);
        if(flagValue === false) continue;

        //- plugin := one of the settings.plugins instances
        //  after applying flagValue.options (if available)
        let plugin = selectPlugin(filename, flagValue, settings);

        //- process the current file
        let result = plugin.run(filename, file);
        
        //- write the tree to the selected property
        file[settings.doctocTree] = result;
      } catch(error) {
        done(error);
        return;
      }
    }
    
    done();
  };
}

//========//========//========//========//========//========//========//========

//- before: settings.plugins as described in Options.plugins
//- after:  settings.plugins := { ($configName: $instance)* }
function initializePlugins(settings) {
  let keys = Object.keys(settings.plugins);
  
  for(let ix=0, ic=keys.length; ix<ic; ix++) {
    let configId = keys[ix];
    let config = settings.plugins[configId];
    
    //### turn ($name | $class) into $definition
    
    if(is.string(config)) {
      //- name of an integrated plugin
      config = { plugin: config };
    }
    
    else if(is.fn(config)) {
      //- a class type function
      config = { plugin: config };
    }
    
    else if(!is.object(config)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] has an invalid value", configId
      ));
    }
    
    else if(!config.hasOwnProperty("plugin")) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] must have a plugin property", configId
      ));
    }
    
    //### initialize $definition.plugin
    
    let plugin = config.plugin;
    
    if(is.string(plugin)) {
      try {//- name of an integrated plugin
        plugin = resolvePluginReference(plugin);
      } catch(error) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin: unknown identifier", configId
        ));
      }
    }
    
    if(is.fn(plugin)) {
      try {//- a class type function
        plugin = new plugin();
      } catch(error) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin: failed to initialize", configId
        ));
      }
    }
    
    if(!is.object(plugin)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s].plugin must be an object", configId
      ));
    }
    
    //### apply $definition.options
    
    if(config.hasOwnProperty("options")) {
      plugin.applyDefaultOptions(config.options);
    }
    
    //### replace $config with $definition.plugin
    
    settings.plugins[configId] = plugin;
  }//- for
}

//========//========//========//========//========//========//========//========

function resolvePluginReference(reference) {
  if(reference === "doctoc-default") {
    return require("./PluginDefault.js");
  }
  throw new Error(util.format(
    "doctoc: [%s] is an invalid plugin reference", reference
  ));
}

//========//========//========//========//========//========//========//========

//returns
//- false - ignore this file
//- true - use the default worker with non-file specific options
//- config := { config: $configName (, options: $options)? }
function getFlagValue(filename, file, settings) {
  if(settings.ignoreFlag) {
    return true;
  }
  
  else if(!file.hasOwnProperty(settings.doctocFlag)) {
    //- ignore this file
    return false;
  }
  
  let flagName = settings.doctocFlag;
  let flagValue = file[flagName];
  
  if(flagValue === true) {
    return true;
  }
  
  else if (flagValue === false) {
    //- ignore this file
    return false;
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
//- one of the settings.plugins instances
//  after applying flagValue.options (if available)
function selectPlugin(filename, flagValue, settings) {
  if(flagValue === true) {
    flagValue = { config: settings.default };
  }
  
  let configName = flagValue.config;
  
  if(!settings.plugins.hasOwnProperty(configName)) {
    throw new Error(util.format(
      "doctoc [%s]: file[%s].config has an invalid value",
      filename, settings.doctocFlag
    ));
  }
  
  let plugin =  settings.plugins[configName];
  
  if(flagValue.hasOwnProperty("options")) {
    plugin.applyFileOptions(flagValue.options);
  }
  
  return plugin;
}
