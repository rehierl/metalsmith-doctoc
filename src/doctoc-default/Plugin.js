
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
  
  //- MDT's plugins API
  this.api = undefined;
}

//========//========//========//========//========//========//========//========

//- public, optional
Plugin.prototype.setPluginsApi = function(api) {
  this.api = api;
};

//========//========//========//========//========//========//========//========

//- public, optional
//- warning if needed and missing
Plugin.prototype.setDefaultOptions = function(options) {
  const clone = this.options.clone();
  clone.combine(options);
  this.optionsDefault = clone;
};

//========//========//========//========//========//========//========//========

//- public, optional
//- warning if needed and missing
Plugin.prototype.setFileOptions = function(filename, options) {
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
  
  return this.api.readFileContents(readContents, {
    api: this.api,
    filename: filename,
    file: file,
    options: options
  });
};

//========//========//========//========//========//========//========//========

function readContents(context) {
  splitContents(context);
  
  if(context.newIdsCount <= 0) {
    delete context.contents;
  } else {
    mergeContents(context);
  }
  
  const api = context.api;
  const headings = context.headings;
  return api.createTreeFromHeadings(headings);
};

//========//========//========//========//========//========//========//========

function splitContents(context) {
  //- m = rx.exec("prefix <h1 attributes>heading</h1> suffix")
  //  m[0]="<h1 attributes>heading</h1>", m[1]="h1", m[2]="1",
  //  m[3]=" attributes", m[4]="heading", m[5]="h1", m[6]="1"
  const rxH = /<(h([1-6]))([^>]*)>([^<]*)<\/(h([1-6]))>/gi;
  
  //- m = rx.exec(" id='some-id'")
  //  m[0]=" id='some-id'", m[1]="some-id"
  const rxA = /id=('([^']*)'|"([^"]*)")/gi;
  
  const api = context.api;
  const contents = context.contents;
  const options = context.options;
  const selector = options.hSelector;
  
  let ix=0, ic=contents.length;
  let newIdsCount = 0;
  let headings = [];
  let parts = [];
  
  const idgen = api.getIdGenerator({
    slugFunc: options.slugFunc,
    idPrefix: options.idPrefix,
    idLengthLimit: options.idLengthLimit
  });
  
  while(ix < ic) {
    const m = rxH.exec(contents);
    
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
    
    if(m[1] !== m[5]) {
      //- could be as simple as "<h1>...</H1>"
      //- either contents is invalid, or rxH could use an update
      throw new Error("doctoc-default: internal error with rxH");
    }
    
    let h = {
      type: "heading",
      ignored: false,
      tag: m[1],
      level: Number.parseInt(m[2]),
      attributes: m[3],
      title: m[4],
      hadId: false,
      id: undefined
    };
    
    if(selector.indexOf(m[2]) < 0) {
      //- heading does not match the selector
      h.ignored = true;
    } else if((h.attributes === "")
    || (m = rxA.exec(h.attributes)) === null) {
      //- no attributes, or no 'id=...' found
      let id = idgen.nextId(h.title);
      //- generated ids are unique, but ...
      //  there still can be a collision with
      //  pre-existing id values
      //- unlikely in the scope of this plugin
      h.id = id;
      headings.push(h);
      newIdsCount++;
    } else {
      //- 'id=...' found
      h.hadId = true;
      h.id = m[1];
      headings.push(h);
    }
    
    parts.push(h);
    ix = rxH.lastIndex;
  }//- while
  
  if(ix < ic) {
    //- some non-heading suffix,
    //  or no heading at all
    parts.push({
      type: "other",
      contents: contents.substring(ix)
    });
  }
  
  context.newIdsCount = newIdsCount;
  context.contents = parts;
  
  //- normalize the heading entries
  //  i.e. remove unnecessary properties
  for(ix=0, ic=headings.length; ix<ic; ix++) {
    const h = headings[ix];

    headings[ix] = {
      tag: h.tag,
      id: h.id,
      title: h.title,
      level: h.level
    };
  }
  
  context.headings = headings;
}

//========//========//========//========//========//========//========//========

function mergeContents(context) {
  const contents = context.contents;
  const ic = contents.length;

  for(let ix=0; ix<ic; ix++) {
    let part = contents[ix];

    if(part.type !== "heading") {
      part = part.contents;
    } else if((part.ignored === true) || (part.hadId === true)) {
      part = util.format("<%s%s>%s</%s>",
        part.tag, part.attributes, part.title, part.tag
      );
    } else {
      part = util.format("<%s id='%s'%s>%s</%s>",
        part.tag, part.id, part.attributes, part.title, part.tag
      );
    }

    contents[ix] = part;
  }//- for

  context.contents = contents.join("");
}
