//var windowData = {};
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

});