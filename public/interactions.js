//////Interactions & Click Handlers

var setToolTip = function(toolState) {
    $('#toolbar ul li.tooltip').text(hint(toolState));
    ///clear all eventhandlers in this context
	node = svg.selectAll('svg.node').on("click", null).on("mousedown", null).on("mouseup",null) ;
	
	switch(toolState) {
		case "addNode":
				node.on("click", function(e){ 
					newRow = nodes.length;
					nodes[newRow] = {"id":"99999999","name":"Untitled","weight":2};
					linksTable[linksTable.length] = {"source": nodes[newRow], "target": e, "value": 4 }
					d = new Date();
					var id;
					var name;
					$.getJSON('/page/'+currentPage+'/post/new/name/'+d.getTime()+'/href/null' , function(data) {
							name = data['data'][0]['name'];
							id = data['data'][0]['neo_id'];
							  $.getJSON('/post/'+id+'/links/'+e.id , function(data) {
									updateJson();
								});
							  });
					//restart(); ///restart once with temporary local data
					
					

					
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
							var newLink = {"source": newSource , "target": e, "value": 2 };
							console.log(newLink);
							linksTable[linksTable.length]  = newLink;
							restart();
							newSource = null;
							$(document).off('mousemove');
							d3.json('/post/'+newLink.source.id+'/links/'+newLink.target.id , function(data) {
								updateJson();
							});
							
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
			case 'refresh':
				updateJson();
			break
						
		}
	}
