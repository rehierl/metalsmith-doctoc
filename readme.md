
metalsmith-doctoc
===============

Please be aware that, as long as this plugin's version begins with '0.',
**I consider this to be a 'Beta' version.** This means that essential parts may
change without further notice. Please open an issue on github if you have any
suggestions.

If you know 'metalsmith-autotoc'
([npmjs](https://www.npmjs.com/package/metalsmith-autotoc),
[github](https://github.com/anatoo/metalsmith-autotoc)),
then you already know what this plugin is supposed to do. The only (big)
difference is that 'metalsmith-doctoc' will allow you to use lightweight plugins
(LPs) to configure how exactly your TOCs will be read from your source files.

So the main purpose of this Metalsmith
([npmjs](https://www.npmjs.com/package/metalsmith),
[github](https://github.com/segmentio/metalsmith))
plugin is to provide a framework for LPs. 'metalsmith-doctoc' will invoke these
LPs for each file they are assigned to, which they analyze and modify in order
to extract a table-of-contents (TOC) menu tree. Such TOC menu trees can then be
used in combination with template engines to render TOC menus into your files.

## TODO

- Need to think about reworking errors:
  Currently, this plugin will throw simple exceptions.
  Any way to support inner exceptions?
- Options.combine() needs to validate user values.
- Need to properly test and describe differences when using 'require' in
  combination with Options.resolveFunc().

## Installation

```js
npm install metalsmith-doctoc
```

## file metadata

```js
//- $value := (false | true | $configName | $config)
//- false := ignore this file
//- true := use the default configuration (see options.default)
//  with non-file specific options
//- $configName := one of the keys used in options.plugins
//- $config := { config: $configName (, options: $options )? }
//  there must be a 'config' property, but there may be an
//  optional 'options' property. any other property will be ignored.
//- $options := anything that will be accepted by the plugin's
//  $class.applyFileOptions() method.
file[options.doctocFlag] := $value
```

* Notice: $options are file-specific options, which will be passed on to
'plugin.applyFileOptions()' with 'plugin' being given by $configName.

## Options

```js
Options {
  //- a multimatch pattern to select which files to process.
  //- a string, or an array of pattern strings.
  //- files that don't match (any pattern) will be ignored.
  filter: "**",

  //- if a file has a doctocFlag metadata property, the file
  //  is considered to be marked as "to be processed".
  //- assign the boolean value 'true' to use the default plugin.
  //- any file that does not have this property will be ignored.
  doctocFlag = "doctoc",

  //- assign the boolean value 'true' to ignore any doctocFlag
  //  metadata property and to use the default plugin
  //- this will act as if each file had (file[doctocFlag] == true)
  ignoreFlag = false,

  //- plugins := { ($configName: $config)* }
  //  i.e. the plugins option holds named configurations
  //- $configName := a name associated with this $config
  //- $config := ($name | $class | $definition)
  //  i.e. either a $name, a $class, or a $definition
  //- $name := the name of an integrated plugin.
  //  currently, only "doctoc-default" is supported.
  //  Options.resolveFunc($name) will be executed in case
  //  a name is not supported.
  //- $class := a class type function, that must support
  //  '$instance = new $class()' expressions.
  //- $definition := { plugin: $plugin, (, options: $options)? }
  //  there must be a 'plugin' property, but there may be
  //  an optional 'options' property. any other property will
  //  be ignored.
  //- $plugin := ($name | $class | $instance)
  //  i.e. either a $name, a $class function, or an $instance
  //- $instance := objects returned by a 'new $class()' expression
  //- $options := anything that will be accepted by the plugin's
  //  $class.applyDefaultOptions() method.
  plugins = {
    "default": { plugin: "doctoc-default", options: "h1-6" }
  },

  //- defines the plugin configuration to use by default.
  //- options.plugins[options.default] must exist;
  //  i.e. options.plugins must have an entry with
  //  ($configName == options.default),
  default = "default",

  //- a function that has the following signature:
  //  ($class | $instance) function(string $name)
  //- assign a function that resolves the given $name
  //  to a $class function or a plugin $instance
  //- a "resolveFunc = require," could work if require()
  //  is able to find the given plugin
  //- "resolveFunc = function(name){ return require(name); }
  //  is the same except that require() will use a different
  //  folder to begin with.
  resolveFunc = undefined,

  //- to which file metadata property to attach the resulting
  //  table-of-contents tree.
  //- this will replace the value of file[doctocFlag] if
  //  (options.doctocFlag == options.doctocTree)!
  doctocTree = "doctoc"
}
```

* Notice: 'Options.plugins[X].options' are default options, which will be passed
on to the plugin specified by 'Options.plugins[X].plugin'.

## Integrated plugins

'metalsmith-doctoc' comes with the following lightweight plugins (LPs). These
allow to use this plugin right off the start. Their main purpose though is to
showcase how to implement and use your own LPs.

In order to use these, simply specify their name (e.g. "doctoc-default") inside
Options.plugins if a $name value is supported.

### "doctoc-default"

This is the integrated, default lightweight plugin for 'metalsmith-doctoc'. It
will be used if you assign the string "doctoc-default" to '$name'; see
'Options.plugins'.

'doctoc-default' is intended to be run after Markdown files have been converted
into HTML files. In general, these kind of HTML files, don't have any deep
structure worth mentioning. They merely hold a "flat" sequence of HTML tags;
i.e. they usually don't contain any &lt;div&gt; tags.

So what this default plugin does is to use regular expressions to search for
headings (&lt;h1&gt; to &lt;h6&gt;) and assign id values to them if needed; i.e.
this default plugin won't add any anchors (&lt;a&gt;) to your content files.
It will then return a list of headings to 'metalsmith-doctoc' for further
processing.

## List of LPs

* What is it's name? : What will it do?

If you have implemented a plugin to be used with 'metalsmith-doctoc', please
name it using 'metalsmith-doctoc-' as prefix. This will allow your plugin to be
easily found by searching on
[npmjs](https://www.npmjs.com/search?q=metalsmith-doctoc-).

## Plugins API

If you intend to write a plugin for 'metalsmith-doctoc', you essentially agree
to generate a menu tree that any user can use as if 'metalsmith-doctoc' created
this structure itself. The main advantage for you is that you don't have to
take care of all the surroundings (options) and that you can concentrate on
what your plugin is actually supposed to do.

Take a look at the './src/doctoc-default' subfolder on
[github]()
for an example of how to implement a lightweight plugin for 'metalsmith-doctoc'.

```js
function Plugin(userOptions) {
  //- no properties are required or accessed.
  //- interaction with plugins is done using methods.
  //this.any_property = value;

  //- optional
  //- void function(anything)
  //- if options.plugins[$name].options does exist,
  //  it's value will be passed on to this function
  //- when options are found and this function is missing,
  //  a waring will be issued
  function applyDefaultOptions(options){ ... };
  
  //- optional
  //- void function(anything)
  //- if file[options.doctocFlag].options does exist,
  //  it's value will be passed on to this function
  //- when options are found and this function is missing,
  //  a waring will be issued
  function applyFileOptions(filename, options){ ... };

  //- required
  //- RunResponse function(string, object)
  function run(filename, file){ ... };
}
```

Note that 'metalsmith-doctoc' implements a proxy, which wraps up any leightweight
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
  //  i.e. an array of Heading objects
  //- $root = Node
  //  i.e. the topmost node of a node tree
  this.result = $result;

  //- optional
  //- set true, if response.result is a $headings array
  //- the proxy will replace result's value with a $root
  this.isHeadingsList = false;

  //- optional
  //- set true to not normalize all node level values
  //- 'normalized' means that for all nodes,
  //  the following is true: (parent.level = child.level-1),
  //  if (and only if) (child.parent = parent)
  this.dontNormalizeLevelValues = false;

  //- optional
  //- set true to not let the proxy set the following
  //  properties for all node objects:
  //  node.next, node.previous, node.childrenAll
  this.dontFinalizeNodes = false;
}
```

```js
Heading {
  //- set to 'h1' in case of a <h1> tag
  //- for debugging purposes only
  this.tag = $tag;

  //- set to $id in case of a <h1 id='$id'> tag
  //- if no id is available, one must be generated
  this.id = $id;

  //- set to $contents in case of <h1>$contents</h1>
  this.contents = $contents;

  //- set to 2 in case of <h2>
  //- this does not have to be the final value
  //  see ProxyConfig.normalizeLevls
  this.level = $level;
}
```

* Notice: If 'Plugin.run()' returns an array of 'Heading' objects, then
'Plugin.getProxyConfig()' should set all fields inside it's 'ProxyConfig'
response.

```js
Node {
  //- see Heading.tag
  this.tag = $tag;

  //- see Heading.id
  this.id = $id;

  //- see Heading.contents
  this.contents = $contents;

  //- see Heading.level
  this.level = $level;

  //- set to match the node's parent node
  this.parent = Node;

  //- for each child in Node*, the following must hold
  //  (child.parent == this).
  this.children = [ Node* ];

  //- optional
  //- the next sibling node such that
  //- (node.next == node.next.previous)
  //- (node.level == node.next.level)
  //- if (node == node.parent.children[i]), then
  //  (node.next == node.parent.children[i+1]),
  this.next = undefined;

  //- optional
  //- the previous sibling node such that
  //- (node.next == node.next.previous)
  //- (node.level == node.previous.level)
  //- if (node == node.parent.children[i]), then
  //  (node.previous == node.parent.children[i-1])
  this.previous = undefined;

  //- optional
  //- all direct and indirect child nodes in the
  //  current sub-tree in order of appearance.
  this.childrenAll = [ Node* ];
}
```

* Notice: If 'next', 'previous', 'childrenAll' are omitted, then
'Plugin.getProxyConfig()' should set the 'finalizeTree' field inside
it's 'ProxyConfig' response. 

## License

MIT
