/*!
 * A wrapper for FBJS to make it feel more like jQuery.
 *  FB   = Facebook
 *  jqRY = jQuery
 *  RY   = RockYou!
 * @author: Nate McQuay [borrowing heavily from jQuery 1.2.6]
 * @author: Karol Bucek [building on top of Nate's version to make it more "complete"]
 *
 * Copyright 2010, Karol Bucek
 * Released under the MIT license.
 */

//can't wrap this because it needs to be "global" and we don't have access to the window object
var FBjqRY = function(selector, context) {
    return new FBjqRY.prototype.init(selector, context);
};
//We can wrap everything else
(function() {// Use the correct document accordingly with window argument (sandbox)
//document = window.document,

// A simple way to check for HTML strings or ID strings
// (both of which we optimize for)
//var quickExpr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w\-]+)$/;
var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/;
// Is it a simple selector
//var isSimple = /^.[^:#\[\.,]*$/;
// Check if a string has a non-whitespace character in it
//var rnotwhite = /\S/;
// Used for trimming whitespace
var trimLeft = /^\s+/;
var trimRight = /\s+$/;
// Match a standalone tag
var rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;
// Keep a UserAgent string for use with jQuery.browser
//userAgent = navigator.userAgent,
// For matching the engine and version of the browser
//browserMatch,
// Has the ready events already been bound?
//readyBound = false,
// The functions to execute on DOM ready
//readyList = [],
// The ready event handler
//DOMContentLoaded,

// Save a reference to some core methods
//toString = Object.prototype.toString;
var toString = {}.toString;
var slice = [].slice;

//hasOwn = Object.prototype.hasOwnProperty;
//push = Array.prototype.push;

trim = ''.trim;

FBjqRY.fn = FBjqRY.prototype = {
    
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
        else if ( selector.jquery ) {
            var nodes = selector.get();
            var length = nodes.length;
            this.nodes = typeof(length) === 'number' ? nodes : [ nodes ];
            this.length = length;
            this.selector = selector.selector;
            this.context = selector.context;
            return this;
        }
        //Are we dealing with FB DOM Nodes?
        else if ( FBjqRY.fbjs.isNode(selector) || FBjqRY.fbjs.isNode(selector[0]) ) {
            this.nodes = selector.length ? selector : [ selector ];
            this.length = this.nodes.length;
            this.context = selector;
            return this;
        }
        else if ( typeof(selector) !== 'undefined' ) {
            var match = quickExpr.exec(selector);
            if ( match && ( match[1] || ! context ) ) { // verify a match, and that no context was specified for #id
                if ( match[1] ) { // HANDLE: $(html) -> $(array)
                    var html = match[1];
                    // If a single string is passed in and it's a single tag
                    // just do a createElement and skip the rest
                    if ( ( match = rsingleTag.exec( html ) ) ) {
                        // FBJS fails on some elements but does not throw an error
                        // e.g. for 'button' : "button is not an allowed DOM element"
                        // and returns undefined !
                        var el = document.createElement( match[1] );
                        if ( !el ) return FBjqRY.error("init() failed to createElement('" + match[1] + "')");
                        this.nodes = [ el ];
                    }
                    else {
                        this.nodes = FBjqRY.clean( [ html ] );
                    }
                }
                else { // HANDLE: $("#id")
                    this.nodes = [];
                    var node = document.getElementById( match[3] );
                    if ( node ) this.nodes[0] = node;
                }
            }
            else {
                // handle $(document).ready :
                //context = context || document.getRootElement(); // @todo should be ok document itself makes no sense ?!
                // HANDLE: $(expr, [context]) -- which is just equivalent to: $(context).find(expr)
                this.nodes = FBjqRY.find( selector, context, null ); // find setup in selector.js
            }
        }

        this.selector = selector;
        this.context = context || document; // @todo does the document make any sense with FBJS ?!
        this.length = this.nodes.length;
        return this;
    },

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "0.5.0", //"@VERSION",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() { return this.length; },

	toArray: function() {
        return slice.call( this.nodes, 0 ); // won't work with FBJS
        /*
        var array = [];
        for ( var i = 0, len = this.length; i < len; i++ ) {
            array[i] = this.nodes[i];
        }
        return array; */
    },

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function(i) {
        // Return a 'clean' array or just the element :
		return typeof(i) === 'undefined' ? slice.call( this.nodes ) : this.nodes[i];
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
            var thisSelector = this.selector;
            ret.selector = thisSelector + (thisSelector ? " " : "") + selector;
        }
        else if ( name ) {
            ret.selector = this.selector + "." + name + "(" + selector + ")";
        }
        // Return the newly-formed element set
        return ret;
    },

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
    each: function(callback, args) {
        FBjqRY.each(this.nodes, callback, args);
        return this;
    },

    ready: function(fn) {
        setTimeout( function() { fn(); } );
        return this;
    },

	eq: function( i ) {
		return i === -1 ? this.slice( i ) : this.slice( i, +i + 1 );
    },

	first: function() { return this.eq(0); },
	last: function() { return this.eq(-1); },

    slice: function(arg1, arg2) {
        return this.pushStack(
            slice.apply( this.nodes, arguments ),
            //this.nodes.slice( arg1, arg2 ),
            "slice", slice.call(arguments).join(",")
        );
    },

	map: function( callback ) {
		return this.pushStack( FBjqRY.map(this.nodes, function(elem, i){
			return callback.call( elem, i, elem );
		}));
	},

    end: function() { // @todo || jQuery(null); ?
        return this.prevObject || FBjqRY( [] );
    },

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: function() {
        var nodes = this.nodes;
        nodes.push.apply(nodes, arguments);
        this.length = nodes.length;
    }
	//sort: [].sort,
	//splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
FBjqRY.fn.init.prototype = FBjqRY.fn;

// ============================================================================
/** FBJS helpers */
// ============================================================================
FBjqRY.fbjs = { // NOTE: needs to be defined before extend is first used !
    nextId: 1,
    // NOTE: __instance is not 100% reliable e.g. testSiblingClassTagSelector fails
    // having the same elements matched with a different __instance identifier !
    getNodeId: function(node, dontGenerate) {
        // __instance is a unique identifier for FBDOM nodes
        //return node && node.__instance;
        if ( node ) {
            if ( ! node.getId ) return undefined;
            var nodeId = node.getId();
            if ( ! nodeId && ! dontGenerate ) {
                nodeId = '_generated-' + FBjqRY.fbjs.nextId++;
                node.setId( nodeId );
            }
            return nodeId;
        }
        return node;
    },
    isNode: function(node) {
        return node && (node.__instance || node.__instance === 0);
    },
    sameNode: function(node1, node2) {
        var getNodeId = FBjqRY.fbjs.getNodeId;
        // __instance is a unique identifier for FBDOM nodes
        //return node1.__instance == node2.__instance;
        return getNodeId(node1) === getNodeId(node2, true);
    }
};

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
	if ( typeof target !== "object" && ! FBjqRY.isFunction(target) ) {
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
		i--;
	}

    var isFBNode = FBjqRY.fbjs.isNode;
    
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
                    //console.log('deep', name, target, copy);
					target[ name ] = FBjqRY.extend( deep,
						// Never move original objects, clone them
						src || ( copy.length != null ? [] : {} )
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
	noConflict: function( deep ) {
		//window.$ = _$;
		//if ( deep ) {
		//	window.jQuery = _jQuery;
		//}
		return FBjqRY;
	},
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: true, // false,
    
	// Handle when the DOM is ready
	//ready: function() { },
	//bindReady: function() { if ( true ) return; },

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return toString.call(obj) === "[object Function]";
	},
	isArray: function( obj ) {
		return toString.call(obj) === "[object Array]";
	},

    /**
     * NOTE: this method is important as FBML might "prerender" JS strings
     * that contain HTML (to be used with setInnerXHTML etc.) !
     *
     * typeof(variable) for such strings might return 'object' !
     * 
     * @FBjqRY.extension
     */
    isString: function(obj) { // @todo var var isString !
        //return object.toString() === object;
        return toString.call(obj) === "[object String]";
    },

    /*
	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
			return false;
		}

		// Not own constructor property must be Object
		if ( obj.constructor &&
			!hasOwn.call(obj, "constructor") &&
			!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	}, */

	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw msg;
	},

	parseJSON: function(data) {
		if ( ! FBjqRY.isString(data) || ! data ) return null;

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		//data = jQuery.trim( data );

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			return parseJSON(data); // from support.js

		}
        else {
			return FBjqRY.error("parseJSON() invalid JSON: " + data);
		}
	},

	noop: function() {},

	// Evalulates a script in a global context
    /*
	globalEval: function( data ) {
		if ( data && rnotwhite.test(data) ) {
			// Inspired by code by Andrea Giammarchi
			// http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");

			script.type = "text/javascript";

			if ( jQuery.support.scriptEval ) {
				script.appendChild( document.createTextNode( data ) );
			} else {
				script.text = data;
			}

			// Use insertBefore instead of appendChild to circumvent an IE6 bug.
			// This arises when a base node is used (#2709).
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}
	}, */

	nodeName: function(elem, name) {
		return elem.getTagName && elem.getTagName().toUpperCase() === name.toUpperCase();
	},

	// args is for internal usage only
    each: function( object, callback, args ) {
        var name, i, length = object.length;
        var isObj = length === undefined || FBjqRY.isFunction(object);

        if ( args ) {
            if ( isObj ) { // length === undefined
                for ( name in object )
                    if ( callback.apply( object[ name ], args ) === false )
                        break;
            } else {
                for ( i = 0; i < length; )
                    if ( callback.apply( object[ i++ ], args ) === false )
                        break;
            }
        // A special, fast, case for the most common use of each
        } else {
            if ( isObj ) { // length === undefined
                for ( name in object )
                    if ( callback.call( object[ name ], name, object[ name ] ) === false )
                        break;
            } else {
                i = 0;
                for ( var value = object[0];
                      i < length && callback.call( value, i, value ) !== false;
                      value = object[++i] ) { }
            }
        }

        return object;
    },

	// Use native String.trim function wherever possible
	trim: trim ?
		function( text ) {
			return text == null ? "" : trim.call( text.toString() );
		} :
		// Otherwise use our own trimming functionality
		function( text ) {
            var empty = '';
			return text == null ? empty :
				text.toString().replace( trimLeft, empty ).replace( trimRight, empty );
		},

	// results is for internal usage only
	makeArray: function( array, results ) {
		var ret = results || [];

		if ( array != null ) {
			var i = array.length;
			// The window, strings (and functions) also have 'length'
			if ( i == null || FBjqRY.isString(array) || FBjqRY.isFunction(array) || array.setInterval ) {
				ret[0] = array;
            }
            else {
                if ( array.jquery ) array = array.nodes;
                FBjqRY.merge( ret, array ); // while ( i ) ret[--i] = array[i];
            }
		}

		return ret;
	},

	inArray: function(elem, array) {
        var cmpFn, isNode = FBjqRY.fbjs.isNode;
        if ( isNode(elem) ) {
            var sameNode = FBjqRY.fbjs.sameNode;
            cmpFn = function(v) { return isNode(v) && sameNode(elem, v); };
        }
        else {
            if ( elem.equals ) cmpFn = function(v) { return elem.equals(v); };
            else cmpFn = function(v) { return (elem === v); };
        }

        array = array.jquery ? array.nodes : array;
        
        for (var i = 0, len = array.length; i < len; i++) {
            if ( cmpFn( array[i] ) ) return i;
        }
        return -1;
    },

	merge: function(first, second) {
        var i = first.length, j = 0;

        if ( typeof(second.length) === "number" ) {
            for ( var len = second.length; j < len; j++ ) {
                first[i++] = second[j];
            }
        }
        else {
            while ( typeof(second[j]) !== 'undefined' ) {
                first[i++] = second[j++];
            }
        }

        first.length = i;
        return first;
    },

	grep: function( array, callback, inv ) {
        var ret = [];

        // Go through the array, only saving the items
        // that pass the validator function
        for ( var i = 0, len = array.length; i < len; i++ ) {
            if ( !inv != !callback( array[i], i ) ) {
                ret.push( array[i] );
            }
        }
        return ret;
    },

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var ret = [], value;

		// Go through the array, translating each of the items to their
		// new value (or values).
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			value = callback( elems[ i ], i, arg );

			if ( value != null ) {
				ret[ ret.length ] = value;
			}
		}

		return ret.concat.apply( [], ret );
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
	},

	// Mutifunctional method to get and set values to a collection
	// The value/s can be optionally by executed if its a function
	access: function( elems, key, value, exec, fn, pass ) {
        var origElems = elems;
        if ( elems.jquery ) elems = elems.nodes;
		var length = elems.length;

		// Setting many attributes
		if ( typeof key === "object" ) {
            var access = FBjqRY.access;
			for ( var k in key ) {
				access( elems, k, key[k], exec, fn, value );
			}
			return origElems;
		}

		// Setting one attribute
		if ( typeof(value) !== 'undefined' ) {
			// Optionally, function values get executed if exec is true
			exec = ! pass && exec && FBjqRY.isFunction(value);

			for ( var i = 0; i < length; i++ ) {
				fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
			}

			return origElems;
		}

		// Getting an attribute
		return length ? fn( elems[0], key ) : undefined;
	},

	now: function() { return (new Date()).getTime(); },

	// Use of jQuery.browser is frowned upon.
	// More details: http://docs.jquery.com/Utilities/jQuery.browser
    /*
	uaMatch: function( ua ) {
		ua = ua.toLowerCase();

		var match = /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
			/(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
			/(msie) ([\w.]+)/.exec( ua ) ||
			!/compatible/.test( ua ) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
			[];

		return { browser: match[1] || "", version: match[2] || "0" };
	}, */

	browser: {},

    unique: function(array) {
        //if ( !array || !array.length ) return [];
        /*
        var indexFn = function(elem) { return elem; };

        if ( ary[0].__instance || ary[0].__instance === 0) {
            indexFn = function(elem) { return elem.__instance; };
        }

        for(var i = 0, length = ary.length; i < length; i++) {
            index = indexFn(ary[i]);
            if(!done[index]) {
                done[index] = true;
                ret.push(ary[i]);
            }
        }
        */
        var ret = [], done = {}, i, len, e, id;
        try {
            if ( FBjqRY.fbjs.isNode(array[0]) ) {
                var getNodeId = FBjqRY.fbjs.getNodeId;
                for (i = 0, len = array.length; i < len; i++) {
                    e = array[i]; id = getNodeId(e);
                    if ( ! done[id] ) {
                        done[id] = true;
                        ret.push(e);
                    }
                }
            }
            else {
                for (i = 0, len = array.length; i < len; i++) {
                    e = array[i]; id = e;
                    if ( ! done[id] ) {
                        done[id] = true;
                        ret.push(e);
                    }
                }
            }
        }
        catch (e) {
            FBjqRY.log("unique() returning original array", e);
            ret = array;
        }
        return ret;
    }
});
/*
browserMatch = jQuery.uaMatch( userAgent );
if ( browserMatch.browser ) {
	jQuery.browser[ browserMatch.browser ] = true;
	jQuery.browser.version = browserMatch.version;
}

// Deprecated, use jQuery.browser.webkit instead
if ( jQuery.browser.webkit ) {
	jQuery.browser.safari = true;
} */

// Verify that \s matches non-breaking spaces
// (IE fails on this test)
if ( !/\s/.test( "\xA0" ) ) {
	trimLeft = /^[\s\xA0]+/;
	trimRight = /[\s\xA0]+$/;
}

FBjqRY.log = FBjqRY.noop; // a tracing helper

// All jQuery objects should point back to these
//rootjQuery = jQuery(document);

// Expose jQuery to the global object
//window.jQuery = window.$ = jQuery;
(function() {

	//var root = document.getRootElement();
    //var script = document.createElement("script");
    //var id = "script" + FBjqRY.now();
    
    var div = document.createElement("div");
	div.setStyle('display', "none");
	div.setInnerXHTML(
    "<div>" +
        //"<link/>" +
        "<table></table>" +
        // FBJS (XHTML issue): opacity: 0.55 is not a valid CSS style
        //"<a href='/a' style='color:red; float:left; opacity: 0.55;'>a</a>" +
        "<a href='/a' style='color:red; float:left;'>a</a>" +
        "<input type='checkbox'/>" +
    "</div>");

	var all = div.getFirstChild().getElementsByTagName("*"),
		a = div.getElementsByTagName("a")[0];

    a.setStyle('opacity', '0.55'); // works despite the inline style doesn't !

	// Can't get basic test support
	if ( !all || !all.length || !a ) {
        FBjqRY.support = {};
        return;
    }

	FBjqRY.support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.getFirstChild().getNodeType() === 3,

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
        // FBJS: link is not an allowed DOM element
		//htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText insted)
		//style: /red/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: true, //a.getAttribute("href") === "/a",

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.55$/.test( a.getStyle('opacity') ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.getStyle('cssFloat'),

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: div.getElementsByTagName("input")[0].value === "on",

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: document.createElement("select").appendChild( document.createElement("option") ).selected,

		// Will be defined later
		checkClone: false,
		scriptEval: false,
		noCloneEvent: true,
		boxModel: null
	};
    /*
	script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
	}
    catch(e) {}

	root.insertBefore( script, root.firstChild );

	// Make sure that the execution of code works by injecting a script
	// tag with appendChild/createTextNode
	// (IE doesn't support this, fails, and uses .text instead)
	if ( window[ id ] ) {
		FBjqRY.support.scriptEval = true;
		delete window[ id ];
	}

	root.removeChild( script );

	if ( div.attachEvent && div.fireEvent ) {
		div.attachEvent("onclick", function click() {
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			FBjqRY.support.noCloneEvent = false;
			div.detachEvent("onclick", click);
		});
		div.cloneNode(true).fireEvent("onclick");
	}

	div = document.createElement("div");
	div.innerHTML = "<input type='radio' name='radiotest' checked='checked'/>";

	var fragment = document.createDocumentFragment();
	fragment.appendChild( div.firstChild );

	// WebKit doesn't clone checked state correctly in fragments
	FBjqRY.support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked;

	// Figure out if the W3C box model works as expected
	// document.body must exist before we can do this
	FBjqRY(function() {
		var div = document.createElement("div");
		div.style.width = div.style.paddingLeft = "1px";

		document.body.appendChild( div );
		FBjqRY.boxModel = FBjqRY.support.boxModel = div.offsetWidth === 2;
		document.body.removeChild( div ).style.display = 'none';
		div = null;
	});
    */

	// Technique from Juriy Zaytsev
	// http://thinkweb2.com/projects/prototype/detecting-event-support-without-browser-sniffing/
	var eventSupported = function( eventName ) {
		var el = document.createElement("div");
		eventName = "on" + eventName;

		var isSupported = (eventName in el);
		if ( ! isSupported ) {
			el.setAttribute(eventName, "return;");
			isSupported = typeof el[eventName] === "function";
		}
		el = null;

		return isSupported;
	};

    // @todo :
	//FBjqRY.support.submitBubbles = eventSupported("submit");
	//FBjqRY.support.changeBubbles = eventSupported("change");

	// release memory in IE
	root = script = div = all = a = null;
    
})();

/*
FBjqRY.props = {
	"for": "htmlFor",
	"class": "className",
	readonly: "readOnly",
	maxlength: "maxLength",
	cellspacing: "cellSpacing",
	rowspan: "rowSpan",
	colspan: "colSpan",
	tabindex: "tabIndex",
	usemap: "useMap",
	frameborder: "frameBorder"
};
*/

// ============================================================================
/** JSON parser */
// ============================================================================
var parseJSON = (function() { //Modified json parser begins here :
    var number  = '(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)';
    var oneChar = '(?:[^\\0-\\x08\\x0a-\\x1f\"\\\\]|\\\\(?:[\"/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';
    var string  = '(?:\"' + oneChar + '*\")';

    var jsonToken = new RegExp('(?:false|true|null|[\\{\\}\\[\\]]' + '|' + number + '|' + string + ')', 'g');

    var escapeSequence = new RegExp('\\\\(?:([^u])|u(.{4}))', 'g');

    var escapes = {
        '"': '"',
        '/': '/',
        '\\': '\\',
        'b': '\b',
        'f': '\f',
        'n': '\n',
        'r': '\r',
        't': '\t'
    };
    function unescapeOne(_, ch, hex) {
        return ch ? escapes[ch] : String.fromCharCode(parseInt(hex, 16));
    }

    return function (json, opt_reviver) {
        var toks = json.match(jsonToken);
        var result;
        var tok = toks[0];
        if ('{' === tok) {
            result = {};
        } else if ('[' === tok) {
            result = [];
        } else {
            return FBjqRY.error("parseJSON() unsupported initial json token: '" + tok + "'");
        }

        var key;
        var stack = [result];
        for (var i = 1, n = toks.length; i < n; ++i) {
          tok = toks[i];

          var cont;
          switch (tok.charCodeAt(0)) {
            case 0x22:  // '"'
              tok = tok.substring(1, tok.length - 1);
              if (tok.indexOf('\\') !== -1) {
                tok = tok.replace(escapeSequence, unescapeOne);
              }
              cont = stack[0];
              if (!key) {
                if (cont instanceof Array) {
                  key = cont.length;
                } else {
                  key = tok || '';
                  break;
                }
              }
              cont[key] = tok;
              key = 0;
              break;
            case 0x5b:  // '['
              cont = stack[0];
              stack.unshift(cont[key || cont.length] = []);
              key = 0;
              break;
            case 0x5d:  // ']'
              stack.shift();
              break;
            case 0x66:  // 'f'
              cont = stack[0];
              cont[key || cont.length] = false;
              key = 0;
              break;
            case 0x6e:  // 'n'
              cont = stack[0];
              cont[key || cont.length] = null;
              key = 0;
              break;
            case 0x74:  // 't'
              cont = stack[0];
              cont[key || cont.length] = true;
              key = 0;
              break;
            case 0x7b:  // '{'
              cont = stack[0];
              stack.unshift(cont[key || cont.length] = {});
              key = 0;
              break;
            case 0x7d:  // '}'
              stack.shift();
              break;
            default:  // sign or digit
              cont = stack[0];
              cont[key || cont.length] = +(tok);
              key = 0;
              break;
          }
        }
        if ( stack.length ) {
            return FBjqRY.error("parseJSON() could not fully process json object");
        }

        if (opt_reviver) {
          var walk = function (holder, key) {
            var value = holder[key];
            if (value && typeof value === 'object') {
              var toDelete = null;
              for (var k in value) {
                if (value.hasOwnProperty(k)) {
                  var v = walk(value, k);
                  if (v !== 0) {
                    value[k] = v;
                  } else {
                    if (!toDelete) { toDelete = []; }
                    toDelete.push(k);
                  }
                }
              }
              if (toDelete) {
                for (var i = toDelete.length; --i >= 0;) {
                  delete value[toDelete[i]];
                }
              }
            }
            return opt_reviver.call(holder, key, value);
          };
          result = walk({ '': result }, '');
        }

        return result;
      };
})();//var windowData = {};
FBjqRY.extend({
	cache: {},

	// Please use with caution
	//uuid: 0,

	// Unique for each copy of jQuery on the page
	expando: "FBjqRY" + FBjqRY.now(),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: { "embed": true, "object": true, "applet": true },

    data: function( elem, name, data ) {
//        var id = getFBNodeId(elem, true), cache = FBjqRY.cache, thisCache;
//        if ( ! id ) {
//            if ( typeof(name) === "string" && typeof(data) === 'undefined' ) return null;
//        }
//        else {
//            id = getFBNodeId(elem, false);
//        }
        var id = FBjqRY.fbjs.getNodeId(elem), cache = FBjqRY.cache, thisCache;

		// Avoid generating a new cache unless none exists and we
		// want to manipulate it.
		if ( typeof name === "object" ) {
			cache[ id ] = FBjqRY.extend(true, {}, name);
		}
        else if ( ! cache[ id ] ) {
			cache[ id ] = {};
		}
		thisCache = cache[ id ];

		// Prevent overriding the named cache with undefined values
		if ( typeof(data) !== 'undefined' ) thisCache[ name ] = data;

		return typeof(name) === "string" ? thisCache[ name ] : thisCache;
    },

    removeData: function( elem, name ) {
        var id = FBjqRY.fbjs.getNodeId(elem, true), cache = FBjqRY.cache;
        var thisCache = id ? cache[ id ] : undefined;

		// If we want to remove a specific section of the element's data
		if ( name ) {
			if ( thisCache ) {
				// Remove the section of cache data
				delete thisCache[ name ];
				// If we've removed all the data, remove the element's cache
				if ( FBjqRY.isEmptyObject(thisCache) ) {
					FBjqRY.removeData( elem );
				}
			}
		} // Otherwise, we want to remove all of the element's data
        else {
			// Completely remove the data cache
			if ( id ) delete cache[ id ];
		}
    },

    // embedded queue.js :

	queue: function( elem, type, data ) {
		if ( !elem ) return;

		type = (type || "fx") + "queue";
		var q = FBjqRY.data( elem, type );

		// Speed up dequeue by getting out quickly if this is just a lookup
		if ( !data ) return q || [];

		if ( !q || FBjqRY.isArray(data) ) {
			q = FBjqRY.data( elem, type, FBjqRY.makeArray(data) );
		}
        else {
			q.push( data );
		}

		return q;
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = FBjqRY.queue( elem, type ), fn = queue.shift();

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) fn = queue.shift();

		if ( fn ) {
			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift("inprogress");
			}

			fn.call(elem, function() {
				FBjqRY.dequeue(elem, type);
			});
		}
	}

});

FBjqRY.fn.extend({
    data: function( key, value ) {
        if ( typeof(key) === 'undefined' && this.length ) {
            return FBjqRY.data( this.nodes[0] );
        }
        else if ( typeof key === "object" ) {
            return this.each(function() { 
                FBjqRY.data( this, key );
            });
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
        return this.each(function(){ 
            FBjqRY.removeData( this, key );
        });
    },

    // embedded queue.js :

	queue: function( type, data ) {
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
		}

		if ( data === undefined ) {
			return FBjqRY.queue( this[0], type );
		}
		return this.each(function( i, elem ) {
			var queue = FBjqRY.queue( this, type, data );

			if ( type === "fx" && queue[0] !== "inprogress" ) {
				FBjqRY.dequeue( this, type );
			}
		});
	},
	dequeue: function( type ) {
		return this.each(function() {
			FBjqRY.dequeue( this, type );
		});
	},

	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = FBjqRY.fx ? jQuery.fx.speeds[time] || time : time;
		type = type || "fx";

		return this.queue( type, function() {
			var elem = this;
			setTimeout(function() {
				FBjqRY.dequeue( elem, type );
			}, time );
		});
	},

	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	}

});var rclass = /[\n\t]/g,
	//rspace = /\s+/,
	//rreturn = /\r/g,
	//rspecialurl = /href|src|style/,
	//rtype = /(button|input)/i,
	//rfocusable = /(button|input|object|select|textarea)/i,
	//rclickable = /^(a|area)$/i,
	rradiocheck = /radio|checkbox/;

FBjqRY.fn.extend({
	attr: function( name, value ) {
		return FBjqRY.access( this, name, value, true, FBjqRY.attr );
	},
    
	removeAttr: function(name) {
		return this.each(function() {
			FBjqRY.attr( this, name, "" );
		});
	},

    addClass: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each(function(i) {
				var self = FBjqRY(this);
				self.addClass( value.call(this, i, self.attr("class")) );
			});
		}

        if ( value && typeof value === "string" ) {
            var trim = FBjqRY.trim;
            value = trim( value );
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                var node = this.nodes[i];
                node.addClassName(value);

                var className = node.getClassName();
                var trimmedClass = trim( className );
                if ( className.length !== trimmedClass.length ) {
                    node.setClassName( trimmedClass );
                }
            }
        }
        return this;
    },

    removeClass: function(value) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each(function(i) {
				var self = FBjqRY(this);
				self.removeClass( value.call(this, i, self.attr("class")) );
			});
		}

        if ( (value && typeof(value) === "string") || value === undefined ) {
            var trim = FBjqRY.trim;
            for ( var i = 0, len = this.length; i < len; i++ ) {
                var node = this.nodes[i];
                if ( value ) { // remove
                    node.removeClassName(value);

                    var className = node.getClassName();
                    var trimmedClass = trim( className );
                    if ( className.length !== trimmedClass.length ) {
                        node.setClassName( trimmedClass );
                    }
                }
                else { // remove all classes :
                    node.setClassName('');
                }
            }
        }
        return this;
    },

    toggleClass: function(value, state) {
		if ( FBjqRY.isFunction(value) ) {
			return this.each(function(i) {
				var self = FBjqRY(this);
				self.toggleClass( value.call(this, i, self.attr("class"), state), state );
			});
		}

        var type = typeof(value), className;
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            if ( type === 'string' ) {
                //node.toggleClassName(value);
				// toggle individual class names :
				var c = 0, classNames = value.split(/\s+/),
                    stateBool = typeof(state) === 'boolean';

				while ( (className = classNames[ c++ ]) ) {
					// check each className given, space seperated list
                    if ( stateBool ) {
                        node[state ? 'addClassName' : 'removeClassName'](className)
                    }
                    else {
                        node.toggleClassName(className);
                    }
				}
            }
			else if ( type === "undefined" || type === "boolean" ) {
                className = node.getClassName();
				if ( className ) {
					// store className if set
					FBjqRY.data( node, "__className__", className );
				}
				// toggle whole className
                if (className || value === false) className = "";
                else {
                    className = FBjqRY.data( node, "__className__" ) || "";
                }
				node.setClassName( className );
			}
        }
        return this;
    },

    hasClass: function(className) {
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            if ( this.nodes[i].hasClassName(className) ) return true;
        }
        return false;
    },

    val: function(value) {
        var i, len, node, values;
        if( typeof(value) !== 'undefined' ) {
            var isFunction = FBjqRY.isFunction(value);

            for ( i = 0, len = this.nodes.length; i < len; i++ ) {
                node = this.nodes[i]; var val = value, nodeVal;

                if ( isFunction ) {
                    nodeVal = FBjqRY(node).val();
                    val = value.call(node, i, nodeVal);
                }
                // Typecast each time if the value is a Function and the appended
                // value is therefore different each time.
                if ( typeof val === "number" ) val += "";

                if ( FBjqRY.isArray(val) && rradiocheck.test( node.getType() ) ) {
                    nodeVal = FBjqRY(node).val();
                    node.setChecked( FBjqRY.inArray( nodeVal, val ) >= 0 );
                }
                else if ( node.getTagName().toUpperCase() === "SELECT" ) {
                    values = FBjqRY.makeArray(val);

                    FBjqRY("option", node).each(function() {
                        var optVal = FBjqRY(this).val();
                        this.setSelected( FBjqRY.inArray( optVal, values ) >= 0 );
                    });

                    if ( ! values.length ) node.setSelectedIndex(-1);
                }
                else {
                    node.setValue(val);
                }
            }
            return this;
        }
        
        if ( ( node = this.nodes[0] ) ) {
            var nodeName = node.getTagName().toUpperCase();
            // NOTE: can't read text from FB nodes !
            //if ( nodeName === 'OPTION' ) {
            //    value = node.getValue() || node.getTextValue();
            //}
            // We need to handle select boxes special
            if ( nodeName === "SELECT" ) {
                var index = node.getSelectedIndex(),
                    options = FBjqRY('option', node).nodes,
                    one = node.getType() === "select-one";

                // Nothing was selected
                if ( index < 0 ) return null;

                // Loop through all the selected options
                for ( i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
                    var option = options[ i ];
                    //console.log('val() select i', option, option.getSelected());
                    if ( option.getSelected() ) {
                        // We don't need an array for one selects
                        value = option.getValue();
                        if ( one ) break;
                        // Multi-Selects return an array
                        if ( ! values ) values = [];
                        values.push( value );
                    }
                }
                if ( ! one ) return values;
            }
            else {
                value = node.getValue();
            }

            return value ? value : '';
        }
        return undefined; // no node
    }
});

var validAttrs = (function() {
    var validAttrs = {},
        // node attributes :
        attrs = ("accessKey,action,checked,className,cols,colSpan,dir,disabled,href,id," +
                   "maxLength,method,name,readOnly,rows,rowSpan,selected,selectedIndex," +
                   "selection,src,style,tabIndex,target,title,type,value");
        // node accessors (getters) :
        attrs += ",tagName,parentNode,nextSibling,previousSibling,firstChild,lastChild";
        attrs = attrs.split(",");
    for (var i = 0, len = attrs.length; i < len; i++) {
        var attr = attrs[i];
        validAttrs[ attr.toLowerCase() ] = 'set' +
            attr.charAt(0).toUpperCase() + attr.substr(1);
    }
    // name aliases :
    validAttrs[ "class" ] = "setClassName";
    validAttrs[ "nodeName".toLowerCase() ] = "setTagName";
    // html/text setters :
    //validAttrs[ "html" ] = "setInnerXHTML";
    validAttrs[ "fbml" ] = "setInnerFBML";
    //validAttrs[ "text" ] = "setTextValue";
    // css/style setters :
    //validAttrs[ "css" ] = "setStyle";
    validAttrs[ "style" ] = "setStyle";
    // height/width helpers :
    //validAttrs[ "height" ] = "setHeight";
    //validAttrs[ "width" ] = "setWidth";
    return validAttrs;
})();

var setStyle = function(node, val) { // a special case for the set style attr method
    if ( typeof(val) === 'string' ) {
        var styles = val.split(";");
        for ( var i = 0, len = styles.length; i < len; i++ ) {
            var s = styles[i].split(":");
            if ( s.length == 2 ) {
                var name = trim( s[0].toLowerCase() );
                var value = trim( s[1] );
                FBjqRY.style(node, name, value);
            }
        }
    }
    else {
        FBjqRY.style(node, val);
    }
};

FBjqRY.extend({
	attrFn: {
		val: true,
		css: true,
		html: true,
		text: true,
		data: true,
		width: true,
		height: true,
		offset: true
	},

	attr: function( elem, name, value, pass ) {
		// don't set attributes on text and comment nodes
		if ( ! elem || elem.getNodeType() === 3 || elem.getNodeType() === 8 ) {
			return undefined;
		}
        
		if ( pass && FBjqRY.attrFn[name] ) {
			return FBjqRY(elem)[name](value);
		}

		//var notxml = elem.nodeType !== 1 || !jQuery.isXMLDoc( elem ),
        // Whether we are setting (or getting)
        var set = typeof value !== 'undefined';

		// Try to normalize/fix the name
		//name = notxml && jQuery.props[ name ] || name;

        // Safari mis-reports the default selected property of an option
        // Accessing the parent's selectedIndex property fixes it
        if ( name === "selected" && ! FBjqRY.support.optSelected ) {
            var parent = elem.getParentNode();
            if ( parent ) {
                parent.getSelectedIndex();
                // Make sure that it also works with optgroups, see #5701
                parent = parent.getParentNode();
                if ( parent ) parent.getSelectedIndex();
            }
        }

        // These attributes require special treatment
        /*
        var special = rspecialurl.test( name );

        // If applicable, access the attribute via the DOM 0 way
        if ( name in elem && notxml && !special ) {
            if ( set ) {
                // We can't allow the type property to be changed (since it causes problems in IE)
                if ( name === "type" && rtype.test( elem.nodeName ) && elem.parentNode ) {
                    jQuery.error( "type property can't be changed" );
                }

                elem[ name ] = value;
            }

            // browsers index elements by id/name on forms, give priority to attributes.
            if ( jQuery.nodeName( elem, "form" ) && elem.getAttributeNode(name) ) {
                return elem.getAttributeNode( name ).nodeValue;
            }

            // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
            // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
            if ( name === "tabIndex" ) {
                var attributeNode = elem.getAttributeNode( "tabIndex" );

                return attributeNode && attributeNode.specified ?
                    attributeNode.value :
                    rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
                        0 :
                        undefined;
            }

            return elem[ name ];
        }
        */

        var setAttr = validAttrs[ name.toLowerCase() ];
        if ( ! setAttr ) {
           FBjqRY.log("attr() attribute name '" + name + "' is not supported");
           return undefined;
        }

        if ( set ) {
            try {
               if ( /* ! FBjqRY.support.style && */ setAttr === "setStyle") setStyle(elem, value);
               else if (setAttr === "setWidth") FBjqRY.style(elem, 'width', value);
               else if (setAttr === "setHeight") FBjqRY.style(elem, 'height', value);
               //else if (setAttr === "setInnerXHTML") Support.xhtml(value, node);
               else elem[setAttr](value); // e.g. setTitle(value)
            }
            catch (e) { // e.g. when setting an invalid url parameter using setSrc()
                return FBjqRY.error("attr() setter node[" + setAttr + "](" + value + ") failed: " + e);
            }
            //return node;
        }

        // getter :
        var getAttr = 'g' + setAttr.substr(1); // setStyle -> getStyle
        if ( ! elem[getAttr] ) {
            if ( set ) return undefined;
            return FBjqRY.error("attr() getter " + getAttr + " not supported !");
        }
        value = undefined;
        try {
            if (getAttr === "getStyle") return FBjqRY.error("attr() could not get bare 'style' attribute value");
            else if (getAttr === "getWidth") value = FBjqRY.style(elem, 'width');
            else if (getAttr === "getHeight") value = FBjqRY.style(elem, 'height');
            else {
                value = elem[getAttr]();  // e.g. getTitle()
                //if ( typeof(value) === 'undefined' ) value = '';
            }
        }
        catch (e) {
            // some nodes for some attrs e.g. getHref throw an error :
            // "TypeError: b is undefined" instead of returning correctly
            FBjqRY.log("attr() getter node[" + getAttr + "]() failed: " + e); // @todo log
        }
        // Non-existent attributes return null, we normalize to undefined
        return value === null ? undefined : value;
	}
});
// exclude the following css properties to add px
var rexclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
	ralpha = /alpha\([^)]*\)/,
	ropacity = /opacity=([^)]*)/,
	rfloat = /float/i,
	rdashAlpha = /-([a-z])/ig,
	//rupper = /([A-Z])/g,
	//rnumpx = /^-?\d+(?:px)?$/i,
	//rnum = /^-?\d/,

	cssShow = { position: "absolute", visibility: "hidden", display:"block" },
	cssWidth = [ "Left", "Right" ],
	cssHeight = [ "Top", "Bottom" ],

	// cache check for defaultView.getComputedStyle
	getComputedStyle = document.defaultView && document.defaultView.getComputedStyle,
	// normalize float css property
	styleFloat = FBjqRY.support.cssFloat ? "cssFloat" : "styleFloat",
	fcamelCase = function( all, letter ) { return letter.toUpperCase(); };

function getWH( elem, name, extra ) {
	var which = name === "width" ? cssWidth : cssHeight,
		val = name === "width" ? elem.getOffsetWidth() : elem.getOffsetHeight();

	if ( extra === "border" ) {
		return val;
	}

    FBjqRY.each( which, function() {
        if ( !extra ) {
            val -= parseFloat(FBjqRY.curCSS( elem, "padding" + this, true)) || 0;
        }
        if ( extra === "margin" ) {
            val += parseFloat(FBjqRY.curCSS( elem, "margin" + this, true)) || 0;
        }
        else {
            val -= parseFloat(FBjqRY.curCSS( elem, "border" + this + "Width", true)) || 0;
        }
    });

	return val;
}

function getOpacityFilter(elem) {
    var filter = elem.getStyle('filter');
    return filter && filter.indexOf("opacity=") >= 0 ?
            (parseFloat( ropacity.exec(filter)[1] ) / 100) + "":
                "";
}
function setOpacityFilter(elem, value) {
    // IE has trouble with opacity if it does not have layout
    // Force it by setting the zoom level
    elem.setStyle('zoom', '1');
    // Set the alpha filter to set the opacity
    var opacity = parseInt( value, 10 ) + "" === "NaN" ? "" : "alpha(opacity=" + value * 100 + ")";
    var filter = elem.getStyle('filter') || FBjqRY.curCSS( elem, "filter" ) || "";
    filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : opacity;
    elem.setStyle('filter', filter);
}

FBjqRY.fn.css = function( name, value ) {
	return FBjqRY.access( this, name, value, true, function( elem, name, value ) {

		if ( value === undefined ) return FBjqRY.curCSS( elem, name );

        // NOTE: moved to style()
		//if ( typeof value === "number" && ! rexclude.test(name) ) {
		//	value += "px";
		//}

		FBjqRY.style( elem, name, value );
	});
};

FBjqRY.extend({
	style: function( elem, name, value ) {

        if ( typeof(name) === 'object' ) {
            var values = {};
            for ( var n in name ) {
                if ( name.hasOwnProperty(n) ) {
                    var val = FBjqRY.style(elem, n, name[n]);
                    values[n] = val;
                }
            }
            return values;
        }

		if ( (name === "width" || name === "height") && parseFloat(value) < 0 ) {
			value = undefined;
		}
		if ( typeof value === "number" && ! rexclude.test(name) ) {
			value += "px";
		}

		// don't set styles on text and comment nodes
		if ( ! elem || elem.getNodeType() === 3 || elem.getNodeType() === 8 ) {
			return undefined;
		}

		var set = value !== undefined; //, style = elem.style || elem;

		// IE uses filters for opacity
		if ( ! FBjqRY.support.opacity && name === "opacity" ) {
			if ( set ) setOpacityFilter(elem, value);
			return getOpacityFilter(elem);
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) name = styleFloat;
		else name = name.replace(rdashAlpha, fcamelCase);

		if ( set ) {
			elem.setStyle(name, value);
		}
		return elem.getStyle(name);
	},

	css: function( elem, name, force, extra ) {
		if ( name === "width" || name === "height" ) {
			if ( elem.getOffsetWidth() !== 0 ) {
				val = getWH( elem, name, extra );
			}
            else {
				FBjqRY.swap( elem, cssShow, function() {
					val = getWH( elem, name, extra );
				});
			}

			return Math.max(0, Math.round(val));
		}

		return FBjqRY.curCSS( elem, name, force );
	},

	curCSS: function( elem, name, force ) {
		var ret;
		// We need to handle opacity special in IE
		if ( name == 'opacity' /* && ! FBjqRY.support.opacity*/ ) {
			ret = elem.getStyle('opacity');
			return ret == "" ? "1" : ret;
		}
		// IE uses filters for opacity
		if ( ! FBjqRY.support.opacity && name === "opacity" && elem.getStyle ) {
            var filter = elem.getStyle('filter');
            var opacity = ropacity.exec(filter || '');
            if ( opacity ) opacity = opacity[1];
			ret = opacity ? (parseFloat(opacity) / 100) + "" : "";
			return ret === "" ? "1" : ret;
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) {
			name = styleFloat;
		}

		//if ( ! force && elem.getStyle && elem.getStyle(name) ) {
        //    ret = elem.getStyle(name);
        //}
		//else
        if ( elem.getStyle ) {
            name = name.replace(rdashAlpha, fcamelCase);
			ret = elem.getStyle( name );

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
            /*
			if ( !/^\d+(px)?$/i.test( ret ) && /^\d/.test( ret ) ) {
				// Remember the original values
				var left = style.left, rsLeft = elem.runtimeStyle.left;

				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				style.left = ret || 0;
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
			} */
		}

		return ret;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var old = {}, name;

		// Remember the old values, and insert the new ones
		for ( name in options ) {
            var camelName = name.replace(rdashAlpha, fcamelCase);
			old[ camelName ] = elem.getStyle( camelName );
			//elem.style[ name ] = options[ name ];
            elem.setStyle( camelName, options[ name ] );
		}

		callback.call( elem );

		// Revert the old values
        elem.setStyle( old );
		//for ( name in options ) {
		//	elem.style[ name ] = old[ name ];
		//}
	}
});

/*
if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		var width = elem.offsetWidth, height = elem.offsetHeight,
			skip = elem.nodeName.toLowerCase() === "tr";

		return width === 0 && height === 0 && !skip ?
			true :
			width > 0 && height > 0 && !skip ?
				false :
				jQuery.curCSS(elem, "display") === "none";
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}
*/

// dimensions.js :

// innerHeight/innerWidth, outerHeight/outerWidth, height/width methods :
FBjqRY.each([ "Height", "Width" ], function( i, name ) {

	var type = name.toLowerCase();

	// innerHeight and innerWidth
	FBjqRY.fn["inner" + name] = function() {
        var node = this.nodes[0];
		return node ? FBjqRY.css( node, type, false, "padding" ) : null;
	};

	// outerHeight and outerWidth
	FBjqRY.fn["outer" + name] = function( margin ) {
        var node = this.nodes[0];
		return node ? FBjqRY.css( node, type, false, margin ? "margin" : "border" ) : null;
	};

	FBjqRY.fn[ type ] = function( size ) {
		// Get window width or height
		var elem = this.nodes[0];
		if ( ! elem ) return size == null ? null : this;

		if ( FBjqRY.isFunction( size ) ) {
			return this.each(function( i ) {
				var self = FBjqRY( this );
				self[ type ]( size.call( this, i, self[ type ]() ) );
			});
		}

        // Get or set width or height on the element
		return size === undefined ?
                // Get width or height on the element
                FBjqRY.css( elem, type ) :
                // Set the width or height on the element (default to pixels if value is unitless)
                this.css( type, typeof size === "string" ? size : size + "px" );
	};

});
/**
 * find function - the selector "engine" behing FBjqRY.
 *
 * @param sel the selector (string)
 * @param context the context of the search e.g. a FB node or a FBjqRY object
 * @param nodes the nodes to filter (assumes no context given if not null), set
 * to null if You're providing a context or want to start at the root element
 * @return an array of matched nodes
 */
FBjqRY.find = (function() {
    var idCheck = /^#(\w+)/,
        classCheck = /^\.([\w\-]+)/,
        tagCheck = /^([A-Za-z_\*]{1}\w*)/,
        attributeCheck = /^\[(\w+)(!|\^|\$|\*|~|\|)?=?["|']?([^\]]+?)?["|']?\]/,
        pseudoCheckParen = /^:([\w\-]+)\("?'?([^\)]+)'?"?\)/,
        pseudoCheck = /^:([\w\-]+)/;

    // Elements can be considered hidden for several reasons :
    // * They have a CSS display value of none.
    // * They are form elements with type="hidden".
    // * Their width and height are explicitly set to 0.
    // * An ancestor element is hidden, so the element is not shown on the page.
    var _isHidden = function(node) {
        if ( node.getTagName().toLowerCase() === 'input' ) {
            var type = node.getType();
            if ( type && type.toLowerCase() === 'hidden' ) return true;
        }
        while ( node ) {
            if ( node.getStyle('display') === 'none' ) return true;
            if ( node.getOffsetWidth() == 0 && node.getOffsetHeight() == 0 ) return true;
            node = node.getParentNode(); // for rootNode this is null - thus we'll stop
        }
        return false;
    };
    var _isInputType = function(node, type) {
        if ( node.getTagName().toLowerCase() !== 'input' ) return false;
        var theType = node.getType();
        return theType && theType.toLowerCase() === type;
    };

    function filterNodes(nodes, fn, recurse) {
        var retNodes = [];
        if ( ! nodes || ! nodes.length ) return retNodes;

        for ( var i = 0, len = nodes.length; i < len; i++ ) {
            if ( fn.call(nodes[i]) ) retNodes.push( nodes[i] );
            if ( recurse ) {
                retNodes = retNodes.concat(
                    filterNodes(nodes[i].getChildNodes(), fn, recurse)
                );
            }
        }
        return retNodes;
    }

    function selectById(nodes, id, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            nodes = [];
            var node = document.getElementById(id);
            if ( node ) nodes[0] = node;
        }
        else {
            nodes = filterNodes( nodes,
                function() { return this.getId() == id; },
                recurse
            );
        }
        return nodes;
    }

    function selectByClass(nodes, cssClass, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) nodes = [ document.getRootElement() ];
        
        return filterNodes( nodes,
            function() { return this.hasClassName(cssClass); },
            recurse
        );
    }

    function selectByTag(nodes, tagName, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            return document.getRootElement().getElementsByTagName(tagName);
        }
        else { // @todo optimize :
            tagName = tagName.toUpperCase();
            /*
            if ( recurse ) { // optimization for a "common" case :
                var tagNodes1 = [], tagNodes2 = [];
                for ( var i = 0, len = nodes.length; i < len; i++ ) {
                    var node = nodes[i];
                    if ( node.getTagName() === tagName || tagName === '*' ) {
                        tagNodes1.push( node );
                    }
                    tagNodes2 = tagNodes2.concat( node.getElementsByTagName(tagName) );
                }
                nodes = tagNodes1.concat( tagNodes2 );
            } */
            //else {
                //if ( tagName === '*' ) return nodes; // ok cause recurse == false
                var allTags = tagName === '*';
                return filterNodes( nodes,
                    function() { return tagName === this.getTagName() || allTags; },
                    recurse
                );
            //}
        }
    }

    function selectByAttribute(nodes, name, type, value, sel, recurse) {
        if ( nodes == null ) {
            nodes = [ document.getRootElement() ];
        }
        var matchFunc = null;
        switch ( type ) {
            case "!": matchFunc = function(a, v) { return a !== v; }; break;
            case "^": matchFunc = function(a, v) { return a.indexOf(v) === 0; }; break;
            case "$": matchFunc = function(a, v) { return a.indexOf(v) + v.length === a.length; }; break;
            case "*": matchFunc = function(a, v) { return a.indexOf(v) >= 0; }; break;
            case "|":
                matchFunc = function(a, v) {
                    return a.length === v.length ? a === v : ( a.indexOf(v) === 0 && a.charAt(v.length) === '-' );
                };
                break;
            case "~": matchFunc = function(a, v) { return FBjqRY.inArray(v, a.split(' ')) !== -1; }; break; // indexOf
            default:
                if ( value === true ) matchFunc = function(a, v) { return !!a; };
                else matchFunc = function(a, v) { return a === v; };
        }
        return filterNodes( nodes,
            function() {
                return matchFunc( FBjqRY.attr(this, name), value );
            },
            recurse
        );
    }

    function selectByPseudo(nodes, pseudo, innerVal, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            if ( pseudo === 'root' ) return [ document.getRootElement() ];
            nodes = document.getRootElement().getElementsByTagName('*');
        }

        var innerValInt = innerVal ? parseInt(innerVal, 10) : null;
        var retNodes;
        
        switch ( pseudo ) {
            case "first":
                retNodes = [ nodes[0] ]; break;
            case "last":
                retNodes = [ nodes[nodes.length - 1] ]; break;
            case "eq":
                retNodes = [ nodes[innerValInt] ]; break;
            case "lt":
                retNodes = nodes.splice(0, innerValInt); break;
            case "gt":
                retNodes = nodes.splice(innerValInt + 1, (nodes.length - innerValInt)); break;
            case "even":
                retNodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 0); } ); break;
            case "odd":
                retNodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 1); } ); break;
            case "contains":
                retNodes = null;
                return FBjqRY.error("find() :contains pseudo selector not supported");
                break;
            case "hidden":
                retNodes = FBjqRY.grep(nodes, _isHidden); break;
            case "visible":
                retNodes = FBjqRY.grep(nodes, function(node) { return ! _isHidden(node); }); break;
            case "has":
                //console.log('has', innerVal, nodes);
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var matches = FBjqRY.find(innerVal, node);
                    return matches.length > 0;
                });
                break;
            case "not":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var notMatches = FBjqRY.find(innerVal, false, [ node ]);
                    // if smt is matched return false :
                    return notMatches.length === 0;
                });
                break;
            case "nth-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    //var childs = this.getChildNodes(), child;
                    //if ( childs && (child = childs[innerValInt]) ) retNodes.push( child );
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var childs = parent.getChildNodes(), child;
                        if ( childs && (child = childs[innerValInt]) ) retNodes.push( child );
                    }
                });
                break;
            case "first-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var child = parent.getFirstChild();
                        if ( child ) retNodes.push( child );
                    }
                });
                break;
            case "last-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    //var child = this.getLastChild();
                    //if ( child ) retNodes.push( child );
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var child = parent.getLastChild();
                        if ( child ) retNodes.push( child );
                    }
                });
                break;
            case "only-child":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var parentChilds = node.getParentNode().getChildNodes();
                    return parentChilds.length === 1;
                });
                break;
            case "parent": // all elements that are the parent of another element :
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var childNodes = node.getChildNodes();
                    return childNodes && childNodes.length > 0;
                });
                break;
            case "empty": // all elements that have no children :
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var childNodes = node.getChildNodes();
                    return ! childNodes || childNodes.length === 0;
                });
                break;
            case "disabled":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var disabled = node.getDisabled();
                    return !! disabled; // @todo disabled === 'disabled'
                });
                break;
            case "enabled":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var disabled = node.getDisabled();
                    return ! disabled;
                });
                break;
            case "selected":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var selected = node.getSelected();
                    return !! selected; // @todo selected === 'selected'
                });
                break;
            case "checked":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var checked = node.getChecked();
                    return !! checked; // @todo checked === 'checked'
                });
                break;
            case "input": // all input, textarea, select and button elements
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var tagName = node.getTagName().toLowerCase();
                    return tagName === 'input' || tagName === 'textarea'
                        || tagName === 'select' || tagName === 'button';
                });
                break;
            case "text":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'text') });
                break;
            case "password":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'password') });
                break;
            case "radio":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'radio') });
                break;
            case "file":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'file') });
                break;
            case "image": // all image inputs
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'image') });
                break;
            case "reset":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'reset') });
                break;
            case "submit":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var type = node.getType(), tagName = node.getTagName().toLowerCase();
                    return (tagName === 'input' && type && type.toLowerCase() === 'submit') ||
                           (tagName === 'button' && ! type && type.toLowerCase() === 'submit');
                });
                break;
            case "header":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var tagName = node.getTagName().toLowerCase();
                    return tagName.length === 2 && tagName.charAt(0) === 'h';
                });
                break;
            case "root": // returns the root element
                var rootNode = document.getRootElement();
                var sameNode = FBjqRY.fbjs.sameNode;
                retNodes = FBjqRY.grep(nodes, function(node) { return sameNode(rootNode, node); });
                break;
        }
        return retNodes;
    }

    return function(sel, context, nodes) { // the find function
        if ( typeof(sel) !== "string" ) {
            if ( sel.length || sel.length === 0 ) return sel;
            return [ sel ];
        }

        var i, len;

        //Is context a valid FBDOM element
        if ( context ) { // context != document
            if ( nodes && nodes.length > 0 ) {
                return FBjqRY.error("find() could not handle context with nodes");
            }
            if ( FBjqRY.fbjs.isNode(context) ) {
                nodes = context.getChildNodes(); // context is never part of the result
            }
            else if ( typeof(context.length) === 'number' ) { // FBjqRY or array
                if ( context.jquery ) context = context.nodes;
                nodes = [];
                for ( i = 0, len = context.length; i < len; i++ ) {
                    nodes = nodes.concat( context[i].getChildNodes() );
                }
            }
            else {
                return FBjqRY.error("find() invalid context: " + context);
            }
        }
        else {
            var filter = context === false; // special case to handle filter-ing
        }

        var recurse, match, prevSel,
            selectors = sel.split( /([^,]*\(.*?\))|,/ ),
            //selectors = sel.split(","),
            allNodes = [], origNodes = nodes;

        var trim = FBjqRY.trim;
        for ( i = 0, len = selectors.length; i < len; i++ ) {
            
            if ( ! selectors[i] ) continue;

            sel = trim( selectors[i] );
            prevSel = "";
            recurse = ! filter; //true;
            while ( sel && sel !== prevSel ) {
                if ( prevSel ) {
                    var char0 = sel.charAt(0);
                    recurse = (char0 === ' ' || char0 === '>' || char0 === '~' || char0 === '+');
                    if ( recurse ) {
                        sel = trim( sel );
                        var nextNodes = [], j, sibling;
                        switch ( sel.charAt(0) ) { // handling selector "hierarchy" :
                            case '>':
                                sel = trim( sel.substr(1) ); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                recurse = false; // only 1st level childs
                                break;
                            case '~':
                                sel = trim( sel.substr(1) ); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    sibling = nodes[j].getNextSibling();
                                    while ( sibling ) {
                                        nextNodes.push( sibling );
                                        sibling = sibling.getNextSibling();
                                    }
                                }
                                recurse = false;
                                break;
                            case '+':
                                sel = trim( sel.substr(1) ); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    sibling = nodes[j].getNextSibling();
                                    if ( sibling ) {
                                        nextNodes.push( sibling );
                                    }
                                }
                                recurse = false;
                                break;
                            default:
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                // but will recurse childs as recurse stays === true
                        }
                        nodes = nextNodes;
                    }
                }
                prevSel = sel;

                //We should start with one of these first 3 cases (id, tag, class)
                if ( ( match = idCheck.exec(sel) ) ) {
                    nodes = selectById(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                if ( ( match = classCheck.exec(sel) ) ) {
                    nodes = selectByClass(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                if ( ( match = tagCheck.exec(sel) ) ) {
                    nodes = selectByTag(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                //The remaining is subfiltering on nodes
                if ( ( match = attributeCheck.exec(sel) ) ) {
                    match[3] = match[3] || true; //if m[3] does not exist we are just checking if attribute exists
                    nodes = selectByAttribute(nodes, match[1], match[2], match[3], sel, recurse);
                    sel = sel.substr( sel.indexOf("]") + 1 );
                    continue;
                }

                match = pseudoCheckParen.exec(sel);
                if ( ! match ) match = pseudoCheck.exec(sel);
                if ( match ) {
                    var matchStr = match[0];
                    var pseudo = match[1];
                    var innerVal = match.length > 2 ? match[2] : null; // the value in the parenthesis

                    nodes = selectByPseudo(nodes, pseudo, innerVal, sel, recurse);

                    sel = sel.substr(matchStr.length);
                    continue;
                }
            }
            if ( sel ) {
                nodes = [];
                return FBjqRY.error("find() could not parse the remaining selector: '" + sel + "'");
            }
            else {
                allNodes = allNodes.concat(nodes);
                nodes = origNodes;
            }
        }

        return FBjqRY.unique(allNodes);
    };
})();
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
                    return FBjqRY.error('clean() setInnerXHTML with "'+ elem +'" failed !');
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
}; */var rnamespaces = /\.(.*)$/,
	fcleanup = function( nm ) {
		return nm.replace(/[^\w\s\.\|`]/g, function( ch ) {
			return "\\" + ch;
		});
	};

/*
 * A number of helper functions used for managing events.
 * Many of the ideas behind this code originated from
 * Dean Edwards' addEvent library.
 */
FBjqRY.event = {

	// Bind an event to an element
	// Original by Dean Edwards
	add: function( elem, types, handler, data ) {
		//if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
		//	return;
		//}

		// For whatever reason, IE has trouble passing the window object
		// around, causing it to be cloned in the process
		//if ( elem.setInterval && ( elem !== window && !elem.frameElement ) ) {
		//	elem = window;
		//}

		if ( handler === false ) handler = returnFalse;

		var handleObjIn, handleObj;

		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
		}

		// Make sure that the function being executed has a unique ID
		if ( ! handler.guid ) {
			handler.guid = FBjqRY.guid++; // @todo ?
		}

		// Init the element's event structure
		var elemData = FBjqRY.data( elem );

		// If no elemData is found then we must be trying to bind to one of the
		// banned noData elements
		if ( !elemData ) return;

		var events = elemData.events = elemData.events || {},
			eventHandle = elemData.handle;

		if ( !eventHandle ) {
			elemData.handle = eventHandle = function() {
				// Handle the second event of a trigger and when
				// an event is called after a page has unloaded
				return typeof FBjqRY !== "undefined" && !FBjqRY.event.triggered ?
					FBjqRY.event.handle.apply( eventHandle.elem, arguments ) :
					undefined;
			};
		}

		// Add elem as a property of the handle function
		// This is to prevent a memory leak with non-native events in IE.
		eventHandle.elem = elem;

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = types.split(" ");

		var type, i = 0, namespaces;

		while ( (type = types[ i++ ]) ) {
			handleObj = handleObjIn ? FBjqRY.extend({}, handleObjIn) : { handler: handler, data: data };

			// Namespaced event handlers
			if ( type.indexOf(".") > -1 ) {
				namespaces = type.split(".");
				type = namespaces.shift();
				handleObj.namespace = namespaces.slice(0).sort().join(".");

			} else {
				namespaces = [];
				handleObj.namespace = "";
			}

			handleObj.type = type;
			if ( !handleObj.guid ) {
				handleObj.guid = handler.guid;
			}

			// Get the current list of functions bound to this event
			var handlers = events[ type ], special = FBjqRY.event.special[ type ] || {};

			// Init the event handler queue
			if ( !handlers ) {
				handlers = events[ type ] = [];

				// Check for a special event handler
				// Only use addEventListener/attachEvent if the special
				// events handler returns false
				if ( ! special.setup ||
                        special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					//if (elem.addEventListener) {
						elem.addEventListener( type, eventHandle, false );
					//}
				}
			}
			
			if ( special.add ) { 
				special.add.call( elem, handleObj ); 

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add the function to the element's handler list
			handlers.push( handleObj );

			// Keep track of which events have been used, for global triggering
			FBjqRY.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	global: {},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, pos ) {
		// don't do events on text and comment nodes
		//if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
		//	return;
		//}

		if ( handler === false ) handler = returnFalse;

		var ret, type, j, i = 0, all, namespaces, namespace, special, eventType, handleObj, origType,
			elemData = FBjqRY.data( elem ),
			events = elemData && elemData.events;

		if ( !elemData || !events ) return;

		// types is actually an event object here
		if ( types && types.type ) {
			handler = types.handler;
			types = types.type;
		}

		// Unbind all events for the element
		if ( !types || typeof types === "string" && types.charAt(0) === "." ) {
			types = types || "";

			for ( type in events ) {
				FBjqRY.event.remove( elem, type + types );
			}
            
			return;
		}

		// Handle multiple events separated by a space
		// jQuery(...).unbind("mouseover mouseout", fn);
		types = types.split(" ");

		while ( (type = types[ i++ ]) ) {
			origType = type;
			handleObj = null;
			all = type.indexOf(".") < 0;
			namespaces = [];

			if ( !all ) {
				// Namespaced event handlers
				namespaces = type.split(".");
				type = namespaces.shift();

                namespace = FBjqRY.map( namespaces.slice(0).sort(), fcleanup ).join("\\.(?:.*\\.)?");
				namespace = new RegExp("(^|\\.)" + namespace + "(\\.|$)");
			}

			eventType = events[ type ];
			if ( !eventType ) continue;

			if ( !handler ) {
				for ( j = 0; j < eventType.length; j++ ) {
					handleObj = eventType[ j ];

					if ( all || namespace.test( handleObj.namespace ) ) {
						FBjqRY.event.remove( elem, origType, handleObj.handler, j );
						eventType.splice( j--, 1 );
					}
				}

				continue;
			}

			special = FBjqRY.event.special[ type ] || {};

			for ( j = pos || 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];

				if ( handler.guid === handleObj.guid ) {
					// remove the given handler for the given type
					if ( all || namespace.test( handleObj.namespace ) ) {
						if ( pos == null ) {
							eventType.splice( j--, 1 );
						}

						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}

					if ( pos != null ) break;
				}
			}

			// remove generic event handler if no more handlers exist
			if ( eventType.length === 0 || pos != null && eventType.length === 1 ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
                    if (elem.removeEventListener) {
                        elem.removeEventListener( type, elemData.handle, false );
                    }
				}

				ret = null;
				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( FBjqRY.isEmptyObject( events ) ) {
			var handle = elemData.handle;
			if ( handle ) {
				handle.elem = null;
			}

			delete elemData.events;
			delete elemData.handle;

			if ( FBjqRY.isEmptyObject( elemData ) ) {
				FBjqRY.removeData( elem );
			}
		}
	},

	// bubbling is internal
	trigger: function( event, data, elem /*, bubbling */ ) {
		// Event object or event type
		var type = event.type || event, bubbling = arguments[3];

		if ( !bubbling ) {
			event = typeof event === "object" ?
				// jQuery.Event object
				event[ FBjqRY.expando ] ? event :
				// Object literal
				FBjqRY.extend( FBjqRY.Event(type), event ) :
				// Just the event type (string)
				FBjqRY.Event(type);

			if ( type.indexOf("!") >= 0 ) {
				event.type = type = type.slice(0, -1);
				event.exclusive = true;
			}

			// Handle a global trigger
			if ( !elem ) {
				// Don't bubble custom events when global (to avoid too much overhead)
				event.stopPropagation(); // supported in FBJS

				// Only trigger if we've ever bound an event for it
				if ( FBjqRY.event.global[ type ] ) {
					FBjqRY.each( FBjqRY.cache, function() {
						if ( this.events && this.events[type] ) {
							FBjqRY.event.trigger( event, data, this.handle.elem );
						}
					});
				}
			}

			// Handle triggering a single element

			// don't do events on text and comment nodes
			//if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			//	return undefined;
			//}

			// Clean up in case it is reused
			event.result = undefined;
			event.target = elem;

			// Clone the incoming data, if any
			data = FBjqRY.makeArray( data );
			data.unshift( event );
		}

		event.currentTarget = elem;

		// Trigger the event, it is assumed that "handle" is a function
		var handle = FBjqRY.data( elem, "handle" );
		if ( handle ) handle.apply( elem, data );

		var parent = elem.getParentNode(); //|| elem.ownerDocument;

		// Trigger an inline bound script
        /*
		try {
			if ( !(elem && elem.nodeName && FBjqRY.noData[elem.getTagName().toLowerCase()]) ) {
				if ( elem[ "on" + type ] && elem[ "on" + type ].apply( elem, data ) === false ) {
					event.result = false;
				}
			}
		// prevent IE from throwing an error for some elements with some event types, see #3533
		} catch (inlineError) {} */

		if ( !event.isPropagationStopped() && parent ) { // @todo
			FBjqRY.event.trigger( event, data, parent, true );
		}
        else if ( !event.isDefaultPrevented() ) { // @todo
			var target = event.target, old, targetType = type.replace(/\..*$/, ""),
				isClick = FBjqRY.nodeName(target, "a") && targetType === "click",
				special = FBjqRY.event.special[ targetType ] || {};

			if ( (!special._default || special._default.call( elem, event ) === false) && 
				!isClick && !(target && target.getTagName && FBjqRY.noData[target.getTagName().toLowerCase()]) ) {
                /* @todo ?!
				try {
					if ( target[ targetType ] ) {
						// Make sure that we don't accidentally re-trigger the onFOO events
						old = target[ "on" + targetType ];

						if ( old ) {
							target[ "on" + targetType ] = null;
						}

						FBjqRY.event.triggered = true;
						target[ targetType ]();
					}

				// prevent IE from throwing an error for some elements with some event types, see #3533
				} catch (triggerError) {}

				if ( old ) {
					target[ "on" + targetType ] = old;
				} */

				FBjqRY.event.triggered = false;
			}
		}
	},

	handle: function( event ) {
		var all, handlers, namespaces, namespace_sort = [], namespace_re, events, 
            args = FBjqRY.makeArray( arguments );

		event = args[0] = FBjqRY.event.fix( event );
		event.currentTarget = this;

		// Namespaced event handlers
		all = event.type.indexOf(".") < 0 && !event.exclusive;

		if ( !all ) {
			namespaces = event.type.split(".");
			event.type = namespaces.shift();
			namespace_sort = namespaces.slice(0).sort();
			namespace_re = new RegExp("(^|\\.)" + namespace_sort.join("\\.(?:.*\\.)?") + "(\\.|$)");
		}

		event.namespace = event.namespace || namespace_sort.join(".");

		events = FBjqRY.data(this, "events");
		handlers = (events || {})[ event.type ];

		if ( events && handlers ) {
			// Clone the handlers to prevent manipulation
			handlers = handlers.slice(0);

			for ( var j = 0, l = handlers.length; j < l; j++ ) {
				var handleObj = handlers[ j ];

				// Filter the functions by class
				if ( all || namespace_re.test( handleObj.namespace ) ) {
					// Pass in a reference to the handler function itself
					// So that we can later remove it
					event.handler = handleObj.handler;
					event.data = handleObj.data;
					event.handleObj = handleObj;
	
					var ret = handleObj.handler.apply( this, args );

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault(); // FBJS ok
							event.stopPropagation(); // FBJS ok
						}
					}

					if ( event.isImmediatePropagationStopped() ) {
						break;
					}
				}
			}
		}

		return event.result;
	},
    /*
	props: "altKey attrChange attrName bubbles button cancelable charCode " + 
           "clientX clientY ctrlKey currentTarget data detail eventPhase fromElement " +
           "handler keyCode layerX layerY metaKey newValue offsetX offsetY " + 
           "originalTarget pageX pageY prevValue relatedNode relatedTarget " +
           "screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),
     */

	props: "target type pageX pageY ctrlKey keyCode metaKey shiftKey".split(" "), // FBJS event

	fix: function( event ) {
		if ( event[ FBjqRY.expando ] ) return event;

		// store a copy of the original event object
		// and "clone" to set read-only properties
		var originalEvent = event;
		event = FBjqRY.Event( originalEvent );

		for ( var i = this.props.length, prop; i; ) {
			prop = this.props[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary
		if ( !event.target ) {
			//event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
		}

		// check if target is a textnode (safari)
		//if ( event.target.nodeType === 3 ) {
		//	event.target = event.target.parentNode;
		//}

		// Add relatedTarget, if necessary
		//if ( !event.relatedTarget && event.fromElement ) {
		//	event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
		//}

		// Calculate pageX/Y if missing and clientX/Y available
		//if ( event.pageX == null && event.clientX != null ) {
		//	var doc = document.documentElement, body = document.body;
		//	event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
		//	event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		//}

		// Add which for key events
		if ( !event.which && event.keyCode ) {
			event.which = event.keyCode;
		}

		// Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
		if ( !event.metaKey && event.ctrlKey ) {
			event.metaKey = event.ctrlKey;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		// Note: button is not normalized, so don't use it
		//if ( !event.which && event.button !== undefined ) {
		//	event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
		//}

		return event;
	},

	// Deprecated, use jQuery.guid instead
	guid: 100000000, //1E8,

	// Deprecated, use jQuery.proxy instead
	proxy: FBjqRY.proxy,

	special: {
		//ready: {
		//	// Make sure the ready event is setup
		//	setup: jQuery.bindReady,
		//	teardown: jQuery.noop
		//},

		live: {
			add: function( handleObj ) {
				FBjqRY.event.add( this,
					liveConvert( handleObj.origType, handleObj.selector ),
					FBjqRY.extend({}, handleObj, {handler: liveHandler, guid: handleObj.handler.guid}) );
			},

			remove: function( handleObj ) {
				FBjqRY.event.remove( this, liveConvert( handleObj.origType, handleObj.selector ), handleObj );
			}
		}

        /*
		beforeunload: {
			setup: function( data, namespaces, eventHandle ) {
				// We only want to do this special case on windows
				if ( this.setInterval ) {
					this.onbeforeunload = eventHandle;
				}
			},

			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		} */
	}
};

FBjqRY.Event = function( src ) {
	// Allow instantiation without the 'new' keyword
	if ( !this.preventDefault ) {
		return new FBjqRY.Event( src );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;
	// Event type
	} else {
		this.type = src;
	}

	// timeStamp is buggy for some events on Firefox(#3843)
	// So we won't rely on the native value
	this.timeStamp = FBjqRY.now();

	// Mark it as fixed
	this[ FBjqRY.expando ] = true;
};

function returnFalse() { return false; }
function returnTrue() { return true; }

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
FBjqRY.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if ( !e ) return;
		
		// if preventDefault exists run it on the original event
		if ( e.preventDefault ) e.preventDefault();
        
		// otherwise set the returnValue property of the original event to false (IE)
		e.returnValue = false;
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if ( !e ) return;

		// if stopPropagation exists run it on the original event
		if ( e.stopPropagation ) e.stopPropagation();
        
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};

/*
// Checks if an event happened on an element within another element
// Used in jQuery.event.special.mouseenter and mouseleave handlers
var withinElement = function( event ) {
	// Check if mouse(over|out) are still within the same parent element
	var parent = event.relatedTarget;

	// Firefox sometimes assigns relatedTarget a XUL element
	// which we cannot access the parentNode property of
	try {
		// Traverse up the tree
		while ( parent && parent !== this ) {
			parent = parent.parentNode;
		}

		if ( parent !== this ) {
			// set the correct event type
			event.type = event.data;

			// handle event if we actually just moused on to a non sub-element
			jQuery.event.handle.apply( this, arguments );
		}

	// assuming we've left the element since we most likely mousedover a xul element
	} catch(e) { }
},

// In case of event delegation, we only need to rename the event.type,
// liveHandler will take care of the rest.
delegate = function( event ) {
	event.type = event.data;
	FBjqRY.event.handle.apply( this, arguments );
};

// Create mouseenter and mouseleave events
FBjqRY.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		setup: function( data ) {
			jQuery.event.add( this, fix, data && data.selector ? delegate : withinElement, orig );
		},
		teardown: function( data ) {
			jQuery.event.remove( this, fix, data && data.selector ? delegate : withinElement );
		}
	};
}); */

// submit delegation
if ( ! FBjqRY.support.submitBubbles ) { // @todo
    
	FBjqRY.event.special.submit = {
		setup: function( data, namespaces ) {
			if ( this.nodeName.toLowerCase() !== "form" ) {
				FBjqRY.event.add(this, "click.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "submit" || type === "image") &&
                        FBjqRY( elem ).closest("form").length ) {
						return trigger( "submit", this, arguments );
					}
				});
	 
				FBjqRY.event.add(this, "keypress.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "text" || type === "password") && 
                        FBjqRY( elem ).closest("form").length && e.keyCode === 13 ) {
						return trigger( "submit", this, arguments );
					}
				});

			} else {
				return false;
			}
		},

		teardown: function( namespaces ) {
			FBjqRY.event.remove( this, ".specialSubmit" );
		}
	};

}

function getSelectOptions(select) {
    return FBjqRY('option', select).nodes; // @todo fast-impl
}

// change delegation, happens here so we have bind.
if ( ! FBjqRY.support.changeBubbles ) { // @todo

	var formElems = /textarea|input|select/i,
    
    changeFilters,

	getVal = function( elem ) {
		var type = elem.getType(), val = elem.getValue();

		if ( type === "radio" || type === "checkbox" ) {
			val = elem.getChecked();
		}
        else if ( type === "select-multiple" ) {
			val = elem.getSelectedIndex() > -1 ?
				FBjqRY.map( getSelectOptions(elem), function( elem ) {
					return elem.getSelected();
				}).join("-") :
				"";
		}
        else if ( FBjqRY.nodeName(elem) === "select" ) {
			val = elem.getSelectedIndex();
		}

		return val;
	},

	testChange = function testChange( e ) {
		var elem = e.target, data, val;

		if ( !formElems.test( elem.getTagName() ) || elem.getReadOnly() ) {
			return;
		}

		data = FBjqRY.data( elem, "_change_data" );
		val = getVal(elem);

		// the current data will be also retrieved by beforeactivate
		if ( e.type !== "focusout" || elem.getType() !== "radio" ) {
			FBjqRY.data( elem, "_change_data", val );
		}
		
		if ( data === undefined || val === data ) {
			return;
		}

		if ( data != null || val ) {
			e.type = "change";
			return FBjqRY.event.trigger( e, arguments[1], elem );
		}
	};

	FBjqRY.event.special.change = {
		filters: {
			focusout: testChange, 

			click: function( e ) {
				var elem = e.target, type = elem.getType();

				if ( type === "radio" || type === "checkbox" || FBjqRY.nodeName(elem) === "select" ) {
					return testChange.call( this, e );
				}
			},

			// Change has to be called before submit
			// Keydown will be called before keypress, which is used in submit-event delegation
			keydown: function( e ) {
				var elem = e.target, type = elem.getType();

				if ( (e.keyCode === 13 && FBjqRY.nodeName(elem) !== "textarea") ||
					(e.keyCode === 32 && (type === "checkbox" || type === "radio")) ||
					type === "select-multiple" ) {
					return testChange.call( this, e );
				}
			},

			// Beforeactivate happens also before the previous element is blurred
			// with this event you can't trigger a change event, but you can store
			// information/focus[in] is not needed anymore
			beforeactivate: function( e ) {
				var elem = e.target;
				FBjqRY.data( elem, "_change_data", getVal(elem) );
			}
		},

		setup: function( data, namespaces ) {
			if ( this.type === "file" ) return false;

			for ( var type in changeFilters ) {
				FBjqRY.event.add( this, type + ".specialChange", changeFilters[type] );
			}

			return formElems.test( this.nodeName );
		},

		teardown: function( namespaces ) {
			FBjqRY.event.remove( this, ".specialChange" );

			return formElems.test( this.nodeName );
		}
	};

	changeFilters = FBjqRY.event.special.change.filters;
}

function trigger( type, elem, args ) {
	args[0].type = type;
	return FBjqRY.event.handle.apply( elem, args );
}

// Create "bubbling" focus and blur events
if ( document.addEventListener ) {
	FBjqRY.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {
		FBjqRY.event.special[ fix ] = {
			setup: function() {
				this.addEventListener( orig, handler, true );
			}, 
			teardown: function() { 
				this.removeEventListener( orig, handler, true );
			}
		};

		function handler( e ) { 
			e = FBjqRY.event.fix( e );
			e.type = fix;
			return FBjqRY.event.handle.call( this, e );
		}
	});
}

FBjqRY.each(["bind", "one"], function( i, name ) {
	FBjqRY.fn[ name ] = function( type, data, fn ) {
		// Handle object literals
		if ( typeof type === "object" ) {
			for ( var key in type ) {
				this[ name ](key, data, type[key], fn);
			}
			return this;
		}
		
		if ( FBjqRY.isFunction( data ) || data === false ) {
			fn = data;
			data = undefined;
		}

		var handler = name === "one" ? FBjqRY.proxy( fn, function( event ) {
			FBjqRY( this ).unbind( event, handler );
			return fn.apply( this, arguments );
		}) : fn;

		if ( type === "unload" && name !== "one" ) {
			this.one( type, data, fn );
		}
        else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				FBjqRY.event.add( this[i], type, handler, data );
			}
		}

		return this;
	};
});

FBjqRY.fn.extend({
	unbind: function( type, fn ) {
		// Handle object literals
		if ( typeof type === "object" && !type.preventDefault ) {
			for ( var key in type ) {
				this.unbind(key, type[key]);
			}

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				FBjqRY.event.remove( this[i], type, fn );
			}
		}

		return this;
	},
	
	delegate: function( selector, types, data, fn ) {
		return this.live( types, data, fn, selector );
	},
	
	undelegate: function( selector, types, fn ) {
		if ( arguments.length === 0 ) {
            return this.unbind( "live" );
		}
        else {
			return this.die( types, null, fn, selector );
		}
	},
	
	trigger: function( type, data ) {
		return this.each(function() {
			FBjqRY.event.trigger( type, data, this );
		});
	},

	triggerHandler: function( type, data ) {
        var node = this.nodes[0];
		if ( node ) {
			var event = FBjqRY.Event( type );
			event.preventDefault();
			event.stopPropagation();
			FBjqRY.event.trigger( event, data, node );
			return event.result;
		}
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments, i = 1;

		// link all the functions, so any of them can unbind this click handler
		while ( i < args.length ) {
			FBjqRY.proxy( fn, args[ i++ ] );
		}

		return this.click( FBjqRY.proxy( fn, function( event ) {
			// Figure out which function to execute
			var lastToggle = ( FBjqRY.data( this, "lastToggle" + fn.guid ) || 0 ) % i;
			FBjqRY.data( this, "lastToggle" + fn.guid, lastToggle + 1 );

			// Make sure that clicks stop
			event.preventDefault();

			// and execute the function
			return args[ lastToggle ].apply( this, arguments ) || false;
		}));
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

var liveMap = {
	focus: "focusin",
	blur: "focusout",
	mouseenter: "mouseover",
	mouseleave: "mouseout"
};

FBjqRY.each(["live", "die"], function( i, name ) {
	FBjqRY.fn[ name ] = function( types, data, fn, origSelector /* Internal Use Only */ ) {
		var type, i = 0, match, namespaces, preType,
			selector = origSelector || this.selector,
			context = origSelector ? this : FBjqRY( this.context );

		if ( FBjqRY.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

		types = (types || "").split(" ");

		while ( (type = types[ i++ ]) != null ) {
			match = rnamespaces.exec( type );
			namespaces = "";

			if ( match )  {
				namespaces = match[0];
				type = type.replace( rnamespaces, "" );
			}

			if ( type === "hover" ) {
				types.push( "mouseenter" + namespaces, "mouseleave" + namespaces );
				continue;
			}

			preType = type;

			if ( type === "focus" || type === "blur" ) {
				types.push( liveMap[ type ] + namespaces );
				type = type + namespaces;

			} else {
				type = (liveMap[ type ] || type) + namespaces;
			}

			if ( name === "live" ) {
				// bind live handler
				for ( var j = 0, l = context.length; j < l; j++ ) {
					FBjqRY.event.add( context[j], "live." + liveConvert( type, selector ),
						{ data: data, selector: selector, handler: fn, origType: type, origHandler: fn, preType: preType } );
				}

			} else {
				// unbind live handler
				context.unbind( "live." + liveConvert( type, selector ), fn );
			}
		}
		
		return this;
	};
});

function liveHandler( event ) {
	var stop, maxLevel, elems = [], selectors = [],
		related, match, handleObj, elem, j, i, l, data, close, namespace,
		events = FBjqRY.data( this, "events" );

	// Make sure we avoid non-left-click bubbling in Firefox (#3861)
	if ( event.liveFired === this || !events || !events.live || event.button && event.type === "click" ) {
		return;
	}

	if ( event.namespace ) {
		namespace = new RegExp("(^|\\.)" + event.namespace.split(".").join("\\.(?:.*\\.)?") + "(\\.|$)");
	}

	event.liveFired = this;

	var live = events.live.slice(0);

	for ( j = 0; j < live.length; j++ ) {
		handleObj = live[j];

		if ( handleObj.origType.replace( rnamespaces, "" ) === event.type ) {
			selectors.push( handleObj.selector );

		} else {
			live.splice( j--, 1 );
		}
	}

    throw "liveHandler() event.currentTarget not implemented !";
	match = FBjqRY( event.target ).closest( selectors, event.currentTarget ); // @todo currentTarget ?!

	for ( i = 0, l = match.length; i < l; i++ ) {
		close = match[i];

		for ( j = 0; j < live.length; j++ ) {
			handleObj = live[j];

			if ( close.selector === handleObj.selector && (!namespace || namespace.test( handleObj.namespace )) ) {
				elem = close.elem;
				related = null;

				// Those two events require additional checking
				//if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
				//	event.type = handleObj.preType;
				//	related = FBjqRY( event.relatedTarget ).closest( handleObj.selector )[0];
				//}

				if ( !related || related !== elem ) {
					elems.push({ elem: elem, handleObj: handleObj, level: close.level });
				}
			}
		}
	}

	for ( i = 0, l = elems.length; i < l; i++ ) {
		match = elems[i];

		if ( maxLevel && match.level > maxLevel ) {
			break;
		}

		event.currentTarget = match.elem;
		event.data = match.handleObj.data;
		event.handleObj = match.handleObj;

		ret = match.handleObj.origHandler.apply( match.elem, arguments );

		if ( ret === false || event.isPropagationStopped() ) {
			maxLevel = match.level;

			if ( ret === false ) stop = false;
		}
	}

	return stop;
}

var rdot = /\./g, rspace = / /g;
function liveConvert( type, selector ) {
	return (type && type !== "*" ? type + "." : "") + selector.replace(rdot, "`").replace(rspace, "&");
}

//var supportedEvents = ("blur focus focusin focusout load resize scroll unload click dblclick " +
//	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
//	"change select submit keydown keypress keyup error").split(" ");
var supportedEvents = ("blur change click dblclick error focus keydown keypress keyup load "  +
                   "mousedown mousemove mouseout mouseover mouseup resize scroll select " +
                   "submit unload").split(" ");
FBjqRY.each( supportedEvents, function( i, name ) {

	// Handle event binding
	FBjqRY.fn[ name ] = function( data, fn ) {
		if ( fn == null ) {
			fn = data;
			data = null;
		}
		return arguments.length > 0 ? this.bind( name, data, fn ) : this.trigger( name );
	};

	if ( FBjqRY.attrFn ) FBjqRY.attrFn[ name ] = true;
});

// Prevent memory leaks in IE
// Window isn't included so as not to unbind existing unload events
// More info:
//  - http://isaacschlueter.com/2006/10/msie-memory-leaks/
/*
if ( window.attachEvent && !window.addEventListener ) {
	window.attachEvent("onunload", function() {
		for ( var id in jQuery.cache ) {
			if ( jQuery.cache[ id ].handle ) {
				// Try/Catch is to handle iframes being unloaded, see #4280
				try {
					jQuery.event.remove( jQuery.cache[ id ].handle.elem );
				} catch(e) {}
			}
		}
	});
} */
var jsc = FBjqRY.now(),
	rscript = /<script(.|\s)*?\/script>/gi,
	rselectTextarea = /select|textarea/i,
	rinput = /color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week/i,
	//jsre = /\=\?(&|$)/,
	rquery = /\?/,
	rts = /(\?|&)_=.*?(&|$)/,
	//rurl = /^(\w+:)?\/\/([^\/?#]+)/,
	r20 = /%20/g,

	// Keep a copy of the old load method
	_load = FBjqRY.fn.load;

FBjqRY.fn.extend({
	load: function( url, params, callback ) {
		if ( typeof url !== "string" && _load ) {
			return _load.apply( this, arguments );
		// Don't do a request if no elements are being requested
		} else if ( !this.length ) {
			return this;
		}

		var off = url.indexOf(" ");
		if ( off >= 0 ) {
			var selector = url.slice(off, url.length);
			url = url.slice(0, off);
		}

		// Default to a GET request
		var type = "GET";

		// If the second parameter was provided
		if ( params ) {
			// If it's a function
			if ( FBjqRY.isFunction( params ) ) {
				// We assume that it's the callback
				callback = params;
				params = null;
			// Otherwise, build a param string
			} else if ( typeof params === "object" ) {
				params = FBjqRY.param( params, FBjqRY.ajaxSettings.traditional );
				type = "POST";
			}
		}

		var self = this;

		// Request the remote document
		FBjqRY.ajax({
			url: url,
			type: type,
			dataType: "html", // @todo ???
			data: params,
			complete: function( res, status ) { // @todo non sense !!!
				// If successful, inject the HTML into all the matched elements
				if ( status === "success" || status === "notmodified" ) {
					// See if a selector was specified
					self.html( selector ?
						// Create a dummy div to hold the results
						jQuery("<div />")
							// inject the contents of the document in, removing the scripts
							// to avoid any 'Permission Denied' errors in IE
							.append(res.responseText.replace(rscript, ""))

							// Locate the specified elements
							.find(selector) :

						// If not, just inject the full result
						res.responseText );
				}

				if ( callback ) {
					self.each( callback, [res.responseText, status, res] );
				}
			}
		});

		return this;
	},

	serialize: function() {
		return FBjqRY.param( this.serializeArray() );
	},
	serializeArray: function() {
		//return this.map( function() {
		//	return this.elements ? jQuery.makeArray(this.elements) : this;
		//})
        return this
		.filter(function() {
			return this.getName() && ! this.getDisabled() &&
				( this.getChecked() || rselectTextarea.test(this.getTagName()) ||
					rinput.test(this.getType()) );
		})
		.map(function() {
			var val = FBjqRY(this).val();
            if (val == null) return null;
            var name = this.getName();

            if ( FBjqRY.isArray(val) ) {
                var ret = [];
                for ( var i = 0; i < val.length; i++ ) {
                    ret.push( { name: name, value: val[i] } );
                }
                return ret;
            }
            else {
                return { name: name, value: val };
            }
		}).get();
	}
});

// Attach a bunch of functions for handling common AJAX events
FBjqRY.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function( i, o ) {
	FBjqRY.fn[o] = function( f ) {
		return this.bind(o, f);
	};
});

FBjqRY.extend({
	get: function( url, data, callback, type ) {
		// shift arguments if data argument was ommited
		if ( FBjqRY.isFunction( data ) ) {
			type = type || callback;
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

	getScript: function( url, callback ) {
		//return jQuery.get(url, null, callback, "script");
        return FBjqRY.error("getScript() not supported");
	},

	getJSON: function( url, data, callback ) {
        //return jQuery.get(url, data, callback, "json");
		return FBjqRY.get(url, data, callback, Ajax.JSON);
	},
    
	post: function( url, data, callback, type ) {
		if ( FBjqRY.isFunction( data ) ) {
			type = type || callback;
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

//	ajaxSettings: {
//		url: location.href,
//		global: true,
//		type: "GET",
//		contentType: "application/x-www-form-urlencoded",
//		processData: true,
//		async: true,
//		/*
//		timeout: 0,
//		data: null,
//		username: null,
//		password: null,
//		traditional: false,
//		*/
//		// Create the request object; Microsoft failed to properly
//		// implement the XMLHttpRequest in IE7 (can't request local files),
//		// so we use the ActiveXObject when it is available
//		// This function can be overriden by calling jQuery.ajaxSetup
//		xhr: window.XMLHttpRequest && (window.location.protocol !== "file:" || !window.ActiveXObject) ?
//			function() {
//				return new window.XMLHttpRequest();
//			} :
//			function() {
//				try {
//					return new window.ActiveXObject("Microsoft.XMLHTTP");
//				} catch(e) {}
//			},
//		accepts: {
//			xml: "application/xml, text/xml",
//			html: "text/html",
//			script: "text/javascript, application/javascript",
//			json: "application/json, text/javascript",
//			text: "text/plain",
//			_default: "*/*"
//		}
//	},

	ajax: function( origSettings ) {
		var options = FBjqRY.extend(true, {}, FBjqRY.ajaxSettings, origSettings),
			type = options.type.toUpperCase();

		options.context = origSettings && origSettings.context || options;

		// convert data if not already a string
		if ( options.data && options.processData && typeof options.data !== "string" ) {
			options.data = FBjqRY.param( options.data, options.traditional );
		}

		if ( options.cache === false && type === "GET" ) {
			var ts = FBjqRY.now();
			// try replacing _= if it is there
			var ret = options.url.replace(rts, "$1_=" + ts + "$2");
			// if nothing was replaced, add timestamp to the end
			options.url = ret + ((ret === options.url) ? (rquery.test(options.url) ? "&" : "?") + "_=" + ts : "");
		}

		// If data is available, append data to url for get requests
		if ( options.data && type === "GET" ) {
			options.url += (rquery.test(options.url) ? "&" : "?") + options.data;
		}

		// Watch for a new set of requests
		if ( options.global && FBjqRY.ajax.active++ === 0 ) {
			FBjqRY.event.trigger( "ajaxStart" ); // @todo
		}

		// Matches an absolute URL, and saves the domain
		//var parts = rurl.exec( s.url ),
		//	remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);

        var ajax = new Ajax();
        ajax.responseType = options.dataType;
        ajax.ondone = function( data ) {
            //options.success();
            FBjqRY.ajax.handleSuccess( options, ajax, data );
            // Fire the complete handlers
            FBjqRY.ajax.handleComplete( options, ajax, data );
        };
        ajax.onerror = function() {
            var retryCount = options.retryCount || 0;
            FBjqRY.log("ajax() error occurred, retrying ...");
            if ( retryCount-- > 0 ) {
                options.retryCount = retryCount;
                FBjqRY.ajax(options);
            }
            else {
                FBjqRY.ajax.handleError(options, ajax, null);
                // Fire the complete handlers
                FBjqRY.ajax.handleComplete( options, ajax, undefined);
            }
        };
		try {
			ajax.post(options.url, options.data);
		}
        catch(e) {
			FBjqRY.ajax.handleError(options, ajax, e);
            // Fire the complete handlers
            FBjqRY.ajax.handleComplete( options, ajax, undefined);
		}

		// Allow custom headers/mimetypes and early abort
        // @todo ?!
//		if ( s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false ) {
//			// Handle the global AJAX counter
//			if ( s.global && FBjqRY.ajax.active-- === 1 ) {
//				FBjqRY.event.trigger( "ajaxStop" ); // @todo
//			}
//			// close opended socket
//			xhr.abort();
//			return false;
//		}

		if ( options.global ) {
			FBjqRY.ajax.triggerGlobal( options, "ajaxSend", [ajax, options] );
		}

		// return XMLHttpRequest to allow aborting the request etc.
		return ajax;
	},

	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( array, traditional ) {
		var s = [], add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = FBjqRY.isFunction(value) ? value() : value;
			s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		};
		
		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = FBjqRY.ajaxSettings.traditional;
		}
		
		// If an array was passed in, assume that it is an array of form elements.
		if ( FBjqRY.isArray(array) || array.jquery ) {
            if ( array.jquery ) array = array.nodes;
			// Serialize the form elements
			FBjqRY.each( array, function() {
				add( this.name, this.value );
			});
		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( var prefix in array ) {
				buildParams( prefix, array[prefix], traditional, add );
			}
		}

		// Return the resulting serialization
		return s.join("&").replace(r20, "+");
	}
});

var req = /=/g, rand = /&/g;
function encodeURIComponent(str) {
    if ( typeof(str) === "string" ) {
        return str.replace(req,'%3D').replace(rand,'%26');
    }
    // checkboxes and radio buttons return objects instead of a string
    else if( typeof(str) === "object" ){
        for (var i in str) {
            return str[i].replace(req,'%3D').replace(rand,'%26');
        }
    }
}

function buildParams( prefix, obj, traditional, add ) {
	if ( FBjqRY.isArray(obj) ) {
		// Serialize array item.
		FBjqRY.each( obj, function( i, v ) {
			if ( traditional || /\[\]$/.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );
			} else {
				// If array item is non-scalar (array or object), encode its
				// numeric index to resolve deserialization ambiguity issues.
				// Note that rack (as of 1.0.0) can't currently deserialize
				// nested arrays properly, and attempting to do so may cause
				// a server error. Possible fixes are to modify rack's
				// deserialization algorithm or to provide an option or flag
				// to force array serialization to be shallow.
				buildParams( prefix + "[" + ( typeof v === "object" || FBjqRY.isArray(v) ? i : "" ) + "]", v, traditional, add );
			}
		});
			
	} else if ( !traditional && obj != null && typeof obj === "object" ) {
		// Serialize object item.
		FBjqRY.each( obj, function( k, v ) {
			buildParams( prefix + "[" + k + "]", v, traditional, add );
		});
					
	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

var ajaxExtend;
FBjqRY.extend( FBjqRY.ajax, ajaxExtend = {

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	//lastModified: {},
	//etag: {},

	handleError: function( s, xhr, status, e ) {
		// If a local callback was specified, fire it
		if ( s.error ) {
			s.error.call( s.context, xhr, status, e );
		}

		// Fire the global callback
		if ( s.global ) {
			jQuery.ajax.triggerGlobal( s, "ajaxError", [xhr, s, e] );
		}
	},

	handleSuccess: function( s, xhr, status, data ) {
		// If a local callback was specified, fire it and pass it the data
		if ( s.success ) {
			s.success.call( s.context, data, status, xhr );
		}

		// Fire the global callback
		if ( s.global ) {
			jQuery.ajax.triggerGlobal( s, "ajaxSuccess", [xhr, s] );
		}
	},

	handleComplete: function( s, xhr, status ) {
		// Process result
		if ( s.complete ) {
			s.complete.call( s.context, xhr, status );
		}

		// The request was completed
		if ( s.global ) {
			jQuery.ajax.triggerGlobal( s, "ajaxComplete", [xhr, s] );
		}

		// Handle the global AJAX counter
		if ( s.global && jQuery.ajax.active-- === 1 ) {
			jQuery.event.trigger( "ajaxStop" );
		}
	},
		
	triggerGlobal: function( s, type, args ) {
		(s.context && s.context.url == null ? jQuery(s.context) : jQuery.event).trigger(type, args);
	}
});

// For backwards compatibility
//FBjqRY.extend( FBjqRY.ajax );
FBjqRY.extend( ajaxExtend );
var elemdisplay = {},
	rfxtypes = /toggle|show|hide/,
	rfxnum = /^([+\-]=)?([\d+.\-]+)(.*)$/,
	timerId,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	];

FBjqRY.fn.extend({
	show: function(speed, callback){
        if (FBjqRY.isFunction(speed) && ! callback) {
            callback = speed;
            speed = null;
        }

		if ( speed ) {
			return this.animate( genFx("show", 3), speed, callback); // @todo genFx
		}
        else {
            var i, len = this.length, node;
			for ( i = 0; i < len; i++ ){
                node = this.nodes[i];
				var old = FBjqRY.data(node, "olddisplay");
				node.setStyle('display', old || "");

				if ( jQuery.css(node, "display") === "none" ) {
					var tagName = node.getTagName(), display;

					if ( elemdisplay[ tagName ] ) {
						display = elemdisplay[ tagName ];
					}
                    else {
                        var body = document.getRootElement();
						var elem = FBjqRY("<" + tagName + " />").appendTo(body);

						display = elem.css("display");
						if ( display === "none" ) display = "block";

						elem.remove();

						elemdisplay[ tagName ] = display;
					}
					FBjqRY.data(node, "olddisplay", display);
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < len; i++ ) {
                node = this.nodes[i];
                node.setStyle('display', FBjqRY.data(node, "olddisplay") || "");
			}

			return this;
		}
	},
	hide: function(speed, callback) {
        if (FBjqRY.isFunction(speed) && ! callback) {
            callback = speed;
            speed = null;
        }

		if ( speed ) {
			return this.animate( genFx("hide", 3), speed, callback); // @todo genFx
		}
        else {
            var i, len = this.length, node;
			for ( i = 0; i < len; i++ ) {
                node = this.nodes[i];
				var old = FBjqRY.data(node, "olddisplay");
				if ( ! old && old !== "none" ) {
                    FBjqRY.data(node, "olddisplay", FBjqRY.css(node, "display"));
                }
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( i = 0; i < len; i++ ) {
                node = this.nodes[i];
                node.setStyle('display', 'none');
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: FBjqRY.fn.toggle, // from event.js

	toggle: function( fn, fn2 ) {
		var bool = typeof fn === "boolean";

		if ( FBjqRY.isFunction(fn) && FBjqRY.isFunction(fn2) ) {
			this._toggle.apply( this, arguments );

		} else if ( fn == null || bool ) {
			this.each(function() {
				var state = bool ? fn : FBjqRY(this).is(":hidden");
				FBjqRY(this)[ state ? "show" : "hide" ]();
			});

		} else {
			this.animate(genFx("toggle", 3), fn, fn2);
		}

		return this;
	},

	fadeTo: function( speed, to, callback ) {
        //return this.animate({ opacity: to }, speed, null, callback);
		return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, callback);
	},

    animate: function( params, speed, easing, callback, neitherShowHide ) {
        var parseSpeed = function(speed) { // @todo FBjqRY.speed || fx.speeds ?
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

        speed = parseSpeed(speed);
        var hide = (neitherShowHide == 2);
        var show = (neitherShowHide == 1);

        var animObj = function(n) {
            var obj = Animation(n).duration(speed); // FB Animation
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
        if (callback) setTimeout(callback, speed);
        return this;
    },
    /*
	animate: function( prop, speed, easing, callback ) {
		var optall = FBjqRY.speed(speed, easing, callback);

		if ( FBjqRY.isEmptyObject( prop ) ) {
			return this.each( optall.complete );
		}

		return this[ optall.queue === false ? "each" : "queue" ](function() {
			var opt = FBjqRY.extend({}, optall), p,
				hidden = FBjqRY(this).is(":hidden"),
				self = this;

			for ( p in prop ) {
				var name = p.replace(rdashAlpha, fcamelCase);

				if ( p !== name ) {
					prop[ name ] = prop[ p ];
					delete prop[ p ];
					p = name;
				}

				if ( prop[p] === "hide" && hidden || prop[p] === "show" && !hidden ) {
					return opt.complete.call(this);
				}

				if ( ( p === "height" || p === "width" ) && this.style ) {
					// Store display property
					opt.display = FBjqRY.css(this, "display");
					// Make sure that nothing sneaks out
					opt.overflow = this.getStyle('overflow');
				}

				if ( FBjqRY.isArray( prop[p] ) ) {
					// Create (if needed) and add to specialEasing
					(opt.specialEasing = opt.specialEasing || {})[p] = prop[p][1];
					prop[p] = prop[p][0];
				}
			}

			if ( opt.overflow != null ) {
				this.setStyle('overflow', "hidden");
			}

			opt.curAnim = FBjqRY.extend({}, prop);

			FBjqRY.each( prop, function( name, val ) {
				var e = new FBjqRY.fx( self, opt, name );

				if ( rfxtypes.test(val) ) {
					e[ val === "toggle" ? hidden ? "show" : "hide" : val ]( prop );

				} else {
					var parts = rfxnum.exec(val),
						start = e.cur(true) || 0;

					if ( parts ) {
						var end = parseFloat( parts[2] ),
							unit = parts[3] || "px";

						// We need to compute starting value
						if ( unit !== "px" ) {
							self.setStyle( name, (end || 1) + unit );
							start = ((end || 1) / e.cur(true)) * start;
							self.setStyle( name, start + unit );
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] ) {
							end = ((parts[1] === "-=" ? -1 : 1) * end) + start;
						}

						e.custom( start, end, unit );

					} else {
						e.custom( start, val, "" );
					}
				}
			});

			// For JS strict compliance
			return true;
		});
	}, */

    stop: function( clearQueue, gotoEnd ) {
        each(this.nodes, function() { 
            Animation(this).stop();
        });
    }

    /*
	stop: function( clearQueue, gotoEnd ) {
		var timers = jQuery.timers;

		if ( clearQueue ) {
			this.queue([]);
		}

		this.each(function() {
			// go in reverse order so anything added to the queue during the loop is ignored
			for ( var i = timers.length - 1; i >= 0; i-- ) {
				if ( timers[i].elem === this ) {
					if (gotoEnd) {
						// force the next step to be the last
						timers[i](true);
					}

					timers.splice(i, 1);
				}
			}
		});

		// start the next in the queue if the last step wasn't forced
		if ( !gotoEnd ) {
			this.dequeue();
		}

		return this;
	} */

    /*
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
    } */

});

function genFx( type, num ){
	var obj = {};
	FBjqRY.each( fxAttrs.concat.apply( [], fxAttrs.slice(0, num) ), function() {
		obj[ this ] = type;
	});
	return obj;
}

// Generate shortcuts for custom animations
FBjqRY.each({ // @todo do these work correctly with FB Animation ?
	slideDown: genFx("show", 1),
	slideUp: genFx("hide", 1),
	slideToggle: genFx("toggle", 1),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" }
}, function( name, props ) {
	FBjqRY.fn[ name ] = function( speed, callback ) {
		return this.animate( props, speed, callback );
	};
});

FBjqRY.extend({
	speed: function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? speed : {
			complete: fn || !fn && easing || FBjqRY.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !FBjqRY.isFunction(easing) && easing
		};

		opt.duration = FBjqRY.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			FBjqRY.fx.speeds[opt.duration] || FBjqRY.fx.speeds._default;

		// Queueing
		opt.old = opt.complete;
		opt.complete = function() {
			if ( opt.queue !== false ) {
				FBjqRY(this).dequeue();
			}
			if ( FBjqRY.isFunction( opt.old ) ) {
				opt.old.call( this );
			}
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ) {
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		if ( !options.orig ) options.orig = {};
	}

});

/* @todo except for this.elem[this.prop] it should work !!!
FBjqRY.fx.prototype = {
	// Simple function for setting a style value
	update: function(){
		if ( this.options.step ) this.options.step.call( this.elem, this.now, this );

		(FBjqRY.fx.step[this.prop] || FBjqRY.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( this.prop == "height" || this.prop == "width" ) {
			this.elem.setStyle('display', "block");
        }
	},
    
	// Get the current size
	cur: function( force ) {
		if ( this.elem[this.prop] != null && (this.elem.getStyle(this.prop) == null) ) {
			return this.elem[ this.prop ];
		}

		var r = parseFloat(FBjqRY.css(this.elem, this.prop, force));
		return r && r > -10000 ? r : parseFloat(FBjqRY.curCSS(this.elem, this.prop)) || 0;
	},

	// Start an animation from one number to another
	custom: function( from, to, unit ) {
		this.startTime = jQuery.now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;

		var self = this;
		function t( gotoEnd ) {
			return self.step(gotoEnd);
		}

		t.elem = this.elem;

		if ( t() && FBjqRY.timers.push(t) && !timerId ) {
			timerId = setInterval(FBjqRY.fx.tick, 13);
		}
	},

	// Simple 'show' function
	show: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = FBjqRY.style( this.elem, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		this.custom(this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur());

		// Start by showing the element
		FBjqRY( this.elem ).show();
	},

	// Simple 'hide' function
	hide: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = FBjqRY.style( this.elem, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function( gotoEnd ) {
		var t = FBjqRY.now(), done = true;

		if ( gotoEnd || t >= this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			for ( var i in this.options.curAnim ) {
				if ( this.options.curAnim[i] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.setStyle('overflow', this.options.overflow);

					// Reset the display
					var old = FBjqRY.data(this.elem, "olddisplay");
					this.elem.setStyle('display', old ? old : this.options.display);

					if ( FBjqRY.css(this.elem, "display") === "none" ) {
                        this.elem.setStyle('display', "block");
					}
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide ) {
					FBjqRY(this.elem).hide();
				}

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show ) {
					for ( var p in this.options.curAnim ) {
						FBjqRY.style(this.elem, p, this.options.orig[p]);
					}
				}

				// Execute the complete function
				this.options.complete.call( this.elem );
			}

			return false;

		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			var specialEasing = this.options.specialEasing && this.options.specialEasing[this.prop];
			var defaultEasing = this.options.easing || (FBjqRY.easing.swing ? "swing" : "linear");
			this.pos = FBjqRY.easing[specialEasing || defaultEasing](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}
};

FBjqRY.extend( FBjqRY.fx, {
	tick: function() {
		var timers = FBjqRY.timers;

		for ( var i = 0; i < timers.length; i++ ) {
			if ( !timers[i]() ) timers.splice(i--, 1);
		}

		if ( !timers.length ) FBjqRY.fx.stop();
	},
		
	stop: function() {
		clearInterval( timerId );
		timerId = null;
	},
	
	speeds: {
		slow: 600,
		fast: 200,
		// Default speed
		_default: 400
	},

	step: {
		opacity: function( fx ) {
			FBjqRY.style(fx.elem, "opacity", fx.now);
		},

		_default: function( fx ) {
			if ( fx.elem.getStyle && fx.elem.getStyle(fx.prop) != null ) {
				fx.elem.setStyle( fx.prop, (fx.prop === "width" || fx.prop === "height" ? Math.max(0, fx.now) : fx.now) + fx.unit );
			} else {
				fx.elem[ fx.prop ] = fx.now;
			}
		}
	}
}); */

if ( FBjqRY.expr && FBjqRY.expr.filters ) {
	FBjqRY.expr.filters.animated = function( elem ) {
		return FBjqRY.grep(FBjqRY.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
//if ( "getBoundingClientRect" in document.documentElement ) {
//	jQuery.fn.offset = function( options ) {
//		var elem = this[0];
//
//		if ( options ) {
//			return this.each(function( i ) {
//				jQuery.offset.setOffset( this, options, i );
//			});
//		}
//
//		if ( !elem || !elem.ownerDocument ) {
//			return null;
//		}
//
//		if ( elem === elem.ownerDocument.body ) {
//			return jQuery.offset.bodyOffset( elem );
//		}
//
//		var box = elem.getBoundingClientRect(),
//			doc = elem.ownerDocument,
//			body = doc.body,
//			docElem = doc.documentElement,
//			win = getWindow(doc),
//			clientTop  = docElem.clientTop  || body.clientTop  || 0,
//			clientLeft = docElem.clientLeft || body.clientLeft || 0,
//			scrollTop  = (win.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop ),
//			scrollLeft = (win.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft),
//			top  = box.top  + scrollTop  - clientTop,
//			left = box.left + scrollLeft - clientLeft;
//
//		return { top: top, left: left };
//	};
//
//} else {

FBjqRY.fn.offset = function( options ) {
    var node = this.nodes[0];

    if ( options ) {
        return this.each(function( i ) {
            FBjqRY.offset.setOffset( this, options, i );
        });
    }

    if ( ! node /* || ! node.ownerDocument */ ) return null;

    //if ( /*node === node.ownerDocument.body*/
    //    FBjqRY.fbjs.sameNode(node, document.getRootElement()) ) {
    //    return FBjqRY.offset.bodyOffset( node );
    //}

    //FBjqRY.offset.initialize();

    return { top: node.getAbsoluteTop(), left: node.getAbsoluteLeft() };

//    var offsetParent = elem.offsetParent, prevOffsetParent = elem,
//        doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
//        body = doc.body, defaultView = doc.defaultView,
//        prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
//        top = elem.offsetTop, left = elem.offsetLeft;
//
//    while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
//        if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
//            break;
//        }
//
//        computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
//        top  -= elem.scrollTop;
//        left -= elem.scrollLeft;
//
//        if ( elem === offsetParent ) {
//            top  += elem.offsetTop;
//            left += elem.offsetLeft;
//
//            if ( jQuery.offset.doesNotAddBorder && !(jQuery.offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.nodeName)) ) {
//                top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
//                left += parseFloat( computedStyle.borderLeftWidth ) || 0;
//            }
//
//            prevOffsetParent = offsetParent;
//            offsetParent = elem.offsetParent;
//        }
//
//        if ( jQuery.offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
//            top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
//            left += parseFloat( computedStyle.borderLeftWidth ) || 0;
//        }
//
//        prevComputedStyle = computedStyle;
//    }
//
//    if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
//        top  += body.offsetTop;
//        left += body.offsetLeft;
//    }
//
//    if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
//        top  += Math.max( docElem.scrollTop, body.scrollTop );
//        left += Math.max( docElem.scrollLeft, body.scrollLeft );
//    }
//
//    return { top: top, left: left };
};

FBjqRY.offset = {
	initialize: function() {
		var body = document.getRootElement(), div = document.createElement("div"),
            innerDiv, checkDiv, table, td, bodyMarginTop = parseFloat( FBjqRY.curCSS(body, "marginTop", true) ) || 0,
			html = "<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'>" +
                   "<div></div></div>";
            //<table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>

		div.setStyle( { position: "absolute", top: 0, left: 0, margin: 0, border: 0, width: "1px", height: "1px", visibility: "hidden" } );

		div.setInnerXHTML(html);
		body.insertBefore( div, body.getFirstChild() );
		innerDiv = div.getFirstChild();
		checkDiv = innerDiv.getFirstChild();
		//td = innerDiv.nextSibling.firstChild.firstChild;

		this.doesNotAddBorder = (checkDiv.getOffsetTop() !== 5);
		//this.doesAddBorderForTableAndCells = (td.offsetTop === 5); // @todo

		checkDiv.setStyle('position', "fixed");
		checkDiv.setStyle('top', "20px");

		// safari subtracts parent border width here which is 5px
		this.supportsFixedPosition = (checkDiv.getOffsetTop() === 20 || checkDiv.getOffsetTop() === 15);
		checkDiv.setStyle('position', "");
        checkDiv.setStyle('top', "");

		innerDiv.setStyle('overflow', "hidden");
		innerDiv.setStyle('position', "relative");

		this.subtractsBorderForOverflowNotVisible = (checkDiv.getOffsetTop() === -5);

		this.doesNotIncludeMarginInBodyOffset = (body.getOffsetTop() !== bodyMarginTop);

		body.removeChild( div );
		body = div = innerDiv = checkDiv = table = td = null;
		FBjqRY.offset.initialize = FBjqRY.noop;
	},

    /*
	bodyOffset: function( body ) {
		var top = body.getOffsetTop(), left = body.getOffsetLeft();

		FBjqRY.offset.initialize();

		if ( FBjqRY.offset.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat( FBjqRY.curCSS(body, "marginTop",  true) ) || 0;
			left += parseFloat( FBjqRY.curCSS(body, "marginLeft", true) ) || 0;
		}

		return { top: top, left: left };
	}, */
	
	setOffset: function( elem, options, i ) {
		var position = FBjqRY.curCSS( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.setStyle('position', "relative");
		}

		var curElem    = FBjqRY( elem ),
			curOffset  = curElem.offset(),
			curCSSTop  = FBjqRY.curCSS( elem, "top", true ),
			curCSSLeft = FBjqRY.curCSS( elem, "left", true ),
			calculatePosition = (position === "absolute" && FBjqRY.inArray('auto', [curCSSTop, curCSSLeft]) > -1),
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is absolute
		if ( calculatePosition ) {
			curPosition = curElem.position();
		}

		curTop  = calculatePosition ? curPosition.top  : parseInt( curCSSTop,  10 ) || 0;
		curLeft = calculatePosition ? curPosition.left : parseInt( curCSSLeft, 10 ) || 0;

		if ( FBjqRY.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if (options.top != null) {
			props.top = (options.top - curOffset.top) + curTop;
		}
		if (options.left != null) {
			props.left = (options.left - curOffset.left) + curLeft;
		}
		
		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


FBjqRY.fn.extend({
	position: function() {
        var elem = this.nodes[0];
		if ( ! elem ) return null;

		// Get *real* offsetParent
		var offsetParent = this.offsetParent(),
		// Get correct offsets
		offset       = this.offset(),
		parentOffset = /* ^body|html$/i.test(offsetParent[0].getNodeName()) ? { top: 0, left: 0 } :*/ offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top  -= parseFloat( FBjqRY.curCSS(elem, "marginTop",  true) ) || 0;
		offset.left -= parseFloat( FBjqRY.curCSS(elem, "marginLeft", true) ) || 0;

		// Add offsetParent borders
		parentOffset.top  += parseFloat( FBjqRY.curCSS(offsetParent[0], "borderTopWidth",  true) ) || 0;
		parentOffset.left += parseFloat( FBjqRY.curCSS(offsetParent[0], "borderLeftWidth", true) ) || 0;

		// Subtract the two offsets
		return {
			top:  offset.top  - parentOffset.top,
			left: offset.left - parentOffset.left
		};
	},

	offsetParent: function() {
		return this.map(function() {
            var root = document.getRootElement(); //sameNode = FBjqRY.fbjs.sameNode;
			var offsetParent = this.getParentNode(); //this.offsetParent || document.body;
            var position = FBjqRY.css(offsetParent, "position");
            
			while ( ( offsetParent &&
                /* (!/^body|html$/i.test(offsetParent.nodeName) */
                ! sameNode(root, offsetParent) &&
                position === "static" ) ||
                // we'll have to search for the offsetParent ourselves in FBJS :
                ( position !== "absolute" && position !== "relative" ) ) {

				offsetParent = offsetParent.getParentNode();
                position = FBjqRY.css(offsetParent, "position");
			}
			return offsetParent || root;
		});
	}
});


// Create scrollLeft and scrollTop methods
FBjqRY.each( ["Left", "Top"], function( i, name ) {
	var getter = "getScroll" + name;
    var setter = "setScroll" + name;
    var method = "scroll" + name;

	FBjqRY.fn[ method ] = function(val) {
		var elem = this.nodes[0], win;
		if ( ! elem ) return null;

		if ( val !== undefined ) {
			// Set the scroll offset
			return this.each(function() {
				win = getWindow( this );
				if ( win ) { // not implemented
					win.scrollTo(
						!i ? val : FBjqRY(win).scrollLeft(),
						 i ? val : FBjqRY(win).scrollTop()
					);
				}
                else {
					this[ setter ](val);
				}
			});
		}
        else {
			win = getWindow( elem );
            if ( win ) { // not implemented
                return ("pageXOffset" in win) ?
                            win[ i ? "pageYOffset" : "pageXOffset" ] :
                                FBjqRY.support.boxModel && win.document.documentElement[ method ] ||
                                    win.document.body[ method ]
            }
            else {
                // Return the scroll offset
                return elem[ getter ]();
            }
		}
	};
});

function getWindow( elem ) {
    return null; // not supported in FBJS !
//	return ("scrollTo" in elem && elem.document) ?
//		elem :
//		elem.nodeType === 9 ?
//			elem.defaultView || elem.parentWindow :
//			false;
}
})();
//set $ and jQuery to be shortcuts to FBjqRY
var jQuery = FBjqRY, $ = FBjqRY;