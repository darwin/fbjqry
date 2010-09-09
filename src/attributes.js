var rclass = /[\n\t]/g,
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
