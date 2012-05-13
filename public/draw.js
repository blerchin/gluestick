//////////////Drawing functions

function drawGrid(element) {
///Construct a grid behind edit interface
	var grid = element.append("svg")
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
}





////Build the SVG representation of links
function drawLinks(linkSelector, data) {  
	link = linkSelector
      .data(data)
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