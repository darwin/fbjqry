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
