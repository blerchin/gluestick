//Read Bookmark-able URL
var currentLoc = location.hash,
	currentPage = Number(currentLoc.replace(/([^0-9]*)/ig,""));

var width = window.innerWidth,
    height = window.innerHeight;

var color = d3.scale.category20c();


var svg = d3.select("#chart").append("svg")
    .attr("width", width)
    .attr("height", height);

drawGrid(svg);

var toolState="nav";


////Page navigator needs more thought and work, but it can wait till editor is done.
//$('#chart').prepend('<a onclick = "loadPrevPage()" href="#'+(currentPage-1)+'" id = pageLeft >PREV</div>')
//$('#chart').prepend('<a onclick = "loadNextPage()" href="#'+(currentPage + 1)+'" id = pageRight >NEXT<div>')
var freeze = false;

var force = d3.layout.force()
	  .charge(function(d) {return -2*Math.pow(d.weight*10, 2.0) })
      .gravity(.1)
      .friction(.7)
      .linkDistance(function(d) {return (30*1/Math.pow(d.value,2));})
      .size([width, height]);
      
 var node; //Selector for all rendered SVG nodes
 var links; //Selector for all rendered SVG links
 var nodes = [];
 var linksTable = []; //TODO: change to a prototype.hash and clean up everything
/* 
$.getJSON("/page/"+currentPage+"/links", function(json) {
	
  force
	  .nodes(fetchJson)
      .links(linksTable)
      .start();

	drawLinks(svg.selectAll('svg line.link'), linksTable);
	drawNodes(svg.selectAll('svg.node'), nodes);
*/

fetchJson(function(data) {
   console.log(data);
   force	
	.nodes(data.nodes)
    .links(data.links)
    .start();
	
	drawLinks(svg.selectAll('svg line.link'), data.links);
	drawNodes(svg.selectAll('svg.node'), data.nodes);
  

$('div#toolbar ul li a.toolSetter').click(function(e){
    console.log("clicked");
    e.preventDefault()
    toolState= $(this).attr('action');
    setToolTip(toolState);
    console.log("toolState is now ",toolState);
    return false;
});

///////

});///closes d3

force.on("tick", function(e) {
		if (!freeze) {
			tick(e);
		}
  });

var tick = function(e) {
    link.attr("x1", function(d) { return d.source.x + (d.source.weight*6); })
        .attr("y1", function(d) { return d.source.y + (d.source.weight*4.5); })
        .attr("x2", function(d) { return d.target.x + (d.target.weight*6); })
        .attr("y2", function(d) { return d.target.y + (d.target.weight*4.5); });

    node.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
}

    

	
	



