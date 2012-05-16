/////General purpose useful functions

function findSameLink( link, obj) {
	var possibles = findNodeLinks( link.source, obj);
	var comparator = [link.source,link.target]
	var results = [];
	for (n in possibles) {
		if (comparator.indexOf(n.source) >= 0 && comparator.indexOf(n.target) >= 0) {
			results.push(n); }
			}
	return results
	}		
		
		
function findNodeLinks(search, table) {
	var results = [];
	for (n in table) {
    	if (n.source === search) {results.push(n)};
    	}
    return results;
	}

function has (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};


/////////This is probably all useless, but hold onto it for reference

push = function(record, dest) {
	dest[dest.length] = record;
	}
map = function (func, object) {
  var result = [];
  for (n in object) {
    result.push(func(n));
  }
  return result;
}

filter = function (comparator, object) {
	var result = [];
	for (i in object) {
		if (comparator(i)) {
			push(i, result);
		}
	}
	return result;
}

//collect = function() {var result; for (x in nodes) { nodes.id==json.links[n].target ? return x;}




//// UI&JQuery Functions
function hint(tool) {
    hints = {   "nav"       :  {"message": "Click and Drag the boxes below to navigate."},
                "addNode"   :  {"message": "Click a box below to connect it to a new one."},
                "addLink"   :  {"message": "Click and drag from one box to another to link them."},
                "anchor"    :  {"message": "Click and drag a box to position it. It will stick in place where you release it."},
                "delete"    :  {"message": "Click the box you wish to remove."},
                "refresh"	:  {"message": "Changes loaded."},  
                "textEdit"	:  {"message": "Click a box to edit the text it contains."}  };
    return hints[tool]['message'];
	}
	
	
	
	
//////////Global functions below//////////

