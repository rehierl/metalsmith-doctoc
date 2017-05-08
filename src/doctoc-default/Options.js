
"use strict";

const is = require("is");
const util = require("util");

module.exports = Options;

//========//========//========//========//========//========//========//========

function Options() {
  if(!(this instanceof Options)) {
    return new Options();
  }
  
  this.hMin = 1;
  
  this.hMax = 6;
}

//========//========//========//========//========//========//========//========

Options.prototype.combine = function(options) {
  let thisInstance = this;
  
  if(!options) {
    return;
  }
  
  if(is.string(options)) {
    let match = /^h([1-6])-([1-6])$/i.exec(options);
    
    if(match !== null) {
      let min = Number.parseInt(match[1]);
      let max = Number.parseInt(match[2]);
      
      if(min > max) {
        throw new Error(util.format(
          "options [%s] must be of type 'hN-M' where (N<=M)",
          options
        ));
      }
      
      options = { hMin: min, hMax: max };
    }
  }
  
  if(options instanceof Options) {
    Object.getOwnPropertyNames(thisInstance)
    .forEach(function(current, index, array) {
      thisInstance[current] = options[current];
    });
    return;
  }
  
  if(is.object(options)) {
    
    
    Object.getOwnPropertyNames(thisInstance)
    .forEach(function(current, index, array) {
      if(options.hasOwnProperty(current)) {
        thisInstance[current] = options[current];
      }
    });
    return;
  }
  
  throw new Error("invalid 'options' argument");
};

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
