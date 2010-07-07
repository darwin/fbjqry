/*
 Current HTML Parser by: Nate McQuay for use with Facebook (FBJS)
 Based on HTML Parser by: John Resig (ejohn.org)
 Original code came from: http://ejohn.org/blog/pure-javascript-html-parser/
 Original code by: Erik Arvidsson, Mozilla Public License
 http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

 // Usage:
 // inject into an existing FBDOM node
 Support.html(htmlString, FBNode);

 // return array of parsed nodes
 var nodes = Support.html(htmlString);

 Support.html is the exposed function for HTMLtoDOM
*/

/*
  Current JSON parser modified by: Nate McQuay for use with Facebook (FBJS)
  Original parser by: Mike Samuel
  Original code from: http://code.google.com/p/json-sans-eval/

  // Usage:
  // return a js object
  Support.json(jsonString);
*/

var Support = {};  // expose variable globally

(function() {

// ============================================================================
/** Helpers */
// ============================================================================
//IE console work-arounds
//if (typeof console === 'undefined') { console = {}; }
//if (typeof console.error !== 'function') {  console.error = function() {}; }
var consoleLog = (typeof console !== 'undefined') && console.log;
Support.log = function(msg, e) {
    if ( Support.log.enabled && consoleLog ) {
        e ? consoleLog(msg, e) : consoleLog(msg);
    }
    if ( e && Support.log.throwErrors ) throw e;
}
Support.error = function(msg) {
    try { throw msg; }
    catch (e) {
        Support.log('[ERROR]', e);
    }
    return undefined;
}

Support.memo = function(fn, cache) { // function return value memoization
    cache = cache || {};
    return function(p) {
        if( p && cache[p] ) { return cache[p]; }
        cache[p] = fn(p);
        return cache[p];
    };
};

// copied from facebooker
Support.encodeURIComponent = function(str) {
    if ( typeof(str) === "string" ) {
        return str.replace(/=/g,'%3D').replace(/&/g,'%26');
    }
    // checkboxes and radio buttons return objects instead of a string
    else if( typeof(str) === "object" ){
        for (var i in str) {
            return str[i].replace(/=/g,'%3D').replace(/&/g,'%26');
        }
    }
};

// ============================================================================
/** String functions */
// ============================================================================
var rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g; // Used for trimming whitespace
var emptyString = '';
//var trim = Support.trim = function(s) { return s.replace(/^\s+|\s+$/g, ""); };
var trim = Support.trim = function(str) {
    if ( str != null && typeof(str) !== 'string' ) str = str.toString();
    return ( str || emptyString ).replace( rtrim, emptyString );
};
var camelCase = Support.camelCase = Support.memo(function(str) {
    return str.replace(/\-(\w)/g, function(all, letter){ return letter.toUpperCase(); });
});

// ============================================================================
/** Object functions */
// ============================================================================
var object = Support.object = {}; // we can't access Array.prototype

//current version is slightly modified from jQuery version
/*
isFunction: function( fn ) {
    return !!fn && typeof fn != "string" && !fn.nodeName && (/^[\s[]?function/.test( fn + "" ));
         //the following condition should be in there too, but FBJS prevents access to Array
         //fn.constructor != [].constructor
},
*/
// See test/unit/core.js for details concerning isFunction.
// Since version 1.3, DOM methods and functions like alert
// aren't supported. They return false on IE (#2968).

var toString = object.toString;
var isFunction = Support.isFunction = function(obj) { // @todo
    return toString.call(obj) === "[object Function]";
};

Support.isArray = function(obj) {
    return toString.call(obj) === "[object Array]";
};
/**
 * NOTE: this method is important as FBML might "prerender" JS strings
 * that contain HTML (to be used with setInnerXHTML etc.) !
 *
 * typeof(variable) for such strings might return 'object' !
 */
Support.isString = function(obj) {
    //return object.toString() === object;
    return toString.call(obj) === "[object String]";
};

Support.isEmptyObject = function(obj) {
    for ( var n in obj ) return false;
    return true;
};

/*
Support.each = function(obj, cb, args) {
    if ( !obj || !obj.length ) return obj; // return [];

    var i, len = obj.length;
    if ( args ) {
        if ( len ) {
            for ( i = 0; i < len; i++ ) cb.apply(obj[i], args);
        }
        else {
            for ( i in obj ) {
                if ( obj.hasOwnProperty(i) ) cb.apply(obj[i], args);
            }
        }
    } else {
        if ( len ) {
            for ( i = 0; i < len; i++ ) cb.call(obj[i]);
        }
        else {
            for ( i in obj ) {
                if ( obj.hasOwnProperty(i) ) cb.call(obj[i]);
            }
        }
    }
    return obj;
}; */
Support.each = function( object, callback, args ) { // args is for internal usage only
    var name, i, length = object.length;
    var isObj = length === undefined || isFunction(object);

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
};

// ============================================================================
/** FBNode helpers */
// ============================================================================
var isFBNode = Support.isFBNode = function(node) {
    return node && (node.__instance || node.__instance === 0);
};

// NOTE: __instance is not 100% reliable e.g. testSiblingClassTagSelector fails
// having the same elements matched with a different __instance identifier !
var nextId = 1;
var getFBNodeId = Support.getFBNodeId = function(node, dontGenerate) {
    // __instance is a unique identifier for FBDOM nodes
    //return node && node.__instance;
    if ( node ) {
        if ( ! node.getId ) return undefined;
        var nodeId = node.getId();
        if ( ! nodeId && ! dontGenerate ) {
            nodeId = '_generated-' + nextId++;
            node.setId( nodeId );
        }
        return nodeId;
    }
    return node;
};
var sameFBNode = Support.sameFBNode = function(node1, node2) {
    // __instance is a unique identifier for FBDOM nodes
    //return node1.__instance == node2.__instance;
    return getFBNodeId(node1) === getFBNodeId(node2);
};

Support.style = function(node, name, value) { // supports multiple nodes
    var i, len = node.length, val;
    
    if ( Support.isString(name) && typeof(value) !== 'undefined' ) {
        name = Support.camelCase(name);
        if (name === 'float' || name === 'styleFloat') name = 'cssFloat';

        if (typeof(value) === 'number') value = value + "px";
        if ( len ) {
            for ( i = 0; i < len; i++ ) {
                val = value;
                if ( Support.isFunction(value) ) {
                    val = value(i, node[i].getStyle(name));
                }
                node[i].setStyle(name, val);
            }
        }
        else { // only used from Support.attr
            node.setStyle(name, value);
        }
        //return false;
    }
    else if ( typeof(name) === 'object' ) {
        //if ( name['float'] && ! name.cssFloat ) name.cssFloat = name['float'];

        var values = {};
        for ( var n in name ) {
            if ( name.hasOwnProperty(n) ) {
                value = name[n];
                
                n = Support.camelCase(n);
                if (n === 'float' || n === 'styleFloat') n = 'cssFloat';

                if (typeof(value) === 'number') value = value + "px";

                ///values[ n ] = value;
                if ( len ) {
                    for ( i = 0; i < len; i++ ) {
                        val = value;
                        if ( Support.isFunction(value) ) {
                            val= value(i, node[i].getStyle(n));
                        }
                        node[i].setStyle(n, val);
                    }
                }
                else { // only used from Support.attr
                    node.setStyle(n, value);
                }
            }
        }

        ///if ( len ) {
        ///    for ( i = 0; i < len; i++ ) node[i].setStyle(values);
        //}
        ///else {
        ///    node.setStyle(values);
        ///}
        //return false;
    }
};

Support.attr = (function() {
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
        validAttrs[ "html" ] = "setInnerXHTML";
        validAttrs[ "fbml" ] = "setInnerFBML";
        validAttrs[ "text" ] = "setTextValue";
        // css/style setters :
        validAttrs[ "css" ] = "setStyle";
        validAttrs[ "style" ] = "setStyle";
        // height/width helpers :
        validAttrs[ "height" ] = "setHeight";
        validAttrs[ "width" ] = "setWidth";
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
                    Support.style(node, name, value);
                }
            }
        }
        else {
            Support.style(node, val);
        }
    };

    return function(node, attr, val) {
        var setAttr = validAttrs[ attr.toLowerCase() ];
        if ( ! setAttr ) {
           Support.log("Support.attr() attribute name '" + attr + "' is not supported");
           return undefined;
        }

        if ( typeof val !== 'undefined' ) { // setter :
            try {
               if (setAttr === "setStyle") setStyle(node, val);
               else if (setAttr === "setWidth") Support.style(node, 'width', val);
               else if (setAttr === "setHeight") Support.style(node, 'height', val);
               //else if (setAttr === "setInnerXHTML") Support.xhtml(val, node);
               else node[setAttr](val); // e.g. setTitle(val)
            }
            catch (e) { // e.g. when setting an invalid url parameter using setSrc()
                return Support.error("Support.attr() setter node[" + setAttr + "](" + val + ") failed: " + e);
            }
            return node;
        }
        // else getter :
        var getAttr = 'g' + setAttr.substr(1); // setStyle -> getStyle
        if ( ! node[getAttr] ) {
            return Support.error("Support.attr() getter " + getAttr + " not supported !");
        }
        val = undefined;
        try {
            if (getAttr === "getStyle") throw "unsupported use css('styleProperty') to get style values";
            else if (getAttr === "getWidth") val = Support.style(node, 'width');
            else if (getAttr === "getHeight") val = Support.style(node, 'height');
            else {
                val = node[getAttr]();  // e.g. getTitle()
                //if ( typeof(val) === 'undefined' ) val = '';
            }
        }
        catch (e) {
            // some nodes for some attrs e.g. getHref throw an error :
            // "TypeError: b is undefined" instead of returning correctly
            Support.log("Support.attr() getter node[" + getAttr + "]() failed: " + e);
        }
        return val;
    };
})();

// ============================================================================
/** Array functions */
// ============================================================================
Support.array = []; // we can't access Array.prototype

Support.map = function( array, callback ) {
    var ret = [];

    // Go through the array, translating each of the items to their
    // new value (or values).
    for ( var i = 0, len = array.length; i < len; i++ ) {
        var value = callback( array[i], i );
        if ( value != null ) ret[ ret.length ] = value;
    }
    return ret.concat.apply( [], ret );
};

Support.grep = function( array, callback, inv ) {
    var ret = [];

    // Go through the array, only saving the items
    // that pass the validator function
    for ( var i = 0, len = array.length; i < len; i++ ) {
        if ( !inv != !callback( array[i], i ) ) {
            ret.push( array[i] );
        }
    }
    return ret;
};

Support.unique = function(array) {
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
        if ( isFBNode(array[0]) ) {
            for (i = 0, len = array.length; i < len; i++) {
                e = array[i]; id = getFBNodeId(e);
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
        Support.log("Support.unique() returning original array", e);
        ret = array;
    }
    return ret;
};

Support.indexOf = function(elem, array) {
    var cmpFn;
    if ( isFBNode(elem) ) {
        cmpFn = function(v) { return isFBNode(v) && sameFBNode(elem, v); };
    }
    else {
        if ( elem.equals ) cmpFn = function(v) { return elem.equals(v); };
        else cmpFn = function(v) { return (elem === v); };
    }
    
    for (var i = 0, len = array.length; i < len; i++) {
        if ( cmpFn(array[i]) ) return i;
    }
    return -1;
};

Support.merge = function(first, second) {
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
};

// ============================================================================
/** JSON parser */
// ============================================================================
Support.json = (function() { //Modified json parser begins here :
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
            return Support.error("Support.json() unsupported initial json token: '" + tok + "'");
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
            return Support.error("Support.json() could not fully process json object");
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

// ============================================================================
/** A helper around setInnerXHTML (FBJS beta feature) */
// ============================================================================
Support.xhtml = function( elems, context ) { // based on jQuery.clean 1.3.2
    context = context || document;
    if ( typeof context.createElement === "undefined" ) context = document;

    if ( typeof elems === 'string' ) { // support single string
        elems = [ elems ];
    }

    // If a single string is passed in and it's a single tag
    // just do a createElement and skip the rest
    if ( elems.length === 1 && Support.isString( elems[0] ) ) {
        var match = /^<(\w+)\s*\/?>$/.exec( elems[0] );
        if ( match ) return [ context.createElement( match[1] ) ];
    }

    var ret = [], div = context.createElement("div");

    Support.each(elems, function() {
        var elem = this;

        if ( typeof elem === "number" ) elem += '';
        if ( ! elem ) return;

        // Convert html string into DOM nodes
        if ( Support.isString(elem) ) {
            // Fix "XHTML"-style tags in all browsers
            elem = elem.replace(/(<(\w+)[^>]*?)\/>/g, function(all, front, tag){
                return tag.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i) ?
                    all : front + "></" + tag + ">";
            });

            // Trim whitespace, otherwise indexOf won't work as expected
            var tags = elem.replace(/^\s+/, "").substring(0, 10).toLowerCase();
            var wrap = // @todo not sure if this is needed FBJS might handle it it's own way ...
                // option or optgroup
                ! tags.indexOf("<opt") &&
                [ 1, "<select multiple='multiple'>", "</select>" ] ||

                ! tags.indexOf("<leg") &&
                [ 1, "<fieldset>", "</fieldset>" ] ||

                tags.match(/^<(thead|tbody|tfoot|colg|cap)/) &&
                [ 1, "<table>", "</table>" ] ||

                ! tags.indexOf("<tr") &&
                [ 2, "<table><tbody>", "</tbody></table>" ] ||

                // <thead> matched above
                (! tags.indexOf("<td") || !tags.indexOf("<th")) &&
                [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ] ||

                ! tags.indexOf("<col") &&
                [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ] ||

                [ 0, "", "" ];

            // Go to html and back, then peel off extra wrappers
            div.setInnerXHTML( wrap[1] + elem + wrap[2] );

            // Move to the right depth
            while ( wrap[0]-- ) div = div.getLastChild();

            elem = div.getChildNodes();
        }

        if ( Support.isFBNode(elem) ) ret.push( elem );
        else ret = Support.merge( ret, elem );

    });

    return ret;
};

// ============================================================================
/** HTML parser */
// ============================================================================
/*
Support.html = ( function() { //Modified htmlparser begins here:

    var each = Support.each;
    var makeMap = function(str) {
        var obj = {}, items = str.split(",");
        for (var i=0, len=items.length; i < len; i++) {
            obj[ items[i] ] = true;
        }
        return obj;
    };

    // Regular Expressions for parsing tags and attributes
    var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
        endTag = /^<\/(\w+)[^>]*>/,
        attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
        endTable = /<\/(table)>/;

    // Empty Elements - HTML 4.01
    var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");
    // Block Elements - HTML 4.01
    var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");
    // Inline Elements - HTML 4.01
    var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");
    // Elements that you can, intentionally, leave open
    // (and which close themselves)
    var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");
    // Attributes that have their values filled in disabled="disabled"
    var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");
    // Special Elements (can contain anything)
    var special = makeMap("script,style");

    //HTMLParser
    var handler, match, stack = [];
    stack.last  = function() { return this[this.length - 1]; };
    stack.reset = function() { this.length = 0; };

    var parseEndTag = function(tag, tagName) {
        // If no tag name is provided, clean shop
        var pos = stack.length - 1, i = pos;
        if(!tagName) {
            pos = 0;
        } else { // Find the closest opened tag of the same type
            for(; pos >= 0; pos--) { if(stack[pos] == tagName) { break; } }
        }

        if(pos >= 0) {
            // Close all the open elements, up the stack
            for(; i >= pos; i--) { if(handler.end) { handler.end(stack[i]); } }
            stack.length = pos; // Remove the open elements from the stack
        }
    };

    var parseStartTag = function(tag, tagName, rest, unary) {
        if(block[tagName]) {
            while(stack.last() && inline[stack.last()]) { parseEndTag("", stack.last()); }
        }

        if(closeSelf[tagName] && stack.last() == tagName) { parseEndTag("", tagName); }

        unary = empty[tagName] || !!unary;
        if(!unary) { stack.push(tagName); }

        if(handler.start) {
            var attrs = [];

            rest.replace(attr, function(match, name) {
                var value = arguments[2] ? arguments[2] :
                    arguments[3] ? arguments[3] :
                    arguments[4] ? arguments[4] :
                    fillAttrs[name] ? name : "";

                attrs.push({
                    name: name,
                    value: value,
                    escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
                });
            });

            if(handler.start) { handler.start(tagName, attrs, unary); }
        }
    };

    var replaceFn = function(all, text) {
        text = text.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").replace(/<!--(.*?)-->/g, "$1");
        if ( handler.chars ) handler.chars(text);
        return "";
    };

    var entityReplace = (function() {
        //A map of entities and their associated character codes
        //http://www.w3schools.com/tags/ref_entities.asp
        //http://www.w3schools.com/tags/ref_symbols.asp

        var entMap = {},
            ent = ['nbsp','iexcl','cent','pound','curren','yen','brvbar','sect','uml','copy','ordf','laquo','not','shy','reg','macr','deg','plusmn','sup2','sup3','acute','micro','para','middot','cedil','sup1','ordm','raquo','frac14','frac12','frac34','iquest','Agrave','Aacute','Acirc','Atilde','Auml','Aring','AElig','Ccedil','Egrave','Eacute','Ecirc','Euml','Igrave','Iacute','Icirc','Iuml','ETH','Ntilde','Ograve','Oacute','Ocirc','Otilde','Ouml','times','Oslash','Ugrave','Uacute','Ucirc','Uuml','Yacute','THORN','szlig','agrave','aacute','acirc','atilde','auml','aring','aelig','ccedil','egrave','eacute','ecirc','euml','igrave','iacute','icirc','iuml','eth','ntilde','ograve','oacute','ocirc','otilde','ouml','divide','oslash','ugrave','uacute','ucirc','uuml','yacute','thorn','yuml'],
            i, length, cc;
        //map of entities 160 - 255
        for(i = 0, length = ent.length; i < length; i++) { entMap[ent[i]] = String.fromCharCode(160+i); }

        //entities outisde 160-255 range
        ent = ['quot','apos','amp','lt','gt','forall','part','exists','empty','nabla','isin','notin','ni','prod','sum','minus','lowast','radic','prop','infin','ang','and','or','cap','cup','int','there4','sim','cong','asymp','ne','equiv','le','ge','sub','sup','nsub','sube','supe','oplus','otimes','perp','sdot','Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta','Theta','Iota','Kappa','Lambda','Mu','Nu','Xi','Omicron','Pi','Rho','Sigma','Tau','Upsilon','Phi','Chi','Psi','Omega','alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigmaf','sigma','tau','upsilon','phi','chi','psi','omega','thetasym','upsih','piv','OElig','oelig','Scaron','scaron','Yuml','fnof','circ','tilde','ensp','emsp','thinsp','zwnj','zwj','lrm','rlm','ndash','mdash','lsquo','rsquo','sbquo','ldquo','rdquo','bdquo','dagger','Dagger','bull','hellip','permil','prime','Prime','lsaquo','rsaquo','oline','euro','trade','larr','uarr','rarr','darr','harr','crarr','lceil','rceil','lfloor','rfloor','loz','spades','clubs','hearts','diams'];
        cc  = [34,39,38,60,62,8704,8706,8707,8709,8711,8712,8713,8715,8719,8721,8722,8727,8730,8733,8734,8736,8743,8744,8745,8746,8747,8756,8764,8773,8776,8800,8801,8804,8805,8834,8835,8836,8838,8839,8853,8855,8869,8901,913,914,915,916,917,918,919,920,921,922,923,924,925,926,927,928,929,931,932,933,934,935,936,937,945,946,947,948,949,950,951,952,953,954,955,956,957,958,959,960,961,962,963,964,965,966,967,968,969,977,978,982,338,339,352,353,376,402,710,732,8194,8195,8201,8204,8205,8206,8207,8211,8212,8216,8217,8218,8220,8221,8222,8224,8225,8226,8230,8240,8242,8243,8249,8250,8254,8364,8482,8592,8593,8594,8595,8596,8629,8968,8969,8970,8971,9674,9824,9827,9829,9830];
        for(i = 0, length = ent.length; i < length; i++) { entMap[ent[i]] = String.fromCharCode(cc[i]); }

        var entRegx = /&(#?)(\w+);/,
              m, str, cutPoint;

        return function(text) {
          str = "";
          while((m = entRegx.exec(text)) !== null) {
            if(m[2]) {
              if(m[1]) {
                  text = text.replace('&#' + m[2] + ';', String.fromCharCode(m[2]));
              } else if(entMap[m[2]]) {
                  text = text.replace('&' + m[2] + ';', entMap[m[2]]);
              } else { //handle things that look like entities, but are not entities
                cutPoint = text.indexOf('&' + m[2] + ';') + m[2].length + 2;
                str += text.substr(0, cutPoint);
                text = text.substr(cutPoint);
              }
            }
          }
          return str + text;
        };
    })();

    function HTMLParser(html) {
        var index, chars, last = html;
        var tbodyCheck = false;
        stack.reset();

        while (html) {
            chars = true;
            // Make sure we're not in a script or style element
            if(!stack.last() || !special[stack.last()]) {
                // Comment
                if(html.indexOf("<!--") === 0) {
                    index = html.indexOf("-->");
                    if(index >= 0) {
                        if(handler.comment) { handler.comment(html.substr(4, index)); }
                        html = html.substr(index + 3);
                        chars = tbodyCheck = false;
                    }
                } else if(html.indexOf("</") === 0) { // end tag
                    match = html.match(endTag);
                    if(match) {
                        html = html.substr( match[0].length );
                        match[0].replace(endTag, parseEndTag);
                        chars = tbodyCheck = false;
                    }
                } else if(html.indexOf("<") === 0) { // start tag
                    match = html.match(startTag);
                    if(match) {
                        if(tbodyCheck && match[1] !== 'tbody') {
                            //This will cause problems with nested tables and some other cases
                            //TODO: Stack based fix
                            html = html.replace(endTable, '</tbody></table>');
                            html = '<tbody>' + html;
                            match = html.match(startTag);
                        }
                        html = html.substr( match[0].length );
                        match[0].replace(startTag, parseStartTag);
                        chars = false;
                        tbodyCheck = match[1].toLowerCase() == 'table';
                    }
                }

                if(chars) {
                    index = html.indexOf("<");
                    var testStr,
                        commentReg = /^<!--/;

                    //handle non tag-related '<' entities
                    while(index >= 0) {
                        testStr = html.substr(index);
                        match = testStr.match(startTag);
                        if(match) { break; }
                        match = testStr.match(endTag);
                        if(match) { break; }
                        match = testStr.match(commentReg);
                        if(match) { break; }
                        index = html.indexOf("<", index + 1);
                    }

                    var text = index < 0 ? html : html.substr(0, index);
                    if (trim(text)) {
                        text = entityReplace(text);
                        handler.chars(text);
                    }
                    html = index < 0 ? "" : html.substr(index);
                }
            } else {
                html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), replaceFn);
                parseEndTag("", stack.last());
            }

            if ( html == last ) {
                return Support.error("Support.html() parse error: " + html);
            }
            last = html;
        }

        parseEndTag(); // Clean up any remaining tags
    }

    var elems, startNode, curParentNode, children;
    handler = {
        start: function(tagName, attrs, unary) {
            var el = document.createElement(tagName);
            each(attrs, function() { Support.attr(el, this.name, this.value); }, [el]);

            if (curParentNode && curParentNode.appendChild) {
                curParentNode.appendChild(el);
            }

            if (!unary) {
                elems.push(el);
                curParentNode = el;
            }
        },
        end: function(tag) {
            elems.length -= 1;
            curParentNode = elems[elems.length - 1];
        },
        chars: function(text) {
            //Bug Report: http://bugs.developers.facebook.com/show_bug.cgi?id=1114
            //TODO: find a way to create text nodes without the span wrapper if bug is not fixed
            //TODO: with FBJS2 we should be able to use createTextNode instead of this hack
            //      --but will the parser be needed?
            var el = document.createElement('span');
            el.setClassName('textNode');
            el.setTextValue(text);
            curParentNode.appendChild(el);
        },
        comment: function(text) {}
    };

    //html - the html string to parse
    //doc  - the insertion point in the document
    return function(html, doc) {
        elems = [];
        html = "<div>" + html + "</div>";
        startNode = document.createElement('div');
        curParentNode = startNode;

        HTMLParser(html);
        children = startNode.getChildNodes()[0].getChildNodes();

        if (! doc) return children;
        doc.setTextValue('');
        each(children, function() { doc.appendChild(this); }, [ doc ]);
        return doc;
    };
})(); // -- END Support.html
*/
})(); // -- END Utility function wrapper
if (typeof Support === 'undefined') throw 'Support module not defined !';

/**
 * findNodes function - the selector "engine" behing FBjqRY.
 * 
 * @param nodes the nodes to filter (assumes no context given if not null), set
 * to null if You're providing a context or want to start at the root element
 * @param sel the selector (string)
 * @param context the context of the search e.g. a FB node or a FBjqRY object
 * @return an array of matched nodes
 *
 * NOTE: Depends on Support functions !
 */
Support.findNodes = (function() {
    var idCheck = /^#(\w+)/,
        classCheck = /^\.([\w\-]+)/,
        tagCheck = /^([A-Za-z_\*]{1}\w*)/,
        attributeCheck = /^\[(\w+)(!|\^|\$|\*|~|\|)?=?["|']?([^\]]+?)?["|']?\]/,
        pseudoCheckParen = /^:(\w+)\("?'?([^\)]+)'?"?\)/,
        pseudoCheck = /^:(\w+)/;

    function filterNodes(nodes, fn, recurse) {
        var retNodes = [];
        if ( ! nodes || ! nodes.length ) return retNodes;

        for ( var i = 0, len = nodes.length; i < len; i++ ) {
            if ( fn.call(nodes[i]) ) retNodes.push( nodes[i] );
            if ( recurse ) {
                retNodes = retNodes.concat(
                    filterNodes(nodes[i].getChildNodes(), fn, recurse)
                );
            }
        }
        return retNodes;
    }

    function selectById(nodes, id, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            nodes = [];
            var node = document.getElementById(id);
            if ( node ) nodes[0] = node;
        }
        else {
            nodes = filterNodes( nodes,
                function() { return this.getId() == id; },
                recurse
            );
        }
        return nodes;
    }

    function selectByClass(nodes, cssClass, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            nodes = [ document.getRootElement() ];
        }
        return filterNodes( nodes,
            function() { return this.hasClassName(cssClass); },
            recurse
        );
    }

    function selectByTag(nodes, tag, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            nodes = document.getRootElement().getElementsByTagName(tag);
        }
        else { // @todo optimize !
//            if ( hierarchy === true ) { // optimization for the "most" case :
//                var tagNodes = [];
//                //console.log('selectByTag() nodes: ', nodes);
//                for (var i = 0, len = nodes.length; i < len; i++) {
//                    tagNodes = tagNodes.concat( nodes[i].getElementsByTagName(tag) );
//                }
//                //console.log('selectByTag() len: ', tagNodes.length);
//                nodes = tagNodes;
//            }
//            else {
                tag = tag.toUpperCase();
                nodes = filterNodes( nodes,
                    function() { return tag === '*' || this.getTagName() == tag; },
                    recurse
                );
//            }
        }
        return nodes;
    }

    function selectByAttribute(nodes, name, type, value, sel, recurse) {
        //console.log('selectByAttribute() name, type, value, recurse: ', name, type, value, recurse);
        if ( nodes == null ) {
            nodes = [ document.getRootElement() ];
        }
        var matchFunc = null;
        switch ( type ) {
            case "!": matchFunc = function(a, v) { return a !== v; }; break;
            case "^": matchFunc = function(a, v) { return a.indexOf(v) === 0; }; break;
            case "$": matchFunc = function(a, v) { return a.indexOf(v) + v.length === a.length; }; break;
            case "*": matchFunc = function(a, v) { return a.indexOf(v) >= 0; }; break;
            case "|":
                matchFunc = function(a, v) {
                    return a.length === v.length ? a === v : ( a.indexOf(v) === 0 && a.charAt(v.length) === '-' );
                };
                break;
            case "~": matchFunc = function(a, v) { return Support.indexOf(v, a.split(' ')) !== -1; }; break;
            default:
                if ( value === true ) matchFunc = function(a, v) { return !!a; };
                else matchFunc = function(a, v) { return a === v; };
        }
        return filterNodes( nodes,
            function() {
                return matchFunc( Support.attr(this, name), value );
            },
            recurse
        );
    }

    return function(nodes, sel, context) { // the findNodes function
        if ( typeof(sel) !== "string" ) {
            if ( sel.length || sel.length === 0 ) return sel;
            return [ sel ];
        }

        var i, len;

        //Is context a valid FBDOM element
        if ( context ) {
            if ( nodes && nodes.length > 0 ) {
                return Support.error("Support.findNodes() could not handle context with nodes");
            }
            if ( Support.isFBNode(context) ) {
                nodes = context.getChildNodes(); // context is never part of the result
            }
            else if ( typeof(context.length) === 'number' ) { // FBjqRY or array
                if ( typeof(context.selector) !== 'undefined' ) context = context.nodes;
                nodes = [];
                for ( i = 0, len = context.length; i < len; i++ ) {
                    nodes = nodes.concat( context[i].getChildNodes() );
                }
            }
            else {
                return Support.error("Support.findNodes() invalid context: " + context);
            }
        }

        var recurse, match,
            prevSel, selectors = sel.split(","),
            allNodes = [], origNodes = nodes;

        for ( i = 0, len = selectors.length; i < len; i++ ) {
            sel = Support.trim(selectors[i]);
            prevSel = "";
            recurse = true;
            while ( sel && sel !== prevSel ) {
                if ( prevSel ) {
                    recurse = (sel.charAt(0) === ' ');
                    if ( recurse ) {
                        sel = Support.trim(sel);
                        var nextNodes = [], j, sibling;
                        switch ( sel.charAt(0) ) { // handling selector "hierarchy" :
                            case '>':
                                sel = Support.trim(sel.substr(1)); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                recurse = false; // only 1st level childs
                                break;
                            case '~':
                                sel = Support.trim(sel.substr(1)); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    sibling = nodes[j].getNextSibling();
                                    while ( sibling ) {
                                        nextNodes.push( sibling );
                                        sibling = sibling.getNextSibling();
                                    }
                                }
                                recurse = false;
                                break;
                            case '+':
                                sel = Support.trim(sel.substr(1)); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    sibling = nodes[j].getNextSibling();
                                    if ( sibling ) {
                                        nextNodes.push( sibling );
                                    }
                                }
                                recurse = false;
                                break;
                            default:
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                // but will recurse childs as recurse stays === true
                        }
                        nodes = nextNodes;
                    }
                }
                prevSel = sel;

                //We should start with one of these first 3 cases (id, tag, class)
                match = idCheck.exec(sel);
                if ( match ) {
                    nodes = selectById(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                match = classCheck.exec(sel);
                if ( match ) {
                    nodes = selectByClass(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                match = tagCheck.exec(sel);
                if ( match ) {
                    nodes = selectByTag(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                //The remaining is subfiltering on nodes
                match = attributeCheck.exec(sel);
                if ( match ) {
                    match[3] = match[3] || true; //if m[3] does not exist we are just checking if attribute exists
                    nodes = selectByAttribute(nodes, match[1], match[2], match[3], sel, recurse);
                    sel = sel.substr( sel.indexOf("]") + 1 );
                    continue;
                }

                match = pseudoCheckParen.exec(sel);
                if ( ! match ) match = pseudoCheck.exec(sel);
                if ( match ) {
                    var matchStr = match[0];
                    var pseudo = match[1];
                    var value = match.length > 2 ? match[2] : null; //the value in the parenthesis
                    var intValue = value ? parseInt(value, 10) : null;

                    var _nodes = nodes;
                    // Elements can be considered hidden for several reasons :
                    // * They have a CSS display value of none.
                    // * They are form elements with type="hidden".
                    // * Their width and height are explicitly set to 0.
                    // * An ancestor element is hidden, so the element is not shown on the page.
                    var _isHidden = function(node) {
                        if ( node.getTagName().toLowerCase() === 'input' ) {
                            var type = node.getType();
                            if ( type && type.toLowerCase() === 'hidden' ) return true;
                        }
                        while ( node ) {
                            if ( node.getStyle('display') === 'none' ) return true;
                            if ( node.getOffsetWidth() == 0 && node.getOffsetHeight() == 0 ) return true;
                            node = node.getParentNode(); // for rootNode this is null - thus we'll stop
                        }
                        return false;
                    };
                    var _isInputType = function(node, type) {
                        if ( node.getTagName().toLowerCase() !== 'input' ) return false;
                        return node.getType() && node.getType().toLowerCase() === type;
                    };

                    switch ( pseudo ) {
                        case "first":
                            nodes = [ nodes[0] ]; break;
                        case "last":
                            nodes = [ nodes[nodes.length - 1] ]; break;
                        case "eq":
                            nodes = [ nodes[intValue] ]; break;
                        case "lt":
                            nodes = nodes.splice(0, intValue); break;
                        case "gt":
                            nodes = nodes.splice(intValue + 1, (nodes.length - intValue)); break;
                        case "even":
                            nodes = Support.grep(nodes, function(node, i) { return (i % 2 === 0); } ); break;
                        case "odd":
                            nodes = Support.grep(nodes, function(node, i) { return (i % 2 === 1); } ); break;
                        case "contains":
                            nodes = null;
                            notSupported(":contains pseudo selector not supported (cannot read text from FB nodes)");
                            break;
                        case "hidden":
                            nodes = Support.grep(nodes, _isHidden); break;
                        case "visible":
                            nodes = Support.grep(nodes, function(node) { return ! _isHidden(node); }); break;
                        case "has":
                            nodes = Support.grep(nodes, function(node) {
                                var matches = find([ node ], value);
                                return matches.length > 0;
                            });
                            break;
                        case "not":
                            nodes = Support.grep(nodes, function(node) {
                                var notMatches = find([ node ], value);
                                // if smt is matched return false :
                                return notMatches.length == 0;
                            });
                            break;
                        case "nth-child":
                            nodes = [];
                            Support.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                if ( childs && childs[intValue] ) nodes.push( childs[intValue] );
                            });
                            break;
                        case "first-child":
                            nodes = [];
                            Support.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                if ( childs && childs[0] ) nodes.push( childs[0] );
                            });
                            break;
                        case "last-child":
                            nodes = [];
                            Support.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                var length = childs && childs.length;
                                if ( length ) nodes.push( childs[length - 1] );
                            });
                            break;
                        case "only-child":
                            nodes = Support.grep(nodes, function(node) {
                                var parentChilds = node.getParentNode().getChildNodes();
                                return parentChilds.length === 1;
                            });
                            break;
                        case "parent": // all elements that are the parent of another element :
                            nodes = Support.grep(nodes, function(node) {
                                var childNodes = node.getChildNodes();
                                return childNodes && childNodes.length > 0;
                            });
                            break;
                        case "empty": // all elements that have no children :
                            nodes = Support.grep(nodes, function(node) {
                                var childNodes = node.getChildNodes();
                                return ! childNodes || childNodes.length === 0;
                            });
                            break;
                        case "disabled":
                            nodes = Support.grep(nodes, function(node) {
                                var disabled = node.getDisabled();
                                return !! disabled; // @todo disabled === 'disabled'
                            });
                            break;
                        case "enabled":
                            nodes = Support.grep(nodes, function(node) {
                                var disabled = node.getDisabled();
                                return ! disabled;
                            });
                            break;
                        case "selected":
                            nodes = Support.grep(nodes, function(node) {
                                var selected = node.getSelected();
                                return !! selected; // @todo selected === 'selected'
                            });
                            break;
                        case "input": // all input, textarea, select and button elements
                            nodes = Support.grep(nodes, function(node) {
                                var tagName = node.getTagName().toLowerCase();
                                return tagName === 'input' || tagName === 'textarea'
                                    || tagName === 'select' || tagName === 'button';
                            });
                            break;
                        case "text":
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'text') });
                            break;
                        case "password":
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'password') });
                            break;
                        case "radio":
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'radio') });
                            break;
                        case "file":
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'file') });
                            break;
                        case "image": // all image inputs
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'image') });
                            break;
                        case "reset":
                            nodes = Support.grep(nodes, function(node) { return _isInputType(node, 'reset') });
                            break;
                        case "submit":
                            nodes = Support.grep(nodes, function(node) {
                                var type = node.getType(), tagName = node.getTagName().toLowerCase();
                                return (tagName === 'input' && type && type.toLowerCase() === 'submit') ||
                                       (tagName === 'button' && ! type && type.toLowerCase() === 'submit');
                            });
                            break;
                        case "header":
                            nodes = Support.grep(nodes, function(node) {
                                var tagName = node.getTagName().toLowerCase();
                                return tagName.length === 2 && tagName.charAt(0) === 'h';
                            });
                            break;
                    }

                    sel = sel.substr(matchStr.length);
                    continue;
                }
            }
            if ( sel ) {
                nodes = [];
                return Support.error("Support.findNodes() could not parse the remaining selector: '" + sel + "'");
            }
            else {
                allNodes = allNodes.concat(nodes);
                nodes = origNodes;
            }
        }

        return Support.unique(allNodes);
    };
})();
//A wrapper for FBJS to make it feel more like jQuery
//About name:
// FB   = Facebook
// jqRY = jQuery
// RY   = RockYou!
//Author: Nate McQuay [borrowing heavily from jQuery 1.2.6]
//Author: Karol Bucek [building on top of Nate's version to make it more "complete"]
//=====================================================

//can't wrap this because it needs to be "global" and we don't have access to the window object
var FBjqRY = function(selector, context) {
    return new FBjqRY.prototype.init(selector, context);
};

// @todo isPlainObject not implemented !
// @todo isXMLDoc not implemented !

//We can wrap everything else
(function() {

var encodeURIComponent = Support.encodeURIComponent;

var each = Support.each;
var map = Support.map;
var grep = Support.grep;
var merge = Support.merge;
var indexOf = Support.indexOf;
var unique = Support.unique;
var trim = Support.trim;

var slice = Support.array.slice;

//var isFunction = Support.isFunction;
//var isArray = Support.isArray;
var isString = Support.isString;
//var isEmptyObject = Support.isEmptyObject;

var isFBNode = Support.isFBNode;
var sameFBNode = Support.sameFBNode;
var getFBNodeId = Support.getFBNodeId;

var find = Support.findNodes;

var is = function(expr, nodes) {
    return !!expr && find(nodes, expr).length > 0; //(this.find(expr).length > 0);
};
    
var filter = function(expr, nodes) {
    var fNodes = [], nodeArray = [];
    for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
        var node = nodes[i]; nodeArray[0] = node;
        if ( is(expr, nodeArray) ) fNodes.push( node );
    }
    return fNodes;
};

/**
 * Helper for the following manipulation functions :
 * - appendTo: "append"
 * - prependTo: "prepend"
 * - insertBefore: "before"
 * - insertAfter: "after"
 * - replaceAll: "replaceWith"
 * @param fn the delegate function
 * @param selector the selector
 * @return FBjqRY object
 */
var delegateManipulation = function(name, fn, selector) {
    var ret = [], insert = FBjqRY(selector).nodes;

    for ( var i = 0, len = insert.length; i < len; i++ ) {
        var elems = (i > 0 ? this.clone(true) : this).get();
        fn.apply( FBjqRY( insert[i] ), elems );
        ret = ret.concat( elems );
    }

    return this.pushStack( ret, name, selector );
};

var elemdisplay = {}; // helper for show()/hide()

var fxAttrs = [
    // height animations
    [ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
    // width animations
    [ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
    // opacity animations
    [ "opacity" ]
];
function genFx( type, num ){
	var obj = {};
	FBjqRY.each( fxAttrs.concat.apply( [], fxAttrs.slice(0,num) ), function() {
		obj[ this ] = type;
	});
	return obj;
}

var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/;
    //quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/;
    //isSimple  = /^.[^:#\[\.]*$/, undefined;

FBjqRY.fn = FBjqRY.prototype = {

    version: "0.3.0",
    
    //CORE
    //====================================

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
        else if ( typeof(selector.selector) !== 'undefined' ) {
            var nodes = selector.get();
            this.nodes = nodes.length ? nodes : [ nodes ];
            this.length = nodes.length;
            this.selector = selector.selector;
            this.context = selector.context;
            return this;
        }
        //Are we dealing with FB DOM Nodes?
        else if ( isFBNode(selector) || isFBNode(selector[0]) ) {
            this.nodes = selector.length ? selector : [ selector ];
            this.length = this.nodes.length;
            this.context = selector;
            return this;
        }
        else if ( typeof(selector) !== 'undefined' ) {
            var match = quickExpr.exec(selector);
            if ( match && ( match[1] || ! context ) ) { // Verify a match, and that no context was specified for #id
                if ( match[1] ) { // HANDLE: $(html) -> $(array)
                    this.nodes = Support.xhtml( match[1] ); // Support.html( match[1] );
                }
                else { // HANDLE: $("#id")
                    this.nodes = [];
                    var node = document.getElementById( match[3] );
                    if ( node ) this.nodes[0] = node;
                }
            }
            else {
                //context = context || document.getRootElement(); // @todo should be ok document itself makes no sense ?!
                // HANDLE: $(expr, [context]) -- which is just equivalent to: $(context).find(expr)
                this.nodes = find( null, selector, context );
            }
        }

        this.selector = selector;
        this.context = context || document; // @todo does the document make any sense with FBJS ?!
        this.length = this.nodes.length;
        return this;
    },

    selector: "", // start with an empty selector

    size: function() { return this.length; },
    
	toArray: function() { 
        //return slice.call( this, 0 ); // won't work with FBJS
        var array = [];
        for ( var i = 0, len = this.length; i < len; i++ ) {
            array[i] = this.nodes[i];
        }
        return array;
    },

    each: function(fn) {
        each(this.nodes, fn);
        return this;
    },
	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function(i) {
        // Return a 'clean' array or just the element :
		return typeof(i) === 'undefined' ? slice.call( this.nodes ) : this.nodes[i];
	},
    index: function(elem) {
        // If it receives a jQuery object, the first element is used
        if ( typeof(elem.selector) !== 'undefined' ) elem = elem.get(0);
        for ( var i = this.nodes.length - 1; i >= 0; i-- ) {
            if ( sameFBNode(elem, this.nodes[i]) ) break;
        }
        return i; // not found == -1
    },

    slice: function() {
        return this.pushStack( 
            slice.apply( this.nodes, arguments ),
            "slice", slice.call(arguments).join(",")
        );
    },
    
	eq: function( i ) {
		return i === -1 ? this.slice( i ) : this.slice( i, +i + 1 );
    },
	first: function() { return this.eq( 0 ); },
	last: function() { return this.eq( -1 ); },
    
	map: function( callback ) {
		return this.pushStack( map(this.nodes, function(elem, i){
			return callback.call( elem, i, elem );
		}));
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
            ret.selector = this.selector + (this.selector ? " " : "") + selector;
        }
        else if ( name ) {
            ret.selector = this.selector + "." + name + "(" + selector + ")";
        }
        // Return the newly-formed element set
        return ret;
    },
    // Force the current matched set of elements to become
    // the specified array of elements (destroying the stack in the process)
    // You should use pushStack() in order to do this, but maintain the stack
    /*
    setArray: function( elems ) {
        // Resetting the length to 0, then using the native Array push
        // is a super-fast way to populate an object with array-like properties
        this.length = 0;
        push.apply( this, elems );

        return this;
    }, */

    //ATTRIBUTES
    //====================================
    attr: function(name, value) {
        var options = name;
        // Look for the case where we're accessing a value
        if ( typeof(name) === 'string' ) {
            if ( typeof(value) === 'undefined' ) {
                var node = this.nodes[0];
                return node && Support.attr(node, name);
            }
            else {
                options = {};
                options[ name ] = value;
            }
        }
        // Check to see if we're setting values
        return this.each( function(i) {
            for ( name in options ) {
                var value = options[name];
                if ( FBjqRY.isFunction(value) ) value = value.call(this, i);
                Support.attr(this, name, value);
            }
        });
    },
	removeAttr: function(name) {
		return this.each(function() {
			//jQuery.attr( this, name, "" );
            Support.attr(this, name, '');
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
            var node, className, trim = FBjqRY.trim;
            value = trim( value );
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                node = this.nodes[i];
                node.addClassName(value);
                
                className = node.getClassName();
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

        if ( (value && typeof value === "string") || value === undefined ) {
            var node, className, trim = FBjqRY.trim;
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                node = this.nodes[i];
                if ( value ) { // remove
                    node.removeClassName(value);

                    className = node.getClassName();
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

    html: function(html) {
        if ( typeof(html) !== 'undefined' ) {
            //each(this.nodes, function() { Support.html(html, this); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                Support.html( html, this.nodes[i] );
            }
            return this;
        }
        return Support.error("html() getter not supported in FBJS");
    },

    fbml: function(fbml) {
        if ( typeof(fbml) !== 'undefined' ) {
            //each(this.nodes, function() { this.setInnerFBML(fbml); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setInnerFBML(fbml);
            }
            return this;
        }
        return Support.error("fbml() getter not supported in FBJS");
    },

    text: function(text) {
        if ( typeof(text) !== 'undefined' ) {
            //each(this.nodes, function() {  this.setTextValue(text); });
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                this.nodes[i].setTextValue(text);
            }
            return this;
        }
        return Support.error("text() getter not supported in FBJS");
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
                
                if ( FBjqRY.isArray(val) && /radio|checkbox/.test( node.getType() ) ) {
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

        node = this.nodes[0];
        if ( node ) {
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

                values = [];
                // Loop through all the selected options
                for ( i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
                    var option = options[ i ];
                    if ( option.getSelected() ) {
                        // We don't need an array for one selects
                        if ( one ) {
                            value = option.getValue();
                            break;
                        }
                        // Multi-Selects return an array
                        values.push( option.getValue() );
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
    },

    //added for our own uses
    dimensions: function() {
        var node = this.nodes[0];
        return {
            top:    node.getAbsoluteTop(),
            left:   node.getAbsoluteLeft(),
            width:  node.getOffsetWidth(),
            height: node.getOffsetHeight(),
            right:  node.getAbsoluteLeft() + node.getOffsetWidth(),
            bottom: node.getAbsoluteTop() + node.getOffsetHeight(),
            clientWidth: node.getClientWidth(),
            clientHeight: node.getClientHeight(),
            scrollTop: node.getScrollTop(),
            scrollLeft: node.getScrollLeft()
        };
    },

    //CSS:
    //========================================
	css: function( key, value ) {
		// ignore negative width and height values
		if ( (key == 'width' || key == 'height') && parseFloat(value) < 0 ) {
			value = undefined;
        }
        if ( Support.isString(key) && typeof(value) === 'undefined' ) {
            var node = this.nodes[0];
            return node && FBjqRY.curCSS(node, key); // getter
        }
        else {
            Support.style(this.nodes, key, value); // setter
            return this;
        }
	},

    offset: function() {
        var node = this.nodes[0];
        return {
            top:  node.getAbsoluteTop(),
            left: node.getAbsoluteLeft()
        };
    },

//    height: function(h) {
//        if (typeof h === 'undefined') {
//            return this.nodes[0].getOffsetHeight();
//        }
//        return this.css("height", h);
//    },
//
//    width: function(w) {
//        if (typeof w === 'undefined') {
//            return this.nodes[0].getOffsetWidth();
//        }
//        return this.css("width", w);
//    },

    //MANIPULATION:
    //========================================

    append: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [ content ];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {node.appendChild(this);});
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ ) node.appendChild( content[j] );
        }
        return this;
    },
    appendTo: function(content) {
        return delegateManipulation.call(this, 'appendTo', this.append, content);
    },
    //appendTo: function(nodes) { return FBjqRY(nodes).append(this); },

    prepend: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [ content ];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {node.insertBefore(this);});
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ ) node.insertBefore( content[j] );
        }
        return this;
    },
    prependTo: function(content) {
        return delegateManipulation.call(this, 'prependTo', this.prepend, content);
    },
    //prependTo: function(nodes) { return FBjqRY(nodes).prepend(this); },

    after: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {
        //        node.getParentNode().insertBefore(this, node.getNextSibling());
        //    });
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ )
                node.getParentNode().insertBefore( content[j], node.getNextSibling() );
        }
        return this;
    },
    insertAfter: function(content) {
        return delegateManipulation.call(this, 'insertAfter', this.after, content);
    },

    before: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        //each(this.nodes, function() {
        //    var node = this;
        //    each(content, function() {
        //        node.getParentNode().insertBefore(this, node);
        //    });
        //});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            for ( var j = 0; j < content.length; j++ )
                node.getParentNode().insertBefore( content[j], node );
        }
        return this;
    },
    insertBefore: function(content) {
        return delegateManipulation.call(this, 'insertBefore', this.before, content);
    },

    replaceWith: function(content) {
        return this.after(content).remove();
    },
    replaceAll: function(content) {
        return delegateManipulation.call(this, 'replaceAll', this.replaceWith, content);
    },

    wrapAll: function(html) {
        var node = this.nodes[0];
		if ( node ) {
			// The elements to wrap the target around
			var wrap = FBjqRY( html ).clone();

			if ( node.getParentNode() ) {
				wrap.insertBefore( node );
            }
			wrap.map( function() {
				var elem = this, child = this.getFirstChild();
				while ( child ) {
                    elem = child;
                    child = elem.getFirstChild();
                }
				return elem;
			}).append(this);
		}
		return this;
    },
	wrapInner: function( html ) {
		return this.each(function() {
			FBjqRY(this).contents().wrapAll(html);
		});
	},
	wrap: function( html ) {
		return this.each(function() {
			FBjqRY(this).wrapAll(html);
		});
	},

    empty: function() {
        this.children().remove();
        return this;
    },

    remove: function(expr) {
        //each(this.nodes, function() {
        //    if ( ! expr || is(expr, [ this ]) ) {
        //        this.getParentNode().removeChild(this);
        //    }
        //});
        var nodeArray = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i]; nodeArray[0] = node;
            if ( ! expr || is(expr, nodeArray) ) {
                node.getParentNode().removeChild(node);
            }
        }
        return this;
    },

    clone: function(includeEvents) {
        var cloned = [];
        //each(this.nodes, function() {cloned.push( this.cloneNode() );});
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            cloned.push( this.nodes[i].cloneNode() );
        }
        return FBjqRY(cloned);
    },

    //TRAVERSING:
    //========================================
    hasClass: function(className) {
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            if ( this.nodes[i].hasClassName(className) ) return true;
        }
        return false;
    },

    filter: function(selector) {
        var fn = selector;
        if ( typeof(fn) === "string" ) {
            fn = function() { return is(selector, [ this ]); };
        } 
        // else it should already be a function
        var nodes = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            if ( fn.call( node, i ) ) nodes.push( node );
        }

        return this.pushStack( nodes, "filter", selector );
    },

    find: function(expr) {
        //return FBjqRY( find(this.nodes, expr) );
        /*
        var nodes = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            var node = this.nodes[i];
            nodes = nodes.concat( find([], expr, node) );
        }
        return this.pushStack( nodes, "find", expr ); */
        return this.pushStack( find(this.nodes, expr), "find", expr );
    },

    is: function( selector ) {
        return is(selector, this.nodes);
    },

    not: function( selector ) { // @todo TEST
        //filter out specified nodes
        var notNodes;
        if ( typeof(selector.selector) !== 'undefined' ) notNodes = selector.nodes;
        else if ( FBjqRY.isArray(selector) ) notNodes = selector;

        if ( notNodes ) {
            var nodes = this.get(); // is a copy already
            for ( var i = 0, len = notNodes.length; i < len; i++ ) {
                var idx = indexOf( notNodes[i], nodes );
                if ( idx != -1 ) nodes.splice(idx, 1); // remove element
            }
        }
        else { // expr assumed to be a selector :
            notNodes = find(this.nodes, selector);
        }
        
        return this.pushStack( nodes, "not", selector );
    },

	add: function( selector ) {
        var selNodes = Support.isString(selector) ?
            //find( null, selector ) :
            FBjqRY( selector ).nodes : // selector might be a html string !
                FBjqRY.makeArray( selector );

		return this.pushStack( FBjqRY.unique( merge(
			this.get(), // it's a clone
			selNodes
		)));
	},
    /*
    add: function(expr) {
        var nodes = FBjqRY(expr);
        this.nodes = this.nodes.concat(nodes.get());
        this.nodes = FBjqRY.unique(this.nodes);
        return this;
    }, */

    children: function(selector) {
        var children = [];
        for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
            children = children.concat( this.nodes[i].getChildNodes() );
        }
        //var ret = FBjqRY(unique(children));
        //return selector ? ret.filter(selector) : ret;

        var nodes = FBjqRY.unique(children);
        if ( selector ) nodes = filter(selector, nodes);
        return this.pushStack( nodes, "children", selector );
        
        /*
        if (expr) {
            children = FBjqRY(this.nodes).find(expr).get();
        } 
        else {
            children = [];
            for ( var i = 0, len = this.nodes.length; i < len; i++ ) {
                children = children.concat( this.nodes[i].getChildNodes() );
            }
        }
        return FBjqRY(unique(children));
        */
    },
    contents: function() { // @todo: This doesn't feel right... TEST
        function grabNodes(node) {
            var nodes = node.getChildNodes();
            for (var i = 0, len = nodes.length; i < len; i++) {
                nodes = nodes.concat(grabNodes(nodes[i]));
            }
            return nodes;
        }

        var nodes = this.nodes;
        for (var i = 0; i < nodes.length; i++) {
            nodes = nodes.concat(grabNodes(nodes[i]));
        }
        return FBjqRY(FBjqRY.unique(nodes)); // @todo pushStack
    },

    next: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            nodeArray[0] = sibling;
            if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "next", selector );
    },
    nextAll: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getNextSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getNextSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "nextAll", selector );
    },
    prev: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            nodeArray[0] = sibling;
            if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prev", selector );
    },
    prevAll: function(selector) {
        var siblings = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            while ( sibling ) {
                nodeArray[0] = sibling;
                if ( ! selector || is(selector, nodeArray) ) siblings.push(sibling);
                sibling = sibling.getPreviousSibling();
            }
        }
        //return FBjqRY(FBjqRY.unique(siblings));
        return this.pushStack( FBjqRY.unique(siblings), "prevAll", selector );
    },

    parent: function(selector) {
        var parents = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode(); nodeArray[0] = node;
            if ( ! selector || is(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                parents.push(node);
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parent", selector );
    },
    parents: function(selector) {
        var parents = [], len = this.nodes.length, nodeArray = [];
        for (var i = 0; i < len; i++) {
            var node = this.nodes[i].getParentNode();
            while ( node ) {
                 nodeArray[0] = node;
                if( ! selector || is(selector, nodeArray) /* FBjqRY(node).is(expr) */ ) {
                    parents.push(node);
                }
                node = node.getParentNode();
            }
        }
        //return FBjqRY(FBjqRY.unique(parents));
        return this.pushStack( FBjqRY.unique(parents), "parents", selector );
    },

    siblings: function(expr) {
        return this.prevAll(expr).concat(this.nextAll(expr)); // @todo pushStack !
    },

    andSelf: function() { // @todo
        return this.add( this.prevObject );
    },
    end: function() { // @todo
        return this.prevObject || FBjqRY( [] );
    },

    //EVENTS:
    //========================================

    ready: function(fn) {setTimeout( function() {fn();} );},

    bind: function(type, fn) { //removed "data" argument
        var outerThis = this;
        each(this.nodes, function() {
            this.addEventListener(type, function(evt) {
                return fn.apply(this, [evt]);
            });
            return outerThis;
        }, [type, fn]);
        return this;
    },

    one: function(type, fn) { //removed "data" argument
        var outerThis = this;
        each(this.nodes, function() {
            this.addEventListener(type, function(evt) {
                var retVal = fn.apply(this, [evt]);
                this.purgeEventListeners(type);
                return retVal;
            });
            return outerThis;
        }, [type, fn]);
    },

    trigger: function(type, data) { //the events we can trigger are limited
        each(this.nodes, function() { this[type](); });
    },

    triggerHandler: function(type, data) {
        if ( this.get(0) ) {
            //var event = jQuery.Event(type);
            //event.preventDefault();
            //event.stopPropagation();
            //jQuery.event.trigger( event, data, this[0] );
            //return event.result;
            return this[type]();
        }
    },

    unbind: function(type, data) {
        each(this.nodes, function() { this.purgeEventListeners(type); }, [type]);
        return this;
    },

    hover: function(over, out) {
        this.mouseover(over);
        this.mouseout(out);
    },

    toggle: function() {
        var allFuncs = arguments;
        var length = arguments.length;
        each(this.nodes, function() {
            var i = 0;
            FBjqRY(this).click(function() {
                allFuncs[i].apply(this);
                i = (i + 1) % length;
            });
        });
        return this;
    },

    //All other event handlers defined later

    //EFFECTS:
    //========================================
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
	hide: function(speed,callback) {
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
    },

    fadeTo: function(speed, opacity, cb) {
        return this.animate({ opacity: opacity }, speed, null, cb);
    },

    animate: function(params, dur, easing, cb, neitherShowHide) {
        var parseSpeed = function(speed) { // @todo fx.speeds ?
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

        dur = parseSpeed(dur);
        var hide = (neitherShowHide == 2);
        var show = (neitherShowHide == 1);

        var animObj = function(n) {
            var obj = Animation(n).duration(dur); // FB Animation
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
        if (cb) setTimeout(cb, dur);
        return this;
    },

    stop: function() {
        each(this.nodes, function() {Animation(this).stop();});
    },

    //queue: function(cb_Q) {},
    //dequeue: function() {},

    //AJAX:
    //========================================
    /*
    serialize: function() {
        return this.serializeArray().join("&");
    },

    serializeArray: function() {
        var obj = this.serializeHash();
        var ary = [];
        for ( var o in obj ) {
            if ( obj.hasOwnProperty(o) ) {
                ary.push( o + "=" + escape(obj[o]) );
            }
        }
        return ary;
    },

    serializeHash: function() {
        // nodes[0] must be a form
        return this.nodes[0].serialize();
    } */
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
				( this.getChecked() || /select|textarea/i.test(this.getTagName()) ||
					/text|hidden|password|search/i.test(this.getType()) );
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
};

/*
each({
    appendTo: "append",
    prependTo: "prepend",
    insertBefore: "before",
    insertAfter: "after",
    replaceAll: "replaceWith"
}, function(name, original) {
//	FBjqRY.fn[ name ] = function() {
//        var args = arguments;
//        return this.each(function() {
//                for ( var i = 0, len = args.length; i < len; i++ )
//                        FBjqRY( args[i] )[ original ]( this );
//        });
//	};
    FBjqRY.fn[name] = FBjqRY.prototype[name] = function(selector) {
	//FBjqRY.fn[name] = function(selector) {
        var ret = [], insert = FBjqRY(selector).nodes;

        for ( var i = 0, len = insert.length; i < len; i++ ) {
            var elems = (i > 0 ? this.clone(true) : this).get();
            FBjqRY.fn[ original ].apply( FBjqRY(insert[i]), elems );
            ret = ret.concat( elems );
        }

        return this.pushStack( ret, name, selector );
	};
});
*/

//Add all common event handler methods
var validEvents = ("blur,change,click,dblclick,error,focus,keydown,keypress,keyup,load,"  +
                   "mousedown,mousemove,mouseout,mouseover,mouseup,resize,scroll,select," +
                   "submit,unload").split(",");
for ( var i = validEvents.length - 1; i >= 0; i-- ) {
    (function() {
        var ev = validEvents[i];
        FBjqRY.fn[ev] = function(fn) {return fn ? this.bind(ev, fn) : this.trigger(ev);};
    })();
}

FBjqRY.fn.init.prototype = FBjqRY.fn;

//FBjqRY.extend = FBjqRY.fn.extend = extend;
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
	if ( typeof target !== "object" && ! Support.isFunction(target) ) {
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
		--i;
	}

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
					target[ name ] = FBjqRY.extend( deep,
						// Never move original objects, clone them
						src || ( copy.length != null ? [ ] : { } )
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
    //AJAX:
    //========================================
    ajax: function(options) {
		// Extend the settings, but re-extend 's' so that it can be
		// checked again later (in the test suite, specifically)
		options = FBjqRY.extend(true, {}, FBjqRY.ajaxSettings, options);

		// convert data if not already a string
		//if ( options.data && options.processData && typeof options.data !== "string" ) {
		//	options.data = FBjqRY.param(options.data);
        //}

        var ajax = new Ajax();
        ajax.responseType = options.dataType;
        ajax.ondone = options.success;
        ajax.onerror = function() {
            var retryCount = options.retryCount || 0;
            Support.log("ajax() error occurred, retrying ...");
            if ( retryCount-- > 0 ) {
                options.retryCount = retryCount;
                FBjqRY.ajax(options);
            }
            else {
                FBjqRY.handleError(options, ajax, null);
            }
        };
		try {
			ajax.post(options.url, options.data);
		}
        catch(e) {
			FBjqRY.handleError(options, ajax, e);
		}
    },
	// Counter for holding the number of active queries
	active: 0,
    
    //load: function(url, data, cb) {},  //-- defined in EVENTS
    /*
    genericAJAX: function(url, data, cb, type, retryCount) {
        retryCount = retryCount || 3;
        if( ! cb && FBjqRY.isFunction(data) ) {
            cb = data;
            data = null;
        }
        var ajax = new Ajax();
        ajax.responseType = type;
        ajax.ondone = cb;
        ajax.onerror = function() {
            console.error("AJAX error occurred! Retrying...");
            if ( retryCount > 0 ) FBjqRY.genericAJAX(url, data, cb, type, retryCount-1);
        };
        ajax.post(url, data);
    }, */
	post: function( url, data, callback, type ) {
		if ( FBjqRY.isFunction( data ) ) {
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
	get: function( url, data, callback, type ) {
		// shift arguments if data argument was ommited
		if ( FBjqRY.isFunction( data ) ) {
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
	getJSON: function( url, data, callback ) {
		return FBjqRY.get(url, data, callback, Ajax.JSON);
	},
    
    getScript: function(url, cb) {
        return Support.error("getScript() not supported in FBJS");
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

	handleError: function( options, ajax, e ) {
		// If a local callback was specified, fire it
		if ( options.error ) options.error( ajax, e );
		// Fire the global callback
		//if ( options.global ) jQuery.event.trigger( "ajaxError", [xhr, s, e] );
	},
    
	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( a ) {
		var s = [];
		function add( key, value ){
			s.push( encodeURIComponent(key) + '=' + encodeURIComponent(value) );
		}

        if ( typeof(a.selector) !== 'undefined' ) a = a.nodes;
		// If an array was passed in, assume that it is an array of form elements
		if ( FBjqRY.isArray(a) ) {
			// Serialize the form elements
			FBjqRY.each( a, function() { add( this.name, this.value ); });
        }
		// Otherwise, assume that it's an object of key/value pairs
		else {
			// Serialize the key/values
			for ( var j in a )
				// If the value is an array then the key names need to be repeated
				if ( FBjqRY.isArray( a[j] ) ) {
					jQuery.each( a[j], function(){ add( j, this ); });
                }
				else add( j, FBjqRY.isFunction(a[j]) ? a[j]() : a[j] );
        }
		// Return the resulting serialization
		return s.join("&").replace(/%20/g, "+");
	},

    //UTILITIES:
    //========================================

    isFunction: Support.isFunction,
    isArray: Support.isArray,
    isEmptyObject: Support.isEmptyObject,

    trim: Support.trim,
    
    each: Support.each,
    map: Support.map,
    grep: Support.grep,
    merge: Support.merge,
    
    /*
    map: function( elems, callback ) {
        if ( FBjqRY.isFunction(elems) ) {
            callback = elems;
            elems = this.nodes;
        }
        var ret = [];

        for (var i = 0, length = elems.length; i < length; i++) {
            var value = callback(elems[i], i);
            if ( value !== null ) ret[ ret.length ] = value;
        }

        return ret.concat.apply([], ret);
    }, */

	makeArray: function( array, results ) { // results is for internal usage only
		var ret = results || [];

		if( array != null ) {
			var i = array.length;
			// The window, strings (and functions) also have 'length'
			if( i == null || isString(array) || FBjqRY.isFunction(array) || array.setInterval ) {
				ret[0] = array;
            } else {
                if ( typeof(array.selector) !== 'undefined' ) {
                    array = array.nodes;
                }
                FBjqRY.merge( ret, array ); // while ( i ) ret[--i] = array[i];
            }
		}

		return ret;
	},

    /*
    inArray: function(value, array) { // array.indexOf
        if ( array.indexOf ) return array.indexOf( value );

        var fn = function(a, b) { return a === b; };
        if ( value.equals ) fn = function(a, b) { return a.equals(b); };

        for ( var i = 0, len = array.length; i < len; i++ ) {
            if ( fn(value, array[i]) ) return i;
        }
        
        return -1;
    },
    indexOf: function(value, arr) { return this.inArray(value, arr); },
    */
    inArray: indexOf,
    indexOf: indexOf,

    unique: function(array) {
        // @todo ?
        // swap to jQuery version if we ever implement "data" method
        return unique(array);
    },

	parseJSON: function(data) {
		if ( ! isString(data) || ! data ) return null;

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		//data = jQuery.trim( data );

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			return Support.json(data);

		} else {
			FBjqRY.error( "Invalid JSON: " + data ); // @ todo error function !
		}
	},

	nodeName: function(elem, name) {
		return elem.getTagName && elem.getTagName().toUpperCase() === name.toUpperCase();
	},
    
	css: function( elem, name, force, extra ) {
		if ( name === "width" || name === "height" ) {
            var props = { position: "absolute", visibility: "hidden", display:"block" },
                which = name === "width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ];
            var val;
			function getWH() {
				val = name === "width" ? elem.getOffsetWidth() : elem.getOffsetHeight();
				if ( extra === "border" ) return;

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
			}

			if (elem.getOffsetWidth() !== 0) getWH();
			else FBjqRY.swap( elem, props, getWH );

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
		// Make sure we're using the right name for getting the float value
		if ( name.match( /float/i ) ) {
            name = 'cssFloat'; //FBjqRY.support.cssFloat ? "cssFloat" : "styleFloat";
        }
        
		//if ( ! force && elem.getStyle && elem.getStyle(name) ) {
        //    ret = elem.getStyle(name);
        //}
		//else
        if ( elem.getStyle ) {
			ret = elem.getStyle( Support.camelCase(name) );

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
            var camelName = Support.camelCase(name);
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
            else if ( proxy && !jQuery.isFunction( proxy ) ) {
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
			proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
		}

		// So proxy can be declared as an argument
		return proxy;
	}

});

// innerHeight/innerWidth, outerHeight/outerWidth, height/width methods :
FBjqRY.each([ "Height", "Width" ], function(i, name) {

	var tl = i ? "Left"  : "Top",  // top or left
		br = i ? "Right" : "Bottom", // bottom or right
		lower = name.toLowerCase();

	// innerHeight and innerWidth
	FBjqRY.fn["inner" + name] = function(){
        var node = this.nodes[0];
		return node ? jQuery.css( node, lower, false, "padding" ) : null;
	};

	// outerHeight and outerWidth
	FBjqRY.fn["outer" + name] = function(margin) {
        var node = this.nodes[0];
		return node ? jQuery.css( node, lower, false, margin ? "margin" : "border" ) : null;
	};

	var type = lower;
    
	FBjqRY.fn[ type ] = function( size ) {

		if ( jQuery.isFunction( size ) ) {
			return this.each( function(i) {
				var self = jQuery( this );
				self[ type ]( size.call( this, i, self[ type ]() ) );
			});
		}
        
		// Get or set width or height on the element
        return size === undefined ?
            // Get width or height on the element
            (this.length ? FBjqRY.css( this.nodes[0], type ) : null) :
            // Set the width or height on the element (default to pixels if value is unitless)
            this.css( type, typeof size === "string" ? size : size + "px" );
	};

});

// ============================================================================
/** jQuery FX */
// ============================================================================
FBjqRY.extend({
    speed: function(speed, easing, fn) {
        var opt = speed && speed.constructor == Object ? speed : {
            complete: fn || !fn && easing || FBjqRY.isFunction( speed ) && speed,
            duration: speed,
            easing: fn && easing || easing && easing.constructor != Function && easing
        };

        opt.duration =
            ( opt.duration && typeof(opt.duration) == 'number' ?
                opt.duration : FBjqRY.fx.speeds[opt.duration] )
                    || FBjqRY.fx.speeds.def;

        // Queueing
        opt.old = opt.complete;
        opt.complete = function() {
            if ( opt.queue !== false ) FBjqRY(this).dequeue();
            if ( FBjqRY.isFunction( opt.old ) ) opt.old.call( this );
        };

        return opt;
    },

    easing: {
        linear: function( p, n, firstNum, diff ) {return firstNum + diff * p;},
        swing: function( p, n, firstNum, diff ) {return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;}
    },

    timers: [],
    timerId: null,
    
    fx: function( elem, options, prop ){
        this.options = options;
        this.elem = elem;
        this.prop = prop;

        if ( !options.orig ) options.orig = {};
    }

});

FBjqRY.fx.prototype = {
	// Simple function for setting a style value
	update: function(){
		if ( this.options.step ) this.options.step.call( this.elem, this.now, this );

		(FBjqRY.fx.step[this.prop] || FBjqRY.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( this.prop == "height" || this.prop == "width" )
			this.elem.setStyle('display', "block");
	},
	// Get the current size
	cur: function(force){
		if ( this.elem[this.prop] != null && this.elem.getStyle(this.prop) == null )
			return this.elem[ this.prop ];

		var r = parseFloat(FBjqRY.css(this.elem, this.prop, force)); // @todo curCSS :
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},
	// Start an animation from one number to another
	custom: function(from, to, unit){
		this.startTime = +new Date; //now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;
		this.update();

		var self = this;
		var t = function(gotoEnd) {
			return self.step(gotoEnd);
		}
		t.elem = this.elem;

		FBjqRY.timers.push(t);

		if ( FBjqRY.timerId == null ) {
			FBjqRY.timerId = setInterval(function(){
				var timers = FBjqRY.timers;

				for ( var i = 0; i < timers.length; i++ )
					if ( !timers[i]() )
						timers.splice(i--, 1);

				if ( !timers.length ) {
					clearInterval( FBjqRY.timerId );
					FBjqRY.timerId = null;
				}
			}, 13);
		}
	},
	// Simple 'show' function
	show: function(){
		// Remember where we started, so that we can go back to it later
		//this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.orig[this.prop] = this.elem.getStyle(this.prop);
		this.options.show = true;

		// Begin the animation
		this.custom(0, this.cur());

		// Make sure that we start at a small width/height to avoid any
		// flash of content
		if ( this.prop == "width" || this.prop == "height" ) {
			this.elem.setStyle(this.prop, "1px");
        }

		// Start by showing the element
		FBjqRY(this.elem).show();
	},

	// Simple 'hide' function
	hide: function(){
		// Remember where we started, so that we can go back to it later
		//this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
        this.options.orig[this.prop] = this.elem.getStyle(this.prop);
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function(gotoEnd){
		var t = +new Date; //now();

		if ( gotoEnd || t > this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			var done = true;
			for ( var i in this.options.curAnim )
				if ( this.options.curAnim[i] !== true )
					done = false;

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.setStyle('overflow', this.options.overflow);

					// Reset the display
					this.elem.setStyle('display', this.options.display);
					//if ( jQuery.css(this.elem, "display") == "none" ) {
                    if (this.elem.getStyle("display") == "none") {
						this.elem.setStyle('display', "block");
                    }
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide )
                    this.elem.setStyle('display', "none");

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show ) {
					//for ( var p in this.options.curAnim )
						//jQuery.attr(this.elem.style, p, this.options.orig[p]);
                    var style = {}
                    for ( var p in this.options.curAnim ) {
                        style[p] = this.options.orig[p]
                    }
                    FBjqRY.attr('style', style);
                }
			}

			if ( done )
				// Execute the complete function
				this.options.complete.call( this.elem );

			return false;
		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			this.pos = FBjqRY.easing[this.options.easing || (FBjqRY.easing.swing ? "swing" : "linear")](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}

};

FBjqRY.extend( FBjqRY.fx, {
    speeds: {
        slow: 600,
        fast: 200,
        // Default speed
        def: 400
    },
    step: {
        scrollLeft: function(fx) {fx.elem.scrollLeft = fx.now;},
        scrollTop: function(fx) {fx.elem.scrollTop = fx.now;},
        opacity: function(fx) {
            //jQuery.attr(fx.elem.style, "opacity", fx.now);
            FBjqRY.attr('style', {"opacity": fx.now});
        },
        _default: function(fx) {
            //fx.elem.style[ fx.prop ] = fx.now + fx.unit;
            fx.elem.setStyle(fx.prop, fx.now + fx.unit);
        }
    }
});

// ============================================================================
/** jQuery data */
// ============================================================================

//var expando = "jQuery" + (+ new Date), uuid = 0; //windowData = {};
FBjqRY.extend({
    cache: {},
    data: function( elem, name, data ) {
//        var id = getFBNodeId(elem, true), cache = FBjqRY.cache, thisCache;
//        if ( ! id ) {
//            if ( typeof(name) === "string" && typeof(data) === 'undefined' ) return null;
//        }
//        else {
//            id = getFBNodeId(elem, false);
//        }
        var id = getFBNodeId(elem), cache = FBjqRY.cache, thisCache;

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
        var id = getFBNodeId(elem, true), cache = FBjqRY.cache; 
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

    queue: function( elem, type, data ) {
        if ( elem ) {
            type = (type || "fx") + "queue";
            var q = FBjqRY.data( elem, type );

            if ( !q || FBjqRY.isArray(data) ) {
                q = FBjqRY.data( elem, type, FBjqRY.makeArray(data) );
            }
            else if ( data ) q.push( data );
        }
        return q;
    },
    dequeue: function( elem, type ) {
        var queue = FBjqRY.queue( elem, type ), fn = queue.shift();

        if ( !type || type === "fx" ) fn = queue[0];
        if ( typeof(fn) !== 'undefined' ) fn.call(elem);
    }
});

FBjqRY.fn.extend({
    data: function( key, value ) {
        if ( typeof(key) === 'undefined' && this.length ) {
            return FBjqRY.data( this.nodes[0] );
        }
        else if ( typeof key === "object" ) {
            return this.each(function() {FBjqRY.data( this, key );});
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
        return this.each(function(){FBjqRY.removeData( this, key );});
    },

    queue: function(type, data) {
        if ( typeof type !== "string" ) {
            data = type; type = "fx";
        }

        if ( typeof(data) === 'undefined' ) return FBjqRY.queue( this.get(0), type );

        return this.each(function() {
            var queue = FBjqRY.queue( this, type, data );
            if ( type == "fx" && queue.length == 1 ) queue[0].call(this);
        });
    },
    dequeue: function(type) {
        return this.each(function(){FBjqRY.dequeue( this, type );});
    }
});

})();

//set $ and jQuery to be shortcuts to FBjqRY
var jQuery = FBjqRY, $ = FBjqRY;
