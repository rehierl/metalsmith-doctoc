
"use strict";

const is = require("is");
const util = require("util");
const slug = require("slug");

module.exports = IdGenerator;

//========//========//========//========//========//========//========//========

//issue 1:
// The problem with slug(), or a similar function is, that it will generate the
// exact same value if you call it with the exact same input. Although, this is
// what these functions are supposed to do, this has the potential to create
// colliding id values:
//
// 0) assume that 'idVal' = slug(title)
// 1) inside of some section: <h3>title</h3> => <h3 id='idVal'>title</h3>
// 2) inside another section: <h4>title</h4> => <h4 id='idVal'>title</h4>
// 3) so <h3> and <h4> will get the same id value.
//
// This might seem more of a theoretical issue, but documentations don't
// necessarily have globally unique headline titles; e.g. some API documentation
// might use <hX>Returns</hX> headings to document the return value of API
// functions.

//solution:
// 1) remember which id values were generated.
// 2) if an id value is generated a second time, then
//    add a unique number suffix (e.g. "-1").

//issue 2:
// Now that no id value will be generated a second time, there still is a chance
// that an id value will be generated which collides with an id value that was
// specified inside the HTML content itself.

//solution:
// 1) execute $id = IdGenerator.next(title) to create an id value for a heading
// 2) check that $id is indeed unqiue
// 3) execute $id = IdGenerator.next() if it wasn't;
//    this will append a different unique number to the last id generated
// 4) retry step 2)

//issue 3:
// Issues 1 and 2 are more related to single documents. If you intend to merge
// multiple documents into a single large one, then chances are that id values
// might collide.

//solution:
// Try using different idPrefix values for each file.

//========//========//========//========//========//========//========//========

function IdGenerator(options) {
  if(!(this instanceof IdGenerator)) {
    return new IdGenerator(options);
  }

  this.slugFunc = slug;
  this.idPrefix = "doctoc";
  this.idLengthLimit = 256;

  //- cache = { $id: nextSuffixNum }
  this.cache = {};

  //- the last cache entry used
  this.cacheLast = undefined;

  //- apply the options provided
  this.set(options);
}

//========//========//========//========//========//========//========//========

//- set multiple properties in one go
IdGenerator.prototype.set = function(options) {
  const thisInstance = this;

  if(!is.object(options)) {
    throw new Error("invalid call");
  }

  ["slugFunc", "idPrefix", "idLengthLimit"]
  .forEach(function(current, index, array) {
    if(options.hasOwnProperty(current)) {
      thisInstance[current] = options[current];
    }
  });
};

//========//========//========//========//========//========//========//========

//- use nextId(title) to generate an id value for 'text'
//- use nextId() to generate a new id for the previous text used
IdGenerator.prototype.nextId = function(text) {
  if(arguments.length === 0) {
    //- in case of .nextId()

    if(this.cacheLast === undefined) {
      throw new Error("invalid call");
    }

    let id = this.cacheLast;
    let num = this.cache[id];
    this.cache[id] = num + 1;

    return util.format("%s-%s", id, num);
  } else {
    //- in case of .nextId(text)

    let id = util.format("%s%s",
      this.idPrefix, this.slugFunc(text)
    );

    if(id.length > this.idLengthLimit) {
      id = id.substring(0, this.idLengthLimit);
    }

    this.cacheLast = id;

    if(!this.cache.hasOwnProperty(id)) {
      //- id wasn't generated previously
      this.cache[id] = 1;
    } else {
      //- avoid an id collision
      let num = this.cache[id];
      this.cache[id] = num + 1;
      id = util.format("%s-%s", id, num);
    }

    return id;
  }
};

//========//========//========//========//========//========//========//========

//- forget about previously generated ids
IdGenerator.prototype.clearCache = function() {
  this.cache = {};
  this.cacheLast = undefined;
};
