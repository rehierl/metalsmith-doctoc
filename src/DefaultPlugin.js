
const is = require("is");
const util = require("util");

module.exports = Plugin;

//========//========//========//========//========//========//========//========

function Plugin(options) {
  console.log("initializing plugin...");
  
  this.optionsDefault = { hMin: 1, hMax: 6 };
  this.optionsFile = this.optionsDefault;
  
  this.applyDefaultOptions(options);
}

//========//========//========//========//========//========//========//========

Plugin.prototype.readOptions = function(options) {
  
};

//========//========//========//========//========//========//========//========

Plugin.prototype.applyDefaultOptions = function(options) {
  console.log("applying default options...");
  this.optionsDefault = this.readOptions(options);
  this.optionsFile = this.optionsDefault;
};

//========//========//========//========//========//========//========//========

Plugin.prototype.applyFileOptions = function(filename, options) {
  console.log("applying file-specific options...");
  options = this.readOptions(options);
  options.filename = filename;
  this.optionsFile = options;
};

//========//========//========//========//========//========//========//========

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
  
  this.optionsFile = this.optionsDefault;
};
