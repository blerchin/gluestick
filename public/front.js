//Read Bookmark-able URL
var currentLoc = location.hash,
	currentPage = Number(currentLoc.replace(/([^0-9]*)/ig,""));

var width = window.innerWidth,
    height = window.innerHeight;

var color = d3.scale.category20c();


var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

///Construct a grid behind edit interface
var grid = svg.append("svg")
	.attr("class", "grid")
	.attr("width", width)
	.attr("height", height);
	
	for (y=0; y<height; y = y + 10) {
		grid.append("line")
			.attr("class", "gridline")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", y)
			.attr("y2", y);
		}
	for (x=0; x<width; x = x + 11) {
	grid.append("line")
		.attr("class", "gridline")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", 0)
		.attr("y2", height);
	}
var toolState="nav";


////Page navigator needs more thought and work, but it can wait till editor is done.
//$('#chart').prepend('<a onclick = "loadPrevPage()" href="#'+(currentPage-1)+'" id = pageLeft >PREV</div>')
//$('#chart').prepend('<a onclick = "loadNextPage()" href="#'+(currentPage + 1)+'" id = pageRight >NEXT<div>')

var force = d3.layout.force()
    .charge(-1220)
    .linkDistance(175)
    .size([width, height]);



d3.json("/page/"+currentPage+"/links", function(json) {
   console.log(json)
    var node; //Selector for all rendered SVG nodes
    var links; //Selector for all rendered SVG links
    
    var nodes = json.posts;
    var nodesHash = getHashTable(nodes,"id");
    var linksTable = getLinksTable(nodes, nodesHash, json.links);
	
    console.log("linksTable = " , linksTable);
    console.log("nodes = " , nodes);
	

var freeze = false;
	
  force
	  .nodes(nodes)
      .links(linksTable)
      .charge(function(d) {return -2*Math.pow(d.weight*10, 2.0) })
      .gravity(.1)
      .friction(.7)
      .linkDistance(function(d) {return (30*1/Math.pow(d.value,2));})
      .start();

	drawLinks(svg.selectAll('svg line.link'), linksTable);
	drawNodes(svg.selectAll('svg.node'), nodes);


  force.on("tick", function(e) {
	if(!freeze){
		tick(e);
		}
  });

$('div#toolbar ul li a.toolSetter').click(function(e){
    console.log("clicked");
    e.preventDefault()
    toolState= $(this).attr('action');
    setToolTip(toolState);
    console.log("toolState is now ",toolState);
    return false;
});

///////
   function restart() {
   			   link = svg.selectAll('line.link').data(linksTable);
			   link.enter().insert("line")
				 .attr("class", "link");
			   link.exit().remove();
			   
			   node = svg.selectAll('svg.node').data(nodes);
			   var nodeEnter = node.enter().append("svg")
				 .attr("class", "node")
				 .attr("x",5)
				 .attr("y",5)
				 .attr("name", function(d) {return d['name']})
				 .attr("width", function(d) {return d.weight*5 })
				 .attr("height",function(d) {return d.weight*3.3})
		 		 .call(force.drag);

			   nodeEnter.append("rect")
				 .attr("rx",5)
				 .attr("ry",5)
				 .attr("width","100%")
				 .attr("height","100%");
				 
			var label = nodeEnter.append("text")
				 .attr("class","text")
				 .attr("x",40)
				 .attr("y",40)
				 .attr("text-anchor", "start") // text-align: right
				 .text(function(d) { return d['name']; });
 
			  nodeEnter.append("title")
				  .text(function(d) { return d['name'] + ", id=" + d['id']; });
				 
			   node.exit().remove;
			   force.start();
	   }



var tick = function(e) {
    link.attr("x1", function(d) { return d.source.x + (d.source.weight*6); })
        .attr("y1", function(d) { return d.source.y + (d.source.weight*4.5); })
        .attr("x2", function(d) { return d.target.x + (d.target.weight*6); })
        .attr("y2", function(d) { return d.target.y + (d.target.weight*4.5); });

    node.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
}



//////////Global functions below//////////

//make or update a hash table of nodes by database id
function getHashTable(obj,prop) {
     var hash = [];
     for (n=0; n<obj.length; n++) {
       hash[n] = obj[n][prop];
     }
     return hash;
  }

//initialize and update the table of links
function getIndexedNodes(nodes) {
//apply an index manually. Something to do with the bare object not having an index method built in.
      for (n=0; n<nodes.length; n++) {
       nodes[n].index=n;
         nodes[n].weight=1;
    }
    return nodes;
  }

//make or update an assoc. array of links by nodesHash key. We want the links table to refer directly to objects in *nodes*.
function getLinksTable(nodes,hash,links) {
    if (!linksTable) {
        var linksTable=[]; //using an array as an associate array in JS is not really proper, but d3 expects to receive data in an array, so tough.
    }
       for (n=0; n<links.length; n++) {
       var sourceNode = nodes[hash.indexOf(links[n].source)];
       var targetNode = nodes[hash.indexOf(links[n].target)];
       if (sourceNode && targetNode) {
           linksTable[linksTable.length++] = {"source": sourceNode,
    						"target": targetNode , "value": links[n]['value'] };
    		}
       }
       return linksTable;
  }

////Build the SVG representation of links
function drawLinks(linkSelector, data) {  
	link = linkSelector
      .data(linksTable)
    	.enter().append("line")
        .attr("class", "link")
        .attr("stroke-width", function(d){ return 2* d.value});
}	


////Build the SVG representation of nodes

function drawNodes(nodeSelector, data) {

  node = nodeSelector
		.data(data)
		.enter()
			.append("svg")
			  .attr("class", "node")
			  .attr("name", function(d) {return d['name']})
			  .attr("width", function(d) {return d.weight*12 })
			  .attr("height",function(d) {return d.weight*9})
			  .attr("x",50)
			  .attr("y",50)
			  .call(force.drag);
			
			node.append("rect")
			  .attr("rx",5)
			  .attr("ry",5)
			  .attr("width","100%")
			  .attr("height","100%");

  var label = node.append("text")
    	  	 .attr("class","text")
    	  	 .attr("x",40)
    	  	 .attr("y",40)
			 .attr("text-anchor", "start") // text-align: right
    	  	 .text(function(d) { return d['name']; });
 
	  node.append("title")
		  .text(function(d) { return d['name'] + ", id=" + d['id']; });

svg.select('svg.node[name="booyah"]').append("svg:image") 
      .attr("xlink:href", "../../header-wood.png") 
      .attr("x",0)
      .attr("y",0)
      .attr("width", 100)
      .attr("height", 75);
}









//// UI&JQuery Functions
var hints = new Object();
    hints = {   "nav"       :  {"message": "Click and Drag the boxes below to navigate."},
                "addNode"   :  {"message": "Click a box below to connect it to a new one."},
                "addLink"   :  {"message": "Click and drag from one box to another to link them."},
                "anchor"    :  {"message": "Click and drag a box to position it. It will stick in place where you release it."},
                "delete"    :  {"message": "Click the node you wish to remove."} };
console.log(hints['nav']['message']);

var setToolTip = function(toolState) {
    $('#toolbar ul li.tooltip').text(hints[toolState].message);
    ///clear all eventhandlers in this context
	node = svg.selectAll('svg.node').on("click", null).on("mousedown", null).on("mouseup",null) ;
	freeze= false;
	switch(toolState) {
		case "addNode":
				node.on("click", function(e){ 
					newRow = nodes.length;
					nodes[newRow] = {"id":"99999999","name":"Untitled","width":"100","height":"75"};
					linksTable[linksTable.length] = {"source": nodes[newRow], "target": e}
					d = new Date();
					var id;
					var name;
					d3.json('/page/'+currentPage+'/post/new/name/'+d.getTime() , function(data) {
							name = data['data'][0]['name'];
							id = data['data'][0]['id'];
  						    nodes[newRow]['name'] = name;
  						    nodes[newRow]['id'] = id; 
							  });
					d3.json('/page/'+currentPage+'/post/'+name+'/links/'+e.name , function(data) {});

					restart();
				});
			break
		case "addLink":
				var newSource= null;
				node.on('click',function(e){
					if (!newSource) {
						newSource= e;
						console.log(newSource);
						demoLine = svg.append("line")
							.attr('stroke-style','dashed')
							.attr('stroke','#000')
							.attr('x1', e.x)
							.attr('y1', e.y)
							.attr('x2', e.x)
							.attr('y2', e.y);	
							
						$(document).mousemove(function(e){
							demoLine
								.attr('x1', newSource.x)
								.attr('y1', newSource.y)
								.attr('x2', e.offsetX)
								.attr('y2', e.offsetY);
						 });
						 
					} else {
	 					$(document).mousemove(null);
							demoLine.remove();
							var newLink = {"source": newSource , "target": e };
							//linksTable[linksTable.length]  = newLink;
							newSource = null;
							$(document).off('mousemove');
							//d3.json('/page/'+currentPage+'/post/'+newLink.source.name+'/links/'+newLink.target.name , function(data) {});
							restart();
	 					}
					//return false;
				});
			
			break;	
			case 'delete':
			
				node.on("click", function(e){ 
						d3.json('/page/'+currentPage+'/post/name/'+e.name+'/delete' , function(data) {
								  });
						console.log(nodes[e.index]);
						nodes.splice(e.index,1);
	
						restart();
					});
			break
						
		}
	}


    
});///closes d3

/////General purpose useful functions

function findSameLink( link, obj) {
	var possibles = findNodeLinks( link.source, obj);
	var comparator = [link.source,link.target]
	var results = [];
	for (n in possibles) {
		if (comparator.indexOf(n.source) >= 0 && comparator.indexOf(n.target) >= 0) {
			results.push(n); }
			}
	return results
	}		
		
		
function findNodeLinks(search, table) {
	var results = [];
	for (n in table) {
    	if (n.source === search) {results.push(n)};
    	}
    return results;
	}

function has (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/////////This is probably all useless, but hold onto it for reference

push = function(record, dest) {
	dest[dest.length] = record;
	}
map = function (func, object) {
  var result = [];
  for (n in object) {
    result.push(func(n));
  }
  return result;
}

filter = function (comparator, object) {
	var result = [];
	for (i in object) {
		if (comparator(i)) {
			push(i, result);
		}
	}
	return result;
}

//collect = function() {var result; for (x in nodes) { nodes.id==json.links[n].target ? return x;}

