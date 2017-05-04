
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
        //- true - default worker with non-file specific options
        //- object - { plugin: "plugin-name" (, options: plugin-options)? }
        let flagValue = getFlagValue(filename, file, settings);
        
        if(flagValue === false) {
          //- ignore this file
          continue;
        }

        //flagValue
        //- true - default worker with non-file specific options
        //- object - { plugin: "plugin-name" (, options: plugin-options)? }
        let worker = selectWorker(filename, flagValue, settings);

        let result = worker(filename, file);
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

function initializePlugins(settings) {
  let keys = Object.keys(settings.plugins);
  
  for(let ix=0, ic=keys.length; ix<ic; ix++) {
    let configId = keys[ix];
    let config = settings.plugins[configId];
    
    if(is.string(config)) {
      config = { plugin: config };
      settings.plugins[configId] = config;
    }
    
    if(is.fn(config)) {
      //- e.g. plugins = { "name": require("...") }
      config = { plugin: config };
      settings.plugins[configId] = config;
    }
    
    if(!is.object(config)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] has an invalid value", configId
      ));
    }
    
    if(!config.hasOwnProperty("plugin")) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s] must have a plugin property", configId
      ));
    }
    
    let plugin = config.plugin;
    
    if(is.string(plugin)) {
      try {
        plugin = requirePlugin(plugin);
        config.plugin = plugin;
      } catch(error) {
        throw new Error(util.format(
          "doctoc: options.plugins[%s].plugin cannot be resolved", configId
        ));
      }
    }
    
    if(is.fn(plugin)) {
      
    }
    
    if(!is.object(plugin)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s].plugin must be an object", configId
      ));
    }
    
    plugin.setDefaultOptions(config.options);
  }
}

//========//========//========//========//========//========//========//========

function requirePlugin(reference) {
  let pluginModule = undefined;
  
  if(reference === "doctoc-default") {
    pluginModule = require("./DocTocDefault.js");
  } else {
    pluginModule = require(reference);
  }
  
  return new pluginModule();
}

//========//========//========//========//========//========//========//========

function getFlagValue(filename, file, settings) {
  if(settings.ignoreFlag) {
    //- use the default worker with non-file specific options
    return true;
  }
  
  if(!file.hasOwnProperty(settings.doctocFlag)) {
    //- ignore this file
    return false;
  }
  
  let flagName = settings.doctocFlag;
  let flagValue = file[flagName];
  
  if(flagValue === true) {
    //- use the default worker with non-file specific options
    return true;
  }
  
  if(flagValue === false) {
    //- ignore this file
    return false;
  }
  
  if(is.string(flagValue)) {
    //- use the specified plugin
    //  with non-file specific options
    return { plugin: flagValue };
  }
  
  if(is.object(flagValue)) {
    if(!flagValue.hasOwnProperty("plugin")) {
      throw new Error(util.format(
        "doctoc [%s]: file[%s] object must have a 'plugin' property",
        filename, flagName
      ));
    }
    
    let flagPluginValue = flagValue.plugin;
    
    if(!is.string(flagPluginValue)) {
      throw new Error(util.format(
        "doctoc [%s]: file[%s].plugin must have a string value",
        filename, flagName
      ));
    }
    
    //- used for file-specific options that will be passed
    //  on to the worker selected by flagValue.plugin
    //- flagValue.options may exist, but does not have to
    //- it also is specific to the plugin, which values it
    //  will accept as options
    //flagValue.options
    
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
//- object - { plugin: "plugin-name" (, options: plugin-options)? }
function selectWorker(filename, flagValue, settings) {
  if(flagValue === true) {
    //- use the default worker with non-file specific options
    flagValue = { plugin: settings.default };
  }
  
  let reference = flagValue.plugin;
  
}
