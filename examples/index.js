

/* 
 * global __dirname
 * Used to disable JsHint warning about __dirname being not declared.
 */

"use strict";

const metalsmith = require("metalsmith");
const doctoc = require("../src/index.js");

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

//*
.use(doctoc({
}))//*/

//========//========//========//========//========

//- end the current expression
;

//- require example modules

//- start a new expression
msi

//- use example modules

//========//========//========//========//========

//- run metalsmith's build process
.build(function(error, files) {
  if(!error) { return false; }
  console.log("ERROR: " + error.message);
  throw error;
});
