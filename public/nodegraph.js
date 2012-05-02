var w = 960,
    h = 800,
    node,
    link,
    data,
    colorscale = d3.scale.category10();

var force = d3.layout.force()
    .on("tick", tick)
    //.charge(function(d) { return d._children ? -d.size : -30; })
    .linkDistance(function(d) { return d.target._children ? 80 : 30; })
    .size([w, h]);

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h);

d3.json("follows", function(json) {
  data = json

  update();
});

function update() {
//	var nodes= flatten(data),
//     links = d3.layout.force().links(nodes);
//	console.log(nodes);
  // Restart the force layout.
  force
      .nodes(data.nodes)
      .links(data.links)
      .start(); 

  // Update the links…
  link = vis.selectAll("line.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links.
  link.enter().insert("line", ".node")
      .attr("class", "link")
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  // Exit any old links.
  link.exit().remove();

  // Update the nodes…
  node = vis.selectAll("rect.node")
      .data(nodes, function(d) { return d.id; })
      .style("fill", color);

  node.transition()
      .attr("width", function(d) { return d.children ? 4.5 : d.size; });

  // Enter any new nodes.
  node.enter().append("rect")
      .attr("class", "node")
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; })
      .attr("width", function(d) { return d.children ? 20 : 4 * d.size; })
      .attr("height", function(d) { return d.children ? 20 : 4 * d.size; })
      .style("fill", color)
      .on("click", click)
      .call(force.drag);

  node.append("title")
      .text(function(d) { return d.name; });

  // Exit any old nodes.
  node.exit().remove();
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
//  return d._children ? "#3182bd" : d.children ?  : "#fd8d3c";
  return d._children ? "#3182bd" : d.children ? "#c6dbef" : colorscale(d.size);
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  var nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.size = node.children.reduce(function(p, v) { return p + recurse(v); }, 0);
    if (!node.id) node.id = ++i;
    nodes.push(node);
    return node.size;
  }

  root.size = recurse(root);
  return nodes;
}