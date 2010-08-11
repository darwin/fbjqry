var rnamespaces = /\.(.*)$/,
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

    global: {},

	// Bind an event to an element
	// Original by Dean Edwards
	add: function( elem, types, handler, data ) {
        var nodeType = elem.getNodeType && elem.getNodeType();
		if ( nodeType === 3 || nodeType === 8 ) return;

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
			handler.guid = FBjqRY.guid++;
		}

		// Init the element's event structure
		var elemData = FBjqRY.data( elem );
        //console.log('add', elem, elemData);
		// If no elemData is found then we must be trying to bind to one of the
		// banned noData elements
		if ( ! elemData ) return;

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
			handleObj = handleObjIn ? FBjqRY.extend({}, handleObjIn) : {handler: handler, data: data};

			// Namespaced event handlers
			if ( type.indexOf(".") > -1 ) {
				namespaces = type.split(".");
				type = namespaces.shift();
				handleObj.namespace = namespaces.slice(0).sort().join(".");
			} 
            else {
				namespaces = [];
				handleObj.namespace = "";
			}

			handleObj.type = type;
			if ( ! handleObj.guid ) handleObj.guid = handler.guid;

			// Get the current list of functions bound to this event
			var handlers = events[ type ], special = FBjqRY.event.special[ type ];

			// Init the event handler queue
			if ( ! handlers ) {
				handlers = events[ type ] = [];
                
                var setup = special && special.setup;
				// Check for a special event handler
				// Only use addEventListener/attachEvent if the special
				// events handler returns false
				if ( ! setup || setup.call( elem, data, namespaces, eventHandle ) === false ) {
                    //console.log('add', type, namespaces, elem);
					// Bind the global event handler to the element
					if (elem.addEventListener && supportedEvents.indexOf(type) > -1) {
                        // NOTE: FBJS logs errors for events it does not "support" !
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}
			
			if ( special && special.add ) { 
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

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, pos ) {
		// don't do events on text and comment nodes
        var nodeType = elem.getNodeType && elem.getNodeType();
		if ( nodeType === 3 || nodeType === 8 ) return;

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
		if ( !types || types.charAt && types.charAt(0) === "." ) {
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

			special = FBjqRY.event.special[ type ]; //|| {};
            //console.log('remove 0', type, eventType, eventType.length, special);

			for ( j = pos || 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];
                //console.log('remove 1', handler.guid, handleObj.guid);
				if ( handler.guid === handleObj.guid ) {
                    //console.log('remove 2 all namespace', all, namespace, handleObj.namespace, namespace.test( handleObj.namespace ));
					// remove the given handler for the given type
					if ( all || namespace.test( handleObj.namespace ) ) {
                        //console.log('remove pre splice', pos);
						if ( pos == null ) {
                            eventType.splice( j--, 1 );
                        }
                        
                        if ( special && special.remove ) {
                            special.remove.call( elem, handleObj );
                        }
					}

					if ( pos != null ) break;
				}
			}

			// remove generic event handler if no more handlers exist
			if ( eventType.length === 0 || pos != null && eventType.length === 1 ) {
                //console.log('remove 3 teardown', type, special);
				if ( !special || !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
                    if (elem.removeEventListener && supportedEvents.indexOf(type) > -1) {
                        elem.removeEventListener( type, elemData.handle, false );
                    }
				}

				//ret = null;
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

	trigger: function( event, data, elem, bubbling ) { // bubbling is internal
		// Event object or event type
		var type = event.type || event; //, bubbling = arguments[3];

        //console.log('trigger', event, data, elem);

		if ( ! bubbling ) {
			event = ! FBjqRY.isString(event) /*typeof event === "object"*/ ?
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
			if ( ! elem ) {
				// Don't bubble custom events when global (to avoid too much overhead)
				event.stopPropagation();

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
            if ( !elem ) return undefined;
            var nodeType = elem.getNodeType && elem.getNodeType();
			if ( nodeType && (nodeType === 3 || nodeType === 8) ) {
				return undefined;
			}

			// Clean up in case it is reused
			event.result = undefined;
			event.target = elem;

			// Clone the incoming data, if any
			data = FBjqRY.makeArray( data );
			data.unshift( event ); // add the event to the front
		}

		event.currentTarget = elem;

		// Trigger the event, it is assumed that "handle" is a function
		var handle = FBjqRY.data( elem, "handle" );
		if ( handle ) { 
            //console.log('trigger handle:', elem, data);
            handle.apply( elem, data );
        }

        // ------------

		// Handle triggering native .onfoo handlers (and on links since we don't call .click() for links)
		//if ( (! elem[type] || (jQuery.nodeName(elem, 'a') && type == "click")) && elem["on"+type] && elem["on"+type].apply( elem, data ) === false )
		//	event.result = false;

        var parent = elem.getParentNode && elem.getParentNode();

		if ( ! event.isPropagationStopped() && parent ) {
			FBjqRY.event.trigger(event, data, parent, true);
		}
		// Trigger the native events (except for clicks on links)
		else if ( /*! bubbling && elem[type] &&*/ ! event.isDefaultPrevented() /*&& !(jQuery.nodeName(elem, 'a') && type == "click") */ ) {
			//this.triggered = true;
			//try {
			//	elem[ type ]();
			//// prevent IE from throwing an error for some hidden elements
			//} catch (e) {}
            
			var target = event.target, targetType = type.replace(/\..*$/, ""),
				special = FBjqRY.event.special[ targetType ] || {};
            
			if ( ( ! special._default || special._default.call( elem, event ) === false ) && 
				! (target && target.getTagName && FBjqRY.noData[target.getTagName().toLowerCase()]) ) {
             
                var listeners = target.listEventListeners && target.listEventListeners(targetType), len;
                if ( listeners && ( len = listeners.length ) ) {
                    
                    FBjqRY.event.triggered = true;
                    
                    for ( var i = 0; i < len; i++ ) {
                        
                        //console.log('calling: listeners[i] = ', listeners[i], target, data);
                        
                        if ( ! listeners[i] ) continue; // some seem to be undefined
                        
                        var ret = listeners[i].apply( target, data );
                        if ( ret === false ) { 
                            event.result = false;
                            if ( event.isPropagationStopped() ) break;
                        }
                    }
                }
                
                FBjqRY.event.triggered = false;
            }
		}

        // ------------

//		var parent = elem.getParentNode && elem.getParentNode(); //|| elem.ownerDocument;
//
//		// Trigger an inline bound script
//        /*
//		try {
//			if ( !(elem && elem.nodeName && FBjqRY.noData[elem.getTagName().toLowerCase()]) ) {
//				if ( elem[ "on" + type ] && elem[ "on" + type ].apply( elem, data ) === false ) {
//					event.result = false;
//				}
//			}
//		// prevent IE from throwing an error for some elements with some event types, see #3533
//		} catch (inlineError) {} */
//
//		if ( ! event.isPropagationStopped() && parent ) { // @todo
//			FBjqRY.event.trigger( event, data, parent, true );
//		}
//        else if ( ! event.isDefaultPrevented() ) {
//            
//			var target = event.target, old, targetType = type.replace(/\..*$/, ""),
//				//isClick = FBjqRY.nodeName(target, "a") && targetType === "click",
//				special = FBjqRY.event.special[ targetType ] || {};
//
//			if ( ( ! special._default || special._default.call( elem, event ) === false ) && 
//				/*! isClick &&*/ !(target && target.getTagName && FBjqRY.noData[target.getTagName().toLowerCase()]) ) {
//				//try {
//                    //console.log('trigger', target, targetType, event)
//                    var listeners = target.listEventListeners && target.listEventListeners(targetType), len;
//					//if ( target[ targetType ] ) {
//                    if ( listeners && ( len = listeners.length ) ) {
//						// Make sure that we don't accidentally re-trigger the onFOO events
//						//old = target[ "on" + targetType ];
//						//if ( old ) target[ "on" + targetType ] = null;
//						FBjqRY.event.triggered = true;
//						//target[ targetType ]();
//                        for ( var i = 0; i < len; i++ ) {
//                            var listener = listeners[i];
//                            //console.log('calling: listeners[i] = ', listener, target, data);
//                            if ( ! listener ) continue; // some seem to be undefined
//                            //var ret = listener.call(target, event); // @todo
//                            //var ret = listener(target, event); // @todo
//                            var ret = listener.apply( target, data ); // @todo
//                            if ( ret === false || event.isPropagationStopped() ) break; // @todo
//                        }
//					}
//				// prevent IE from throwing an error for some elements with some event types, see #3533
//				//} catch (triggerError) {}
//				//if ( old ) target[ "on" + targetType ] = old;
//				FBjqRY.event.triggered = false;
//			}
//		}
	},

	handle: function( event ) {
		var all, handlers, namespaces, namespace_sort = [], namespace_re, events, 
            args = FBjqRY.makeArray( arguments );

		event = args[0] = FBjqRY.event.fix( event );
		event.currentTarget = this;

        //console.log('handle() 0', event);

		// Namespaced event handlers
		all = event.type.indexOf(".") < 0 && ! event.exclusive;

		if ( ! all ) {
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
                    
                    //console.log('handle() 1', event, this, ret);
                    
					if ( typeof(ret) !== 'undefined' ) {
						event.result = ret;
						if ( ret === false ) {
                            //console.log('handle() 0', ret, event, event.preventDefault);
							event.preventDefault();
                            //console.log('handle() 1', ret, event);
							event.stopPropagation();
                            //console.log('handle() 2', ret, event);
						}
					}

					if ( event.isImmediatePropagationStopped() ) break;
				}
			}
		}

		return event.result;
	},
    /*
	handle: function( event ) {
		var all, handlers, namespaces, namespace, events;
        var args = FBjqRY.makeArray( arguments );
        
		event = args[0] = FBjqRY.event.fix( event );
		event.currentTarget = this;

		// Namespaced event handlers
		all = event.type.indexOf(".") < 0 && !event.exclusive;

		if ( !all ) {
			namespaces = event.type.split(".");
			event.type = namespaces.shift();
			namespace = new RegExp("(^|\\.)" + namespaces.slice(0).sort().join("\\.(?:.*\\.)?") + "(\\.|$)");
		}

		events = FBjqRY.data(this, "events"); 
        handlers = events ? events[ event.type ] : undefined;

		if ( events && handlers ) {
			// Clone the handlers to prevent manipulation
			handlers = handlers.slice(0);

			for ( var j = 0, l = handlers.length; j < l; j++ ) {
				var handleObj = handlers[ j ];

				// Filter the functions by class
				if ( all || namespace.test( handleObj.namespace ) ) {
					// Pass in a reference to the handler function itself
					// So that we can later remove it
					event.handler = handleObj.handler;
					event.data = handleObj.data;
					event.handleObj = handleObj;

                    console.log('handle() 0 calling handler', event, this);

					var ret = handleObj.handler.apply( this, args );

                    console.log('handle() 1 handler returned', ret);

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}

					if ( event.isImmediatePropagationStopped() ) {
                        console.log('handle() 2 breaking handler chain !');
						break;
					}
				}
			}
		}

		return event.result;
	}, */
    
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
	//guid: 100000000, //1E8,

	// Deprecated, use jQuery.proxy instead
	proxy: FBjqRY.proxy,

	special: {
        /*
		ready: {
			// Make sure the ready event is setup
			setup: jQuery.bindReady,
			teardown: jQuery.noop
		}, */

		live: {
			add: function( handleObj ) {
//				FBjqRY.event.add( this, handleObj.origType, FBjqRY.extend({}, handleObj, { handler: liveHandler }) );

                FBjqRY.event.add( this, liveConvert( handleObj.origType, handleObj.selector ),
                    FBjqRY.extend({}, handleObj, { handler: liveHandler, guid: handleObj.handler.guid }) );
			},
			remove: function( handleObj ) {
//				var remove = true, type = handleObj.origType.replace(rnamespaces, "");
//
//                var events = FBjqRY.data(this, "events").live;
//                if (events) {
//                    for ( var i = 0, len = events.length; i < len; i++ ) {
//                        if ( type === events[i].origType.replace(rnamespaces, "") ) {
//                            remove = false;
//                            break;
//                        }
//                    }
//                }
//
//				if (remove) FBjqRY.event.remove( this, handleObj.origType, liveHandler );
                
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

				return false;
			},
			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		} */
	}
};

function returnFalse() {return false;}
function returnTrue() {return true;}

FBjqRY.Event = function( src ) {
    
    //console.log('Event src:', src);
    
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
            var self = this;
			if ( ! FBjqRY.nodeName(self, "form") ) {
				FBjqRY.event.add(self, "click.specialSubmit", function( e ) {
					var elem = e.target, type = elem.getType();

					if ( (type === "submit" || type === "image") &&
                        FBjqRY( elem ).closest("form").length ) {
						return trigger( "submit", this, arguments );
					}
				});
				FBjqRY.event.add(self, "keypress.specialSubmit", function( e ) {
					var elem = e.target, type = elem.getType();

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

	var formElems = /textarea|input|select/i, changeFilters,

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
        else if ( FBjqRY.nodeName(elem, "select") ) {
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

				if ( type === "radio" || type === "checkbox" || FBjqRY.nodeName(elem, "select") ) {
					return testChange.call( this, e );
				}
			},

			// Change has to be called before submit
			// Keydown will be called before keypress, which is used in submit-event delegation
			keydown: function( e ) {
				var elem = e.target, type = elem.getType();

				if ( (e.keyCode === 13 && ! FBjqRY.nodeName(elem, "textarea")) ||
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
            
            var self = this;
			for ( var type in changeFilters ) {
				FBjqRY.event.add( self, type + ".specialChange", changeFilters[type] );
			}

			return formElems.test( self.getTagName() );
		},

		teardown: function( namespaces ) {
            var self = this;
			FBjqRY.event.remove( self, ".specialChange" );

			return formElems.test( self.getTagName() );
		}
	};

	changeFilters = FBjqRY.event.special.change.filters;
}

function trigger( type, elem, args ) {
	args[0].type = type;
	return FBjqRY.event.handle.apply( elem, args );
}

// Create "bubbling" focus and blur events
//if ( document.addEventListener ) { // @todo root
	FBjqRY.each( { focus: "focusin", blur: "focusout" }, 
    function( orig, fix ) {
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
//}

FBjqRY.each(["bind", "one"], function( i, name ) {
	FBjqRY.fn[ name ] = function( type, data, fn ) {
        
        //console.log(name, type, data);
        
		// Handle object literals
		if ( ! FBjqRY.isString(type) /*typeof type === "object"*/ ) {
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
            var nodes = this.nodes;
            //console.log(name, type, nodes);
			for ( var i = 0, l = this.length; i < l; i++ ) {
                //console.log(name, type, nodes[i]);
				FBjqRY.event.add( nodes[i], type, handler, data );
			}
		}

		return this;
	};
});

FBjqRY.fn.extend({
	unbind: function( type, fn ) {
		// Handle object literals
		if ( typeof type === "object" //&& ! FBjqRY.isString(type) /* added */
            && ! type.preventDefault ) {
			for ( var key in type ) this.unbind( key, type[key] );
		} 
        else {
            var nodes = this.nodes;
			for ( var i = 0, l = this.length; i < l; i++ ) {
				FBjqRY.event.remove( nodes[i], type, fn );
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

FBjqRY.each( ["live", "die"], function( i, name ) {
	FBjqRY.fn[ name ] = function( types, data, fn, origSelector /* Internal Use Only */ ) {
		var type, i = 0, match, namespaces, preType,
			selector = origSelector || this.selector,
            // NOTE: in jQuery context is never null (document by default)
            // in our case document makes no sense but we have root :
			context = origSelector ? this : FBjqRY( this.context || document.getRootElement() );

		if ( FBjqRY.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

        //console.log( name + '()', context, context.length);

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
			} 
            else {
				type = (liveMap[ type ] || type) + namespaces;
			}

			if ( name === "live" ) { // bind live handler
                var liveType = liveConvert( type, selector, true );
				//context.each(function(){
				//	FBjqRY.event.add( this, liveType,
				//		{ data: data, selector: selector, handler: fn, origType: type, origHandler: fn, preType: preType } );
				//});
				// bind live handler
				for ( var j = 0, nodes = context.nodes, len = context.length; j < len; j++ ) {
                    //console.log( name + '()', nodes[j], liveConvert( type, selector ) );
					FBjqRY.event.add( nodes[j], liveType,
						{ data: data, selector: selector, handler: fn, origType: type, origHandler: fn, preType: preType } );
				}

			} else {
                //console.log( name + '()', context, liveConvert( type, selector ) );
				// unbind live handler
				context.unbind( liveConvert( type, selector, true ), fn );
			}
		}
		
		return this;
	}
});

function liveHandler( event ) {
	var stop, maxLevel, elems = [], selectors = [],
		related, match, handleObj, elem, j, i, l, close, namespace,
		events = FBjqRY.data( this, "events" );

	// Make sure we avoid non-left-click bubbling in Firefox (#3861)
	if ( event.liveFired === this || ! events || ! events.live 
        || event.button && event.type === "click" ) {
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
		} 
        else {
			live.splice( j--, 1 );
		}
	}
    
	match = FBjqRY( event.target ).closest( selectors, event.currentTarget );

	for ( i = 0, l = match.length; i < l; i++ ) {
		close = match[i]; // match is an array - closest() returns an array

		for ( j = 0; j < live.length; j++ ) {
			handleObj = live[j];

			if ( close.selector === handleObj.selector && (!namespace || namespace.test( handleObj.namespace )) ) {
				elem = close.elem;
				related = null;

				// Those two events require additional checking @todo
				if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
					event.type = handleObj.preType;
					related = FBjqRY( event.relatedTarget ).closest( handleObj.selector )[0];
				}

				if ( ! related || related !== elem ) {
					elems.push({elem: elem, handleObj: handleObj, level: close.level});
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

			if ( ret === false ) { 
                stop = false;
                break;
            }
		}
	}

	return stop;
}

function liveHandler1( event ) {
	var stop, elems = [], selectors = [], args = arguments,
		related, match, handleObj, elem, j, i, l, data,
		events = FBjqRY.data( this, "events" );

	// Make sure we avoid non-left-click bubbling in Firefox (#3861)
	if ( event.liveFired === this || ! events || ! events.live 
        || event.button && event.type === "click" ) {
		return;
	}

	event.liveFired = this;

	var live = events.live.slice(0);

	for ( j = 0; j < live.length; j++ ) {
		handleObj = live[j];

		if ( handleObj.origType.replace( rnamespaces, "" ) === event.type ) {
			selectors.push( handleObj.selector );
		} 
        else {
			live.splice( j--, 1 );
		}
	}

	match = FBjqRY( event.target ).closest( selectors, event.currentTarget );

    //console.log('liveHandler sel, match: ', selectors, match);

	for ( i = 0, l = match.length; i < l; i++ ) {
        var matchi = match[i];
		for ( j = 0; j < live.length; j++ ) {
			handleObj = live[j];
            
			if ( matchi.selector === handleObj.selector ) {
				elem = matchi.elem;
				related = null;

				// Those two events require additional checking
				if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
                    // @todo
					related = FBjqRY( event.relatedTarget ).closest( handleObj.selector )[0];
				}

				if ( !related || related !== elem ) {
					elems.push({ elem: elem, handleObj: handleObj });
				}
			}
		}
	}

    //console.log('liveHandler elems: ', elems);

	for ( i = 0, l = elems.length; i < l; i++ ) {
		match = elems[i];
		event.currentTarget = match.elem;
		event.data = match.handleObj.data;
		event.handleObj = match.handleObj;

		if ( match.handleObj.origHandler.apply( match.elem, args ) === false ) {
			stop = false;
			break;
		}
	}

	return stop;
}

//function liveHandler( event ) {
//    var stop, maxLevel, elems = [], selectors = [],
//        related, match, handleObj, elem, j, i, l, data, close, namespace,
//        events = jQuery.data( this, "events" );
//
//    // Make sure we avoid non-left-click bubbling in Firefox (#3861)
//    if ( event.liveFired === this || !events || !events.live 
//        || event.button && event.type === "click" ) {
//        return;
//    }
//
//    if ( event.namespace ) {
//        namespace = new RegExp("(^|\\.)" + event.namespace.split(".").join("\\.(?:.*\\.)?") + "(\\.|$)");
//    }
//
//    event.liveFired = this;
//
//    var live = events.live.slice(0);
//
//    for ( j = 0; j < live.length; j++ ) {
//        handleObj = live[j];
//
//        if ( handleObj.origType.replace( rnamespaces, "" ) === event.type ) {
//            selectors.push( handleObj.selector );
//        } else {
//            live.splice( j--, 1 );
//        }
//    }
//
//    match = jQuery( event.target ).closest( selectors, event.currentTarget );
//
//    for ( i = 0, l = match.length; i < l; i++ ) {
//        close = match[i];
//
//        for ( j = 0; j < live.length; j++ ) {
//            handleObj = live[j];
//
//            if ( close.selector === handleObj.selector && (!namespace || namespace.test( handleObj.namespace )) ) {
//                elem = close.elem;
//                related = null;
//
//                // Those two events require additional checking
//                if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
//                    event.type = handleObj.preType;
//                    related = jQuery( event.relatedTarget ).closest( handleObj.selector )[0];
//                }
//
//                if ( ! related || related !== elem ) {
//                    elems.push({ elem: elem, handleObj: handleObj, level: close.level });
//                }
//            }
//        }
//    }
//
//    for ( i = 0, l = elems.length; i < l; i++ ) {
//        match = elems[i];
//
//        if ( maxLevel && match.level > maxLevel ) break;
//
//        event.currentTarget = match.elem;
//        event.data = match.handleObj.data;
//        event.handleObj = match.handleObj;
//
//        ret = match.handleObj.origHandler.apply( match.elem, arguments );
//
//        if ( ret === false || event.isPropagationStopped() ) {
//            maxLevel = match.level;
//
//            if ( ret === false ) stop = false;
//        }
//    }
//
//    return stop;
//}

var rdot = /\./g, rspace = / /g;
function liveConvert( type, selector, prefix ) {
	return (prefix ? "live." : '') + (type && type !== "*" ? type + "." : "") + selector.replace(rdot, "`").replace(rspace, "&");
}

var supportedEvents = ("blur change click dblclick error focus keydown keypress keyup load "  +
                   "mousedown mousemove mouseout mouseover mouseup resize scroll select " +
                   "submit unload").split(" ");
var addEventFn = function( i, name ) {
	// Handle event binding
	FBjqRY.fn[ name ] = function( data, fn ) {
		if ( fn == null ) {
			fn = data;
			data = null;
		}
		return arguments.length > 0 ? this.bind( name, data, fn ) : this.trigger( name );
	};
	if ( FBjqRY.attrFn ) FBjqRY.attrFn[ name ] = true;
};
FBjqRY.each(supportedEvents, addEventFn);
// NOTE: jQuery has 4 extra events on top what FBJS supports :
// these won't be bind to FB elements using addEventListener !
addEventFn(0, 'focusin'); 
addEventFn(0, 'focusout');
addEventFn(0, 'mouseenter'); 
addEventFn(0, 'mouseleave');
