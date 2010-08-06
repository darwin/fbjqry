var //rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
	rleadingWhitespace = /^\s+/,
	rtagName = /<([\w:]+)/,
	//rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnocache = /<script|<object|<embed|<option|<style/i,
    rxhtmlTag = /(<([\w:]+)[^>]*?)\/>/g,
    rselfClosing = /^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,
	fcloseTag = function( all, front, tag ) {
		return rselfClosing.test( tag ) ? all : front + "></" + tag + ">";
	},
    // html5 style boolean attributes :
	rhtml5Attr = /(checked|selected|disabled)(\s*=\s*['"]\w*['"])?/gi,
	fhtml5Attr = function( str, attr, val ) {
		return val ? str : attr + "='" + attr + "'";
	},
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		//_default: [ 0, "", "" ]
        // "fixes" FBJS issue not allowing to set HTML only valid XHTML :
        // these will wrap all content making it "more" XHTML friendly e.g.
        //
        // <div>1</div><div>2</div> will "become" valid XHTML due to wrappin
        //
        _default: [ 1, "<div>", "</div>" ]
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
 * @param manipFn the delegate function
 * @param selector the selector
 * @return FBjqRY object
 */
var delegateManipulation = function(name, manipFn, selector) {
    var ret = [], insert = FBjqRY(selector).nodes, self = this;

    for ( var i = 0, len = insert.length; i < len; i++ ) {
        var elems = (i > 0 ? self.clone(true) : self).nodes;
        manipFn.call( FBjqRY( insert[i] ), elems );
        ret = ret.concat( elems );
    }

    return this.pushStack( ret, name, selector );
};

FBjqRY.fn.extend({
    text: function(text) {
        if ( typeof(text) !== 'undefined' ) {
            if ( FBjqRY.isFunction(text) ) {
                return this.each(function(i) {
                    var self = FBjqRY(this), old = undefined; // self.text();
                    self.text( text.call(this, i, old) );
                });
            }
            
            for ( var i = 0, len = this.length; i < len; i++ ) {
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
//		else if ( FBjqRY.isString(html) && ! rnocache.test( html ) &&
//			(FBjqRY.support.leadingWhitespace || ! rleadingWhitespace.test( html )) &&
//			! wrapMap[ (rtagName.exec( html ) || ["", ""])[1].toLowerCase() ] ) {
//
//			html = html.replace(rxhtmlTag, fcloseTag);
//
//			try {
//				for ( var i = 0, l = this.length; i < l; i++ ) {
//					// Remove element nodes and prevent memory leaks
//                    var node = this.nodes[i];
//                    if ( node.getNodeType() === 1 ) {
//                        FBjqRY.cleanData( node.getElementsByTagName("*") );
//                        node.setInnerXHTML( html );
//					}
//				}
//			// If using innerHTML throws an exception, use the fallback method
//			}
//            catch(e) {
//				this.empty().append( html );
//			}
//		}
        else if ( FBjqRY.isFunction( html ) ) {
			this.each( function(i) {
				var self = FBjqRY(this), old = undefined; // self.html();
				self.empty().append(function(){
					return html.call( this, i, old );
				});
			});
        
		}
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
            if ( FBjqRY.isFunction(fbml) ) {
                return this.each(function(i) {
                    var self = FBjqRY(this), old = undefined; // self.fbml();
                    self.fbml( fbml.call(this, i, old) );
                });
            }
            
            for ( var i = 0, len = this.length; i < len; i++ ) {
                this.nodes[i].setInnerFBML(fbml);
            }
            return this;
        }
        return FBjqRY.error("fbml() getter not supported");
    },

    wrapAll: function(html) {
		if ( FBjqRY.isFunction( html ) ) {
			return this.each( function(i) {
                var self = this;
				FBjqRY(self).wrapAll( html.call(self, i) );
			});
		}

        var node = this.nodes[0];
		if ( node ) {
			// The elements to wrap the target around
			var wrap = FBjqRY( html ).eq(0).clone(true);

			if ( node.getParentNode() ) {
				wrap.insertBefore( node );
            }
            
			wrap.map( function() {
				var elem = this, child;

				while ( ( child = elem.getFirstChild() ) && child.getNodeType() === 1 ) {
                    elem = child;
                }
				return elem;
			}).append(this);
		}
		return this;
    },

	wrap: function( html ) {
		return this.each(function() {
			FBjqRY(this).wrapAll(html);
		});
	},

	wrapInner: function( html ) {
        if ( FBjqRY.isFunction( html ) ) {
            return this.each( function(i) {
                var self = this;
                FBjqRY(self).wrapInner( html.call(self, i) );
            });
        }

		return this.each( function(i) {
            var self = this;
            // can't handle correctly if there are no childs -
            // contents() will return an empty list in FBJS !
            if ( ! self.getFirstChild() ) {
                
                var wrap = FBjqRY( html ).eq(0).clone(true);

                if ( self.getParentNode() ) {
                    wrap.insertBefore( self );
                }
                
                wrap.each( function() {
                    var elem = this, child;
                    while ( ( child = elem.getFirstChild() )
                        && child.getNodeType() === 1 ) {
                        elem = child;
                    }

                    self.appendChild( elem );
                });

            } // there is at least one child :
            else {
                FBjqRY(self).contents().wrapAll( html );
            }
		});
	},

	unwrap: function() {
        //console.log('unwrap() StRT');
		var ret = this.parent().each(function() {
            var self = this; var $this = FBjqRY(self);
			//$this.replaceWith( $this.children() );
            $this.replaceWith( self.getChildNodes() );
		}).end();
        //console.log('unwrap() DoNE');
        return ret;
	},

    append: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each( function(i) {
                var self = this;
				var $this = FBjqRY(self);
				value = value.call(self, i, undefined /* $this.html() */);
				$this.append( value );
			});
		}

        value = FBjqRY(value).nodes;
        //value = typeof(value.length) === 'number' ? value : [ value ];

        //console.log('append', value);

        for ( var i = 0, nodes = this.nodes, len = this.length; i < len; i++ ) {
            var node = nodes[i], val;
            if ( node.getNodeType() !== 1 ) continue;
            for ( var j = 0; j < value.length; j++ ) {
                if ( ( val = value[j] ) ) {
                    if ( i > 0 ) val = val.cloneNode(true);
                    //console.log('append i', node, value[j]);
                    node.appendChild( val );
                    //console.log('appended');
                }
            }
        }
        return this;
    },
    appendTo: function(value) {
        return delegateManipulation.call(this, 'appendTo', this.append, value);
    },

    prepend: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each( function(i) {
                var self = this;
				var $this = FBjqRY(self);
				value = value.call(self, i, undefined /* $this.html() */);
				$this.prepend( value );
			});
		}

        value = FBjqRY(value).nodes;
        //value = typeof(value.length) === 'number' ? value : [ value ];

        for ( var i = 0, nodes = this.nodes, len = this.length; i < len; i++ ) {
            var node = nodes[i], val;
            if ( node.getNodeType() !== 1 ) continue;
            for ( var j = 0; j < value.length; j++ ) {
                if ( ( val = value[j] ) ) {
                    if ( i > 0 ) val = val.cloneNode(true);
                    node.insertBefore( val, node.getFirstChild() );
                }
            }
        }
        return this;
    },
    prependTo: function(value) {
        return delegateManipulation.call(this, 'prependTo', this.prepend, value);
    },

    after: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each( function(i) {
                var self = this;
				var $this = FBjqRY( self );
				value = value.call( self, i );
				$this.after( value );
			});
		}

        value = FBjqRY(value).nodes;
        //value = typeof(value.length) === 'number' ? value : [ value ];

        var nodes = this.nodes;
		if ( nodes[0] && nodes[0].getParentNode() ) {
            for ( var i = 0, len = this.length; i < len; i++ ) {
                var node = nodes[i], val;
                var parent = node.getParentNode();
                for ( var j = 0; j < value.length; j++ ) {
                    if ( ( val = value[j] ) ) {
                        if ( i > 0 ) val = val.cloneNode(true);
                        parent.insertBefore( val, node.getNextSibling() );
                    }
                }
            }
            return this;
		}
        else if ( arguments.length ) {
			var set = this.pushStack( this, "after", arguments );
			set.push.apply( set, FBjqRY( arguments[0] ).toArray() );
			return set;
		}
    },
    insertAfter: function(value) {
        return delegateManipulation.call(this, 'insertAfter', this.after, value);
    },

    before: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each( function(i) {
                var self = this;
				var $this = FBjqRY( self );
				value = value.call( self, i );
				$this.before( value );
			});
		}

        //console.log('before 1', value);
        value = FBjqRY(value).nodes;
        //value = typeof(value.length) === 'number' ? value : [ value ];
        //console.log('before 2', value);

        /*
        for ( var i = 0, nodes = this.nodes, len = this.length; i < len; i++ ) {
            var node = nodes[i];
            var parent = node.getParentNode();
            for ( var j = 0; j < value.length; j++ ) {
                // @todo if there are text nodes it starts failing
                // with an error "TypeError: b is null { message="b is null" }"
                //
                // these seems to be an issue only with cloning text nodes in
                // replaceWith where clone() is hacked instead of detach() !
                // 
                // cloning a text node returns null !
                //
                if ( value[j] ) parent.insertBefore( value[j], node );
            }
        }

        //console.log('before 3');
        return this; */
        
        var nodes = this.nodes;
		if ( nodes[0] && nodes[0].getParentNode() ) {
            for ( var i = 0, len = this.length; i < len; i++ ) {
                var node = nodes[i], val;
                var parent = node.getParentNode();
                for ( var j = 0; j < value.length; j++ ) {
                    if ( ( val = value[j] ) ) {
                        if ( i > 0 ) val = val.cloneNode(true);
                        parent.insertBefore( val, node );
                    }
                }
            }
            return this;
		}
        else if ( arguments.length ) {
			var set = FBjqRY( arguments[0] );
			set.push.apply( set, this.toArray() );
			return this.pushStack( set, "before", arguments );
		}
    },
    insertBefore: function(value) {
        return delegateManipulation.call(this, 'insertBefore', this.before, value);
    },

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
        
        //console.log('remove()', this.nodes, selector);
        var nodeArray = [];
        for ( var i = 0, len = this.length, nodes = this.nodes; i < len; i++ ) {
            var node = nodes[i]; nodeArray[0] = node;
			if ( ! selector || FBjqRY.filter( selector, nodeArray ).length ) {
				if ( ! keepData && node.getNodeType() === 1 ) {
					FBjqRY.cleanData( node.getElementsByTagName("*") );
                    FBjqRY.cleanData( nodeArray /* [ node ] */ );
				}

                //console.log('remove() removing', node, node.getNodeType());
                var parent = node.getParentNode();
				if ( parent ) parent.removeChild( node );
                //console.log('remove() removed', node.__instance);
			}
		}

        //console.log('remove() DoNE');
		return this;
	},

    empty: function() {
        this.children().remove();
        return this;
    },

    clone: function(includeEvents) {
        var cloned = [];
        // @todo clone events if jQuery events are kept !?
        for ( var i = 0, len = this.length, nodes = this.nodes; i < len; i++ ) {
            cloned.push( nodes[i].cloneNode(true) );
        }
        return FBjqRY(cloned);
    },

	replaceWith: function( value ) {
        var node = this.nodes[0];
		if ( node && node.getParentNode() ) {
			if ( FBjqRY.isFunction( value ) ) {
				return this.each(function(i) {
                    var self = this;
					var $this = FBjqRY(self), old = undefined /* $this.html() */;
					$this.replaceWith( value.call( self, i, old ) );
				});
			}

			// Make sure that the elements are removed from the DOM before they
            // are inserted. this can help fix replacing a parent with child elements

            //console.log('replaceWith() value', value);

			if ( ! FBjqRY.isString(value) ) {
                // @todo another FBJS failure - it seems to not be
                // able to reattach detached nodes - fails with :
                // with an error "This DOM node is no longer valid"
                //
				//value = FBjqRY( value ).detach();
                value = FBjqRY( value ).clone();
			}

            //console.log('replaceWith() value 2', value);

			return this.each( function() {
                var self = this;
                //console.log('replaceWith() self', self);
				var next = self.getNextSibling();
                var parent = self.getParentNode();

                //console.log('replaceWith() next', next);
				FBjqRY( self ).remove();
                //console.log('replaceWith() next2', !! next);

				if ( next ) {
                    //console.log('replaceWith() before', next, value);
					FBjqRY( next ).before( value );
				}
                else {
                    //console.log('replaceWith() append', parent, value);
					FBjqRY( parent ).append( value );
				}

                //console.log('replaceWith() DoNE');
			});
		}
        else {
			return this.pushStack( FBjqRY(FBjqRY.isFunction(value) ? value() : value), "replaceWith", value );
		}
	},
    replaceAll: function( value ) {
        return delegateManipulation.call(this, 'replaceAll', this.replaceWith, value);
    },

	detach: function( selector ) {
		return this.remove( selector, true );
	}
});

/*

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
*/

FBjqRY.extend({

	clean: function( elems, context /*, fragment, scripts */ ) {
		context = context || document;
        
		if ( typeof context.createElement === "undefined" ) context = document;

        var ret = []; //div = context.createElement("div");
        var isFBNode = FBjqRY.fbjs.isNode, isString = FBjqRY.isString;

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) elem += "";
			if ( ! elem ) continue;

            if ( isString(elem) ) {
                // Convert html string into DOM nodes
                if ( ! rhtml.test( elem ) ) {
                    //elem = context.createTextNode( elem ); continue;
                    return FBjqRY.error("clean() cannot create text node: '" + elem + "'");
                }

				// Fix "XHTML"-style tags in all browsers
				elem = elem.replace(rxhtmlTag, fcloseTag);

                // setInnerXHTML does not support HTML5 style attributes
                // e.g. <input type="radio" checked />
                // fix: <input type="radio" checked="checked" />
                elem = elem.replace(rhtml5Attr, fhtml5Attr);

                var tag = rtagName.exec( elem );
                tag = tag ? tag[1].toLowerCase() : '_default';
                var wrap = wrapMap[ tag ];
                //var xWrap = !! wrap;
                if ( ! wrap ) wrap = wrapMap._default;

				//var tag = (rtagName.exec( elem ) || ["", ""])[1].toLowerCase(),
					//wrap = wrapMap[ tag ] || wrapMap._default;
                var div = context.createElement("div");

				// Go to html and back, then peel off extra wrappers
                var xhtml = wrap[1] + elem + wrap[2];
				div.setInnerXHTML( xhtml );

				// Move to the right depth
                var depth = wrap[0];
				while ( depth-- ) div = div.getLastChild();

                // The XHTML parser does not throw any errors - it only logs :
                //
                // XML Parsing Error: junk after document element Location:
                // http://apps.facebook.com/fbjqry_dev/?run=manipulation
                // Line Number 1, Column 18: <span>huuu</span><p></p>
                //
                // thus we'll check ourselves if the setInnnerXHTML succeeded :
                //if ( wrap[1] ) tag = rtagName.exec( wrap[1] )[1].toLowerCase();
                // it's XHTML thus we should always have the first child :
                var fChild = div.getFirstChild();
                if ( ! fChild || fChild.getTagName().toLowerCase() !== tag ) {
                    //return FBjqRY.error('clean() setInnerXHTML with "'+ xhtml +'" failed !');
                    return FBjqRY.error('clean() setInnerXHTML failed with: ', elem);
                }

				// Remove IE's autoinserted <tbody> from table fragments
				if ( ! FBjqRY.support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					var hasBody = rtbody.test(elem),
						tbody = tag === "table" && ! hasBody ?
							div.getFirstChild() && div.getFirstChild().getChildNodes() :
							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && ! hasBody ? div.getChildNodes() : [];

					for ( var j = tbody.length - 1; j >= 0 ; --j ) {
                        var tb = tbody[ j ];
						if ( FBjqRY.nodeName( tb, "tbody" ) && ! tb.getChildNodes().length ) {
							tb.getParentNode().removeChild( tb );
						}
					}

				}

				// IE completely kills leading whitespace when innerHTML is used
				//if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
				//	div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
				//}

				elem = div.getChildNodes();
			}

            if ( isFBNode(elem) ) ret.push( elem );
            else ret = FBjqRY.merge( ret, elem );
		}

        /*
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
        */

		return ret;
	},

	cleanData: function( elems ) {
		var data, id, cache = FBjqRY.cache,
			special = FBjqRY.event.special;
			//deleteExpando = FBjqRY.support.deleteExpando;

        var getNodeId = FBjqRY.fbjs.getNodeId;

		for ( var i = 0, len = elems.length; i < len; i++ ) {
            var elem = elems[i];

			if ( elem.getTagName && FBjqRY.noData[ elem.getTagName().toLowerCase() ] ) {
				continue;
			}

			id = getNodeId(elem, true); //elem[ jQuery.expando ];
			
			if ( id ) {
				data = cache[ id ];
				
				if ( data && data.events ) {
					for ( var type in data.events ) {
						if ( special[ type ] ) {
							FBjqRY.event.remove( elem, type );
						} else {
                            elem.removeEventListener(type, data.handle);
							//removeEvent( elem, type, data.handle );
						}
					}
				}
				
				//if ( deleteExpando ) { delete elem[ jQuery.expando ];
				//} else if ( elem.removeAttribute ) {
				//	elem.removeAttribute( jQuery.expando );
				//}
				
				delete cache[ id ];
			}
		}
	}
});

/*
var rstartendtag = /<\/?([\w:]+)[^\/]*?>/g;
var fstartendtag = function( str, tag ) {
    return str;
};
var split2XHTML = function( html, tag ) {
    //tag = tag ? tag : rtagName.exec( elem );
    //html.split();
}; */