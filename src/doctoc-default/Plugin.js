
"use strict";

const is = require("is");
const util = require("util");

const Options = require("./Options.js");

module.exports = Plugin;

//========//========//========//========//========//========//========//========

function Plugin(userOptions) {
  if(!(this instanceof Plugin)) {
    return new Plugin(userOptions);
  }
  
  //- used as default/base options when
  //  applying plugin-specific settings
  this.options = new Options();
  this.options.combine(userOptions);
  
  //- used as default/base options when
  //  applying file-specific settings
  this.optionsDefault = this.options;
  
  //- used when processing a file
  this.optionsFile = this.options;
  
  //return;
}

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyDefaultOptions = function(options) {
  let clone = this.options.clone();
  clone.combine(options);
  this.optionsDefault = clone;
  this.optionsFile = clone;
};

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyFileOptions = function(filename, options) {
  let clone = this.optionsDefault.clone();
  clone.combine(options);
  clone.filename = filename;
  this.optionsFile = clone;
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
  
  let contents = file.contents;
  
  if(!is.string(contents)) {
    //- asume contents is some Buffer
    contents = contents.toString('utf8');
  }
  
  //- use file contents
  console.log(contents);
  
  //- file options should only be used for a single file
  //- reset the file options to the common options
  this.optionsFile = this.optionsDefault;
};

//========//========//========//========//========//========//========//========

//- public, required
Plugin.prototype.getDocTocTree = function() {
  return null;
};
