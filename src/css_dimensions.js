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
		//if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
		//	return undefined;
		//}

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
