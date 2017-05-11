
metalsmith-doctoc
===============

If you know 'metalsmith-autotoc'
([npmjs](https://www.npmjs.com/package/metalsmith-autotoc),
[github](https://github.com/anatoo/metalsmith-autotoc)),
then you already know what this plugin will essentially do. The only (big)
difference is that 'metalsmith-doctoc' will allow you to use lightweight plugins
(LPs) to configure how your TOCs will be generated from your source files.

So the main purpose of this Metalsmith
([npmjs](https://www.npmjs.com/package/metalsmith),
[github](https://github.com/segmentio/metalsmith))
plugin is to provide a framework for LPs. 'metalsmith-doctoc' will invoke these
LPs for each file they are assigned to, which they analyze in order to extract
a table-of-contents (TOC) menu tree. These TOC menu trees can then be used in
combination with a template engine to render TOC menus into your files.

## TODO

Please be aware that, as long as this plugin's version begins with '0.',
**I consider this to be a 'Beta' version.** This means that it should basically
work, but still needs some editing/review/testing. So essential parts may change
without further notice. Please open an issue on github if you have any suggestions.

- check plugin results ?!?
- Need to properly test and describe differences when using
  'require' in combination with Options.resolveFunc().

## Installation

```js
npm install metalsmith-doctoc
```

## Overview

In general you will use YAML frontmatter to mark your files as to be processed:

```
---
doctoc-flag: default
---
file content
```

By defining a "doctoc-flag" frontmatter property you configure a file to be
processed. When such a file is encountered, metalsmith-doctoc will use the
property's value to determine which plugin configuration to use in order to
process that file. In the above case, "default" refers to a named configuration
that needs to be defined via metalsmith-doctoc's options:

```js
.use(doctoc({
  filter: "**",
  docotocFlag: "doctoc-flag",
  ignoreFlag: false,
  plugins: {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  },
  default: "default",
  doctocTree: "doctoc-tree"
})
```

This essentially tells metalsmith-doctoc to initialize the integrated plugin
"doctoc-default" and make it accessible via the name "default". This will also
initialize the integrated plugin with the default setting "h1-6".

When metalsmith's pipeline is run, metalsmith-doctoc will execute the integrated
plugin when it encounters that file. doctoc-default will then extract the file's
table-of-contents and generate a menu tree. Once it receives that tree,
metalsmith-doctoc will then assign it to the file's "doctoc-tree" property.

## Options

```js
Options {
  //- a multimatch pattern to select which files to process.
  //- a string, or an array of pattern strings.
  //- files that don't match (any pattern) will be ignored.
  filter: "**",

  //- if a file has a doctocFlag frontmatter property, the file
  //  is considered to be marked as "to be processed".
  //- any file that does not have this property will be ignored.
  doctocFlag: "doctoc",

  //- set the boolean value 'true' to ignore any doctocFlag
  //  frontmatter property and to use the default configuration
  //- this is equivalent to assigning a doctocFlag frontmatter
  //  property to all files and setting their value to true.
  ignoreFlag: false,

  //- plugins := { ($configName: $config)* }
  //  i.e. the plugins option holds named configurations
  //- $configName := a name associated with this $config
  //- $config := ($name | $class | $definition)
  //  i.e. either a $name, a $class, or a $definition
  //- $name := the name of an integrated plugin.
  //  currently, only "doctoc-default" is supported.
  //  see "Integrated Plugins" for a list of which names
  //  are supported. Options.resolveFunc($name) will be
  //  executed if a name is not supported.
  //- $class := a class type function, that must support
  //  '$instance = new $class()' expressions.
  //- $definition := { plugin: $plugin (, options: $options)? }
  //  there must be a 'plugin' property,
  //  but the 'option' property is optional.
  //  any other additional property will be ignored.
  //- $plugin := ($name | $class | $instance)
  //  i.e. either a $name, a $class function, or an $instance
  //- $instance := objects returned by 'new $class()'
  //- $options := anything that is accepted by the plugin's
  //  $class.applyDefaultOptions() method.
  plugins: {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  },

  //- defines the configuration to use by default.
  //  e.g. if (file[doctocFlag] == true)
  //- options.plugins must have an entry with
  //  ($configName == options.default),
  default: "default",

  //- when metalsmith-doctoc concludes that $name is
  //  not the name of an integrated plugin, it will
  //  try to execute options.resolveFunc($name)
  //- set this property to boolean 'true' to let
  //  metalsmith-doctoc try to execute require($name)
  //  before options.resolveFunc($name) is executed
  //- define options.resovleFunc if you use this property!
  enableRequire: false,

  //- ($class | $instance) function(string $name)
  //- assign a function that resolves the given $name
  //  to a $class function, or a plugin $instance
  //- a "resolveFunc = require," could work if require()
  //  is able to find the given plugin
  //- "resolveFunc = function(name){ return require(name); }
  //  is similar, but will most probably use a different
  //  folder from which it will start it's search.
  //- don't specify, if you don't provide a function!
  resolveFunc: undefined,

  //- to which file metadata property to attach the resulting
  //  table-of-contents tree.
  //- this will replace the value of file[doctocFlag],
  //  if (options.doctocFlag == options.doctocTree)!
  doctocTree: "doctoc"
}
```

## File metadata

### file[options.doctocFlag]

This file property is expected to have the following $value:

```js
//- $value := (false | true | $configName | $config)
//- false := ignore this file
//- true := use metalsmith-doctoc's default configuration
//- $configName := one of the names used in options.plugins
//- $config := { config: $configName (, options: $options )? }
//  there must be a 'config' property,
//  but there may be an optional 'options' property.
//  any other additional property will be ignored.
//- $options := anything that is accepted by the plugin's
//  $class.applyFileOptions() method.
```

### file[options.doctocTree]

This file property will hold an instance of a node object;
more precisely, the topmost (root) node of the node tree.

```js
Node {
  //- a string value
  //- e.g. 'h1' in case of a <h1> tag
  tag: $tag,

  //- a string value
  //- e.g. '$id' in case of a <h1 id='$id'> tag
  //- if $id was missing, one will be generated and
  //  the file's contents will be modified accordingly
  id: $id,

  //- a string value
  //- i.e. $contents from <h1>$contents</h1>
  //- this value will be used as the link's description
  contents: $contents,

  //- a number value in [+0,+Infinity)
  //- root.level will always be 0; and
  //  (node.level > root.level) for all other nodes
  //- (this.level == this.parent.level+X)
  //  must be true for some X in [+1,+Infinity)
  //  i.e. X does not have to be +1!
  level: $level,

  //- the topmost node of the current node tree.
  //- root.root = root (circular!)
  root: Node?

  //- set to point to the node's parent node
  //- there must be a value 'i' such that
  //  (this.parent.children[i] = this)
  //- this property will be undefined
  //  if there is no such parent node;
  //  i.e. (root.parent == undefined)
  parent: Node?,

  //- the next sibling node such that
  //- (node.next == node.next.previous)
  //- (node.level == node.next.level)
  //- if (node == node.parent.children[i]), then
  //  (node.next == node.parent.children[i+1]),
  //- this property will be undefined
  //  if there is no such sibling node
  next: Node?,

  //- the previous sibling node such that
  //- (node.next == node.next.previous)
  //- (node.level == node.previous.level)
  //- if (node == node.parent.children[i]), then
  //  (node.previous == node.parent.children[i-1])
  //- this property will be undefined
  //  if there is no such sibling node
  previous: Node?,

  //- for each node in children, the following
  //  must be true: (node.parent == this)
  //  for each node in this array.
  children: [ Node* ],

  //- all direct and indirect child nodes in the
  //  current sub-tree in order of appearance.
  childrenAll: [ Node* ]
}
```

## Integrated plugins

'metalsmith-doctoc' comes with the following lightweight plugins (LPs). Their
main purpose though is to showcase how to implement and use your own LPs.

The names of all integrated plugins will use the prefix "doctoc-".

### "doctoc-default"

'doctoc-default' is intended to be run after Markdown files have been converted
into HTML files. In general, these kind of HTML files, aren't fully specified
and don't have any deep structure worth mentioning. They merely hold a "flat"
sequence of HTML tags; i.e. usually no &lt;div&gt; tags.

This default plugin uses regular expressions to search for headings (&lt;h1&gt;
to &lt;h6&gt;) tags and assigns id values to them if needed; i.e. this default
plugin won't add any anchors (&lt;a&gt;) to your content files. It will then
return a list of headings to 'metalsmith-doctoc' for further processing.

## List of LPs

* What is it's name? : What will it do?

If you have implemented a plugin to be used with 'metalsmith-doctoc', please
name it using 'metalsmith-doctoc-' as prefix. This will allow your plugin to be
easily found by searching on 
[npmjs](https://www.npmjs.com/search?q=metalsmith-doctoc-).

## Error handling

```js
try {
  //- try something that might fail
} catch(error) {
  let newError = new Error("some message");
  newError.innerError = error;
  throw newError;
}
```

In some cases, metalsmith-doctoc needs to create it's own error in order to
point out, with which options.plugins configuration or file it had a problem.
As this this will dump the actual error that triggered this problem, this
initial error will be attached to the new Error object via a 'innerError'
property. Check these properties if doctoc's error messages lack the information
you need to deal with a problem.

## Plugins API

If you intend to write a plugin for 'metalsmith-doctoc', you essentially agree
to generate a menu tree that any user can use as if 'metalsmith-doctoc' created
this structure itself. The main advantage for you is that you can concentrate on
what your plugin is actually supposed to do, which is to read table-of-contents
from a file's contents.

Take a look at the './src/doctoc-default' subfolder on
[github](https://github.com/rehierl/metalsmith-doctoc/tree/master/src/doctoc-default)
for an example of how to implement a basic lightweight plugin for 'metalsmith-doctoc'.

```js
Plugin interface {
  //- no properties are required or accessed.
  //- interaction with plugins is done using methods.
  //any_property: any_value,

  //- optional
  //- void function(anything)
  //- if options.plugins[$name].options does exist,
  //  it's value will be passed on to this function
  //- when options are found and this function is missing,
  //  a waring will be issued
  function applyDefaultOptions(options);
  
  //- optional
  //- void function(anything)
  //- if file[options.doctocFlag].options does exist,
  //  it's value will be passed on to this function
  //- when options are found and this function is missing,
  //  a waring will be issued
  function applyFileOptions(filename, options);

  //- required
  //- RunResponse function(string, object)
  function run(filename, file);
}
```

Note that 'metalsmith-doctoc' implements a proxy, which wraps up any lightweight
plugin. This proxy will handle all cases in which any of the above optional
functions are missing. The 'Plugin.run()' function must return an object, which
holds run's result and contains meta-information about the result. The proxy
uses this meta-data to determine if the plugin's actual result needs further
processing. run's response object must have the following structure:

```js
RunResponse {
  //- required
  //- $result = ($headings | $root)
  //- $headings = [ Heading* ]
  //  an array of Heading objects
  //- $root = Node
  //  the topmost node of a node tree
  result: $result,

  //- optional
  //- set true if response.result is a $headings array
  //- the proxy will replace result's value by a $root
  isHeadingsList: false,

  //- optional
  //- set true to not normalize all node level values
  //- 'normalized' means that for all nodes,
  //  the following is true: (child.level = parent.level+1),
  //  if (and only if) (child.parent = parent)
  dontNormalizeLevelValues: false,

  //- optional
  //- set true to prevent the proxy from overwriting
  //  the following node properties:
  //  node.next, node.previous, node.childrenAll
  dontFinalizeNodes, false
}
```

If RunResponse.isHeadingsList is set, RunResponse.result is expected to be
an array of Heading objects:

```js
Heading {
  //- a string value
  //- set to 'hX' for each <hX> tag
  //- e.g. 'h1' in case of a <h1> tag
  tag: $tag,

  //- a string value
  //- e.g. '$id' in case of a <h1 id='$id'> tag
  //- if no id is available, one must be generated
  //  and the file's contents must be modified accordingly
  id: $id,

  //- a string value
  //- set to $contents in case of <h1>$contents</h1>
  //- this value will be used to describe a link.
  contents: $contents,

  //- an integer value from [+1,+Infinity)
  //- e.g. 2 in case of <h2>
  level: $level
}
```

If (list[i].level < list[i+n].level), proxy will assume that list[i+n] is
supposed to be a child heading of list[i]. Hence it is important that list
contains the headings in order of appearance.

In any other case, RunResponse.result is expected to be a Node object;
more precisely, the topmost (root) node of a node tree. See section
file[options.doctocTree] for an object definition.

You may omit node.next, node.previous and node.childrenAll as long as you don't
set RunResponse.dontFinalizeNodes to true. You must set dontFinalizeNodes if
your plugin has set these properties, or otherwise the proxy will overwrite
their values.

## License

MIT
