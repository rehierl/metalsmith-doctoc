
const is = require("is");
const util = require("util");

module.exports = Plugin;

//========//========//========//========//========//========//========//========

function Plugin(options) {
  console.log("initializing plugin...");
  
  if(!(this instanceof Plugin)) {
    //- don't return undefined if used like "Plugin(options)"
    //  i.e. without the "new" operator
    return new Plugin(options);
  }
  
  this.optionsDefault = { hMin: 1, hMax: 6 };
  this.optionsCommon = this.optionsDefault;
  this.optionsFile = this.optionsDefault;
  this.applyDefaultOptions(options);
  
  this.headings = undefined;
  this.menuTree = undefined;
}

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.parseOptionsArg = function(options) {
  return;
};

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.combineOptions = function(defaults, custom) {
  defaults = defaults || {};
  custom = custom || {};
  let options = {};
  
  Object.keys(this.optionsDefault).forEach(function(current, index, array) {
    //- first, take the default value
    if(defaults.hasOwnProperty(current)) {
      options[current] = defaults[current];
    }
    //- then, override it with the custom value
    if(custom.hasOwnProperty(current)) {
      options[current] = custom[current];
    }
  });
  
  return options;
}

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyDefaultOptions = function(options) {
  console.log("applying default options...");
  
  options = this.parseOptionsArg(options);
  options = this.combineOptions(this.optionsDefault, options);
  
  this.optionsCommon = options;
  this.optionsFile = options;
};

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyFileOptions = function(filename, options) {
  console.log("applying file-specific options...");
  
  options = this.parseOptionsArg(options);
  options = this.combineOptions(this.optionsCommon, options);
  
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
    contents = contents.toString('utf8');
  }
  
  //- use the contents
  
  //- file options should only be used for a single file
  //- reset the file options to the common options
  this.optionsFile = this.optionsCommon;
};
