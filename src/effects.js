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
