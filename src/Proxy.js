
"use strict";

const is = require("is");
const util = require("util");

module.exports = Proxy;

//========//========//========//========//========//========//========//========

function Proxy(configName, plugin) {
  if(!(this instanceof Proxy)) {
    return new Proxy(configName, plugin);
  }
  
  if( !is.fn(plugin["run"])) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: missing 'run' function",
      configName
    ));
  }
  
  if( !is.fn(plugin["getDocTocTree"])) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: missing 'getDocTocTree' function",
      configName
    ));
  }
  
  this.configName = configName;
  this.plugin = plugin;
}

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyDefaultOptions = function(options) {
  if(is.fn(this.plugin["applyDefaultOptions"])) {
    this.plugin.applyDefaultOptions(options);
  } else {
    //- cannot apply the given options
    //TODO: issue a warning
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyFileOptions = function(options) {
  if(is.fn(this.plugin["applyFileOptions"])) {
    this.plugin.applyFileOptions(options);
  } else {
    //- cannot apply the given options
    //TODO: issue a warning
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.run = function(filename, file) {
  this.plugin.run(filename, file);
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.getDocTocTree = function(filename) {
  return null;
};
