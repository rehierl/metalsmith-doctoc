
"use strict";

const is = require("is");
const util = require("util");

module.exports = Options;

//========//========//========//========//========//========//========//========

function Options() {
  if(!(this instanceof Options)) {
    return new Options();
  }
  
  //- if X=N for some <hN> tag, then ignore any heading that has a
  //  lower N than hMin; i.e. ignore a heading if (N < hMin)
  //- ignore all tags other than <hX>, if (hMin == hMax == X)
  //- ignore all tags, if (hMin > hMax)
  this.hMin = 1;
  
  //- if X=N for some <hN> tag, then ignore any heading that has a
  //  higher N than hMax; i.e. ignore a heading if (N > hMax)
  //- ignore all tags other than <hX>, if (hMin == hMax == X)
  //- ignore all tags, if (hMin > hMax)
  this.hMax = 6;
  
  //- if a heading of the form <h1>$title</h1> is found, an id
  //  will be generated using '$id = slug($title)'. in order to
  //  avoid collision of id values, generated ids will be prefixed
  //  with $idPrefix; i.e. '<h1 id="$idPrefix$id">$title</h1>'.
  //- set to "" if no prefix is needed.
  this.idPrefix = "doctoc-";
}

//========//========//========//========//========//========//========//========

Options.prototype.clone = function() {
  let thisInstance = this;
  let options = new Options();
  
  Object.getOwnPropertyNames(thisInstance)
  .forEach(function(current, index, array) {
    options[current] = thisInstance[current];
  });
  
  return options;
};

//========//========//========//========//========//========//========//========

//- merge the supplied options into the current object
Options.prototype.combine = function(options) {
  if(options === undefined) {
    //- ignore this call
    return;
  }
  
  //- e.g. options = "h1-6"
  if(is.string(options)) {
    let range = readRange(options);
    
    if(range === undefined) {
      throw new Error(util.format(
        "string options '%s' is an invalid range value",
        options
      ));
    }
    
    options = range;
  }
  
  if(!is.object(options)) {
    throw new Error("invalid options argument");
  }
  
  //- e.g. options = { hRange: "h1-6" }
  if(options.hasOwnProperty("hRange")) {
    let range = options.hRange;
    
    if(!is.string(range)) {
      throw new Error(util.format(
        "options.hRange: [%s] is an invalid range value",
        options
      ));
    }
            
    range = readRange(range);
    
    if(range === undefined) {
      throw new Error(util.format(
        "options.hRange: '%s' is an invalid range value",
        options
      ));
    }
    
    options.hMin = range.hMin;
    options.hMax = range.hMax;
    delete options.hRange;
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
  let value = undefined;

  ["hMin", "hMax"].forEach(function(current, index, array) {
    if(options.hasOwnProperty(current)) {
      value = options[current];

      if(!is.integer(value) || is.infinite(value)) {
        throw new Error(util.format(
          "options.%s: [%s] is not a valid integer value",
          current, value
        ));
      }

      if((value < 1) || (value > 6)) {
        throw new Error(util.format(
          "options.%s: [%s] is not a valid integer value",
          current, value
        ));
      }
    }
  });

  if(options.hasOwnProperty("hMin")
  && options.hasOwnProperty("hMax")) {
    if(options.hMin > options.hMax) {
      throw new Error(util.format(
        "options.hMin, options.hMax: (%s <= %s) is not true",
        options.hMin, options.hMax
      ));
    }
  }

  key = "idPrefix";
  if(options.hasOwnProperty(key)) {
    value = options[key];
    if(!is.string(value)) {
      throw new Error(util.format(
        "options.%s: [%s] is not a non-empty string",
        key, value
      ));
    }
  }
}

//========//========//========//========//========//========//========//========

function readRange(range) {
  let match = /^h([1-6])-([1-6])$/i.exec(range);
  
  if(match === null) {
    return undefined;
  }
  
  let min = Number.parseInt(match[1]);
  let max = Number.parseInt(match[2]);
  return { hMin: min, hMax: max };
}
