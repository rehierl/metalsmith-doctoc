
"use strict";

//- require node modules
const is = require("is");
const util = require("util");
const multimatch = require("multimatch");

//- require local files
const Options = require("./Options.js");
const Proxy = require("./Proxy.js");

//- plugin exports
module.exports = plugin;

//========//========//========//========//========//========//========//========

function plugin(userOptions) {
  const options = new Options();
  options.combine(userOptions);
  
  //- after this call:
  //  settings.plugins := { ($configName: $proxy)* }
  //  i.e. each plugins entry holds a proxy wrapper
  initializePlugins(options);
  
  return function main(files, metalsmith, done) {
    let keys = multimatch(Object.keys(files), options.filter);
    
    for(let ix=0, ic=keys.length; ix<ic; ix++) {
      let filename = keys[ix];
      let file = files[filename];
      
      try {
        //flagValue
        //- false - ignore this file
        //- true - use the default plugin with non-file specific options
        //- { config: $configName (, options: $options)? }
        let flagValue = getFlagValue(filename, file, options);
        if(flagValue === false) continue;

        //- proxy := one of the options.plugins $proxy entries
        //- this will also apply flagValue.options (if available);
        //  which must be done here in case of (flagValue === true)
        let proxy = selectProxy(filename, flagValue, options);

        //- process the current file
        let root = proxy.run(filename, file);
        
        //- assign the tree to the selected property
        //- root - the root node of the document's toc menu tree
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

//- before: see Options.plugins
//- after:  options.plugins := { ($configName: $proxy)* }
function initializePlugins(options) {
  let keys = Object.keys(options.plugins);
  
  for(let ix=0, ic=keys.length; ix<ic; ix++) {
    let configName = keys[ix];
    let definition = options.plugins[configName];
    
    //### turn ($name | $class) into $definition
    
    if(is.string(definition)) {
      //- the name of an integrated plugin
      definition = { plugin: definition };
    }
    
    else if(is.fn(definition)) {
      //- a class type function
      definition = { plugin: definition };
    }
    
    else if(!is.object(definition)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] "
        + "has an invalid value",
        configName
      ));
    }
    
    else if(!definition.hasOwnProperty("plugin")) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] "
        + "must have a plugin property",
        configName
      ));
    }
    
    //### initialize $definition.plugin
    
    let plugin = definition.plugin;
    
    if(is.string(plugin)) {
      let reference = plugin;
      
      try {//- the name of an integrated plugin
        plugin = resolvePluginReference(reference, options);
      } catch(error) {
        let newError = new Error(util.format(
          "doctoc: options.plugins[%s].plugin: "
          + "failed to resolve the given plugin reference",
          configName
        ));
        newError.innerError = error;
        throw newError;
      }
      
      if(!is.fn(plugin) && !is.object(plugin)) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin: "
          + "failed to resolve the given plugin reference",
          configName
        ));
      }
    }
    
    if(is.fn(plugin)) {
      try {//- a class type function
        plugin = new plugin();
      } catch(error) {
        let newError = new Error(util.format(
          "doctoc: options.plugins[%s].plugin: "
          + "failed to initialize the given plugin",
          configName
        ));
        newError.innerError = error;
        throw newError;
      }
    }
    
    if(!is.object(plugin)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s].plugin "
        + "has an invalid value",
        configName
      ));
    }
    
    //### replace $definition.plugin with $proxy
    
    let proxy = new Proxy(configName, plugin);
    
    //- apply options.plugins[X].options
    if(definition.hasOwnProperty("options")) {
      proxy.applyDefaultOptions(definition.options);
    }
    
    options.plugins[configName] = proxy;
  }//- for
}

//========//========//========//========//========//========//========//========

function resolvePluginReference(reference, options) {
  //### test for integrated plugins
  
  if(reference === "doctoc-default") {
    return require("./doctoc-default/Plugin.js");
  }
  
  if(options.enableRequire === true) {
    try {
      return require(reference);
    } catch(error) {
      if(options.resolveFunc) {
        //- ignore this error here and hope that the user
        //  solves this issue in resolveFunc()
      } else {
        throw error;
      }
    }
  }
  
  //### not an integrated plugin
  
  if(options.resolveFunc) {
    return options.resolveFunc(reference);
  }
}

//========//========//========//========//========//========//========//========

//returns
//- false - ignore this file
//- true  - use the default plugin with non-file specific options
//- { config: $configName (, options: $options)? }
function getFlagValue(filename, file, options) {
  if(options.ignoreFlag) {
    return true;//- use the default plugin
  }
  
  let flagName = options.doctocFlag;
  
  if(!file.hasOwnProperty(options.doctocFlag)) {
    return false;//- ignore this file
  }
  
  let flagValue = file[flagName];
  
  if (flagValue === false) {
    return false;//- ignore this file
  }
  
  else if(flagValue === true) {
    return true;//- use the default plugin
  }
  
  else if(is.string(flagValue)) {
    //- use the specified plugin
    //  with non-file specific options
    return { config: flagValue };
  }
  
  if(!is.object(flagValue)) {
    throw new Error(util.format(
      "doctoc [%s]: file[%s] has an invalid value",
      filename, flagName
    ));
  }
  
  if(!flagValue.hasOwnProperty("config")) {
    throw new Error(util.format(
      "doctoc [%s]: file[%s] must have a 'config' property",
      filename, flagName
    ));
  }

  if(!is.string(flagValue.config)) {
    throw new Error(util.format(
      "doctoc [%s]: file[%s].config must have a string value",
      filename, flagName
    ));
  }

  return flagValue;
}

//========//========//========//========//========//========//========//========

//flagValue
//- true - use the default plugin with non-file specific options
//- { config: $configName (, options: $options)? }
//returns
//- one of the settings.plugins $proxy entries
//- this will also apply flagValue.options (if available)
function selectProxy(filename, flagValue, options) {
  if(flagValue === true) {
    flagValue = { config: options.default };
  }
  
  let configName = flagValue.config;
  let plugins = options.plugins;
  
  if(!plugins.hasOwnProperty(configName)) {
    throw new Error(util.format(
      "doctoc [%s].[%s]: unknown $configName reference",
      filename, options.doctocFlag
    ));
  }
  
  let proxy = plugins[configName];
  
  //- apply file[doctocFlag].options
  if(flagValue.hasOwnProperty("options")) {
    let options = flagValue.options;
    proxy.applyFileOptions(filename, options);
  }
  
  return proxy;
}
