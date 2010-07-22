//var runtil = /Until$/,
	//rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	//rmultiselector = /,/,
	//isSimple = /^.[^:#\[\.,]*$/;

FBjqRY.fn.extend({

    find: function(selector) {
        return this.pushStack( FBjqRY.find(selector, this.nodes), "find", selector );
    },

    not: function(selector) {
        
        var nodes;
        if ( typeof(selector) === "string" ) {
            nodes = FBjqRY.filter( selector, this.nodes, true ); // not - true
        }
        else {
            selector = selector2Function(selector);
            
            nodes = [];
            for ( var i = 0, len = this.length; i < len; i++ ) {
                var node = this.nodes[i];
                if ( ! selector.call( node, i, node ) ) nodes.push( node );
            }
        }
        
        return this.pushStack( nodes, "not", selector );

    },

	is: function( selector ) {
		return !! selector && FBjqRY.filter( selector, this.nodes ).length > 0;
	},

	has: function( selector ) {
		var matches = FBjqRY( selector ).nodes;
		return this.filter( function() {
			for ( var i = 0, len = matches.length; i < len; i++ ) {
				if ( FBjqRY.contains( this, matches[i] ) ) return true;
			}
		});
	},

    filter: function(selector) {
        var nodes;
        if ( typeof(selector) === "string" ) {
            nodes = FBjqRY.filter( selector, this.nodes );
            //fn = function() {
            //    return FBjqRY.find( selector, null, [ this ] ).length > 0;
            //};
        }
        else {
            selector = selector2Function(selector);
            
            nodes = [];
            for ( var i = 0, len = this.length; i < len; i++ ) {
                var node = this.nodes[i];
                if ( selector.call( node, i, node ) ) nodes.push( node );
            }
        }
        
        return this.pushStack( nodes, "filter", selector );
    },

    /* @todo not implemented !
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
        var elemUndefined = typeof(elem) === 'undefined';
		if ( elemUndefined || typeof(elem) === "string" ) {
			return FBjqRY.inArray( this.nodes[0],
				// If it receives a string, the selector is used
				// If it receives nothing, the siblings are used
				elemUndefined ? this.parent().children() : FBjqRY( elem ).nodes );
		}
		// Locate the position of the desired element
		return FBjqRY.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem.nodes[0] : elem, this.nodes );
    },

	add: function( selector ) {
        var selNodes = FBjqRY.isString( selector ) ?
                            FBjqRY( selector ).nodes : // selector might be a html string !
                                FBjqRY.makeArray( selector );

        selNodes = FBjqRY.merge( this.get(), selNodes );
		return this.pushStack( FBjqRY.unique( selNodes ) );
	},

	andSelf: function() {
		return this.add( this.prevObject );
	}
});

FBjqRY.fn.extend({

    parent: function(selector) {
        return this.pushStack( collectParents(this.nodes, selector, false), "parent", selector || '' );
    },
    parents: function(selector) {
        return this.pushStack( collectParents(this.nodes, selector, true), "parents", selector || '' );
    },
    parentsUntil: function(until, selector) {
        return this.pushStack( collectParents(this.nodes, selector, until), "parentsUntil", selector || '' );
    },

    next: function(selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getNextSibling', false );
        return this.pushStack( siblings, "next", selector || '' );
    },
    nextAll: function(selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getNextSibling', true );
        return this.pushStack( siblings, "nextAll", selector || '' );
    },
    nextUntil: function(until, selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getNextSibling', until );
        return this.pushStack( siblings, "nextUntil", selector || '' );
    },

    prev: function(selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getPreviousSibling', false );
        return this.pushStack( siblings, "prev", selector || '' );
    },
    prevAll: function(selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getPreviousSibling', true );
        return this.pushStack( siblings, "prevAll", selector || '' );
    },
    prevUntil: function(until, selector) {
        var siblings = collectSiblings( this.nodes, selector, 'getPreviousSibling', until );
        return this.pushStack( siblings, "prevUntil", selector || '' );
    },

    siblings: function(selector) {
        //return this.prevAll(selector).concat(this.nextAll(selector));
        var siblings = collectSiblings( this.nodes, selector, 'getPreviousSibling', true );
        siblings = siblings.concat( collectSiblings( this.nodes, selector, 'getNextSibling', true ) );
        return this.pushStack( siblings, "siblings", selector || '' );
    },
    children: function(selector) {
        return this.pushStack( collectChildren(this.nodes, selector), "children", selector || '' );
    },
    contents: function() { // same as children()
        return this.pushStack( collectChildren(this.nodes), "contents", '' );
    }

});

var collectSiblings = function(nodes, selector, getSiblings, until) {
    var siblings = [], len = nodes.length, nodeArray = [];
    var doUntil = ( typeof(until) !== 'boolean' );
    var recurse = doUntil || until; /// until if not used means recurse (true/false)

    for ( var i = 0; i < len; i++ ) {
        var sibling = nodes[i][ getSiblings ](); // nodes[0].getNextSibling()
        
        while ( sibling ) {
            nodeArray[0] = sibling;

            if ( doUntil && ( until && matchesNodes(until, nodeArray) ) ) {
                break;
            }

            if ( ! selector || matchesNodes(selector, nodeArray) ) {
                siblings.push(sibling);
            }
            
            sibling = recurse ? sibling[ getSiblings ]() : null;
        }
    }
    return FBjqRY.unique(siblings);
}

var collectParents = function(nodes, selector, until) {
    var parents = [], len = nodes.length, nodeArray = [];
    var sameNode = FBjqRY.fbjs.sameNode;
    var doUntil = ( typeof(until) !== 'boolean' );
    var recurse = doUntil || until; /// until if not used means recurse (true/false)

    var rootElement = document.getRootElement();

    for ( var i = 0; i < len; i++ ) {
        var node = nodes[i].getParentNode();
        while ( node ) {
            nodeArray[0] = node;

            if ( doUntil && ( until && matchesNodes(until, nodeArray) ) ) {
                break;
            }

            if ( selector ) {
                // do not add the root element - might get confusing :
                if ( sameNode(rootElement, node) ) break;

                if ( matchesNodes(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                    parents.push(node);
                }
            }
            else { 
                // @todo currently we're adding root here - seems to make sense ?!
                parents.push(node);
            }
            node = recurse ? node.getParentNode() : null;
        }
    }
    return FBjqRY.unique(parents);
}

var collectChildren = function(nodes, selector) {
    var children = [];
    for ( var i = 0, len = nodes.length; i < len; i++ ) {
        children = children.concat( nodes[i].getChildNodes() );
    }

    children = FBjqRY.unique(children);
    if ( selector ) children = FBjqRY.filter( selector, children );
    return children;
}

var selector2Function = function(selector) {
    if ( selector.jquery ) selector = selector.nodes;
    if ( FBjqRY.isArray(selector) ) {
        var selNodes = selector;
        selector = function() {
            return FBjqRY.inArray(this, selNodes) !== -1;
        };
    }
    else if ( FBjqRY.fbjs.isNode(selector) ) {
        var selNode = selector, sameNode = FBjqRY.fbjs.sameNode;
        selector = function() { return sameNode(this, selNode); };
    }
    return selector;
};

var matchesNodes = function(selector, nodes) {
    return !! selector && FBjqRY.filter( selector, nodes ).length > 0;
};

FBjqRY.filter = function( selector, nodes, not ) {
    if ( not ) selector = ":not(" + selector + ")";

    var matchNodes = []; var singleNode = [];
    for ( var i = 0, len = nodes.length; i < len; i++ ) {
        var node = nodes[i]; singleNode[0] = node;
        if ( FBjqRY.find(selector, false, singleNode).length > 0 ) {
            matchNodes.push( node );
        }
    }
    
    return matchNodes;
};

// Check to see if a DOM node is within another DOM node.
FBjqRY.contains = (function(){
    
    var containsWalk = function( node, array ) {
        if ( ! array || array.length === 0 ) return false;
        if ( FBjqRY.inArray(node, array) !== -1 ) return true;
        for ( var i = 0, len = array.length; i < len; i++ ) {
            if ( containsWalk( node, array[i].getChildNodes() ) ) return true;
        }
        return false;
    };

    return function( container, contained ) {
        if ( FBjqRY.fbjs.sameNode(container, contained) ) return false;
        return containsWalk( contained, container.getChildNodes() );
    };
})();
