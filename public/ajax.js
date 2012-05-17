/////Ajax functionality


///Get JSON from server and return via a callback
function fetchJson(url,callback) {
	var json = $.getJSON(url, function(json) {
				var fetchedLinks = createLinksTable(json.posts, json.links);
				stayPositive(json.posts);
				return callback({ "nodes" : json.posts , "links" : fetchedLinks});
				});
	}


///Create an Array of links referencing nodes as objects.
//This is hiding a bunch of messy, shitty loops that should one day be dealt with.


function createLinksTable(localNodes, localLinks) {
	var localHash = getHashTable(localNodes,"id");
	console.log(localHash);
	table = getLinksTable(getIndexedNodes(localNodes), localHash, localLinks);
	console.log(table);
	return table;
	}

function nodeSize(el) {
		var weight = el.weight;
		var width = (weight+2)*12;
		var height = (weight+2)*9;
	result = {"width":width, "height":height};
	return result;
	}
function stayPositive(nodes) {
	for (n in nodes) {
		if (n.x<0) { n.x = 40};
		if (n.y<0) { n.y = 40};
		}
}
////Redraw and Restart the force simulator after modifying data


function restart(nodes, links, init) {
		   if (init) {force.nodes(nodes).links(links).start();}
		   //Eventually we need to add diffs to existing arrays. For now, just reload the damn thing.
		   else { force.nodes(nodes).links(links).start();} 
		   
		   link = svg.selectAll('line.link').data(links);
		   link.enter().append("line")
			 .attr("class", "link")
	         .attr("stroke-width", function(d){ return 2* d.value});

		   link.exit().remove();
		   
		   node = svg.selectAll('svg.node').data(nodes);
		   
		   var nodeEnter = node.enter().append("svg")
			 .attr("class", "node")
			 .attr("x",5)
			 .attr("y",5)
			 .attr("name", function(d) {return d['name']})
			 .attr("width", function(d) {return nodeSize(d)['width']})
			 .attr("height",function(d) {return nodeSize(d)['height']})
			 .call(force.drag);

		   nodeEnter.append("rect")
			 .attr("rx",5)
			 .attr("ry",5)
			 .attr("width","100%")
			 .attr("height","100%")
			 .attr("fill","#eee");
			node.selectAll('text').remove();	 
			
/*This is a much better way to do things, but elements don't seem to move on tick.		
		var label = node.append("foreignObject")
			 .attr("class","text")
			 //.attr("requiredExtensions","http://example.com/SVGExtensions/EmbeddedXHTML")
			// .attr("x", function(d){return d.x +5 })
			 //.attr("y", function(d){return d.y + 5})
			 .attr("width", function(d){return nodeSize(d)['width']-10})
			 .attr("height", function(d){return nodeSize(d)['height']-10})
			   .append("xhtml:body")
				    .style("font", "10px 'Helvetica Neue'")
	   			    .html(function(d) { 
				 		return '<p>'+d.name+'</p>';  });
*/
		var nodesWithImage = node.filter(function(d) { 
										return d.img != ( null && "img src");}); 
		nodesWithImage.append('image')
			.attr('xlink:href', function(d) {return d.img})
			.attr("width", "100%")
			.attr("height", "100%");
		
		node.selectAll('text').remove();

		var label = node.append("text")
					 .attr("class","text");
					 //.attr("width","100%")
					  //.attr("height","100%")
					 
			label.append("tspan")
 					 .attr("text-anchor","middle")
 					 .attr("x", function(d){return nodeSize(d)['width']/2})
			 		 .attr("y", function(d){return nodeSize(d)['height']/2})
					 .text(function(d) {return d.name.split("\\n")[0] });

			label.append("tspan")
					.attr("x", function(d){return nodeSize(d)['width']/2})
			 		.attr("y", function(d){return nodeSize(d)['height']/2+15})
					.attr("text-anchor","middle")
					.text(function(d) {return d.name.split("\\n")[1] });
							 
		  nodeEnter.append("title")
			  .text(function(d) { return d['name'] + ", id=" + d['id']; });
			 
		   node.exit().remove();
		   
		   
		   // Update node/link positions whenever force says "tick".
			force.on("tick", function(e) {
				link.attr("x1", function(d) { return d.source.x + (d.source.weight*6); })
					.attr("y1", function(d) { return d.source.y + (d.source.weight*4.5); })
					.attr("x2", function(d) { return d.target.x + (d.target.weight*6); })
					.attr("y2", function(d) { return d.target.y + (d.target.weight*4.5); });
				node.attr("x", function(d) { return d.x; })
					.attr("y", function(d) { return d.y; });
				/*
				label.attr("x", function(d,i) {return d.x; })
					 .attr("y", function(d,i) { return d.y; });
					 */
  });
		   
		   
   }
   
   
   //make or update a hash table of nodes by database id
function getHashTable(obj,prop) {
     if (!hash) { var hash = []; }
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