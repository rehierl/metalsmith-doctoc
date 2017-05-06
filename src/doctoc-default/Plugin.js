
"use strict";

const is = require("is");
const util = require("util");

module.exports = Plugin;

//========//========//========//========//========//========//========//========

function Plugin(userOptions) {
  if(!(this instanceof Plugin)) {
    return new Plugin(userOptions);
  }
  
  this.options = {
    hMin: 1,
    hMax: 6
  };
  
  this.optionsDefault = this.options;
  this.optionsFile = this.options;
  
  if(userOptions) {
    //- ignore in case of 'new Plugin()'
    this.applyDefaultOptions(userOptions);
  }
  
  this.headings = undefined;
  this.menuTree = undefined;
}

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.parseOptionsArg = function(options) {
  console.log(options);
  return;
};

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.combineOptions = function(defaults, custom) {
  let options = {};
  
  Object.keys(defaults).forEach(function(current, index, array) {
    //- first, take the default values
    options[current] = defaults[current];

    //- then, override them with the custom values
    if(custom.hasOwnProperty(current)) {
      options[current] = custom[current];
    }
  });
  
  return options;
};

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyDefaultOptions = function(options) {
  options = this.parseOptionsArg(options);
  options = this.combineOptions(this.options, options);
  
  this.optionsDefault = options;
  this.optionsFile = options;
};

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyFileOptions = function(filename, options) {
  options = this.parseOptionsArg(options);
  options = this.combineOptions(this.optionsDefault, options);
  
  options.filename = filename;
  this.optionsFile = options;
};

//========//========//========//========//========//========//========//========

//- public, required
Plugin.prototype.run = function(filename, file) {
  console.log(util.format("processing file [%s]...", filename));
  let options = this.optionsFile;
  
  if(!options.hasOwnProperty("filename")) {
    //- i.e. use default options
  } else {
    //- i.e. use file-specific options
    assert(options.filename === filename, "invalid call");
  }
  
  let data = file.contents;
  let contents = data.contents;
  
  if(!is.string(contents)) {
    //- asume contents is some Buffer
    contents = contents.toString('utf8');
  }
  
  //- use file contents
  
  //- file options should only be used for a single file
  //- reset the file options to the common options
  this.optionsFile = this.optionsDefault;
};

//========//========//========//========//========//========//========//========

//- public, required
Plugin.prototype.getDocTocTree = function() {
  return null;
};
