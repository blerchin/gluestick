
var width = canvas_size()[0];
var height = canvas_size()[1];

var svg = d3.select("#chart").append("svg")
		.attr("width", width)
		.attr("height", height);
//var color = d3.scale.category20c();
    
var toolState="nav";

	
$(document).ready(function() {
	
	////On address bar hash change, load specified graph
	$(window).bind('hashchange', function() {
		loadPage(getPage());
	});
////Yeah, so this really doesn't work right.	
/*	$(window).resize(function() {
		canvas_size();
		loadPage(getPage());
		});
*/	
	drawGrid(svg);
	$('div#toolbar ul li a.toolSetter').click(function(e){
		e.preventDefault();
		$('div#toolbar ul li a.toolSetter').removeClass('active');
		$('this').addClass('active');
		toolState= $(this).attr('action');
		setToolTip(toolState);
		console.log("toolState is now ",toolState);
		return false;
	});
	loadPage(getPage());
});

var freeze = false;

var force = d3.layout.force()
	  .charge(function(d) {return -2*Math.pow(d.weight*10, 2.0) })
      .gravity(.1)
      .friction(.9)
      .linkDistance(function(d) {return (30*1/Math.pow(d.value,2));})
      .size([width,height]);



// Enclosing tons of cool shit here and some ugly stuff, too.
// Not really fit for public consumption or reuse. But maybe you are brave....
// Use startGraph to load new data set and update for incremental updates. Although
// right now they do the same thing.

function startGraph(page){
	fetchJson("/page/"+page+"/links",function(data){
		restart(data.nodes, data.links, true);
		});
	}

function updateGraph(){
	fetchJson("/page/"+getPage()+"/links",function(data){
		restart(data.nodes, data.links);
		});
	}


// Front End / UI functions

// Update node/link positions whenever force says "tick".
force.on("tick", function(e) {
	link.attr("x1", function(d) { return d.source.x + (d.source.weight*6); })
        .attr("y1", function(d) { return d.source.y + (d.source.weight*4.5); })
        .attr("x2", function(d) { return d.target.x + (d.target.weight*6); })
        .attr("y2", function(d) { return d.target.y + (d.target.weight*4.5); });

    node.attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });
  });


//Deal with links/graphs based on bookmarkable URLs
function loadPage(page) {
		$('#chart a#pageLeft').attr('href' , '#'+ getPage('prev'));
		$('#chart a#pageRight').attr('href', '#'+ getPage('next'));
		startGraph(page);
	}
	
function getPage(inc) {
	var currentPage = Number(location.hash.replace(/([^0-9]*)/ig,""));

	if (arguments.length==0) {
			return currentPage;
		} else if (inc == "prev") {
			currentPage >1 ? currentPage-- : currentPage;
			return currentPage;
		} else if (inc == "next") {
			currentPage++;
			return currentPage;
		} else {
			return undefined;
			}
	}

function canvas_size() {
	var width = window.innerWidth,
		height = window.innerHeight;
	
	return [width, height];
}
