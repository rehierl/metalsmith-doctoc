
"use strict";

const is = require("is");
const util = require("util");

const IdGenerator = require("./IdGenerator.js");

module.exports = PluginsApi;

//========//========//========//========//========//========//========//========

function PluginsApi() {
  if(!(this instanceof PluginsApi)) {
    return new PluginsApi();
  }
}

//========//========//========//========//========//========//========//========

PluginsApi.prototype.readFileContents = function(readFunc, context) {
  let contents = context.file.contents;
  let fromBuffer = undefined;
  
  if(is.string(contents)) {
    fromBuffer = false;
  } else {
    //- assume contents is a Buffer
    contents = contents.toString('utf8');
    fromBuffer = true;
  }
  
  context.contents = contents;
  const result = readFunc(context);
  
  if(context.contents) {
    contents = context.contents;
    
    if(!is.string(contents)) {
      throw new Error("context.contents must be a string value");
    }
    
    if(fromBuffer === true) {
      //- if you started with a buffer,
      //  then you should finish with one
      contents = new Buffer(contents);
    }
    
    context.file.contents = contents;
  }
  
  return result;
};

//========//========//========//========//========//========//========//========

PluginsApi.prototype.getIdGenerator = function(options) {
  return new IdGenerator(options);
};

//========//========//========//========//========//========//========//========

PluginsApi.prototype.createTreeFromHeadings = function(headings) {
  const root = this.createNodesFromHeadings(headings);
  
  this.finalizeNodes(root);
  this.normalizeLevelValues(root);
  
  return root;
};

//========//========//========//========//========//========//========//========

//@param list
//- an array of Heading entries in order of appearance
//- $heading := { tag: $tag, id: $id, contents: $contents, level: $level }
//- $tag := the html tag taken from the html content; e.g. "h1" in case of "<h1>"
//- $id := the value of the html element's id attribute
//- $contents := anything that was found in between "<hX>" and "</hX>"
//- $level := the level number of a heading; e.g. 2 in case of "<h2>"
//@returns
//- the root node of the menu tree
//- node := extend($heading, { parent: $parent, children: $children })
//- $parent := the next node one or more steps, higher in the hierarchy
//- $children := [ $node* ] := all direct child nodes that are one or more steps
//  lower into the hierarchy in such way, that (nC.parent=nP if nP.children=[nC])
//  and (nC.level-X == nP.level) for some X in [+1,+Infinity]
PluginsApi.prototype.createNodesFromHeadings = function(headings) {
  const nodes = [];
  
  //### initialize the nodes
  
  const root = {
    heading: undefined,
    level: 0,
    parent: undefined,
    children: []
  };
  
  nodes.push(root);
  
  for(let ix=0, ic=headings.length; ix<ic; ix++) {
    const h = headings[ix];
    
    if(!is.object(h)) {
      throw new Error(util.format(
        "doctoc options.plugins[%s]: "
        + "returned a non-object heading entry",
        this.configName
      ));
    }
    
    if(!h.hasOwnProperty("level")) {
      throw new Error(util.format(
        "doctoc options.plugins[%s]: "
        + "returned a heading without level property",
        this.configName
      ));
    }
    
    const level = h.level;
    
    if(!is.number(level)) {
      throw new Error(util.format(
        "doctoc options.plugins[%s]: "
        + "returned a heading with an invalid level property",
        this.configName
      ));
    }
    
    if(level <= 0) {
      throw new Error(util.format(
        "doctoc options.plugins[%s]: "
        + "returned a heading with an invalid level property",
        this.configName
      ));
    }
    
    nodes.push({
      heading: h,
      level: level,
      parent: undefined,
      children: []
    });
  }
  
  //### interconnect the nodes
  
  for(let ix=1, ic=nodes.length; ix<ic; ix++) {
    const nX = nodes[ix-1];
    const nY = nodes[ix];
    
    //- nX higher in hierarchy than nY
    if(nX.level < nY.level) {
      nX.children.push(nY);
      nY.parent = nX;
      continue;
    }
    
    //- nY higher in hierarchy than nX
    //  or nY is the next sibling of nX
    //- (nX.level >= nY.level)
    let nP = nX.parent;
    
    while(true) {//- find the parent node
      //- because of root, this should never happen
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
  
  return root;
};

//========//========//========//========//========//========//========//========

//- set the .root, .next, .previous and .childrenAll properties
//  of each node object
PluginsApi.prototype.finalizeNodes = function(root) {
  const buffer = [ root ];
  
  //- build the buffer in such way that for each nY=buffer[Y]
  //  node, there is a nX=buffer[X] node where
  //  nY.parent = nX.parent for some (X < Y)
  //- traverse such a buffer in reverse order and each node
  //  is visited if, and only if, all children of that node
  //  have been visited before
  
  for(let ix=0; ix<buffer.length; ix++) {
    const node = buffer[ix];
    
    node.root = root;
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
    const node = buffer[ix];
    
    //- interconnect the child nodes
    for(let jx=1, jc=node.children.length; jx<jc; jx++) {
      node.children[jx-1].next = node.children[jx];
      node.children[jx].previous = node.children[jx-1];
    }
    
    //- add all child nodes to node.childrenAll
    for(let jx=0, jc=node.children.length; jx<jc; jx++) {
      const child = node.children[jx];
      node.childrenAll.push(child);
      
      for(let kx=0, kc=child.childrenAll.length; kx<kc; kx++) {
        node.childrenAll.push(child.childrenAll[kx]);
      }
    }
  }
};

//========//========//========//========//========//========//========//========

PluginsApi.prototype.normalizeLevelValues = function(root) {
  const nodes = root.root.childrenAll;
  const ic = nodes.length;
  
  for(let ix=0; ix<ic; ix++) {
    const node = nodes[ix];
    node.level = node.parent.level+1;
  }
};
