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

FBjqRY.fx.prototype = {
	// Simple function for setting a style value
	update: function() {
        var self = this;
		if ( self.options.step ) self.options.step.call( self.elem, self.now, this );

        var prop = self.prop;
		(FBjqRY.fx.step[prop] || FBjqRY.fx.step._default)( self );

		// Set display property to block for height/width animations
		if ( prop == "height" || prop == "width" ) {
			self.elem.setStyle('display', "block");
        }
	},
    
	// Get the current size
	cur: function( force ) {
        var self = this;
        var elem = self.elem, prop = self.prop;
        //var elemProp = elem[ prop ]; // @todo
        var elemProp = FBjqRY.attr(elem, prop); // @todo
		if ( elemProp != null && (elem.getStyle(prop) == null) ) {
			return elemProp;
		}

		var r = parseFloat( FBjqRY.css(elem, prop, force) );
		return r && r > -10000 ? r : parseFloat( FBjqRY.curCSS(elem, prop) ) || 0;
	},

	// Start an animation from one number to another
	custom: function( from, to, unit ) {
        var self = this;
		self.startTime = FBjqRY.now();
		self.start = from;
		self.end = to;
		self.unit = unit || self.unit || "px";
		self.now = self.start;
		self.pos = self.state = 0;

		function t( gotoEnd ) {
			return self.step(gotoEnd);
		}

		t.elem = self.elem;

		if ( t() && FBjqRY.timers.push(t) && !timerId ) {
			timerId = setInterval( FBjqRY.fx.tick, 13 );
		}
	},

	// Simple 'show' function
	show: function() {
        var self = this;
        var elem = self.elem, prop = self.prop;
		// Remember where we started, so that we can go back to it later
		self.options.orig[ prop ] = FBjqRY.style( elem, prop );
		self.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		self.custom(prop === "width" || prop === "height" ? 1 : 0, self.cur());

		// Start by showing the element
		FBjqRY( elem ).show();
	},

	// Simple 'hide' function
	hide: function() {
        var self = this;
        var elem = self.elem, prop = self.prop;
		// Remember where we started, so that we can go back to it later
		self.options.orig[ prop ] = FBjqRY.style( elem, prop );
		self.options.hide = true;

		// Begin the animation
		self.custom( self.cur(), 0 );
	},

	// Each step of an animation
	step: function( gotoEnd ) {
        var self = this;
        var options = self.options, elem = self.elem;
        
		var t = FBjqRY.now(), done = true;

		if ( gotoEnd || t >= options.duration + self.startTime ) {
			self.now = self.end;
			self.pos = self.state = 1;
			self.update();
            
			options.curAnim[ self.prop ] = true;

			for ( var i in options.curAnim ) {
				if ( options.curAnim[i] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				if ( options.display != null ) {
					// Reset the overflow
					elem.setStyle('overflow', options.overflow);

					// Reset the display
					var old = FBjqRY.data(elem, "olddisplay");
					elem.setStyle('display', old ? old : options.display);

					if ( FBjqRY.css(elem, "display") === "none" ) {
                        elem.setStyle('display', "block");
					}
				}

				// Hide the element if the "hide" operation was done
				if ( options.hide ) FBjqRY(elem).hide();

				// Reset the properties, if the item has been hidden or shown
				if ( options.hide || options.show ) {
					for ( var p in options.curAnim ) {
						FBjqRY.style( elem, p, options.orig[p] );
					}
				}

				// Execute the complete function
				options.complete.call( elem );
			}

			return false;

		} else {
			var n = t - self.startTime;
			self.state = n / options.duration;

			// Perform the easing function, defaults to swing
			var specialEasing = options.specialEasing && options.specialEasing[ self.prop ];
			var defaultEasing = options.easing || ( FBjqRY.easing.swing ? "swing" : "linear" );
			self.pos = FBjqRY.easing[ specialEasing || defaultEasing ](self.state, n, 0, 1, options.duration);
			self.now = self.start + ((self.end - self.start) * self.pos);

			// Perform the next step of the animation
			self.update();
		}

		return true;
	}
};

FBjqRY.extend( FBjqRY.fx, {
	tick: function() {
		var timers = FBjqRY.timers;

		for ( var i = 0; i < timers.length; i++ ) {
			if ( ! timers[i]() ) timers.splice(i--, 1);
		}

		if ( ! timers.length ) FBjqRY.fx.stop();
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
            var elem = fx.elem, prop = fx.prop;
			if ( elem.getStyle && elem.getStyle(prop) != null ) {
				elem.setStyle( prop, (prop === "width" || prop === "height" ? Math.max(0, fx.now) : fx.now) + fx.unit );
			} 
            else {
				elem[ fx.prop ] = fx.now; // @todo ?
			}
		}
	}
});

if ( FBjqRY.expr && FBjqRY.expr.filters ) {
	FBjqRY.expr.filters.animated = function( elem ) {
		return FBjqRY.grep(FBjqRY.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
