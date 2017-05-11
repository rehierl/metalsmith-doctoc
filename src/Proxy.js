
"use strict";

const is = require("is");
const util = require("util");
const debug = require("debug")("metalsmith-doctoc");

module.exports = Proxy;

//========//========//========//========//========//========//========//========

function Proxy(configName, plugin) {
  if(!(this instanceof Proxy)) {
    return new Proxy(configName, plugin);
  }
  
  this.configName = configName;
  this.plugin = plugin;
  
  if(!is.fn(plugin["run"])) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: "
      + "plugin does not have a 'run' method",
      configName
    ));
  }
}

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyDefaultOptions = function(options) {
  if(is.fn(this.plugin["applyDefaultOptions"])) {
    this.plugin.applyDefaultOptions(options);
  } else {
    debug(util.format(
      "proxy for [%s]: unable to apply the options from the configuration",
      this.configName
    ));
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyFileOptions = function(filename, options) {
  if(is.fn(this.plugin["applyFileOptions"])) {
    this.plugin.applyFileOptions(filename, options);
  } else {
    debug(util.format(
      "proxy for [%s]: unable to apply the options from file [%s]",
      this.configName, filename
    ));
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.run = function(filename, file) {
  let response = this.plugin.run(filename, file);
  
  if(!is.object(response)) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: "
      + "run's response wasn't an object",
      this.configName
    ));
  }
  
  if(!response.hasOwnProperty("result")) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: "
      + "run's response doesn't have a 'result' property",
      this.configName
    ));
  }
  
  let root = undefined;
  
  if(response.isHeadingsList) {
    if(!is.array(response.result)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s]: "
        + "run's response has response.isHeadingsArray set, but "
        + "response.result isn't an array",
        this.configName
      ));
    }
    root = this.createNodesFromHeadings(response.result);
  } else {
    root = response.result;
  }
  
  if(!response.dontNormalizeLevelValues) {
    this.normalizeLevelValues(root);
  }
  
  if(!response.dontFinalizeNodes) {
    this.finalizeNodes(root);
  }
  
  return root;
};

//========//========//========//========//========//========//========//========

//input
//- a flat list of heading entries in order of appearance
//- list = [ $heading ]
//- $heading := { tag: $tag, id: $id, contents: $contents, level: $level }
//- $tag := the html tag taken from the html content; e.g. "h1" in case of "<h1>"
//- $id := the value of the html element's id attribute
//- $contents := anything that was found in between "<hX>" and "</hX>"
//- $level := the level number of a heading; e.g. 2 in case of "<h2>"
//output
//- the root node of the menu tree
//- node := extend($heading, { parent: $parent, children: $children })
//- $parent := the next node one or more steps, higher in the hierarchy
//- $children := [ $node* ] := all direct child nodes that are one or more steps
//  lower into the hierarchy in such way, that (nC.parent=nP if nP.children=[nC])
//  and (nC.level-X == nP.level) for some X in [+1,+Infinity]
Proxy.prototype.createNodesFromHeadings = function(list) {
  let nodes = [];
  
  //### initialize the nodes
  
  nodes.push({
    tag: "h0",
    id: "root",
    contents: "",
    level: 0,
    parent: undefined,
    children: []
  });
  
  let root = nodes[0];
  root.root = root;
  
  for(let ix=0, ic=list.length; ix<ic; ix++) {
    let h = list[ix];
    
    nodes.push({
      tag: h.tag,
      id: h.id,
      contents: h.contents,
      level: h.level,
      root: root,
      parent: undefined,
      children: []
    });
  }
  
  //### interconnect the nodes
  
  for(let ix=1, ic=nodes.length; ix<ic; ix++) {
    let nX = nodes[ix-1];
    let nY = nodes[ix];
    
    //- nX higher in hierarchy than nY
    if(nX.level < nY.level) {
      nY.parent = nX;
      nX.children.push(nY);
      continue;
    }
    
    //- nY higher in hierarchy than nX
    //  or nY is the next sibling of nX
    //- (nX.level >= nY.level)
    let nP = nX.parent;
    
    while(true) {//- find the parent node
      //- this should never happen because of the root node
      //console.assert(nP !== undefined, "internal error");
      
      if(nP.level < nY.level) {
        //- parent node found
        nY.parent = nP;
        nP.children.push(nY);
        break;
      }
      
      nP = nP.parent;
    }
  }
  
  //### return the tree
  
  return nodes[0];
};

//========//========//========//========//========//========//========//========

//- make sure that nP.level = nC.level-X for X in [1]
//  so not just any value in [+1,+Infinity]
Proxy.prototype.normalizeLevelValues = function(root) {
  let buffer = [ root ];
  
  while(buffer.length > 0) {
    let node = buffer.pop();
    for(let ix=0, ic=node.children.length; ix<ic; ix++) {
      let child = node.children[ix];
      child.level = child.parent.level + 1;
      buffer.push(child);
    }
  }
};

//========//========//========//========//========//========//========//========

//- set/fill the .next, .previous, .childrenAll properties
//  of each menu node
Proxy.prototype.finalizeNodes = function(root) {
  let buffer = [ root ];
  
  //- build the buffer in such way that for each nY=buffer[Y]
  //  node, there is a nX=buffer[X] node where
  //  nY.parent = nX.parent for some (X < Y)
  //- traverse such a buffer in reverse order and each node
  //  is visited if, and only if, all children of that node
  //  have been visited before
  
  for(let ix=0; ix<buffer.length; ix++) {
    let node = buffer[ix];
    
    node.next = undefined;
    node.previous = undefined;
    node.childrenAll = [];
    
    //- add all child nodes to the buffer
    for(let jx=0, jc=node.children.length; jx<jc; jx++) {
      buffer.push(node.children[jx]);
    }
  }
  
  //- start at the last child node and
  //  work your way up to the root
  
  for(let ix=buffer.length-1; ix>=0; ix--) {
    let node = buffer[ix];
    
    //- interconnect the child nodes
    for(let jx=1, jc=node.children.length; jx<jc; jx++) {
      node.children[jx-1].next = node.children[jx];
      node.children[jx].previous = node.children[jx-1];
    }
    
    //- add all child nodes to node.childrenAll
    for(let jx=0, jc=node.children.length; jx<jc; jx++) {
      let child = node.children[jx];
      node.childrenAll.push(child);
      
      for(let kx=0, kc=child.childrenAll.length; kx<kc; kx++) {
        node.childrenAll.push(child.childrenAll[kx]);
      }
    }
  }
};
