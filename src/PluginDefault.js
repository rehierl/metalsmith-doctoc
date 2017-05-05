
const util = require("util");

module.exports = plugin;

//========//========//========//========//========//========//========//========

var instance = 0;

function plugin(options) {
  instance = instance + 1;
  console.log("initializing plugin...", instance);
  this.applyDefaultOptions(options);
}

//========//========//========//========//========//========//========//========

plugin.prototype.applyDefaultOptions = function(options) {
  console.log("applying default options...", instance);
};

//========//========//========//========//========//========//========//========

plugin.prototype.applyFileOptions = function(options) {
  console.log("applying file options...", instance);
}

//========//========//========//========//========//========//========//========

plugin.prototype.run = function(filename, file) {
  console.log(util.format(
    "processing file [%s]...", filename), instance);
};
