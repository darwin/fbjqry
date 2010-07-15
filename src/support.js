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
		leadingWhitespace: false, //div.getFirstChild().nodeType === 3,

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
})();