/*
 Current HTML Parser by: Nate McQuay for use with Facebook (FBJS)
 Based on HTML Parser by: John Resig (ejohn.org)
 Original code came from: http://ejohn.org/blog/pure-javascript-html-parser/
 Original code by: Erik Arvidsson, Mozilla Public License
 http://erik.eae.net/simplehtmlparser/simplehtmlparser.js

 // Usage: 
 // inject into an existing FBDOM node
 Utility.html(htmlString, FBNode);
 
 // return array of parsed nodes
 var nodes = Utility.html(htmlString);
 
 Utility.html is the exposed function for HTMLtoDOM
*/

/*
  Current JSON parser modified by: Nate McQuay for use with Facebook (FBJS)
  Original parser by: Mike Samuel
  Original code from: http://code.google.com/p/json-sans-eval/
  
  // Usage:
  // return a js object
  Utility.json(jsonString);
*/

var Utility = {};  //expose variable globally
(function() {

//IE console work-arounds
if(typeof console == 'undefined') { console = {}; }
if(typeof console.error != 'function') {  console.error = function() {}; }

Utility.trim = function(s) { return s.replace(/^\s+|\s+$/g, ""); };
Utility.memo = function(fn, cache) {
    cache = cache || {};
    return function(p) {
        if(p && cache[p]) { return cache[p]; }
        cache[p] = fn(p);
        return cache[p];
    };
};
Utility.camelCase = Utility.memo(function(s) { 
    return s.replace(/\-(\w)/g, function(all, letter){ return letter.toUpperCase(); });
});
Utility.attr = (function() {
    var validAttrs = {},
        trim = Utility.trim,
        attrAry = ("accessKey,action,checked,className,cols,colSpan,dir,disabled,href,id," +
                   "maxLength,method,name,readOnly,rows,rowSpan,selected,selectedIndex," +
                   "selection,src,style,tabIndex,target,title,type,value").split(",");
    for(var i = 0, length = attrAry.length; i < length; i++) {
       validAttrs[attrAry[i].toLowerCase()] = attrAry[i];
    }
    validAttrs["class"] = "className";

    function setStyle(node, v) { //a special case for the set style attr method
        v = v.split(";");
        var s, name;
        for(var i = 0, length = v.length; i < length; i++) {
            s = v[i].split(":");
            if(s.length == 2) {
                name = Utility.camelCase(trim(s[0].toLowerCase()));
                if(name == 'float') { name = 'cssFloat'; }
                node.setStyle(name, trim(s[1]));
            }
        }
    }

    return function(node, attr, v) {
       var orig = attr;
       attr = validAttrs[attr.toLowerCase()];
       if(!attr) {
           console.error("The attribute " + orig + " is not currently supported in FBJS!");
           return;
       }

       var method = (typeof v != "undefined") ? "set" : "get";
       method += attr.charAt(0).toUpperCase() + attr.substr(1);
       if(v || v === "" || v === 0) {
           if(method == "setStyle") { setStyle(node, v); }
           else { node[method](v); }
           return node;
       }
       return node[method]();
    };
})();
Utility.makeMap = function(s){
    var obj = {}, items = s.split(",");
    for (var i = 0, l = items.length; i < l; i++) {
        obj[ items[i] ] = true;
    }
    return obj;
};
Utility.each = function(obj, cb, args) {
    if(!obj || !obj.length) { return []; }

    var p, i = 0, length = obj.length;
    if(args) {
        if(length) {
            for(;i < length; i++) { cb.apply(obj[i], args); }
        } else {
            for(p in obj) { 
                if (obj.hasOwnProperty(p)) { cb.apply(obj[p], args); }
            }
        }
    } else {
        if(length) {
            for(;i < length; i++) { cb.call(obj[i]); }
        } else {
            for(p in obj) {
                if (obj.hasOwnProperty(p)) { cb.call(obj[p]); }
            }
        }
    }
    return obj;
};
Utility.unique = function(ary) {
    if(!ary || !ary.length) { return []; }

    var ret = [], done = {}, index;
    var indexFn = function(elem) { return elem; };
    //unique identifier for FBDOM nodes
    if(ary[0].__instance || ary[0].__instance === 0) { 
        indexFn = function(elem) { return elem.__instance; };
    }

    for(var i = 0, length = ary.length; i < length; i++) {
        index = indexFn(ary[i]);
        if(!done[index]) {
            done[index] = true;
            ret.push(ary[i]);
        }
    }
    return ret;
};
Utility.indexOf = function(elem, ary) {
    var cmpFn = function(v) { return (elem === v); };
    if(elem.equals) { cmpFn = function(v) { return elem.equals(v); }; }
    if(elem.__instance || elem.__instance === 0) {
        cmpFn = function(v) {
            return v.__instance && (elem.__instance === v.__instance);
        };
    }
    for(var i = 0, l = ary.length; i < l; i++) {
        if(cmpFn(ary[i])) { return i; }
    }
    return -1;
};
//alias of indexOf
Utility.inArray = function(elem, ary) { return Utility.indexOf(elem, ary); };

//Modified json parser begins here:
Utility.json = (function() {
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
        console.error('unsupported initial json token: ' + tok);
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
    if (stack.length) { console.error('Could not fully process json object'); }

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

//Modified htmlparser begins here:
Utility.html = (function() {

// Regular Expressions for parsing tags and attributes
var startTag = /^<(\w+)((?:\s+\w+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
    endTag = /^<\/(\w+)[^>]*>/,
    attr = /(\w+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
    endTable = /<\/(table)>/,
    makeMap = Utility.makeMap,
    each = Utility.each;

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

function parseEndTag(tag, tagName) {
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
}

function parseStartTag(tag, tagName, rest, unary) {
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
}

function replaceFn(all, text) {
    text = text.replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
               .replace(/<!--(.*?)-->/g, "$1");
    if(handler.chars) { handler.chars(text); }
    return "";
}

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

    while(html) {
        chars = true;
        // Make sure we're not in a script or style element
        if(!stack.last() || !special[stack.last()]) {
            // Comment
            if(html.indexOf("<!--") === 0) {
                index = html.indexOf("-->");
                if(index >= 0) {
                    if(handler.comment) { handler.comment(html.substring(4, index)); }
                    html = html.substring(index + 3);
                    chars = tbodyCheck = false;
                }
            } else if(html.indexOf("</") === 0) { // end tag
                match = html.match(endTag);
                if(match) {
                    html = html.substring(match[0].length);
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
                    html = html.substring(match[0].length);
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
                    testStr = html.substring(index);
                    match = testStr.match(startTag);
                    if(match) { break; }
                    match = testStr.match(endTag);
                    if(match) { break; }
                    match = testStr.match(commentReg);
                    if(match) { break; }
                    index = html.indexOf("<", index + 1);
                }

                var text = index < 0 ? html : html.substring(0, index);
                if(Utility.trim(text)) {
                    text = entityReplace(text);
                    handler.chars(text);
                }
                html = index < 0 ? "" : html.substring(index);
            }
        } else {
            html = html.replace(new RegExp("(.*)<\/" + stack.last() + "[^>]*>"), replaceFn);
            parseEndTag("", stack.last());
        }

        if(html == last) { throw "Parse Error: " + html; }
        last = html;
    }

    parseEndTag(); // Clean up any remaining tags
}

var elems, startNode, curParentNode, children;
handler = {
    start: function(tagName, attrs, unary) {
        var el = document.createElement(tagName);
        each(attrs, function() { Utility.attr(el, this.name, this.value); }, [el]);

        if(curParentNode && curParentNode.appendChild) {
            curParentNode.appendChild(el);
        }
            
        if(!unary) {
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

    if(!doc) { return children; }
    doc.setTextValue('');
    each(children, function() { doc.appendChild(this); }, [doc]);
    return doc;
};
})(); // -- END Utility.html
})(); // -- END Utility function wrapper