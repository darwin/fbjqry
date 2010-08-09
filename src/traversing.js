//var runtil = /Until$/,
	//rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	//rmultiselector = /,/,
	//isSimple = /^.[^:#\[\.,]*$/;

// matches POSistional selectors (from Sizzle internals) : 
var rselectorpos = /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/;     

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
            var self = this;
			for ( var i = 0, len = matches.length; i < len; i++ ) {
				if ( FBjqRY.contains( self, matches[i] ) ) return true;
			}
            return false;
		});
	},

    filter: function(selector) {
        var nodes;
        if ( typeof(selector) === "string" ) {
            nodes = FBjqRY.filter( selector, this.nodes );
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
	},
    
    /* */
    
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
        var siblings = collectSiblings( this.nodes, selector, 'getPreviousSibling', true );
        siblings = siblings.concat( collectSiblings( this.nodes, selector, 'getNextSibling', true ) );
        return this.pushStack( siblings, "siblings", selector || '' );
    },
    children: function(selector) {
        var children = [], len = this.length;
        for ( var i = 0, nodes = this.nodes; i < len; i++ ) {
            var child = nodes[i].getFirstChild();
            while ( child ) {
                ( child.getNodeType() === 1 ) && children.push( child );
                child = child.getNextSibling();
            }
        }

        if ( selector ) children = FBjqRY.filter( selector, children );

        children = len === 1 ? children : FBjqRY.unique(children);
        return this.pushStack( children, "children", selector || '' );
    },
    contents: function() { // same as children()
        var children = [], len = this.length;
        for ( var i = 0, nodes = this.nodes; i < len; i++ ) {
            children = children.concat( nodes[i].getChildNodes() );
        }
        
        children = len === 1 ? children : FBjqRY.unique(children);
        return this.pushStack( children, "contents", '' );
    },
    
	closest: function( selector, context ) {
        
        var sameNode = FBjqRY.fbjs.sameNode;
        
		if ( FBjqRY.isArray( selector ) ) { /* live() relies on this ! */
			var ret = [], cur = this.nodes[0], matches = {}, sel, level = 1;

			if ( cur && selector.length ) {
				for ( var i = 0, l = selector.length; i < l; i++ ) {
					sel = selector[i];
                    
					if ( ! matches[sel] ) {
						matches[sel] = rselectorpos.test( sel ) ? 
                            FBjqRY( sel, context || this.context ) : sel;
					}
				}

				while ( cur && ( context == null || ! sameNode(context, cur) ) ) {
					for ( sel in matches ) {
						var match = matches[sel];

						if ( match.jquery ? match.index(cur) > -1 : FBjqRY(cur).is(match) ) {
							ret.push({ selector: sel, elem: cur, level: level });
						}
					}
					cur = cur.getParentNode();
					level++;
				}
			}

			return ret;
		}
        
        // match POS-itional selector :
		var pos = rselectorpos.test( selector ) ?  FBjqRY( selector, context || this.context ) : null;

		return this.map(function( i, cur ) {
			while ( cur && ( context == null || ! sameNode(context, cur) ) ) {
				if ( pos ? pos.index(cur) > -1 : FBjqRY(cur).is(selector) ) {
					return cur;
				}
				cur = cur.getParentNode();
			}
			return null;
		});
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
                ( sibling.getNodeType() === 1 ) && siblings.push( sibling );
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
        var parent = nodes[i].getParentNode();
        while ( parent ) {
            nodeArray[0] = parent;

            if ( doUntil && ( until && matchesNodes(until, nodeArray) ) ) {
                break;
            }

            if ( selector ) {
                // do not add the root element - might get confusing :
                if ( sameNode(rootElement, parent) ) break;

                if ( matchesNodes(selector, nodeArray) ) {
                    ( parent.getNodeType() === 1 ) && parents.push( parent );
                }
            }
            else { 
                // @todo currently we're adding root here - seems to make sense ?!
                ( parent.getNodeType() === 1 ) && parents.push(parent);
            }
            parent = recurse ? parent.getParentNode() : null;
        }
    }
    return FBjqRY.unique(parents);
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
