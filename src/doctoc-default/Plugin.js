
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
}

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyDefaultOptions = function(options) {
  const clone = this.options.clone();
  clone.combine(options);
  this.optionsDefault = clone;
};

//========//========//========//========//========//========//========//========

//- public, not required
//- warning if needed and missing
Plugin.prototype.applyFileOptions = function(filename, options) {
  const clone = this.optionsDefault.clone();
  clone.combine(options);
  clone.filename = filename;
  this.optionsFile = clone;
};

//========//========//========//========//========//========//========//========

//- public, required
Plugin.prototype.run = function(filename, file) {
  let options = undefined;
  
  {//## choose which options to use
    options = this.optionsFile;
    
    if(!options.hasOwnProperty("filename")) {
      options = this.optionsDefault;
    } else if(options.filename !== filename) {
      options = this.optionsDefault;
    }
    
    //- file options should only be used for a single file
    //- reset file options to the default options
    this.optionsFile = this.optionsDefault;
  }
  
  let headings = undefined;
  
  {//### read and modify the file's contents
    let contents = file.contents;
    let fromBuffer = undefined;

    if(is.string(contents)) {
      fromBuffer = false;
    } else {
      //- assume that contents is a Buffer
      contents = contents.toString('utf8');
      fromBuffer = true;
    }

    const result = split(contents, options);
    contents = merge(result.contents, options);

    if(fromBuffer === true) {
      //- if you started with a buffer,
      //  then you should stop with one
      contents = new Buffer(contents);
    }

    file.contents = contents;
    headings = result.headings;
  }
  
  //### transform the heading entries
  for(let ix=0, ic=headings.length; ix<ic; ix++) {
    const h = headings[ix];

    headings[ix] = {
      tag: h.tag,
      id: h.id,
      title: h.title,
      level: h.level
    };
  }
  
  return {
    result: headings,
    isHeadingsList: true
  };
};

//========//========//========//========//========//========//========//========

//- private
//- split and search for html heading tags
function split(contents, options) {
  //- m = rx.exec("prefix <h1 attributes>heading</h1> suffix")
  //  m[0]="<h1 attributes>heading</h1>", m[1]="h1", m[2]="1",
  //  m[3]=" attributes", m[4]="heading", m[5]="h1", m[6]="1"
  const rxH = /<(h([1-6]))([^>]*)>([^<]*)<\/(h([1-6]))>/gi;
  
  //- m = rx.exec(" id='some-id'")
  //  m[0]=" id='some-id'", m[1]="some-id"
  const rxA = /id=('([^']*)'|"([^"]*)")/gi;
  
  let ix=0, ic=contents.length;
  let parts = [];
  let headings = [];
  
  while(ix < ic) {
    let m = rxH.exec(contents);
    
    if(m === null) {
      //- no match found
      break;
    }
    
    if(ix < m.index) {
      //- some non-heading prefix
      parts.push({
        type: "other",
        contents: contents.substring(ix, m.index)
      });
      ix = m.index;
    }
    
    //- contents are invalid, or
    //  rxH needs to be improved
    console.assert(m[1] === m[5], "internal error: rxH");
    
    let h = {
      type: "heading",
      ignored: false,
      tag: m[1],
      level: Number.parseInt(m[2]),
      attributes: m[3],
      title: m[4]
    };
    
    if((h.level < options.hMin)
    || (h.level > options.hMax)) {
      //- ignore this heading
      h.ignored = true;
    } else if(h.attributes === "") {
      //- did not have any attributes
      h.hadId = false;
      h.id = options.idPrefix + slug(h.title);
      headings.push(h);
    } else if((m = rxA.exec(h.attributes)) === null) {
      //- no 'id=...' found
      h.hadId = false;
      h.id = options.idPrefix + slug(h.title);
      headings.push(h);
    } else {
      //- 'id=...' found
      h.hadId = true;
      h.id = m[1];
      headings.push(h);
    }
    
    parts.push(h);
    ix = rxH.lastIndex;
    continue;
  }
  
  if(ix < ic) {
    //- some non-heading suffix,
    //  or no heading at all
    parts.push({
      type: "other",
      contents: contents.substring(ix)
    });
  }
  
  return {
    contents: parts,
    headings: headings
  };
};

//========//========//========//========//========//========//========//========

//- private
//- merge contents and add id attributes if necessary
 function merge(contents, options) {
  let ic = contents.length;
  
  for(let ix=0; ix<ic; ix++) {
    let part = contents[ix];
    
    if(part.type !== "heading") {
      contents[ix] = part.contents;
      continue;
    }
    
    if((part.ignored === true) || (part.hadId === true)) {
      contents[ix] = util.format("<%s%s>%s</%s>",
        part.tag, part.attributes, part.title, part.tag
      );
    } else {
      contents[ix] = util.format("<%s id='%s'%s>%s</%s>",
        part.tag, part.id, part.attributes, part.title, part.tag
      );
    }
    
    continue;
  }
  
  return contents.join("");
};
