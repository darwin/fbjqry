//var runtil = /Until$/,
	//rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	//rmultiselector = /,/,
	//isSimple = /^.[^:#\[\.,]*$/;

FBjqRY.fn.extend({

    find: function(selector) {
        return this.pushStack( FBjqRY.find(selector, this.nodes), "find", selector );
    },

    /*
	has: function( target ) {
		var targets = jQuery( target );
		return this.filter(function() {
			for ( var i = 0, l = targets.length; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	}, */

    not: function( selector ) { // @todo TEST
        //filter out specified nodes
        var notNodes;
        if ( selector.jquery ) notNodes = selector.nodes;
        else if ( FBjqRY.isArray(selector) ) notNodes = selector;

        if ( notNodes ) {
            var nodes = this.get(); // is a copy already
            for ( var i = 0, len = notNodes.length; i < len; i++ ) {
                var idx = FBjqRY.inArray( notNodes[i], nodes ); // indexOf
                if ( idx != -1 ) nodes.splice(idx, 1); // remove element
            }
        }
        else { // expr assumed to be a selector :
            notNodes = FBjqRY.find(selector, this.nodes);
        }

        return this.pushStack( nodes, "not", selector );
    },

	is: function( selector ) {
		return !! selector && FBjqRY.filter( selector, this.nodes ).length > 0;
	},

    filter: function(selector) {
        var fn = selector;
        if ( typeof(fn) === "string" ) {
            fn = function() { 
                return FBjqRY.find( selector, this ).length > 0;
            };
        }
        // else it should already be a function
        var nodes = [];
        for ( var i = 0, len = this.length; i < len; i++ ) {
            var node = this.nodes[i];
            if ( fn.call( node, i ) ) nodes.push( node );
        }

        return this.pushStack( nodes, "filter", selector );
    },

    /*
	closest: function( selectors, context ) {
		if ( jQuery.isArray( selectors ) ) {
			var ret = [], cur = this[0], match, matches = {}, selector, level = 1;

			if ( cur && selectors.length ) {
				for ( var i = 0, l = selectors.length; i < l; i++ ) {
					selector = selectors[i];

					if ( !matches[selector] ) {
						matches[selector] = jQuery.expr.match.POS.test( selector ) ? 
							jQuery( selector, context || this.context ) :
							selector;
					}
				}

				while ( cur && cur.ownerDocument && cur !== context ) {
					for ( selector in matches ) {
						match = matches[selector];

						if ( match.jquery ? match.index(cur) > -1 : jQuery(cur).is(match) ) {
							ret.push({ selector: selector, elem: cur, level: level });
						}
					}
					cur = cur.parentNode;
					level++;
				}
			}

			return ret;
		}

		var pos = jQuery.expr.match.POS.test( selectors ) ? 
			jQuery( selectors, context || this.context ) : null;

		return this.map(function( i, cur ) {
			while ( cur && cur.ownerDocument && cur !== context ) {
				if ( pos ? pos.index(cur) > -1 : jQuery(cur).is(selectors) ) {
					return cur;
				}
				cur = cur.parentNode;
			}
			return null;
		});
	}, */
	
	// Determine the position of an element within
	// the matched set of elements
    index: function(elem) {
        // If it receives a jQuery object, the first element is used
        if ( typeof(elem.selector) !== 'undefined' ) elem = elem.get(0);
        var sameNode = FBjqRY.fbjs.sameNode;
        for ( var i = this.length - 1; i >= 0; i-- ) {
            if ( sameNode(elem, this.nodes[i]) ) break;
        }
        return i; // not found == -1
    },

	add: function( selector ) {
        var selNodes = FBjqRY.isString(selector) ?
            //find( null, selector ) :
            FBjqRY( selector ).nodes : // selector might be a html string !
                FBjqRY.makeArray( selector );

		return this.pushStack( FBjqRY.unique( FBjqRY.merge(
			this.get(), // it's a clone
			selNodes
		)));
	},

	andSelf: function() {
		return this.add( this.prevObject );
	}
});

FBjqRY.fn.extend({
    parent: function(selector) {
        var parents = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode(); nodeArray[0] = node;
            if ( ! selector || isNodes(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                parents.push(node);
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parent", selector );
    },
    parents: function(selector) {
        var parents = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode();
            while ( node ) {
                 nodeArray[0] = node;
                if( ! selector || isNodes(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                    parents.push(node);
                }
                node = node.getParentNode();
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parents", selector );
    },

    next: function(selector) {
        var siblings = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            nodeArray[0] = sibling;
            if ( ! selector || isNodes(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "next", selector );
    },
    nextAll: function(selector) {
        var siblings = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || isNodes(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getNextSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "nextAll", selector );
    },
    
    prev: function(selector) {
        var siblings = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            nodeArray[0] = sibling;
            if ( ! selector || isNodes(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prev", selector );
    },
    prevAll: function(selector) {
        var siblings = [], len = this.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || isNodes(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getPreviousSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prevAll", selector );
    },

    siblings: function(expr) {
        return this.prevAll(expr).concat(this.nextAll(expr)); // @todo pushStack !
    },

    children: function(selector) {
        var children = [];
        for ( var i = 0, len = this.length; i < len; i++ ) {
            children = children.concat( this.nodes[i].getChildNodes() );
        }
        //var ret = FBjqRY(unique(children));
        //return selector ? ret.filter(selector) : ret;

        var nodes = FBjqRY.unique(children);
        if ( selector ) nodes = filter(selector, nodes);
        return this.pushStack( nodes, "children", selector );

        /*
        if (expr) {
            children = FBjqRY(this.nodes).find(expr).get();
        }
        else {
            children = [];
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                children = children.concat( this.nodes[i].getChildNodes() );
            }
        }
        return FBjqRY(unique(children));
        */
    },
    
    contents: function() { // @todo: This doesn't feel right... TEST
        function grabNodes(node) {
            var nodes = node.getChildNodes();
            for (var i = 0, len = nodes.length; i < len; i++) {
                nodes = nodes.concat(grabNodes(nodes[i]));
            }
            return nodes;
        }

        var nodes = this.nodes;
        for (var i = 0; i < nodes.length; i++) {
            nodes = nodes.concat(grabNodes(nodes[i]));
        }
        return FBjqRY(FBjqRY.unique(nodes)); // @todo pushStack
    }

});

var isNodes = function(selector, nodes) {
    return !! selector && FBjqRY.filter( selector, nodes ).length > 0;
};

FBjqRY.filter = function( selector, nodes, not ) {
    if ( not ) selector = ":not(" + selector + ")"; // not-used
    var fNodes = []; //nodeArray = [];
    //console.log('filter', selector, nodes);
    for ( var i = 0, len = nodes.length; i < len; i++ ) {
        var node = nodes[i]; //nodeArray[0] = node;
        if ( FBjqRY.find(selector, null, [ node ]).length > 0 ) {
            fNodes.push( node );
        }
    }
    return fNodes;
};
