//Read Bookmark-able URL
var currentLoc = location.hash,
	currentPage = Number(currentLoc.replace(/([^0-9]*)/ig,""));

var width = window.innerWidth,
    height = window.innerHeight;

var color = d3.scale.category20c();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(30)
    .size([width, height]);

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);



var toolState="nav";

$('div#toolbar ul li a.toolSetter').click(function(e){
    console.log("clicked");
    e.preventDefault()
    toolState= $(this).attr('action');
    setToolTip(toolState);
    console.log("toolState is now ",toolState);
    return false;
});

////Page navigator needs more thought and work, but it can wait till editor is done.
//$('#chart').prepend('<a onclick = "loadPrevPage()" href="#'+(currentPage-1)+'" id = pageLeft >PREV</div>')
//$('#chart').prepend('<a onclick = "loadNextPage()" href="#'+(currentPage + 1)+'" id = pageRight >NEXT<div>')

d3.json("/page/"+currentPage+"/links", function(json) {
   console.log(json)
    var nodesHash = getHashTable(json.posts,"id")
    var nodes = getIndexedNodes(json.posts);
    var linksTable = getLinksTable(json.posts, nodesHash, json.links);

    console.log("linksTable = " , linksTable);
	

	
  force
	  .nodes(json.posts, function(d) {return d.id})
      .links(linksTable)
      .linkDistance( function(d) { return d.source.width + d.target.width})
      .charge(-1000)
      .start();

  var link = svg.selectAll("line.link")
      .data(linksTable)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });


  var node = svg.selectAll("svg.node")
		.data(json.posts)
    .enter()
		.append("svg")
		  .attr("class", "node")
		  .attr("width", function(d) {return d['width']})
		  .attr("height",function(d) {return d['height']})
		  .call(force.drag);
		
		node.append("rect")
		  .attr("rx",5)
		  .attr("ry",5)
		  .attr("stroke", "none")
		  .attr("stroke-width","0px")
		  .attr("width","100%")
		  .attr("height","100%");

  var label = node.append("text")
    	  	 .attr("class","text")
    	  	 .attr("x",40)
    	  	 .attr("y",40)
//    	  	 .attr("dx", 20)
//			 .attr("dy", function(d) {return d['height']/2}) 
			 .attr("text-anchor", "start") // text-align: right
    	  	 .text(function(d) { return d['name']; });
 
  
  node.append("title")
      .text(function(d) { return d['name'] + ", id=" + d['id']; });

  force.on("tick", function(e) {

    link.attr("x1", function(d) { return d.source.x + (d.source.width/2); })
        .attr("y1", function(d) { return d.source.y + (d.source.height/2); })
        .attr("x2", function(d) { return d.target.x + (d.target.width/2); })
        .attr("y2", function(d) { return d.target.y + (d.target.height/2); });

    node.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
    

  });
});

//////////Global functions below//////////

//make or update a hash table of nodes by database id
  var getHashTable = function(obj,prop) {
     var hash = [];
     for (n=0; n<obj.length; n++) {
       hash[n] = obj[n][prop];
     }
     return hash;
  }

//initialize and update the table of links
var getIndexedNodes = function(nodes) {
//apply an index manually. Something to do with the bare object not having an index method built in.
      for (n=0; n<nodes.length; n++) {
       nodes[n].index=n;
         nodes[n].weight=1;
    }
    return nodes;
  }

//make or update an assoc. array of links by nodesHash key. We want the links table to refer directly to objects in *nodes*.
var getLinksTable = function(nodes,hash,links) {
    if (!linksTable) {
        var linksTable=[]; //using an array as an associate array in JS is not really proper, but d3 expects to receive data in an array, so tough.
    }
       for (n=0; n<links.length; n++) {
       var sourceNode = nodes[hash.indexOf(links[n].source)];
       var targetNode = nodes[hash.indexOf(links[n].target)];
       if (sourceNode && targetNode) {
           linksTable[linksTable.length++] = {"source": sourceNode,
    						"target": targetNode , "value": 5 };
    		}
       }
       return linksTable;
  }

//// UI&JQuery Functions
var hints = new Object();
    hints = {   "nav"       :  {"message": "Click and Drag the boxes below to navigate."},
                "addNode"   :  {"message": "Click a box below to connect it to a new one."},
                "addLink"   :  {"message": "Click and drag from one box to another to link them."},
                "anchor"    :  {"message": "Click and drag a box to position it. It will stick in place where you release it."}};
console.log(hints['nav']['message']);
var setToolTip = function(toolState) {
    $('#toolbar ul li.tooltip').text(hints[toolState].message);
}

//// Add page Nav buttons


/////////This is probably all useless, but hold onto it for reference

push = function(record, dest) {
	dest[dest.length] = record;
	}
map = function (func, object) {
  var result = [];
  for (n in object) {
    push(func(n), result);
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

