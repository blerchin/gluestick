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


//This stuff all sucks big time, but since we are dealing with dynamic data I can't think of a better way to do it.
//We create an objects table, then reference those objects from the links table based on database ID.
//Then feed a zero-based table of objects and links by index to d3 on start() and every update()
//Nodes will need to retrieve data by looking it up in the nodesTable.



d3.json("list", function(json) {
  //make or update a hash table of nodes by database id
  var nodesHash = [];
  for (n=0; n<json.nodes.length; n++) {
  	nodesHash[n] = json.nodes[n].id;
  }
  //apply an index manually. Why this is necessary I have absolutely no idea.
  
  var nodes = json.nodes;
  for (n=0; n<nodes.length; n++) {
  	nodes[n].index=n;
  	nodes[n].weight=1;
  	nodes[n].weight=1;
  }
  
  //make or update an assoc. array of links by nodesHash key. This is important because d3.force assumes links refer to array loc
  var linksTable=[]; //this is technically incorrect, but the built-in array methods are too useful to give up.
  for (n=0; n<json.links.length; n++) {
   var sourceNode = nodes[nodesHash.indexOf(json.links[n].source)];
   var targetNode = nodes[nodesHash.indexOf(json.links[n].target)];
   if (sourceNode && targetNode) {
	   linksTable[linksTable.length++] = {"source": sourceNode,
						"target": targetNode , "value": 5 };
		}
   }
  	
  	
  console.log("linksTable = " , linksTable);
 console.log(linksTable[1].source.index);
 
 
  force
	  .nodes(nodes)
      .links(linksTable)
      .linkDistance(170)
      .charge(-60)
      .gravity(.05)
      .start();

  var link = svg.selectAll("line.link")
      .data(linksTable)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });


  var node = svg.selectAll("rect.node")
	   .data(nodes)
    .enter().append("rect")
      .attr("class", "node")
      .attr("width", 50)
      .attr("height",50)
      .style("fill", function(d){return color(d.group); })
      .call(force.drag);

  node.append("title")
      .text(function(d) { return "id:" + nodesHash[Number(d)]; });

  force.on("tick", function(e) {
 /*
   // Push different nodes in different directions for clustering.
  var k = 10 * e.alpha;
  nodes.forEach(function(o, i) {
    o.y += i & 1 ? k : -k;
    o.x += i & 10 ? k : -k;
  });
*/  
  
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
  });
});


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

		