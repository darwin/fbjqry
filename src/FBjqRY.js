
//A wrapper for FBJS to make it feel more like jQuery
//About name:
// FB   = Facebook
// jqRY = jQuery
// RY   = RockYou!
//Author: Nate McQuay [borrowing heavily from jQuery 1.2.6]
//Author: Karol Bucek [building on top of Nate's version to make it more "complete"]
//=====================================================

//can't wrap this because it needs to be "global" and we don't have access to the window object
var FBjqRY = function(selector, context) {
    return new FBjqRY.prototype.init(selector, context);
};

// @todo isPlainObject not implemented !
// @todo isXMLDoc not implemented !

//We can wrap everything else
(function() {

//var encodeURIComponent = Support.encodeURIComponent;

var each = Support.each;
var map = Support.map;
var grep = Support.grep;
var merge = Support.merge;
var indexOf = Support.indexOf;
var unique = Support.unique;
var trim = Support.trim;

var slice = Support.array.slice;

//var isFunction = Support.isFunction;
//var isArray = Support.isArray;
var isString = Support.isString;
//var isEmptyObject = Support.isEmptyObject;

var isFBNode = Support.isFBNode;
var sameFBNode = Support.sameFBNode;
var getFBNodeId = Support.getFBNodeId;

var find = Support.findNodes;

var is = function(expr, nodes) {
    return !!expr && find(nodes, expr).length > 0; //(this.find(expr).length > 0);
};
    
var filter = function(expr, nodes) {
    var fNodes = [], nodeArray = [];
    for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
        var node = nodes[i]; nodeArray[0] = node;
        if ( is(expr, nodeArray) ) fNodes.push( node );
    }
    return fNodes;
};

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

var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/;
    //quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/;
    //isSimple  = /^.[^:#\[\.]*$/, undefined;

FBjqRY.fn = FBjqRY.prototype = {

    version: "0.3.0-SNAPSHOT",
    
    //CORE
    //====================================

    init: function(selector, context) {
        //selector = selector || document; // makes no sense document is a stub only !
        if ( typeof(selector) === 'undefined' ) { // @todo probably non sense to have it ...
            this.context = document;
            this.length = 0;
            return this;
        }
        //ready state shortcut handler -- no need for ready event because FBJS delays execution
        if ( FBjqRY.isFunction(selector) ) return this.ready(selector);
        //Are we dealing with an FBjqRY object?
        else if ( typeof(selector.selector) !== 'undefined' ) {
            var nodes = selector.get();
            this.nodes = nodes.length ? nodes : [ nodes ];
            this.length = nodes.length;
            this.selector = selector.selector;
            this.context = selector.context;
            return this;
        }
        //Are we dealing with FB DOM Nodes?
        else if ( isFBNode(selector) || isFBNode(selector[0]) ) {
            this.nodes = selector.length ? selector : [ selector ];
            this.length = this.nodes.length;
            this.context = selector;
            return this;
        }
        else if ( typeof(selector) !== 'undefined' ) {
            var match = quickExpr.exec(selector);
            if ( match && ( match[1] || ! context ) ) { // Verify a match, and that no context was specified for #id
                if ( match[1] ) { // HANDLE: $(html) -> $(array)
                    this.nodes = Support.xhtml( match[1] ); // Support.html( match[1] );
                }
                else { // HANDLE: $("#id")
                    this.nodes = [];
                    var node = document.getElementById( match[3] );
                    if ( node ) this.nodes[0] = node;
                }
            }
            else {
                //context = context || document.getRootElement(); // @todo should be ok document itself makes no sense ?!
                // HANDLE: $(expr, [context]) -- which is just equivalent to: $(context).find(expr)
                this.nodes = find( null, selector, context );
            }
        }

        this.selector = selector;
        this.context = context || document; // @todo does the document make any sense with FBJS ?!
        this.length = this.nodes.length;
        return this;
    },

    selector: "", // start with an empty selector

    size: function() { return this.length; },
    
	toArray: function() { 
        //return slice.call( this, 0 ); // won't work with FBJS
        var array = [];
        for ( var i = 0, len = this.length; i < len; i++ ) {
            array[i] = this.nodes[i];
        }
        return array;
    },

    each: function(fn) {
        each(this.nodes, fn);
        return this;
    },
	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function(i) {
        // Return a 'clean' array or just the element :
		return typeof(i) === 'undefined' ? slice.call( this.nodes ) : this.nodes[i];
	},
    index: function(elem) {
        // If it receives a jQuery object, the first element is used
        if ( typeof(elem.selector) !== 'undefined' ) elem = elem.get(0);
        for ( var i = this.nodes.length - 1; i >= 0; i-- ) {
            if ( sameFBNode(elem, this.nodes[i]) ) break;
        }
        return i; // not found == -1
    },

    slice: function() {
        return this.pushStack( 
            slice.apply( this.nodes, arguments ),
            "slice", slice.call(arguments).join(",")
        );
    },
    
	eq: function( i ) {
		return i === -1 ? this.slice( i ) : this.slice( i, +i + 1 );
    },
	first: function() { return this.eq( 0 ); },
	last: function() { return this.eq( -1 ); },
    
	map: function( callback ) {
		return this.pushStack( map(this.nodes, function(elem, i){
			return callback.call( elem, i, elem );
		}));
	},

    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function( elems, name, selector ) {
        // Build a new jQuery matched element set
        var ret = FBjqRY( elems );
        // Add the old object onto the stack (as a reference)
        ret.prevObject = this;
        ret.context = this.context;

        if ( name === "find" ) {
            ret.selector = this.selector + (this.selector ? " " : "") + selector;
        }
        else if ( name ) {
            ret.selector = this.selector + "." + name + "(" + selector + ")";
        }
        // Return the newly-formed element set
        return ret;
    },
    // Force the current matched set of elements to become
    // the specified array of elements (destroying the stack in the process)
    // You should use pushStack() in order to do this, but maintain the stack
    /*
    setArray: function( elems ) {
        // Resetting the length to 0, then using the native Array push
        // is a super-fast way to populate an object with array-like properties
        this.length = 0;
        push.apply( this, elems );

        return this;
    }, */

    //ATTRIBUTES
    //====================================
    attr: function(name, value) {
        var options = name;
        // Look for the case where we're accessing a value
        if ( typeof(name) === 'string' ) {
            if ( typeof(value) === 'undefined' ) {
                var node = this.nodes[0];
                return node && Support.attr(node, name);
            }
            else {
                options = {};
                options[ name ] = value;
            }
        }
        // Check to see if we're setting values
        return this.each( function(i) {
            for ( name in options ) {
                var value = options[name];
                if ( FBjqRY.isFunction(value) ) value = value.call(this, i);
                Support.attr(this, name, value);
            }
        });
    },

    addClass: function(cssClass) {
        //each(this.nodes, function() {this.addClassName(cssClass);});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            this.nodes[i].addClassName(cssClass);
        }
        return this;
    },

    removeClass: function(cssClass) {
        //each(this.nodes, function() {this.removeClassName(cssClass);});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            this.nodes[i].removeClassName(cssClass);
        }
        return this;
    },

    toggleClass: function(cssClass) {
        //each(this.nodes, function() { this.toggleClassName(cssClass); });
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            this.nodes[i].toggleClassName(cssClass);
        }
        return this;
    },

    html: function(html) {
        if ( typeof(html) !== 'undefined' ) {
            //each(this.nodes, function() { Support.html(html, this); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                Support.html( html, this.nodes[i] );
            }
            return this;
        }
        return Support.error("html() getter not supported in FBJS");
    },

    fbml: function(fbml) {
        if ( typeof(fbml) !== 'undefined' ) {
            //each(this.nodes, function() { this.setInnerFBML(fbml); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setInnerFBML(fbml);
            }
            return this;
        }
        return Support.error("fbml() getter not supported in FBJS");
    },

    text: function(text) {
        if ( typeof(text) !== 'undefined' ) {
            //each(this.nodes, function() {  this.setTextValue(text); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setTextValue(text);
            }
            return this;
        }
        return Support.error("text() getter not supported in FBJS");
    },

    val: function(val) {
        if( typeof(val) !== 'undefined' ) {
            //each(this.nodes, function() { this.setValue(val); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setValue(val);
            }
            return this;
        }
        return this.nodes[0].getValue();
    },

    //added for our own uses
    dimensions: function() {
        var node = this.nodes[0];
        return {
            top:    node.getAbsoluteTop(),
            left:   node.getAbsoluteLeft(),
            width:  node.getOffsetWidth(),
            height: node.getOffsetHeight(),
            right:  node.getAbsoluteLeft() + node.getOffsetWidth(),
            bottom: node.getAbsoluteTop() + node.getOffsetHeight(),
            clientWidth: node.getClientWidth(),
            clientHeight: node.getClientHeight(),
            scrollTop: node.getScrollTop(),
            scrollLeft: node.getScrollLeft()
        };
    },

    //CSS:
    //========================================
    css: function(name, value) {
        if ( typeof name === 'string' && typeof value !== 'undefined' ) {
            if (name == 'float') name = 'cssFloat';
            name = Support.camelCase(name);
            if (typeof(value) == 'number') value = value + "px";
            each(this.nodes, function() { this.setStyle(name, value); });
            return this;
        }
        if ( typeof name === 'object' ) {
            if( name['float'] && ! name.cssFloat ) name.cssFloat = name['float'];
            var values = {};
            for ( var o in name ) {
                if ( name.hasOwnProperty(o) ) {
                    value = name[o];
                    if (typeof(value) === 'number') value = value + "px";
                    values[Support.camelCase(o)] = value;
                }
            }
            each(this.nodes, function() { this.setStyle(values); });
            return this;
        }
        return this.nodes[0].getStyle( Support.camelCase(name) );
    },

    offset: function() {
        var node = this.nodes[0];
        return {
            top:  node.getAbsoluteTop(),
            left: node.getAbsoluteLeft()
        };
    },

    height: function(h) {
        if (typeof h === 'undefined') return this.nodes[0].getOffsetHeight();
        return this.css("height", h);
    },

    width: function(w) {
        if (typeof w === 'undefined') return this.nodes[0].getOffsetWidth();
        return this.css("width", w);
    },

    //MANIPULATION:
    //========================================

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

    replaceWith: function(content) {
        return this.after(content).remove();
    },
    replaceAll: function(content) {
        return delegateManipulation.call(this, 'replaceAll', this.replaceWith, content);
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

    empty: function() {
        this.children().remove();
        return this;
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

    clone: function(includeEvents) {
        var cloned = [];
        //each(this.nodes, function() {cloned.push( this.cloneNode() );});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            cloned.push( this.nodes[i].cloneNode() );
        }
        return FBjqRY(cloned);
    },

    //TRAVERSING:
    //========================================
    hasClass: function(className) {
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            if ( this.nodes[i].hasClassName(className) ) return true;
        }
        return false;
    },

    filter: function(selector) {
        var fn = selector;
        if ( typeof(fn) === "string" ) {
            fn = function(node) { return is(selector, [ node ]); };
        } 
        // else it should already be a function
        var nodes = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            if ( fn( node ) ) nodes.push( node );
        }

        return this.pushStack( nodes, "filter", selector );
    },

    find: function(expr) {
        //return FBjqRY( find(this.nodes, expr) );
        /*
        var nodes = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            nodes = nodes.concat( find([], expr, node) );
        }
        return this.pushStack( nodes, "find", expr ); */
        return this.pushStack( find(this.nodes, expr), "find", expr );
    },

    is: function( selector ) {
        return is(selector, this.nodes);
    },

    not: function( selector ) { // @todo TEST
        //filter out specified nodes
        var notNodes;
        if ( typeof(selector.selector) !== 'undefined' ) notNodes = selector.nodes;
        else if ( FBjqRY.isArray(selector) ) notNodes = selector;

        if ( notNodes ) {
            var nodes = this.get(); // is a copy already
            for ( var i = 0, len = notNodes.length; i < len; i++ ) {
                var idx = indexOf( notNodes[i], nodes );
                if ( idx != -1 ) nodes.splice(idx, 1); // remove element
            }
        }
        else { // expr assumed to be a selector :
            notNodes = find(this.nodes, selector);
        }
        
        return this.pushStack( nodes, "not", selector );
    },

	add: function( selector ) {
        var selNodes = Support.isString(selector) ?
            //find( null, selector ) :
            FBjqRY( selector ).nodes : // selector might be a html string !
                FBjqRY.makeArray( selector );

		return this.pushStack( FBjqRY.unique( merge(
			this.get(), // it's a clone
			selNodes
		)));
	},
    /*
    add: function(expr) {
        var nodes = FBjqRY(expr);
        this.nodes = this.nodes.concat(nodes.get());
        this.nodes = FBjqRY.unique(this.nodes);
        return this;
    }, */

    children: function(selector) {
        var children = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
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
    },

    next: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            nodeArray[0] = sibling;
            if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "next", selector );
    },
    nextAll: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getNextSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "nextAll", selector );
    },
    prev: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            nodeArray[0] = sibling;
            if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prev", selector );
    },
    prevAll: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getPreviousSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prevAll", selector );
    },

    parent: function(selector) {
        var parents = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode(); nodeArray[0] = node;
            if ( ! selector || is(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                parents.push(node);
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parent", selector );
    },
    parents: function(selector) {
        var parents = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode();
            while ( node ) {
                 nodeArray[0] = node;
                if( ! selector || is(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                    parents.push(node);
                }
                node = node.getParentNode();
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parents", selector );
    },

    siblings: function(expr) {
        return this.prevAll(expr).concat(this.nextAll(expr)); // @todo pushStack !
    },

    andSelf: function() { // @todo
        return this.add( this.prevObject );
    },
    end: function() { // @todo
        return this.prevObject || FBjqRY( [] );
    },

    //EVENTS:
    //========================================

    ready: function(fn) {setTimeout( function() {fn();} );},

    bind: function(type, fn) { //removed "data" argument
        var outerThis = this;
        each(this.nodes, function() {
            this.addEventListener(type, function(evt) {
                return fn.apply(this, [evt]);
            });
            return outerThis;
        }, [type, fn]);
        return this;
    },

    one: function(type, fn) { //removed "data" argument
        var outerThis = this;
        each(this.nodes, function() {
            this.addEventListener(type, function(evt) {
                var retVal = fn.apply(this, [evt]);
                this.purgeEventListeners(type);
                return retVal;
            });
            return outerThis;
        }, [type, fn]);
    },

    trigger: function(type, data) { //the events we can trigger are limited
        each(this.nodes, function() { this[type](); });
    },

    triggerHandler: function(type, data) {
        if ( this.get(0) ) {
            //var event = jQuery.Event(type);
            //event.preventDefault();
            //event.stopPropagation();
            //jQuery.event.trigger( event, data, this[0] );
            //return event.result;
            return this[type]();
        }
    },

    unbind: function(type, data) {
        each(this.nodes, function() { this.purgeEventListeners(type); }, [type]);
        return this;
    },

    hover: function(over, out) {
        this.mouseover(over);
        this.mouseout(out);
    },

    toggle: function() {
        var allFuncs = arguments;
        var length = arguments.length;
        each(this.nodes, function() {
            var i = 0;
            FBjqRY(this).click(function() {
                allFuncs[i].apply(this);
                i = (i + 1) % length;
            });
        });
        return this;
    },

    //All other event handlers defined later

    //EFFECTS:
    //========================================
    show: function(speed, cb) {
        if (FBjqRY.isFunction(speed) && !cb) {
            cb = speed;
            speed = null;
        }

        if ( !speed ) {
            this.stop();
            each(this.nodes, function() {
                this.setStyle("display", "block").setStyle("opacity", "1.0");
                if ( this.getStyle("height") ) this.setStyle("height", "auto");
                if ( this.getStyle("width") ) this.setStyle("width", "auto");
            });
            if(cb) {cb();}
            return this;
        }
        return this.animate({height: 'auto', width: 'auto', opacity: '1.0'}, speed, null, cb, 1);
    },

    hide: function(speed, cb) {
        if (FBjqRY.isFunction(speed) && !cb) {
            cb = speed;
            speed = null;
        }

        if ( !speed ) {
            this.stop();
            //this happens faster than Animation(this).hide();
            each(this.nodes, function() {
                this.setStyle("display", "none").setStyle("opacity", "0.0");
                if ( this.getStyle("height") ) this.setStyle("height", "0px");
                if ( this.getStyle("width") ) this.setStyle("width", "0px");
            });
            if ( cb ) cb();
            return this;
        }
        return this.animate({height: '0px', width: '0px', opacity: '0.0'}, speed, null, cb, 2);
    },

    slideDown: function(speed, cb) {
        return this.animate({height: 'auto'}, speed, null, cb, 1);
    },

    slideUp: function(speed, cb) {
        return this.animate({height: '0px'}, speed, null, cb, 2);
    },

    slideToggle: function(speed, cb) {},

    fadeIn: function(speed, cb)  {
        each(this.nodes, function() {
            var node = FBjqRY(this);
            if (node.css("display") == "none" || node.css("visibility") == "hidden") {
                node.css("opacity", "0.0").css("display", "block").css("visibility", "visible");
            }
        });
        return this.fadeTo(speed, 1.0, cb);
    },

    fadeOut: function(speed, cb) {
        var nodes = this.nodes;
        return this.fadeTo(speed, 0.0, function() {
            each(nodes, function() { FBjqRY(this).css("display", "none"); });
        });
    },

    fadeTo: function(speed, opacity, cb) {
        return this.animate({ opacity: opacity }, speed, null, cb);
    },

    animate: function(params, dur, easing, cb, neitherShowHide) {
        var parseSpeed = function(speed) { // @todo fx.speeds ?
            if ( typeof(speed) == "string" ) {
                speed = trim(speed).toLowerCase();
                switch ( speed ) {
                    case "fast": speed = 200; break;
                    case "slow": speed = 600; break;
                    default: speed = 400; break;
                }
            }
            return speed ? speed : 400;
        }

        dur = parseSpeed(dur);
        var hide = (neitherShowHide == 2);
        var show = (neitherShowHide == 1);

        var animObj = function(n) {
            var obj = Animation(n).duration(dur); // FB Animation
            for ( var p in params ) {
                if ( params.hasOwnProperty(p) ) obj = obj.to(p, params[p]);
            }
            if ( easing ) obj = obj.ease(easing);
            if ( hide )   obj = obj.blind().hide();
            if ( show )   obj = obj.blind().show();
            return obj;
        };

        this.stop();
        each(this.nodes, function() { animObj(this).go(); });
        if (cb) setTimeout(cb, dur);
        return this;
    },

    stop: function() {
        each(this.nodes, function() {Animation(this).stop();});
    },

    //queue: function(cb_Q) {},
    //dequeue: function() {},

    //AJAX:
    //========================================
    serialize: function() {
        return this.serializeArray().join("&");
    },

    serializeArray: function() {
        var obj = this.serializeHash();
        var ary = [];
        for ( var o in obj ) {
            if ( obj.hasOwnProperty(o) ) {
                ary.push( o + "=" + escape(obj[o]) );
            }
        }
        return ary;
    },

    serializeHash: function() {
        // nodes[0] must be a form
        return this.nodes[0].serialize();
    }
};

/*
each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
}, function(name, original) {
//	FBjqRY.fn[ name ] = function() {
//        var args = arguments;
//        return this.each(function() {
//                for ( var i = 0, len = args.length; i < len; i++ )
//                        FBjqRY( args[i] )[ original ]( this );
//        });
//	};
    FBjqRY.fn[name] = FBjqRY.prototype[name] = function(selector) {
	//FBjqRY.fn[name] = function(selector) {
        var ret = [], insert = FBjqRY(selector).nodes;

        for ( var i = 0, len = insert.length; i < len; i++ ) {
            var elems = (i > 0 ? this.clone(true) : this).get();
            FBjqRY.fn[ original ].apply( FBjqRY(insert[i]), elems );
            ret = ret.concat( elems );
        }

        return this.pushStack( ret, name, selector );
	};
});
*/

//Add all common event handler methods
var validEvents = ("blur,change,click,dblclick,error,focus,keydown,keypress,keyup,load,"  +
                   "mousedown,mousemove,mouseout,mouseover,mouseup,resize,scroll,select," +
                   "submit,unload").split(",");
for ( var i = validEvents.length - 1; i >= 0; i-- ) {
    (function() {
        var ev = validEvents[i];
        FBjqRY.fn[ev] = function(fn) {return fn ? this.bind(ev, fn) : this.trigger(ev);};
    })();
}

FBjqRY.fn.init.prototype = FBjqRY.fn;

//FBjqRY.extend = FBjqRY.fn.extend = extend;
/* // 1.4.2 version - requires isPlainObject
FBjqRY.extend = FBjqRY.fn.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}, i = 1, length = arguments.length,
        deep = false, options, name, src, copy;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && ! Support.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) { target = this; --i; }

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging object literal values or arrays
				if ( deep && copy && ( isPlainObject(copy) || isArray(copy) ) ) {
					var clone = src && ( isPlainObject(src) || isArray(src) ) ? src
						: isArray(copy) ? [] : {};

					// Never move original objects, clone them
					target[ name ] = FBjqRY.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
}; */
FBjqRY.extend = FBjqRY.fn.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && ! FBjqRY.isFunction(target) ) target = {};

	// extend jQuery itself if only one argument is passed
	if ( length == i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null )
			// Extend the base object
			for ( var name in options ) {
				var src = target[ name ], copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) continue;

				// Recurse if we're merging object values
				if ( deep && copy && typeof copy === "object" && ! isFBNode(copy) ) {
					target[ name ] = FBjqRY.extend( deep,
						// Never move original objects, clone them
						src || ( copy.length != null ? [ ] : { } )
					, copy );
                }
				// Don't bring in undefined values
				else if ( typeof copy !== 'undefined' ) target[ name ] = copy;

			}
    }

	// Return the modified object
	return target;
};

FBjqRY.extend({
    //AJAX:
    //========================================
    ajax: function(options) {
		// Extend the settings, but re-extend 's' so that it can be
		// checked again later (in the test suite, specifically)
		options = FBjqRY.extend(true, {}, FBjqRY.ajaxSettings, options);

		// convert data if not already a string
		//if ( options.data && options.processData && typeof options.data !== "string" ) {
		//	options.data = FBjqRY.param(options.data);
        //}

        var ajax = new Ajax();
        ajax.responseType = options.dataType;
        ajax.ondone = options.success;
        ajax.onerror = function() {
            var retryCount = options.retryCount || 0;
            Support.log("ajax() error occurred, retrying ...");
            if ( retryCount-- > 0 ) {
                options.retryCount = retryCount;
                FBjqRY.ajax(options);
            }
            else {
                FBjqRY.handleError(options, ajax, null);
            }
        };
		try {
			ajax.post(options.url, options.data);
		}
        catch(e) {
			FBjqRY.handleError(options, ajax, e);
		}
    },
	// Counter for holding the number of active queries
	active: 0,
    
    //load: function(url, data, cb) {},  //-- defined in EVENTS
    /*
    genericAJAX: function(url, data, cb, type, retryCount) {
        retryCount = retryCount || 3;
        if( ! cb && FBjqRY.isFunction(data) ) {
            cb = data;
            data = null;
        }
        var ajax = new Ajax();
        ajax.responseType = type;
        ajax.ondone = cb;
        ajax.onerror = function() {
            console.error("AJAX error occurred! Retrying...");
            if ( retryCount > 0 ) FBjqRY.genericAJAX(url, data, cb, type, retryCount-1);
        };
        ajax.post(url, data);
    }, */
	post: function( url, data, callback, type ) {
		if ( FBjqRY.isFunction( data ) ) {
			callback = data;
			data = {};
		}
		return FBjqRY.ajax({
			type: "POST",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},
	get: function( url, data, callback, type ) {
		// shift arguments if data argument was ommited
		if ( FBjqRY.isFunction( data ) ) {
			callback = data;
			data = null;
		}
		return FBjqRY.ajax({
			type: "GET", // it will be a POST anyway !
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},
	getJSON: function( url, data, callback ) {
		return FBjqRY.get(url, data, callback, Ajax.JSON);
	},
    
    getScript: function(url, cb) {
        return Support.error("getScript() not supported in FBJS");
    },

	ajaxSetup: function( settings ) {
		FBjqRY.extend( FBjqRY.ajaxSettings, settings );
	},
	ajaxSettings: {
		url: null, //location.href,
		global: true,
		type: "POST", // we can only do a POST !
		//contentType: "application/x-www-form-urlencoded",
		//processData: true,
		//async: true,
		//accepts: { // @todo only a placeholder
		//	xml: "application/xml, text/xml",
		//	html: "text/html",
		//	script: "text/javascript, application/javascript",
		//	json: "application/json, text/javascript",
		//	text: "text/plain",
		//	_default: "*/*"
		//}
        dataType: Ajax.RAW, // FB "extension"
        retryCount: 1, // FB "extension"
        requireLogin: null // FB "extension"
	},

	handleError: function( options, ajax, e ) {
		// If a local callback was specified, fire it
		if ( options.error ) options.error( ajax, e );
		// Fire the global callback
		//if ( options.global ) jQuery.event.trigger( "ajaxError", [xhr, s, e] );
	},
    
	// Serialize an array of form elements or a set of
	// key/values into a query string
    /*
	param: function( a ) {
		var s = [ ];

		function add( key, value ){
			s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
		};

		// If an array was passed in, assume that it is an array
		// of form elements
		if ( jQuery.isArray(a) || a.jquery )
			// Serialize the form elements
			jQuery.each( a, function(){
				add( this.name, this.value );
			});

		// Otherwise, assume that it's an object of key/value pairs
		else
			// Serialize the key/values
			for ( var j in a )
				// If the value is an array then the key names need to be repeated
				if ( jQuery.isArray(a[j]) )
					jQuery.each( a[j], function(){
						add( j, this );
					});
				else
					add( j, jQuery.isFunction(a[j]) ? a[j]() : a[j] );

		// Return the resulting serialization
		return s.join("&").replace(/%20/g, "+");
	}, */

    //UTILITIES:
    //========================================

    isFunction: Support.isFunction,
    isArray: Support.isArray,
    isEmptyObject: Support.isEmptyObject,

    trim: Support.trim,
    
    each: Support.each,
    map: Support.map,
    grep: Support.grep,
    merge: Support.merge,
    
    /*
    map: function( elems, callback ) {
        if ( FBjqRY.isFunction(elems) ) {
            callback = elems;
            elems = this.nodes;
        }
        var ret = [];

        for (var i = 0, length = elems.length; i < length; i++) {
            var value = callback(elems[i], i);
            if ( value !== null ) ret[ ret.length ] = value;
        }

        return ret.concat.apply([], ret);
    }, */

	makeArray: function( array, results ) { // results is for internal usage only
		var ret = results || [];

		if( array != null ) {
			var i = array.length;
			// The window, strings (and functions) also have 'length'
			if( i == null || isString(array) || FBjqRY.isFunction(array) || array.setInterval ) {
				ret[0] = array;
            } else {
                if ( typeof(array.selector) !== 'undefined' ) {
                    array = array.nodes;
                }
                FBjqRY.merge( ret, array ); // while ( i ) ret[--i] = array[i];
            }
		}

		return ret;
	},

    /*
    inArray: function(value, array) { // array.indexOf
        if ( array.indexOf ) return array.indexOf( value );

        var fn = function(a, b) { return a === b; };
        if ( value.equals ) fn = function(a, b) { return a.equals(b); };

        for ( var i = 0, len = array.length; i < len; i++ ) {
            if ( fn(value, array[i]) ) return i;
        }
        
        return -1;
    },
    indexOf: function(value, arr) { return this.inArray(value, arr); },
    */
    inArray: indexOf,
    indexOf: indexOf,

    unique: function(array) {
        // @todo ?
        // swap to jQuery version if we ever implement "data" method
        return unique(array);
    },

	parseJSON: function(data) {
		if ( ! isString(data) || ! data ) return null;

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		//data = jQuery.trim( data );

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			return Support.json(data);

		} else {
			FBjqRY.error( "Invalid JSON: " + data ); // @ todo error function !
		}
	},

	// A global GUID counter for objects
	guid: 1,
	proxy: function( fn, proxy, thisObject ) {
		if ( arguments.length === 2 ) {
			if ( typeof proxy === "string" ) {
				thisObject = fn;
				fn = thisObject[ proxy ];
				proxy = undefined;
			}
            else if ( proxy && !jQuery.isFunction( proxy ) ) {
				thisObject = proxy;
				proxy = undefined;
			}
		}

		if ( ! proxy && fn ) {
			proxy = function() {
				return fn.apply( thisObject || this, arguments );
			};
		}

		// Set the guid of unique handler to the same of original handler, so it can be removed
		if ( fn ) {
			proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
		}

		// So proxy can be declared as an argument
		return proxy;
	}
});

// ============================================================================
/** jQuery FX */
// ============================================================================
FBjqRY.extend({
    speed: function(speed, easing, fn) {
        var opt = speed && speed.constructor == Object ? speed : {
            complete: fn || !fn && easing || FBjqRY.isFunction( speed ) && speed,
            duration: speed,
            easing: fn && easing || easing && easing.constructor != Function && easing
        };

        opt.duration =
            ( opt.duration && typeof(opt.duration) == 'number' ?
                opt.duration : FBjqRY.fx.speeds[opt.duration] )
                    || FBjqRY.fx.speeds.def;

        // Queueing
        opt.old = opt.complete;
        opt.complete = function() {
            if ( opt.queue !== false ) FBjqRY(this).dequeue();
            if ( FBjqRY.isFunction( opt.old ) ) opt.old.call( this );
        };

        return opt;
    },

    easing: {
        linear: function( p, n, firstNum, diff ) {return firstNum + diff * p;},
        swing: function( p, n, firstNum, diff ) {return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;}
    },

    timers: [],
    timerId: null,
    
    fx: function( elem, options, prop ){
        this.options = options;
        this.elem = elem;
        this.prop = prop;

        if ( !options.orig ) options.orig = {};
    }

});

FBjqRY.fx.prototype = {
	// Simple function for setting a style value
	update: function(){
		if ( this.options.step ) this.options.step.call( this.elem, this.now, this );

		(FBjqRY.fx.step[this.prop] || FBjqRY.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( this.prop == "height" || this.prop == "width" )
			this.elem.setStyle('display', "block");
	},
	// Get the current size
	cur: function(force){
		if ( this.elem[this.prop] != null && this.elem.getStyle(this.prop) == null )
			return this.elem[ this.prop ];

		var r = parseFloat(FBjqRY.css(this.elem, this.prop, force)); // @todo curCSS :
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},
	// Start an animation from one number to another
	custom: function(from, to, unit){
		this.startTime = +new Date; //now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;
		this.update();

		var self = this;
		var t = function(gotoEnd) {
			return self.step(gotoEnd);
		}
		t.elem = this.elem;

		FBjqRY.timers.push(t);

		if ( FBjqRY.timerId == null ) {
			FBjqRY.timerId = setInterval(function(){
				var timers = FBjqRY.timers;

				for ( var i = 0; i < timers.length; i++ )
					if ( !timers[i]() )
						timers.splice(i--, 1);

				if ( !timers.length ) {
					clearInterval( FBjqRY.timerId );
					FBjqRY.timerId = null;
				}
			}, 13);
		}
	},
	// Simple 'show' function
	show: function(){
		// Remember where we started, so that we can go back to it later
		//this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.orig[this.prop] = this.elem.getStyle(this.prop);
		this.options.show = true;

		// Begin the animation
		this.custom(0, this.cur());

		// Make sure that we start at a small width/height to avoid any
		// flash of content
		if ( this.prop == "width" || this.prop == "height" ) {
			this.elem.setStyle(this.prop, "1px");
        }

		// Start by showing the element
		FBjqRY(this.elem).show();
	},

	// Simple 'hide' function
	hide: function(){
		// Remember where we started, so that we can go back to it later
		//this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.orig[this.prop] = this.elem.getStyle(this.prop);
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function(gotoEnd){
		var t = +new Date; //now();

		if ( gotoEnd || t > this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			var done = true;
			for ( var i in this.options.curAnim )
				if ( this.options.curAnim[i] !== true )
					done = false;

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.setStyle('overflow', this.options.overflow);

					// Reset the display
					this.elem.setStyle('display', this.options.display);
					//if ( jQuery.css(this.elem, "display") == "none" ) {
                    if (this.elem.getStyle("display") == "none") {
						this.elem.setStyle('display', "block");
                    }
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide )
                    this.elem.setStyle('display', "none");

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show ) {
					//for ( var p in this.options.curAnim )
						//jQuery.attr(this.elem.style, p, this.options.orig[p]);
                    var style = {}
                    for ( var p in this.options.curAnim ) {
                        style[p] = this.options.orig[p]
                    }
                    FBjqRY.attr('style', style);
                }
			}

			if ( done )
				// Execute the complete function
				this.options.complete.call( this.elem );

			return false;
		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			this.pos = FBjqRY.easing[this.options.easing || (FBjqRY.easing.swing ? "swing" : "linear")](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}

};

FBjqRY.extend( FBjqRY.fx, {
    speeds: {
        slow: 600,
        fast: 200,
        // Default speed
        def: 400
    },
    step: {
        scrollLeft: function(fx) {fx.elem.scrollLeft = fx.now;},
        scrollTop: function(fx) {fx.elem.scrollTop = fx.now;},
        opacity: function(fx) {
            //jQuery.attr(fx.elem.style, "opacity", fx.now);
            FBjqRY.attr('style', {"opacity": fx.now});
        },
        _default: function(fx) {
            //fx.elem.style[ fx.prop ] = fx.now + fx.unit;
            fx.elem.setStyle(fx.prop, fx.now + fx.unit);
        }
    }
});

// ============================================================================
/** jQuery data */
// ============================================================================

//var expando = "jQuery" + (+ new Date), uuid = 0; //windowData = {};
FBjqRY.extend({
    cache: {},
    data: function( elem, name, data ) {
        //elem = elem == window ? windowData : elem;
        /*
        var id = elem[ expando ];

        // Compute a unique ID for the element
        if ( !id ) id = elem[ expando ] = ++uuid;
        */
        var id = getFBNodeId(elem);

        // Only generate the data cache if we're
        // trying to access or manipulate it
        if ( name && ! FBjqRY.cache[ id ] ) FBjqRY.cache[ id ] = {};

        // Prevent overriding the named cache with undefined values
        if ( typeof(data) !== 'undefined' ) {
            FBjqRY.cache[ id ][ name ] = data;
        }

        // Return the named cache data, or the ID for the element
        return name ? FBjqRY.cache[ id ][ name ] : id;
    },
    removeData: function( elem, name ) {
        //elem = elem == window ? windowData : elem;

        //var id = elem[ expando ];

        var id = getFBNodeId(elem);

        // If we want to remove a specific section of the element's data
        if ( name ) {
            if ( FBjqRY.cache[ id ] ) {
                // Remove the section of cache data
                delete FBjqRY.cache[ id ][ name ];
                // If we've removed all the data, remove the element's cache
                name = "";
                for ( name in FBjqRY.cache[ id ] ) break;
                if ( ! name ) FBjqRY.removeData( elem );
            }
        // Otherwise, we want to remove all of the element's data
        } else {
            // Clean up the element expando
            /*
            try {
                delete elem[ expando ];
            }
            catch(e){
                // IE has trouble directly removing the expando
                // but it's ok with using removeAttribute
                if ( elem.removeAttribute ) elem.removeAttribute( expando );
            } */
            // Completely remove the data cache
            delete FBjqRY.cache[ id ];
        }
    },
    queue: function( elem, type, data ) {
        if ( elem ) {
            type = (type || "fx") + "queue";
            var q = FBjqRY.data( elem, type );

            if ( !q || FBjqRY.isArray(data) ) {
                q = FBjqRY.data( elem, type, FBjqRY.makeArray(data) );
            }
            else if ( data ) q.push( data );
        }
        return q;
    },
    dequeue: function( elem, type ) {
        var queue = FBjqRY.queue( elem, type ), fn = queue.shift();

        if ( !type || type === "fx" ) fn = queue[0];
        if ( typeof(fn) !== 'undefined' ) fn.call(elem);
    }
});

FBjqRY.fn.extend({
    data: function( key, value ) {
        if ( typeof(key) === 'undefined' && this.length ) {
            return FBjqRY.data( this.nodes[0] );
        }
        else if ( typeof key === "object" ) {
            return this.each(function() {FBjqRY.data( this, key );});
        }

        var parts = key.split(".");
        parts[1] = parts[1] ? "." + parts[1] : "";

        if ( typeof(value) === 'undefined' ) {
            //var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);
            if ( typeof(data) === 'undefined' && this.length ) {
                var data = FBjqRY.data( this.nodes[0], key );
            }
            return (typeof(data) === 'undefined' && parts[1]) ? this.data( parts[0] ) : data;
        }
        else {
            //return this.trigger("setData" + parts[1] + "!", [parts[0], value])
                return this.each(function() {
                    FBjqRY.data( this, key, value );
                });
        }
    },
    removeData: function( key ) {
        return this.each(function(){FBjqRY.removeData( this, key );});
    },
    queue: function(type, data) {
        if ( typeof type !== "string" ) {
            data = type; type = "fx";
        }

        if ( typeof(data) === 'undefined' ) return FBjqRY.queue( this.get(0), type );

        return this.each(function() {
            var queue = FBjqRY.queue( this, type, data );
            if ( type == "fx" && queue.length == 1 ) queue[0].call(this);
        });
    },
    dequeue: function(type) {
        return this.each(function(){FBjqRY.dequeue( this, type );});
    }
});

})();

//set $ and jQuery to be shortcuts to FBjqRY
var jQuery = FBjqRY, $ = FBjqRY;
