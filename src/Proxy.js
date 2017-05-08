
"use strict";

const is = require("is");
const util = require("util");

module.exports = Proxy;

//========//========//========//========//========//========//========//========

function Proxy(configName, plugin) {
  if(!(this instanceof Proxy)) {
    return new Proxy(configName, plugin);
  }
  
  if( !is.fn(plugin["run"])) {
    throw new Error(util.format(
      "doctoc: options.plugins[%s]: missing 'run' function",
      configName
    ));
  }
  
  this.configName = configName;
  this.plugin = plugin;
}

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyDefaultOptions = function(options) {
  if(is.fn(this.plugin["applyDefaultOptions"])) {
    this.plugin.applyDefaultOptions(options);
  } else {
    //- cannot apply the given options
    //TODO: issue a warning
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyFileOptions = function(options) {
  if(is.fn(this.plugin["applyFileOptions"])) {
    this.plugin.applyFileOptions(options);
  } else {
    //- cannot apply the given options
    //TODO: issue a warning
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.run = function(filename, file) {
  let tree = this.plugin.run(filename, file);
  
  if(is.array(tree)) {
    tree = this.buildTree(tree);
  }
  
  return tree;
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
Proxy.prototype.buildTree = function(list) {
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
  
  for(let ix=0, ic=list.length; ix<ic; ix++) {
    let h = list[ix];
    
    nodes.push({
      tag: h.tag,
      id: h.id,
      contents: h.contents,
      level: h.level,
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
