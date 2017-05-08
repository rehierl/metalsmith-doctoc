
/* global __dirname */

"use strict";

const metalsmith = require("metalsmith");

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

//- start a new expression
msi

.use(function(files, metalsmith, done) {
  console.log("pre-markdown-it");
  done();
})

.use(markdown("commonmark", {}))

.use(function(files, metalsmith, done) {
  console.log("pre-plugin");
  done();
})

//*
.use(doctoc({
  //- use the default settings
}))//*/

.use(function(files, metalsmith, done) {
  console.log("post-plugin");
  done();
})

//========//========//========//========//========

//- run metalsmith's build process
.build(function(error, files) {
  if(!error) { return false; }
  console.log("ERROR: " + error.message);
  throw error;
});
