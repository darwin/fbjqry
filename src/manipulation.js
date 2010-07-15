var //rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /(<([\w:]+)[^>]*?)\/>/g,
	rtagName = /<([\w:]+)/,
	//rtbody = /<tbody/i,
	//rhtml = /<|&#?\w+;/,
	rnocache = /<script|<object|<embed|<option|<style/i,
	//rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,  // checked="checked" or checked (html5)
    rselfClosing = /^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,
	fcloseTag = function( all, front, tag ) {
		return rselfClosing.test( tag ) ? all : front + "></" + tag + ">";
	},
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		_default: [ 0, "", "" ]
	};

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE can't serialize <link> and <script> tags normally
/*
if ( ! FBjqRY.support.htmlSerialize ) {
	wrapMap._default = [ 1, "div<div>", "</div>" ];
} */

/**
 * Helper for the following manipulation functions :
 * - appendTo: "append"
 * - prependTo: "prepend"
 * - insertBefore: "before"
 * - insertAfter: "after"
 * - replaceAll: "replaceWith"
 * @param fn the delegate function
 * @param selector the selector
 * @return FBjqRY object
 */
var delegateManipulation = function(name, fn, selector) {
    var ret = [], insert = FBjqRY(selector).nodes;

    for ( var i = 0, len = insert.length; i < len; i++ ) {
        var elems = (i > 0 ? this.clone(true) : this).get();
        fn.apply( FBjqRY( insert[i] ), elems );
        ret = ret.concat( elems );
    }

    return this.pushStack( ret, name, selector );
};

var rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;

// ============================================================================
/** A helper around setInnerXHTML (FBJS beta feature) */
// ============================================================================
var nodesFromXHTML = function( elems, context ) { // based on jQuery.clean 1.3.2
    context = context || document;
    if ( typeof context.createElement === "undefined" ) context = document;

    if ( FBjqRY.isString(elems) ) { // support single string
        elems = [ elems ];
    }

    // If a single string is passed in and it's a single tag
    // just do a createElement and skip the rest
    if ( elems.length === 1 && FBjqRY.isString( elems[0] ) ) {
        var match = rsingleTag.exec( elems[0] );
        if ( match ) return [ context.createElement( match[1] ) ];
    }

    var ret = [], div = context.createElement("div");
    var isFBNode = FBjqRY.fbjs.isNode;

    FBjqRY.each(elems, function() {
        var elem = this;

        if ( typeof elem === "number" ) elem += '';
        if ( ! elem ) return;

        // Convert html string into DOM nodes
        if ( FBjqRY.isString(elem) ) {
            // Fix "XHTML"-style tags in all browsers
            //var html = elem.replace(rxhtmlTag, rselfClosing);
            var html = elem;

            // Trim whitespace, otherwise indexOf won't work as expected
            //html = html.replace(rleadingWhitespace, '');

            var tag = rtagName.exec( html );
            tag = tag ? tag[1] : '_default';
            var wrap = wrapMap[ tag ] || wrapMap._default;

            /*
            var tags = html.replace(rleadingWhitespace, "").substring(0, 10).toLowerCase();
            var wrap = // @todo not sure if this is needed FBJS might handle it it's own way ...
                // option or optgroup
                ! tags.indexOf("<opt") &&
                [ 1, "<select multiple='multiple'>", "</select>" ] ||

                ! tags.indexOf("<leg") &&
                [ 1, "<fieldset>", "</fieldset>" ] ||

                tags.match(/^<(thead|tbody|tfoot|colg|cap)/) &&
                [ 1, "<table>", "</table>" ] ||

                ! tags.indexOf("<tr") &&
                [ 2, "<table><tbody>", "</tbody></table>" ] ||

                // <thead> matched above
                (! tags.indexOf("<td") || !tags.indexOf("<th")) &&
                [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ] ||

                ! tags.indexOf("<col") &&
                [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ] ||

                [ 0, "", "" ]; */

            // Go to html and back, then peel off extra wrappers
            //try {
                div.setInnerXHTML( wrap[1] + html + wrap[2] );
            //}
            //catch(e) { // @todo errors ?
                //console.log('wrap', wrap, rtagName.exec( html ), e);
                //throw e;
            //}

            // Move to the right depth
            var unwrapCount = wrap[0];
            while ( unwrapCount-- ) div = div.getLastChild();

            elem = div.getChildNodes();
        }

        if ( isFBNode(elem) ) ret.push( elem );
        else ret = FBjqRY.merge( ret, elem );

    });

    return ret;
};

FBjqRY.fn.extend({
    text: function(text) {
        if ( typeof(text) !== 'undefined' ) {
            //if ( FBjqRY.isFunction(text) ) {
            //    return this.each(function(i) {
            //        var self = FBjqRY(this);
            //        self.text( text.call(this, i, null /* self.text() */) );
            //    });
            //}
            //each(this.nodes, function() {  this.setTextValue(text); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setTextValue(text);
            }
            return this;
        }
        return FBjqRY.error("text() getter not supported");
    },
    /*
    html: function(html) {
        if ( typeof(html) !== 'undefined' ) {
            //each(this.nodes, function() { Support.html(html, this); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                buildNodesXHTML( html, this.nodes[i] );
            }
            return this;
        }
        return FBjqRY.error("html() getter not supported");
    }, */
    
	html: function( html ) {
		if ( typeof(html) === undefined ) {
            return FBjqRY.error("html() getter not supported");
        }
		// See if we can take a shortcut and just use innerHTML
		else if ( FBjqRY.isString(html) && ! rnocache.test( html ) &&
			(FBjqRY.support.leadingWhitespace || ! rleadingWhitespace.test( html )) &&
			! wrapMap[ (rtagName.exec( html ) || ["", ""])[1].toLowerCase() ] ) {

			html = html.replace(rxhtmlTag, fcloseTag);

			try {
				for ( var i = 0, l = this.length; i < l; i++ ) {
					// Remove element nodes and prevent memory leaks
					//if ( this[i].nodeType === 1 ) {
                    var node = this.nodes[i];
                    FBjqRY.cleanData( node.getElementsByTagName("*") ); // @todo cleanData ?
                    node.setInnerXHTML( html );
					//}
				}
			// If using innerHTML throws an exception, use the fallback method
			}
            catch(e) {
				this.empty().append( html );
			}
		}
        //else if ( FBjqRY.isFunction( html ) ) {
		//	this.each( function(i) {
		//		var self = FBjqRY(this), old = self.html();
		//		self.empty().append(function(){
		//			return html.call( this, i, old );
		//		});
		//	});
        //
		//}
        else {
			this.empty().append( html );
		}

		return this;
	},

    /**
     * @FBjqRY.extension
     */
    fbml: function(fbml) {
        if ( typeof(fbml) !== 'undefined' ) {
            //each(this.nodes, function() { this.setInnerFBML(fbml); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setInnerFBML(fbml);
            }
            return this;
        }
        return FBjqRY.error("fbml() getter not supported");
    },

    wrapAll: function(html) {
        var node = this.nodes[0];
		if ( node ) {
			// The elements to wrap the target around
			var wrap = FBjqRY( html ).clone();

			if ( node.getParentNode() ) {
				wrap.insertBefore( node );
            }
			wrap.map( function() {
				var elem = this, child = this.getFirstChild();
				while ( child ) {
                    elem = child;
                    child = elem.getFirstChild();
                }
				return elem;
			}).append(this);
		}
		return this;
    },
    
	wrapInner: function( html ) {
		return this.each(function() {
			FBjqRY(this).contents().wrapAll(html);
		});
	},

	wrap: function( html ) {
		return this.each(function() {
			FBjqRY(this).wrapAll(html);
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			FBjqRY( this ).replaceWith( this.getChildNodes() );
		}).end();
	},

    append: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [ content ];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {node.appendChild(this);});
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ ) node.appendChild( content[j] );
        }
        return this;
    },
    appendTo: function(content) {
        return delegateManipulation.call(this, 'appendTo', this.append, content);
    },
    //appendTo: function(nodes) { return FBjqRY(nodes).append(this); },

    prepend: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [ content ];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {node.insertBefore(this);});
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ ) node.insertBefore( content[j] );
        }
        return this;
    },
    prependTo: function(content) {
        return delegateManipulation.call(this, 'prependTo', this.prepend, content);
    },
    //prependTo: function(nodes) { return FBjqRY(nodes).prepend(this); },

    after: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {
        //        node.getParentNode().insertBefore(this, node.getNextSibling());
        //    });
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ )
                node.getParentNode().insertBefore( content[j], node.getNextSibling() );
        }
        return this;
    },
    insertAfter: function(content) {
        return delegateManipulation.call(this, 'insertAfter', this.after, content);
    },

    before: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {
        //        node.getParentNode().insertBefore(this, node);
        //    });
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ )
                node.getParentNode().insertBefore( content[j], node );
        }
        return this;
    },
    insertBefore: function(content) {
        return delegateManipulation.call(this, 'insertBefore', this.before, content);
    },

    remove: function(expr) {
        //each(this.nodes, function() {
        //    if ( ! expr || is(expr, [ this ]) ) {
        //        this.getParentNode().removeChild(this);
        //    }
        //});
        var nodeArray = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i]; nodeArray[0] = node;
            if ( ! expr || is(expr, nodeArray) ) {
                node.getParentNode().removeChild(node);
            }
        }
        return this;
    },

    empty: function() {
        this.children().remove();
        return this;
    },

    clone: function(includeEvents) {
        var cloned = [];
        //each(this.nodes, function() {cloned.push( this.cloneNode() );});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            cloned.push( this.nodes[i].cloneNode() );
        }
        return FBjqRY(cloned);
    },

    replaceWith: function(content) {
        return this.after(content).remove();
    },
    replaceAll: function(content) {
        return delegateManipulation.call(this, 'replaceAll', this.replaceWith, content);
    },

	detach: function( selector ) {
		return this.remove( selector, true );
	}
});

/*
function root( elem, cur ) {
	return jQuery.nodeName(elem, "table") ?
		(elem.getElementsByTagName("tbody")[0] ||
		elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
		elem;
}

function cloneCopyEvent(orig, ret) {
	var i = 0;

	ret.each(function() {
		if ( this.nodeName !== (orig[i] && orig[i].nodeName) ) {
			return;
		}

		var oldData = jQuery.data( orig[i++] ), curData = jQuery.data( this, oldData ), events = oldData && oldData.events;

		if ( events ) {
			delete curData.handle;
			curData.events = {};

			for ( var type in events ) {
				for ( var handler in events[ type ] ) {
					jQuery.event.add( this, type, events[ type ][ handler ], events[ type ][ handler ].data );
				}
			}
		}
	});
}

function buildFragment( args, nodes, scripts ) {
	var fragment, cacheable, cacheresults,
		doc = (nodes && nodes[0] ? nodes[0].ownerDocument || nodes[0] : document);

	// Only cache "small" (1/2 KB) strings that are associated with the main document
	// Cloning options loses the selected state, so don't cache them
	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
	if ( args.length === 1 && typeof args[0] === "string" && args[0].length < 512 && doc === document &&
		!rnocache.test( args[0] ) && (jQuery.support.checkClone || !rchecked.test( args[0] )) ) {

		cacheable = true;
		cacheresults = jQuery.fragments[ args[0] ];
		if ( cacheresults ) {
			if ( cacheresults !== 1 ) {
				fragment = cacheresults;
			}
		}
	}

	if ( !fragment ) {
		fragment = doc.createDocumentFragment();
		jQuery.clean( args, doc, fragment, scripts );
	}

	if ( cacheable ) {
		jQuery.fragments[ args[0] ] = cacheresults ? fragment : 1;
	}

	return { fragment: fragment, cacheable: cacheable };
}

jQuery.fragments = {};

jQuery.extend({
	clean: function( elems, context, fragment, scripts ) {
		context = context || document;

		// !context.createElement fails in IE with an error but returns typeof 'object'
		if ( typeof context.createElement === "undefined" ) {
			context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
		}

		var ret = [];

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) {
				elem += "";
			}

			if ( !elem ) {
				continue;
			}

			// Convert html string into DOM nodes
			if ( typeof elem === "string" && !rhtml.test( elem ) ) {
				elem = context.createTextNode( elem );

			} else if ( typeof elem === "string" ) {
				// Fix "XHTML"-style tags in all browsers
				elem = elem.replace(rxhtmlTag, fcloseTag);

				// Trim whitespace, otherwise indexOf won't work as expected
				var tag = (rtagName.exec( elem ) || ["", ""])[1].toLowerCase(),
					wrap = wrapMap[ tag ] || wrapMap._default,
					depth = wrap[0],
					div = context.createElement("div");

				// Go to html and back, then peel off extra wrappers
				div.innerHTML = wrap[1] + elem + wrap[2];

				// Move to the right depth
				while ( depth-- ) {
					div = div.lastChild;
				}

				// Remove IE's autoinserted <tbody> from table fragments
				if ( !jQuery.support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					var hasBody = rtbody.test(elem),
						tbody = tag === "table" && !hasBody ?
							div.firstChild && div.firstChild.childNodes :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !hasBody ?
								div.childNodes :
								[];

					for ( var j = tbody.length - 1; j >= 0 ; --j ) {
						if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
							tbody[ j ].parentNode.removeChild( tbody[ j ] );
						}
					}

				}

				// IE completely kills leading whitespace when innerHTML is used
				if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
					div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
				}

				elem = div.childNodes;
			}

			if ( elem.nodeType ) {
				ret.push( elem );
			} else {
				ret = jQuery.merge( ret, elem );
			}
		}

		if ( fragment ) {
			for ( i = 0; ret[i]; i++ ) {
				if ( scripts && jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
					scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );
				
				} else {
					if ( ret[i].nodeType === 1 ) {
						ret.splice.apply( ret, [i + 1, 0].concat(jQuery.makeArray(ret[i].getElementsByTagName("script"))) );
					}
					fragment.appendChild( ret[i] );
				}
			}
		}

		return ret;
	},
	
	cleanData: function( elems ) {
		var data, id, cache = jQuery.cache,
			special = jQuery.event.special,
			deleteExpando = jQuery.support.deleteExpando;
		
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
				continue;
			}

			id = elem[ jQuery.expando ];
			
			if ( id ) {
				data = cache[ id ];
				
				if ( data && data.events ) {
					for ( var type in data.events ) {
						if ( special[ type ] ) {
							jQuery.event.remove( elem, type );

						} else {
							removeEvent( elem, type, data.handle );
						}
					}
				}
				
				if ( deleteExpando ) {
					delete elem[ jQuery.expando ];

				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( jQuery.expando );
				}
				
				delete cache[ id ];
			}
		}
	}
});

function evalScript( i, elem ) {
	if ( elem.src ) {
		jQuery.ajax({
			url: elem.src,
			async: false,
			dataType: "script"
		});
	} else {
		jQuery.globalEval( elem.text || elem.textContent || elem.innerHTML || "" );
	}

	if ( elem.parentNode ) {
		elem.parentNode.removeChild( elem );
	}
}
*/
