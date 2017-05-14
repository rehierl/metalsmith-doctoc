
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
  if(!is.fn(this.plugin["applyDefaultOptions"])) {
    debug(util.format(
      "doctoc options.plugins[%s]: "
      + "unable to apply the options from the configuration",
      this.configName
    ));
    return;
  }

  try {
    this.plugin.applyDefaultOptions(options);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to execute plugin.applyDefaultOptions()",
      this.configName
    ));
    newError.innerError = error;
    throw newError;
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.applyFileOptions = function(filename, options) {
  if(!is.fn(this.plugin["applyFileOptions"])) {
    debug(util.format(
      "doctoc options.plugins[%s]: "
      + "unable to apply the options from file [%s]",
      this.configName, filename
    ));
    return;
  }
  
  try {
    this.plugin.applyFileOptions(filename, options);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to execute plugin.applyFileOptions() "
      + "with file [%s]",
      this.configName, filename
    ));
    newError.innerError = error;
    throw newError;
  }
};

//========//========//========//========//========//========//========//========

//- public, required
Proxy.prototype.run = function(filename, file) {
  let response = undefined;
  
  try {
    response = this.plugin.run(filename, file);
  } catch(error) {
    let newError = new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "failed to process file [%s]",
      this.configName, filename
    ));
    newError.innerError = error;
    throw newError;
  }
  
  if(!is.object(response)) {
    throw new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "run's response wasn't an object",
      this.configName
    ));
  }
  
  if(!response.hasOwnProperty("result")) {
    throw new Error(util.format(
      "doctoc options.plugins[%s]: "
      + "run's response doesn't have a 'result' property",
      this.configName
    ));
  }
  
  let root = undefined;
  
  if(!response.isHeadingsList) {
    root = response.result;

    if(response.dontFinalizeNodes) {
      //- do a full validation
    } else {
      //- do a semi validation
      this.finalizeNodes(root);
    }
  } else {
    if(!is.array(response.result)) {
      throw new Error(util.format(
        "doctoc: options.plugins[%s]: "
        + "run's response has response.isHeadingsArray set, but "
        + "response.result isn't an array",
        this.configName
      ));
    }
    root = this.createNodesFromHeadings(response.result);
    this.finalizeNodes(root);
  }
  
  if(!response.dontNormalizeLevelValues) {
    const ic = root.childrenAll.length;
    
    for(let ix=0; ix<ic; ix++) {
      const node = root.childrenAll[ix];
      node.level = node.parent.level+1;
    }
  }
  
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
Proxy.prototype.createNodesFromHeadings = function(list) {
  const nodes = [];
  
  //### initialize the nodes
  
  const root = {
    heading: undefined,
    level: 0,
    parent: undefined,
    children: []
  };
  
  nodes.push(root);
  
  for(let ix=0, ic=list.length; ix<ic; ix++) {
    const h = list[ix];
    
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

//- set/fill the .next, .previous, .childrenAll properties
//  of each menu node
Proxy.prototype.finalizeNodes = function(root) {
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
