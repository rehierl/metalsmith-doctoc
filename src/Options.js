
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
