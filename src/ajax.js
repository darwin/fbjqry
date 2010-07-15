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
