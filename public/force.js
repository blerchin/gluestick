var width = 960,
    height = 800;

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-200)
    .linkDistance(40)
    .size([width, height]);

var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);



d3.json("nodes", function(json) {
	var nodeGraph = new d3.map(json.nodes);
	links = [];
	nodeGraph.forEach(function(d){ d.forEach(function(i) {console.log(i.links);});  } );
	console.log(nodeGraph);
	console.log(links);	
	
/*	json.nodes.forEach(function(i) {
		nodeGraph[i.id] = { id: i.id, links: i.links, attr: i.attr };
		});
	console.log(nodeGraph);	
	
	
	//var computeLinks = new Array;
	  computeLinks = nodeGraph.map(function(g) {
	  		g.links.map(function(i) {
				return { source: g.id , target: i };
				});
		});
			 
	
	console.log(computeLinks);
	
*/			 
 /*
 keys().forEach(function(i) {
 		for (j in nodegraph[i].links) {
			 return {source: i , target: j};
 			 };
 		});
 		
 */
 //console.log(links);
 /*DUMB SHIT
  var hashed_links = json.links.map( function(i) { 
  	return d3.key(json.nodes.filter(i.id))
  	});
  console.log(hashed_links);
*/	  
  
  
/*COOL STUFF  
  var links = json.links,
	  nodes = {};
	// Compute the distinct nodes from the links. from http://bl.ocks.org/1153292
	links.forEach(function(link) {
	  link.source = nodes[link.source] || (nodes[link.source] = {id: link.source});
	  link.target = nodes[link.target] || (nodes[link.target] = {id: link.target});
	});
  console.log(nodes);
*/

  force
      .nodes(nodegraph)
      .links(links)
      .data(data, function(d) { return d.key; })
      .start();

  var link = svg.selectAll("line.link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", 2);

  var node = svg.selectAll("circle.node")
      .data(json.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .call(force.drag);

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
});