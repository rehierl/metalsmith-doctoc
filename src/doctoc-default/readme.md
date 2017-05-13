
doctoc-default
===============

doctoc-default is intended to be run after Markdown files have been converted
into HTML files. In general, these kind of HTML files, aren't fully specified
(i.e. no &lt;html&gt; or &lt;body&gt; tags) and don't have any deep structure
worth mentioning. They merely hold a "flat" sequence of HTML tags, which
usually doesn't have any &lt;div&gt; tags.

This plugin will use regular expressions to search for heading tags (&lt;h1&gt;
to &lt;h6&gt;) and will add id attributes to them if needed. It will then return
a list of Heading objects to metalsmith-doctoc for further processing.

## Options Object

doctoc-default will accept the following option properties:

```js
Options {
  //- an integer value in [1,6]
  //- if hMin=X, then this plugin will
  //  ignore any heading tag <hN> if (N < X)
  //- if (hMin == hMax == X), then this plugin will
  //  ignore any heading tag, but not <hX>
  //- if (hMin > hMax), then all heading tags will be ignored!
  hMin: 1,

  //- an integer value in [1,6]
  //- if hMax=X, then this plugin will
  //  ignore any heading tag <hN> if (N > X)
  //- if (hMin == hMax == X), then this plugin will
  //  ignore any heading tag, but not <hX>
  //- if (hMin > hMax), then all heading tags will be ignored!
  hMax: 6,

  //- if a heading of the form <h1>$title</h1> is found, an id
  //  will be generated using '$id = slug($title)'. in order to
  //  avoid collision of id values, generated ids will be
  //  prefixed with $idPrefix;
  //  i.e. '<h1 id="$idPrefix$id">$title</h1>'.
  //- set to "" if you don't want to use a prefix.
  idPrefix: "doctoc-"
}
```

### Range pattern

You may use a range pattern to specify hMin and hMax values separately:

```
$range = 'h$min-$max'
$min, $max = [1-6]
```

Note that the value of $min should always be lower or equal to the value of $max.

### Range for options

This plugin will accept a range pattern instead of an options object:

```js
metalsmith-doctoc-options {
  ...

  plugins: {
    ...
    
    $configName: {
      plugin: 'doctoc-default',
      options: $range
    }

    ...
  },

  ...
}
```

In this case, the default value (i.e. 'doctoc-') will be used for the idPrefix
property.

### Range property

Instead of the hMin and hMax properties, you may specify a hRange property:

```js
Options {
  hRange: $range,
  idPrefix: $prefix
}
```

Please note, that this will overwrite/replace any hMin and hMax property!

## Heading Objects

doctoc-default's Heading objects will have the following properties:

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
