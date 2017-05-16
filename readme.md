
metalsmith-doctoc
===============

Please be aware that, as long as this plugin's version begins with '0.',
**I consider this to be a 'Under development' version.** This means that it
should basically work, but still needs some improvement/editing/review/testing.

The main purpose of this Metalsmith
([npmjs](https://www.npmjs.com/package/metalsmith),
[github](https://github.com/segmentio/metalsmith))
plugin is to provide a framework for LPs. metalsmith-doctoc **(MDT)** will invoke
lightweight plugins **(LPs)** for each file they are configured for, which they
analyze in order to generate a table-of-contents **(TOC)** menu tree. These TOC
menu trees can then be used in combination with a template engine to render
menus into your files.

## TODO

- test require() with Options.resolveFunc()
- validation of menu trees returned by plugins

## Installation

```js
npm install metalsmith-doctoc
```

## Overview

In general you will use frontmatter properties to mark your files as
"to be processed":

```
---
doctoc-flag: default
---
file content
```

When such a file is encountered, MDT will use the property's value to determine
which LP configuration to use in order to process that file. In the above case,
"default" refers to a named configuration that MDT needs to look up inside it's
options object:

```js
const doctoc = require('metalsmith-doctoc');

.use(doctoc({
  filter: "**",
  docotocFlag: "doctoc-flag",
  ignoreFlag: false,
  plugins: {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  },
  default: "default",
  enableRequire: false,
  doctocTree: "doctoc-tree"
})
```

This essentially tells MDT to initialize the integrated LP "doctoc-default" and
make it use-able via the name "default". This will also initialize the
integrated LP with the default options "h1-6".

When metalsmith's pipeline is run, MDT will then execute the integrated LP when
it encounters that file. 'doctoc-default' will then extract the file's TOC
and generate a menu tree. Once MDT receives that tree, it will assign it to the
file's 'doctoc-tree' property.

## Options

The options object that MDT will accept is as follows:

```js
Options {
  //- a multimatch pattern to select which files to process.
  //- a string, or an array of multimatch strings.
  //- files that don't match (any pattern) will be ignored.
  filter: "**",

  //- if a file has a doctocFlag property, the file
  //  is marked as "to be processed".
  //- any file that does not define this property
  //  will be ignored.
  doctocFlag: "doctoc",

  //- assign the boolean value 'true' to ignore any doctocFlag
  //  frontmatter property and to use the default configuration
  //- this is equivalent to assigning a doctocFlag frontmatter
  //  property to all files and setting their value to true.
  ignoreFlag: false,

  //- plugins := { ($configName: $config)* }
  //  i.e. the plugins property holds named configurations.
  //- $configName := a name associated with this $config
  //- $config := ($name | $class | $definition)
  //  i.e. either a $name, a $class, or a $definition
  //- $name := the name of an integrated plugin.
  //  see section "Integrated Plugins" for a list of which
  //  names are supported. Options.resolveFunc($name) will
  //  be executed if a name is not supported.
  //- $class := a class type function, that must support
  //  '$instance = new $class()' expressions.
  //- $definition := { plugin: $plugin (, options: $options)? }
  //  i.e. there must be a plugin property,
  //  but the option property is optional.
  //  any other additional property will be ignored.
  //- $plugin := ($name | $class | $instance)
  //  i.e. either a $name, a $class function, or an $instance
  //- $instance := objects returned by 'new $class(...)'
  //- $options := anything that is allowed by the plugin's
  //  $class.applyDefaultOptions() method.
  plugins: {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  },

  //- this marks the configuration to use by default.
  //  e.g. if (file[doctocFlag] == true)
  //- obviously, options.plugins must have an entry with
  //  ($configName == options.default),
  default: "default",

  //- when metalsmith-doctoc concludes that $name is
  //  not the name of an integrated plugin, it will
  //  try to execute options.resolveFunc($name).
  //- set this property to boolean true to allow
  //  metalsmith-doctoc to try executing require($name)
  //  before executing options.resolveFunc($name).
  enableRequire: false,

  //- ($class | $instance) function(string $name)
  //- assign a function that will resolve the given $name
  //  to a $class function, or a plugin $instance
  //- if you don't return a $class or an $instance, it
  //  will be assumed that the function failed to resolve
  //  $name as a reference to a plugin
  resolveFunc: undefined,

  //- to which file property to attach the resulting tree.
  //- this will replace the value of file[doctocFlag],
  //  if (options.doctocFlag == options.doctocTree)!
  doctocTree: "doctoc"
}
```

## File metadata

### file[options.doctocFlag]

```js
file[options.doctocFlag] = $value
//- $value := (false | true | $configName | $config)
//- false := ignore this file
//- true := use the default options.plugins configuration
//- $configName := one of the names used in options.plugins
//- $config := { config: $configName (, options: $options )? }
//  i.e. there must be a config property,
//  but there may be an optional options property.
//  any other additional property will be ignored.
//- $options := anything that is allowed by the plugin's
//  $class.applyFileOptions($options) method.
```

### file[options.doctocTree]

```js
file[options.doctocTree] = $root
//- $root := the topmost node of the menu tree
```

This file property will hold an instance of a node object:

```js
Node {
  //- a Heading object
  //- (root.heading == undefined)
  heading: $heading

  //- a number from [+0,+Infinity)
  //- (node.level == node.parent.level+X)
  //  must be true for some X in [+1,+Infinity)
  //  i.e. X does not have to be +1!
  //- (root.level == 0) and (node.level >= 1)
  //  for any other node object
  level: $level,

  //- the topmost node of the current node tree.
  //- (root.root == root); i.e. circular!
  root: Node?

  //- set to point to the node's parent node
  //- (node.parent.children[i] == node)
  //- (root.parent == undefined)
  parent: Node?,

  //- the next sibling such that
  //- if (node == node.parent.children[i]), then
  //  (node.next == node.parent.children[i+1]),
  //- this property will be undefined
  //  if there is no such node
  //- (root.next == undefined)
  next: Node?,

  //- the previous sibling such that
  //- if (node == node.parent.children[i]), then
  //  (node.previous == node.parent.children[i-1])
  //- this property will be undefined
  //  if there is no such node
  //- (root.previous == undefined)
  previous: Node?,

  //- all direct child nodes of this node
  //  i.e. (node.children[i].parent == node)
  children: [ Node* ],

  //- all direct and indirect child nodes of the
  //  sub-tree defined by the current node
  childrenAll: [ Node* ]
}
```

Note that the actual properties of the node.heading object is not relevant to
MDT and must be defined/documented by the LP that created these. A Heading
object could have the following properties:

```js
Heading {
  //- e.g. 'h1' in case of '<h1>'
  tag: $tag,

  //- e.g. '$id' in case of '<h1 id="$id">'
  id: $id,

  //- e.g. '$title' in case of '<h1>$title</h1>'
  title: $title,

  //- e.g. 2 in case of '<h2>'
  level: $level
}
```

## Integrated plugins

MDT comes with the following LPs:

* [doctoc-default](https://github.com/rehierl/metalsmith-doctoc/tree/master/src/doctoc-default)
  is intended to be run after Markdown files have been converted into HTML files.
  It will use regular expressions to analyze these files and add id attributes
  to heading tags if needed. When done it will return a list of Heading objects
  to MDT for further processing.

These can be used by specifying their name inside options.plugins. Their main
purpose though is to showcase how to implement LPs.

## List of available LPs

* metalsmith-doctoc-jsdom
  ([npmjs](https://www.npmjs.com/package/metalsmith-doctoc-jsdom),
  [github](https://github.com/rehierl/metalsmith-doctoc-jsdom))
  will use jsdom
  ([npmjs](https://www.npmjs.com/package/jsdom),
  [github](https://github.com/tmpvar/jsdom))
  to search for heading tags inside HTML content.

If you intend to create a plugin for MDT and need some documentation, then take
a look at the [API documentation](https://github.com/rehierl/metalsmith-doctoc/tree/master/readme-api.md).

If you have implemented a plugin for MDT, please prefix it's name with
'metalsmith-doctoc-'. This will allow your plugin to be easily found by
[searching on npmjs](https://www.npmjs.com/search?q=metalsmith-doctoc-).

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

In some cases, MDT needs to create it's own error in order to point out, with
which options.plugins configuration or file it had a problem. As this this will
hide the error that triggered a problem, this initial error will be attached
to the new error's object via a 'innerError' property. Check these properties if
MDT's error messages lack the information you need to solve an issue.

## License

MIT
