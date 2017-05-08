
"use strict";

const is = require("is");
const util = require("util");
const slug = require("slug");

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
  
  //- used to hold hold heading objects
  this.headings = [];
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

//- public, not required
Plugin.prototype.getProxyOptions = function() {
  return {
    buildTree: true,
    normalizeLevels: true,
    finalizeTree: true
  };
};

//========//========//========//========//========//========//========//========

//- public, required
Plugin.prototype.run = function(filename, file) {
  let options = this.optionsFile;
  
  if(!options.hasOwnProperty("filename")) {
    //- i.e. use default options
  } else {
    //- i.e. use file-specific options
    assert(options.filename === filename, "invalid call");
  }
  
  {//- read and modify the file's contents
    let contents = file.contents;
    let fromBuffer = undefined;

    if(is.string(contents)) {
      fromBuffer = false;
    } else {
      //- assume that contents is some Buffer
      contents = contents.toString('utf8');
      fromBuffer = true;
    }

    //- split and search for html heading tags
    contents = this.split(contents, options);

    //- merge contents and add id attributes if necessary
    contents = this.merge(contents, options);

    if(fromBuffer === true) {
      //- if you started with a buffer,
      //  then you should stop with one
      contents = new Buffer(contents);
    }

    file.contents = contents;
  }
  
  //- file options should only be used for a single file
  //- reset the file options to the common options
  this.optionsFile = this.optionsDefault;
  
  let list = this.headings;
  this.headings = [];
  
  //- normalize the headings list
  for(let ix=0, ic=list.length; ix<ic; ix++) {
    let h = list[ix];
    
    list[ix] = {
      tag: h.tag,
      id: h.id,
      contents: h.contents,
      level: h.level
    };
  }
  
  return list;
};

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.split = function(contents, options) {
  //- e.g. m = rx.exec("prefix <h1 attributes>heading</h1> suffix")
  //  m[0]="<h1 attributes>heading</h1>", m[1]="h1", m[2]="1",
  //  m[3]=" attributes", m[4]="heading", m[5]="h1", m[6]="1"
  const rxH = /<(h([1-6]))([^>]*)>([^<]*)<\/(h([1-6]))>/gi;
  
  //- e.g. m = rx.exec(" id='some-id'")
  //  m[0]=" id='some-id'", m[1]="some-id"
  const rxA = /id=('([^']*)'|"([^"]*)")/gi;
  
  let headings = [];
  let ix=0, ic=contents.length;
  let parts = [];
  
  while(ix < ic) {
    let m = rxH.exec(contents);
    
    if(m === null) {
      //- no match found
      break;
    }
    
    if(ix < m.index) {
      parts.push({
        type: "other",
        contents: contents.substring(ix, m.index)
      });
      ix = m.index;
    }
    
    //- contents are invalid, or
    //  the rxH needs to be improved
    console.assert(m[1] === m[5], "internal error");
    
    let h = {
      type: "heading",
      tag: m[1],
      level: Number.parseInt(m[2]),
      attributes: m[3],
      contents: m[4]
    };
    
    if((h.level < options.hMin)
    || (h.level > options.hMax)) {
      //- ignore this heading
      h.ignored = true;
    } else if(h.attributes === "") {
      //- did not have any attributes
      h.ignored = false;
      h.hadId = false;
      h.id = options.idPrefix + slug(h.contents);
      headings.push(h);
    } else if((m = rxA.exec(h.attributes)) === null) {
      //- no 'id=...' found inside attributes
      h.ignored = false;
      h.hadId = false;
      h.id = options.idPrefix + slug(h.contents);
      headings.push(h);
    } else {
      //- 'id=...' found inside attributes
      h.ignored = false;
      h.hadId = true;
      h.id = m[1];
      headings.push(h);
    }
    
    parts.push(h);
    ix = rxH.lastIndex;
    continue;
  }
  
  if(ix < ic) {
    parts.push({
      type: "other",
      contents: contents.substring(ix)
    });
  }
  
  this.headings = headings;
  return parts;
};

//========//========//========//========//========//========//========//========

//- private
Plugin.prototype.merge = function(contents, options) {
  let ix=0, ic=contents.length;
  
  for(ix=0; ix<ic; ix++) {
    let part = contents[ix];
    
    if(part.type !== "heading") {
      contents[ix] = part.contents;
      continue;
    }
    
    if((part.ignored === true) || (part.hadId === true)) {
      contents[ix] = util.format("<%s%s>%s</%s>",
        part.tag, part.attributes, part.contents, part.tag
      );
    } else {
      contents[ix] = util.format("<%s id='%s'%s>%s</%s>",
        part.tag, part.id, part.attributes, part.contents, part.tag
      );
    }
    
    continue;
  }
  
  return contents.join("");
};
