
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
  
  return function main(files, metalsmith, done) {
    let keys = multimatch(Object.keys(files), settings.pattern);
    
    keys.forEach(function(filename, index, array) {
      let file = files[filename];
      let flagValue = getFlagValue(filename, file, settings);
      
      let worker = selectWorker(filename, flagValue, settings);
      let result = worker(filename, file);
      
      file[settings.doctocTree] = result;
    });
  };
}

//========//========//========//========//========//========//========//========

function getFlagValue(filename, file, settings) {
  if(!file.hasOwnProperty(settings.doctocFlag)) {
    //- use the default worker with default settings
    return true;
  }
  
  let flagValue = file[settings.doctocFlag];
  
  if(flagValue === true) {
    //- use the default worker with default settings
    return true;
  }
  
  if(flagValue === false) {
    //- ignore this file
    return false;
  }
  
  if(is.string(flagValue)) {
    //- use the specified plugin with default options
    return { plugin: flagValue, options: {} };
  }
  
  if(is.object(flagValue)) {
    return flagValue;
  }
  
  
}

//========//========//========//========//========//========//========//========

function selectWorker(filename, flagValue, settings) {
  return;
}
