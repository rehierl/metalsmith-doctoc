
"use strict";

const is = require("is");
const util = require("util");
const debug = require("debug")("metalsmith-doctoc");

const PluginsApi = require("./PluginsApi.js");

module.exports = Proxy;

//========//========//========//========//========//========//========//========

function Proxy(configName, plugin) {
  if(!(this instanceof Proxy)) {
    return new Proxy(configName, plugin);
  }
  
  this.configName = configName;
  this.plugin = plugin;
  
  //- send the plugin an api object
  this.setPluginsApi();
}

//========//========//========//========//========//========//========//========

//- private (proxy => plugin)
Proxy.prototype.setPluginsApi = function() {
  if(!is.fn(this.plugin["setPluginsApi"])) {
    return;//- just ignore this call
  }

  try {
    let api = new PluginsApi();
    this.plugin.setPluginsApi(api);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to execute plugin.setPluginsApi()",
      this.configName
    ));
    newError.innerError = error;
    throw newError;
  }
};

//========//========//========//========//========//========//========//========

//- public (doctoc => plugin)
Proxy.prototype.setDefaultOptions = function(options) {
  if(!is.fn(this.plugin["setDefaultOptions"])) {
    debug(util.format(
      "doctoc options.plugins[%s]: "
      + "unable to apply the options from the configuration",
      this.configName
    ));
    return;
  }

  try {
    this.plugin.setDefaultOptions(options);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to execute plugin.setDefaultOptions()",
      this.configName
    ));
    newError.innerError = error;
    throw newError;
  }
};

//========//========//========//========//========//========//========//========

//- public (doctoc => plugin)
Proxy.prototype.setFileOptions = function(filename, options) {
  if(!is.fn(this.plugin["setFileOptions"])) {
    debug(util.format(
      "doctoc options.plugins[%s]: "
      + "unable to apply the options from file [%s]",
      this.configName, filename
    ));
    return;
  }
  
  try {
    this.plugin.setFileOptions(filename, options);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to execute plugin.setFileOptions() "
      + "with file [%s]",
      this.configName, filename
    ));
    newError.innerError = error;
    throw newError;
  }
};

//========//========//========//========//========//========//========//========

//- public (doctoc => plugin)
Proxy.prototype.run = function(filename, file) {
  let root = undefined;
  
  if(!is.fn(this.plugin["run"])) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: "
      + "plugin does not have a 'run' method",
      this.configName
    ));
  }
  
  try {
    root = this.plugin.run(filename, file);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to process file [%s]",
      this.configName, filename
    ));
    newError.innerError = error;
    throw newError;
  }
  
  return root;
};
