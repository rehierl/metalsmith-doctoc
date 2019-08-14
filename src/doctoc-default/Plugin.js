
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
  readExistingIds(context);
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

function readExistingIds(context) {
  const makeIdsUnique = context.options.makeIdsUnique;

  if(makeIdsUnique !== true) {
    context.existingIds = {};
    return;
  }

  //- m = rx.exec("id='some-id'")
  //  m[0]="id='some-id'", m[1]="'some-id'", m[2]="some-id"
  const rxIds = /id=('([^']*)'|"([^"]*)")/gi;

  //- existingIds: { (<id-value>: true)* }
  const existingIds = {};

  const contents = context.contents;
  let ix=0, ic=contents.length;

  while(ix < ic) {
    const match = rxIds.exec(contents);

    if(match === null) {
      //- no (more) match found
      break;
    }

    const id = match[2] ? match[2] : match[3];

    if(existingIds[id]) {
      //- this id is already defined multiple times
      //throw new Error(util.format(
      //  "this file already defines id [%s] multiple times", id
      //));
    } else {
      existingIds[id] = true;
    }

    ix = rxIds.lastIndex;
  }

  context.existingIds = existingIds;
}

//========//========//========//========//========//========//========//========

function splitContents(context) {
  //- m = rx.exec("prefix <h1 attributes>heading</h1> suffix")
  //  m[0]="<h1 attributes>heading</h1>", m[1]="h1", m[2]="1",
  //  m[3]=" attributes", m[4]="heading", m[5]="h1", m[6]="1"
  const rxH = /<(h([1-6]))([^>]*)>([^<]*)<\/(h([1-6]))>/gi;

  //- m = rx.exec("id='some-id'")
  //  m[0]="id='some-id'", m[1]="'some-id'", m[2]="some-id"
  const rxIds = /id=('([^']*)'|"([^"]*)")/gi;

  //- existingIds: { (<id-value>: true)* }
  const existingIds = context.existingIds;

  const api = context.api;
  const contents = context.contents;
  const options = context.options;
  const selector = options.hSelector;

  let ix=0, ic=contents.length;
  let newIdsCount = 0;
  let headings = [];
  let parts = [];
  let match = null;

  const idgen = api.getIdGenerator({
    slugFunc: options.slugFunc,
    idPrefix: options.idPrefix,
    idLengthLimit: options.idLengthLimit
  });

  while(ix < ic) {
    match = rxH.exec(contents);

    if(match === null) {
      //- no (more) match found
      break;
    }

    if(ix < match.index) {
      //- some non-heading prefix
      parts.push({
        type: "other",
        contents: contents.substring(ix, match.index)
      });
      ix = match.index;
    }

    if(match[1] !== match[5]) {
      //- could be as simple as "<h1>...</H1>"
      //- either contents is invalid, or rxH could use an update
      throw new Error("doctoc-default: internal error with rxH");
    }

    let heading = {
      type: "heading",
      ignored: false,
      tag: match[1],
      level: Number.parseInt(match[2]),
      attributes: match[3],
      title: match[4],
      hadId: false,
      id: undefined
    };

    if(selector.indexOf(match[2]) < 0) {
      //- heading does not match the selector
      heading.ignored = true;
    } else if((match = rxIds.exec(heading.attributes)) !== null) {
      //- id attribute found
      heading.hadId = true;
      heading.id = match[2] ? match[2] : match[3];
      headings.push(heading);
    } else {
      //- no id attribute found
      let id = idgen.nextId(heading.title);

      while(existingIds[id]) {
        id = idgen.nextId();
      }

      existingIds[id] = true;
      heading.id = id;
      headings.push(heading);
      newIdsCount++;
    }

    parts.push(heading);
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
    const heading = headings[ix];

    headings[ix] = {
      tag: heading.tag,
      id: heading.id,
      title: heading.title,
      level: heading.level
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
