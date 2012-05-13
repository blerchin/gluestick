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


