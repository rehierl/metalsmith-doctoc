
doctoc-default
===============

doctoc-default is intended to be run after Markdown files have been converted
into HTML files. In general, these kind of HTML files, aren't fully specified
(i.e. no &lt;html&gt; or &lt;body&gt; tags) and don't have any deep structure
worth mentioning. They merely hold a "flat" sequence of HTML tags, which
usually doesn't have any &lt;div&gt; tags.

This plugin will use regular expressions to search for heading tags (&lt;h1&gt;
to &lt;h6&gt;) and will add id attributes to them if needed.

## Options object

This plugin will accept the following option properties:

```js
Options {
  //- $range = 'h$min-$max'
  //- with $min and $max in [1,6] and ($min <= $max)
  //- $min will replace hMin and $max will replace hMax
  hRange: "h1-6",

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

  //- $selector = /h[1-6](,\s*h[1-6])*/
  //- a heading will only be taken into account, if it's tag
  //  can be found inside hSelector
  //- if hRange is given, it will override hMin and hMax
  //- if hMin or hMax are given, they will override hSelector
  //- hSelector is what will be used to find the heading tags
  hSelector: 'h1, h2, h3, h4, h5, h6',

  //- string function(string)
  //- this function will be used to calculate a missing id:
  //  assuming "<h1>$title</h1>" was found, an id will be
  //  generated as follows: $id = options.slugFunc($title)
  //- the purpose of this function is to generate an id
  //  value that respects HTML's requirements for these
  //  kind of values; e.g. no (') or (") characters, etc.
  //- node's slug module isn't flawless:
  //  slug('1.') === slug('1..') === '1'
  //  i.e. a possible id value collision
  //- this option allows you to specify a function of your
  //  own in case slug() causes any issues
  slugFunc: slug,

  //- if a heading of the form <h1>$title</h1> is found, an id
  //  will be generated using '$id = slug($title)'. in order to
  //  avoid collision of id values, generated ids will be
  //  prefixed with $idPrefix;
  //  i.e. '<h1 id="$idPrefix$id">$title</h1>'.
  //- set to "" if you don't want to use a prefix.
  idPrefix: "doctoc-",

  //- this will limit id = (idPrefix + slugFunc(title))
  //  to the specified number of characters.
  //- id values might exceed that limit by some unique
  //  number suffix.
  idLengthLimit: 256,

  //- if set to true, this will ensure that generated id values
  //  won't collide with any pre-existing ids.
  //- turned off by default as this will neagively impact the
  //  plugin's performance.
  makeIdsUnique = false
}
```

Note that if a hRange value is given, it will override hMin, hMax and hSelector.
And if hRange is omitted, but hMin and/or hMax are given, they will override
hSelector. So only one of those (hRange, hMin/hMax or hSelector) should be used.

### Range/Selector for options

This plugin will accept a range string instead of an options object:

```js
metalsmith-doctoc-options {
  ...
  plugins: {
    ...
    $configName: {
      ... options: 'h1-6' ...
    }
    ...
  },
  ...
}
```

It is also possible to provide a selector string:

```js
... options: 'h1, h2, h3, h4' ...
```

## Node.heading objects

These objects will have the following properties:

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
