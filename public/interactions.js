//////Interactions & Click Handlers

var setToolTip = function(toolState) {
    $('#toolbar ul li.tooltip').text(hint(toolState));
    ///clear all eventhandlers in this context
	node = svg.selectAll('svg.node').on("click", null).on("mousedown", null).on("mouseup",null) ;
	if(typeof demoLine != 'undefined'){ demoLine.remove() };
	switch(toolState) {
		case "addNode":
				node.on("click", function(e){ 
					//newRow = nodes.length;
					d = Date.getTime;
					//nodes[newRow] = {"id":d,"name":"Untitled","weight":2};
					//linksTable[linksTable.length] = {"source": nodes[newRow], "target": e, "value": 4 }

					//var id;
					//var name;
					$.getJSON('/page/'+getPage()+'/post/new/name/'+d+'/href/null' , function(data) {
							var name = data['data'][0]['name'];
							var id = data['data'][0]['neo_id'];
							  $.getJSON('/post/'+id+'/links/'+e.id , function(data) {
									updateGraph();
								});
							  });					
					

					
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
						var execs = 0;
						svg.on("mousemove",function(e){
							//e.stopPropagation();
							demoLine
								.attr('x1', newSource.x)
								.attr('y1', newSource.y)
								.attr('x2', d3.event.offsetX)
								.attr('y2', d3.event.offsetY);
							
							if(execs<20) {
								console.log(d3.event);
								}
							execs++
							return false;
						 },false);
						 
						 svg.on("mouseleave", function(e) {
							 demoLine.remove();
							 return;
						 	});
						 
					} else {
	 					$(document).mousemove(null);
							demoLine.remove();
							var newLink = {"source": newSource , "target": e, "value": 2 };
							console.log(newLink);
							newSource = null;
							$(document).off('mousemove');
							if(newLink.source && newLink.target) {	
								d3.json('/post/'+newLink.source.id+'/links/'+newLink.target.id , function(data) {
									updateGraph();
								});
							}
	 					}
					return false;
				});
			
			break;	
			case 'delete':
				node.on("click", function(e){ 
					$.getJSON('/post/id/'+e.id+'/delete' , function(data) {
						updateGraph();
						});
					});
			break;
			
			case 'anchor':
				node.on("mousedown", function(e){
					e.fixed = 3;
					});
				node.on("dblclick", function(e){
					e.fixed = 0;
					});
				node.on("mouseout", function(e){
					var url = '/post/id/'+e.id+'/fixed/'+ (e.fixed ? e.fixed + '/'+e.x+'/'+e.y : '/false');
					$.getJSON(url, function(data) {
						console.log(data);
						});
					});  
					
			break;
			case 'refresh':
				updateGraph();
			break;
			case 'textEdit':
				node.on("click", function(e) {
					force.stop();
					$('#chart').append('<div class = "editBox">\
												<textarea id="name">'+e.name+'</textarea>\
												<input id="href" val=("'+( e.href ? e.href.toString() : 'url')+'") />\
												<button id="editSave" onclick="saveData('+e.id+')" val="save">Save</button>\
												</div>');
					var editBox = $('#chart div.editBox');
					editBox.css({"left": e.x, "top":e.y});
					
					
						});
			break;						
		}
	}

function saveData(nodeId){
						var editBox = $('#chart div.editBox');
						$.ajax({
							url: '/post/id/'+nodeId+'/update/',
							dataType: 'json',
							data: {"name": editBox.find('textarea#name').val(),
								   "href": editBox.find('input#href').val()},
							success: function() {
								console.log('data saved!');
								editBox.remove();
								updateGraph();
								}
							});
						}