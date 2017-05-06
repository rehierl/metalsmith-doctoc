
always a h1 heading
===

always a h2 heading
---

- these are setext-style headlines
- they are "underlined" (using "=" or "-") headlines  
  => you need at least 3 characters (i.e. "=" or "-") for it to work
- lines starting with "=" will always be h1-headings  
  => no matter how many "=" characters you use  
  => must be a pure "=" line => any other character will break recognition!
- lines starting with "-" will always be h2-headings  
  => no matter how many "-" characters you use  
  => => must be a pure "-" line => any other character will break recognition!

# h1 heading

- these are atx-style headlines
- the number of "#" used at the beginning of a line
  determines which h-tag a heading gets
- you will still get a h2 heading,
  if you use "##" without any "#"  
  => number of "#"s determines their h-number
- you will still get a h1 and h3 headings,
  if you use "#" and "###" without any "#"  
  => no auto-shifting from "###" to "##"
- the number of opening hashes determines the header level
- html only defines h1 through h6, therefore "h7 heading" won't be recognized

## h2 heading

h2 heading content

### h3 heading

h3 heading content

#### h4 heading

h4 heading content

##### h5 heading

h5 heading content

###### h6 heading

h6 heading content

####### h7 heading

h7 heading content
