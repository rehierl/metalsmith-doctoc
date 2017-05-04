
/* global Infinity */

"use strict";

const is = require("is");

const PluginDefault = require("./PluginDefault.js");

module.exports = Options;

//========//========//========//========//========//========//========//========

function Options() {
  //- ignore any file that does not match this pattern
  this.pattern = "**";
  
  //- if a file has a doctocFlag property, then the file is
  //  considered to be marked as "to be processed"
  //- set true to use the default configuration
  //- ignore any file that does not have this property
  this.doctocFlag = "doctoc";
  
  //- set true to ignore all doctocFlag values
  //  and to use the default configuration
  //- acts as if each file had (file.doctocFlag === true)
  this.ignoreFlag = false;
  
  this.plugins = {
    "doctoc-1": "doctoc-default",
    "doctoc-2": { plugin: "doctoc-default", options: {} },
    
    "doctoc-3": require("./PluginDefault.js"),
    "doctoc-4": { plugin: require("./PluginDefault.js"), options: {} },
    
    "doctoc-5": PluginDefault,//- same as 3
    //"doctoc-6": new PluginDefault({}),//- not allowed
    "doctoc-7": { plugin: PluginDefault, options: {} },//- same as 4
    "doctoc-8": { plugin: new PluginDefault({}) },
    "doctoc-9": { plugin: new PluginDefault({}), options: {} },
  };
  
  //- the plugin configuration to use by default
  //- this.plugins[this.default] must exist
  this.default = "doctoc-1";
  
  //- to which file metadata property to attach the
  //  table-of-contents tree
  //- which will replace the value of file[doctocFlag] if
  //  (options.doctocFlag === options.doctocTree)!
  this.doctocTree = "doctoc";
}

//========//========//========//========//========//========//========//========

Options.prototype.combine = function (userOptions) {
  {//- acceptance of non-object arguments
    if(arguments.length === 0) {
      //- don't use any non-default options
      userOptions = {};
    }
  }
  
  //- now, userOptions must be an object
  if(!is.object(userOptions)) {
    throw new TypeError("invalid options argument");
  }
  
  {//- validation of userOptions properties
    //- properties are tested if, and only if,
    //  they exist *and* if their value is not undefined
    let value = undefined;
    
    //- options.fileLimit
    
    if(userOptions.hasOwnProperty("fileLimit")) {
      value = userOptions.fileLimit;
      
      if(!is.int(value)) {
        throw new TypeError("options.fileLimit must be an integer value");
      }
      
      if(value === Infinity) {
        value = 0;
      } else if(value === -Infinity) {
        value = 0;
      } else if(value < 0) {
        value = 0;
      }
      
      userOptions.fileLimit = value;
    }
    
    //- options.doctocFlag
    
    if(userOptions.hasOwnProperty("doctocFlag")) {
      value = userOptions.doctocFlag;
      
      if(!is.string(value)) {
        throw new TypeError("options.doctocFlag must be a string");
      }
      
      value = value.trim();
      
      if(value.length <= 0) {
        throw new TypeError("options.doctocFlag must be a non-empty string");
      }
     
      userOptions.doctocFlag = value;
    }
  }
  
  {//- override the default settings
    let thisInstance = this;
    
    Object.keys(this).forEach(function(current, index, array) {
      //- if userOptions has a property, then use it;
      //  this incldues any 'undefined' values
      if(userOptions.hasOwnProperty(current)) {
        thisInstance[current] = userOptions[current];
      }
    });
  }
};
