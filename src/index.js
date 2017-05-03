
"use strict";

const is = require("is");
const util = require("util");
const multimatch = require("multimatch");

const Options = require("./Options.js");

module.exports = plugin;

//========//========//========//========//========//========//========//========

/**
 * @param {type} options
 * @returns {Function}
 */
function plugin(options) {
  const settings = new Options();
  settings.combine(options);
  
  /**
   * @param {type} files
   * @param {type} metalsmith
   * @param {type} done
   * @returns {undefined}
   */
  return function main(files, metalsmith, done) {
    //- do something
  };
}
