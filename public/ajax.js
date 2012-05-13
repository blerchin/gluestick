/////Ajax functionality


///Get JSON from server and return via a callback
function fetchJson(url,callback) {
	var json = $.getJSON(url, function(json) {
				var fetchedLinks = createLinksTable(json.posts, json.links);
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
			 .attr("width", function(d) {return (d.weight+2)*12 })
			 .attr("height",function(d) {return (d.weight+2)*9})
			 .call(force.drag);

		   nodeEnter.append("rect")
			 .attr("rx",5)
			 .attr("ry",5)
			 .attr("width","100%")
			 .attr("height","100%")
			 .attr("fill","#eee");
			 
		var label = nodeEnter.append("text")
			 .attr("class","text")
			 .attr("x",40)
			 .attr("y",40)
			 .attr("text-anchor", "start") // text-align: right
			 .text(function(d) { return d['name']; });

		  nodeEnter.append("title")
			  .text(function(d) { return d['name'] + ", id=" + d['id']; });
			 
		   node.exit().remove();
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