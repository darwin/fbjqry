// Use the correct document accordingly with window argument (sandbox)
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
        this.context = context; // || document; // NOTE: does not make sense with FBJS ...
        this.length = this.nodes.length;
        return this;
    },

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "0.6.0-SNAPSHOT", //"@VERSION",

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
var nextId = 1;
FBjqRY.fbjs = { // NOTE: needs to be defined before extend is first used !
    //nextId: 1,
    // NOTE: __instance is not 100% reliable e.g. testSiblingClassTagSelector fails
    // having the same elements matched with a different __instance identifier !
    getNodeId: function(node, dontGenerate) {
        // __instance is a unique identifier for FBDOM nodes
        //return node && node.__instance;
        if ( node && node.getId ) {
            var nodeId = node.getId();
            if ( ! nodeId && ! dontGenerate ) {
                nodeId = '_FBjqRY_generated-' + nextId++; //FBjqRY.fbjs.nextId++;
                node.setId( nodeId );
            }
            return nodeId;
        }
        return undefined; //return node;
    },
    isNode: function(node) {
        return node && (node.__instance || node.__instance === 0);
    },
    sameNode: function(node1, node2) {
        if ( node1 === node2 ) return true;
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

	error: function( /* msg */ ) {
        FBjqRY.log.apply(this, arguments);
		//throw msg;
        throw arguments.join('');
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
			return FBjqRY.error("parseJSON() invalid JSON: ", data);
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
            else if ( proxy && ! FBjqRY.isFunction( proxy ) ) {
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
			proxy.guid = fn.guid = fn.guid || proxy.guid || FBjqRY.guid++;
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
