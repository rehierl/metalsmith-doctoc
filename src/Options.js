
/* global Infinity */

"use strict";

const is = require("is");
const util = require("util");

module.exports = Options;

//========//========//========//========//========//========//========//========

//file[options.doctocFlag] := $value
//- $value := (false | true | $configName | $config)
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
  this.filter = "**";

  //- if a file has a doctocFlag metadata property, the file
  //  is considered to be marked as "to be processed".
  //- assign the boolean value 'true' to use the default plugin.
  //- any file that does not have this property will be ignored.
  this.doctocFlag = "doctoc";

  //- assign the boolean value 'true' to ignore any doctocFlag
  //  metadata property and to use the default plugin
  //- this will act as if each file had (file[doctocFlag] == true)
  this.ignoreFlag = false;

  //- plugins := { ($configName: $config)* }
  //  i.e. the plugins option holds named configurations
  //- $configName := a name associated with this $config
  //- $config := ($name | $class | $definition)
  //  i.e. either a $name, a $class, or a $definition
  //- $name := the name of an integrated plugin.
  //  currently, only "doctoc-default" is supported.
  //  Options.resolveFunc($name) will be executed in case
  //  a name is not supported.
  //- $class := a class type function, that must support
  //  '$instance = new $class()' expressions.
  //- $definition := { plugin: $plugin, (, options: $options)? }
  //  there must be a $plugin property, but there may be
  //  an optional $options property. any other property will
  //  be ignored.
  //- $plugin := ($name | $class | $instance)
  //  i.e. either a $name, a $class function, or an $instance
  //- $instance := objects returned by a 'new $class()' expression
  //- $options := anything that is accepted by the plugin's
  //  $class.applyDefaultOptions() method.
  this.plugins = {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  };

  //- the plugin configuration to use by default
  //- this.plugins[this.default] must exist
  //- this.plugins must have an entry
  //  with ($configName == this.default)
  this.default = "default";
  
  //- when metalsmith-doctoc concludes that $name is
  //  not the name of an integrated plugin, it will
  //  try to execute options.resolveFunc($name)
  //- set this property to boolean 'true' to let
  //  metalsmith-doctoc try to execute require($name)
  //  before options.resolveFunc($name) is executed
  //- define options.resovleFunc if you use this property!
  this.enableRequire = false;

  //- a function that has the following signature:
  //  ($class | $instance) function(string $name)
  //- assign a function that resolves the given $name
  //  to a $class function or a plugin $instance
  //- a "resolveFunc = require," could work if require()
  //  is able to find the given plugin
  //- "resolveFunc = function(name){ return require(name); }
  //  is the same except that require() will use a different
  //  folder to begin with.
  this.resolveFunc = undefined;

  //- to which file metadata property to attach the resulting
  //  table-of-contents tree.
  //- this will replace the value of file[doctocFlag] if
  //  (options.doctocFlag == options.doctocTree)!
  this.doctocTree = "doctoc";
};

//========//========//========//========//========//========//========//========
  
Options.prototype.combine = function(options) {
  if(arguments.length === 0) {
    //- ignore this call
    return;
  }

  if(!is.object(options)) {
    throw new TypeError("invalid options argument");
  }

  validateOptions(options);
  const thisInstance = this;
  
  Object.getOwnPropertyNames(this)
  .forEach(function(current, index, array) {
    if(options.hasOwnProperty(current)) {
      thisInstance[current] = options[current];
    }
  });
};

//========//========//========//========//========//========//========//========

function validateOptions(options) {
  let key = undefined;

  //- non-empty string values
  ["doctocFlag", "default", "doctocTree"]
  .forEach(function(current, index, array) {
    if(options.hasOwnProperty(current)) {
      if(!isString(options[current])) {
        throw new Error(util.format(
          "options.%s must be a non-empty string", current
        ));
      }
    }
  });

  //- boolean values
  ["ignoreFlag", "enableRequire"]
  .forEach(function(current, index, array) {
    if(options.hasOwnProperty(current)) {
      if(!isBool(options[current])) {
        throw new Error(util.format(
          "options.%s must be a non-empty string", current
        ));
      }
    }
  });

  key = "filter";
  if(options.hasOwnProperty(key)) {
    if(!isString(options[key]) && !isStringArray(options[key])) {
      throw new Error("options.filter must be a string or an array of strings");
    }
  }

  key = "plugins";
  if(options.hasOwnProperty(key)) {
    if(!is.object(options[key])) {
      throw new Error("options.plugins must be an object");
    }
  }

  key = "resolveFunc";
  if(options.hasOwnProperty(key)) {
    if(!is.fn(options[key])) {
      throw new Error("options.resolveFunc must be a function");
    }
  }
}

//========//========//========//========//========//========//========//========

function isBool(value) {
  if(value === true) {
    return true;
  }
  if(value === false) {
    return true;
  }
  return false;
}

//========//========//========//========//========//========//========//========

function isString(value) {
  if(!is.string(value)) {
    return false;
  }
  
  if(value.trim().length === 0) {
    return false;
  }
  
  return true;
}

//========//========//========//========//========//========//========//========

function isStringArray(value) {
  if(!is.array(value)) {
    return false;
  }
  
  for(let ix=0, ic=value.length; ix<ic; ix++) {
    if(!isString(value[ix])) {
      return false;
    }
  }
  
  return true;
}
