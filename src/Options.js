
/* global Infinity */

"use strict";

const is = require("is");

module.exports = Options;

//========//========//========//========//========//========//========//========

//file[options.doctocFlag] := (false | true | $configName | $config)
//- false := ignore this file
//- true := use the default worker with non-file specific options
//- $configName := one of Object.keys(options.plugins)
//- $config := { config: $configName (, options: $options)? }
//- $options := anything accepted by $instance.applyFileOptions()
//  used as file-specific configuration of the referenced plugin

//========//========//========//========//========//========//========//========

function Options() {
  //- ignore any file that does not multimatch this pattern
  //- string or an array of strings
  this.pattern = "**";

  //- set true to ignore all doctocFlag values
  //  and to use the default configuration
  //- acts as if each file had (file.doctocFlag === true)
  this.ignoreFlag = false;

  //- if a file has a doctocFlag property, then the file is
  //  considered to be marked as "to be processed"
  //- set true to use the default configuration
  //- ignore any file that does not have this property
  this.doctocFlag = "doctoc";

  //- the plugin configuration to use by default
  //- this.plugins[this.default] must exist
  //- this.plugins must have an entry
  //  with ($configName == this.default)
  this.default = "default";

  //- this.plugins := { ($configName: $config)* }
  //- $configName := associated this name with $config
  //- $config := ($name | $class | $definition)
  //- $name := the name of an integrated plugin
  //  currently, the only allowed value is: 'default'
  //- $class := a class type function, that
  //  must support 'instance = new $class()' expressions,
  //- $definition := { plugin: $plugin (, options: $options)? }
  //  must have a 'plugin' property,
  //  may have an 'options' property,
  //  any other properties will be ignored
  //- $plugin := ($name | $class | $instance)
  //- $instance := objects resulting from a 'new $class()' expression
  //- $options := anything accepted by $class.applyDefaultOptions()
  this.plugins = {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  };
  
  //- ($class|$instance) function(string reference)
  //- a function used to resolve plugin references
  //- called if $config or $plugin is a $name and if
  //  that name does not refer to an integrated plugin
  //- the most simplistic way to implement such a
  //  function would be: 'return require(reference)'
  this.resolveFunc = undefined;

  //- to which file metadata property to attach the
  //  table-of-contents tree
  //- which will replace the value of file[doctocFlag] if
  //  (options.doctocFlag === options.doctocTree)!
  this.doctocTree = "doctoc";
};

//========//========//========//========//========//========//========//========
  
Options.prototype.combine = function(userOptions) {
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
