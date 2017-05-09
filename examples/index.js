
/* global __dirname */

"use strict";

const metalsmith = require("metalsmith");
const util = require("util");

//========//========//========//========//========

//- declared by Node
const basedir = __dirname;

//- create a new instance and set the working directory
const msi = new metalsmith(basedir)

//- set the working directory
.directory(basedir)

//- scan this subdirectory for source files
.source("files-input")

//- write the output files to this subdirectory
.destination("files-output")

//- set file or files to not load into the pipeline
//.ignore(files)

//- set true to recreate .destination()
//.clean(true)

//- the max number of files to read/write at a time
//.concurrency(Infinity)

//- global metadata to pass to templates
//.metadata({})

//- set true to enable frontmatter parsing
//.frontmatter(true)

//========//========//========//========//========

//- end the current expression
;

const markdown = require("metalsmith-markdownit");
const doctoc = require("../src/index.js");
const attach = require("./ex-attach.js");

//- start a new expression
msi

.use(function(files, metalsmith, done) {
  console.log("pre-markdown-it");
  done();
})

.use(markdown("commonmark", {
  /* use only default options */
}))

.use(function(files, metalsmith, done) {
  console.log("pre-plugin");
  done();
})

//*
.use(doctoc({
  pattern: "**",
  ignoreFlag: false,
  doctocFlag: "doctoc",
  
  plugins: {
    "default": {
      plugin: "asdf",
      options: "h1-6"
    }
  },
  
  "default": "default",
  resolveFunc: require,
  doctocTree: "doctoc"
}))//*/

.use(function(files, metalsmith, done) {
  console.log("pre-examples");
  done();
})

.use(attach)

.use(function(files, metalsmith, done) {
  console.log("pre-build");
  done();
})

//- run metalsmith's build process
.build(function(error, files) {
  if(!error) { return false; }
  console.log("ERROR: " + error.message);
  throw error;
});
