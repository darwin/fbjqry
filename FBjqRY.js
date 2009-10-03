//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//NOTE: must include Utility.js before include this library
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//A wrapper for FBJS to make it feel more like jQuery
//About name:
// FB   = Facebook
// jqRY = jQuery
// RY   = RockYou!
//Author: Nate McQuay [borrowing heavily from jQuery 1.2.6]
//=====================================================

//can't wrap this because it needs to be "global" and we don't have access to the window object
var FBjqRY = function(selector, context) {
    return new FBjqRY.prototype.init(selector, context);
};

//We can wrap everything else
(function() {

var trim = Utility.trim;
var unique = Utility.unique;
var each = Utility.each;

function parseSpeed(speed) {
    if(typeof(speed) == "string") {
        speed = trim(speed).toLowerCase();
        switch(speed) {
            case "fast": speed = 200; break;
            case "slow": speed = 600; break;
            default: speed = 400; break;
        }
    }
    return speed ? speed : 400;
}

//function to notify programmers when expected functionality is missing
function notSupported(errStr) {
    if(console && console.log) {
      if(errStr) {
        console.log(errStr);
      } else {
        console.log("The method you are trying to use is not yet supported by FBjqRY or FBJS");
      }
    }
}

var find = (function() {
    var idCheck = /^#(\w+)/,
        classCheck = /^\.([\w\-]+)/,
        tagCheck = /^([A-Za-z_]{1}\w*)/,
        attributeCheck = /^\[(\w+)(!|\^|\$|\*)?=?"?'?([^\]]+)?'?"?\]/,
        pseudoCheckParen = /^:(\w+)\("?'?([^\)]+)'?"?\)/,
        pseudoCheck = /^:(\w+)/;

    function filter(nodes, fn, args, getChildren) {
        var retNodes = [];
        if(!nodes || !nodes.length) { return []; }

        for(var i = 0, length = nodes.length; i < length; i++) {
            var retVal = fn.apply(nodes[i], args);
            if(retVal) { retNodes.push(nodes[i]); }
            if(getChildren) {
                retNodes = retNodes.concat(filter(nodes[i].getChildNodes(), fn, args, getChildren));
            }
        }
        return retNodes;
    }

    function selectById(nodes, id, t, getChildren) {
        if(nodes.length === 0) {
            nodes = [document.getElementById(id)];
        } else {
            nodes = filter(nodes, function() {
                return this.getId() == id;
            }, [id], true);
        }

        return nodes;
    }

    function selectByClass(nodes, cssClass, t, getChildren) {
        if(nodes.length === 0) {
            nodes = [document.getRootElement()];
        }

        nodes = filter(nodes, function() {
            return this.hasClassName(cssClass);
        }, [cssClass], getChildren);

        return nodes;
    }

    function selectByTag(nodes, tag, t, getChildren) {
        if(nodes.length === 0) {
            nodes = document.getRootElement().getElementsByTagName(tag);
        } else {
            var newNodes = [];
            for(var i = 0, length = nodes.length; i < length; i++) {
                newNodes = newNodes.concat(nodes[i].getElementsByTagName(tag));
            }
            nodes = newNodes;
        }
        return nodes;
    }

    function selectByAttribute(nodes, a, matchType, v, t, getChildren) {
        var matchFunc = null;
        switch(matchType) {
            case "!": matchFunc = function(a,b) { return a != b; }; break;
            case "^": matchFunc = function(a,b) { return a.indexOf(b) === 0; }; break;
            case "$": matchFunc = function(a,b) { return a.indexOf(b)+b.length == a.length; }; break;
            case "*": matchFunc = function(a,b) { return a.indexOf(b) >= 0; }; break;
            default:  
                if(v === true) {
                    matchFunc = function(a,b) { return !!a; };
                } else {
                    matchFunc = function(a,b) { return a == b; };
                }
                break;
        }

        nodes = filter(nodes, function() {
            return matchFunc(FBjqRY(this).attr(a), v);
        }, [a, v], getChildren);

        return nodes;
    }

    return function(nodes, t, context) {
        if(typeof(t) != "string") {
            if(t.length || t.length === 0) { return t; }
            return [t];
        }

        //Is context a valid FBDOM element
        if(context && !context.getElementById) { return []; }

        var getChildren, m, prevT,
            selectors = t.split(","),
            allNodes = [],
            origNodes = nodes;
        
        for(var i = 0, length = selectors.length; i < length; i++) {
            t = trim(selectors[i]);
            prevT = "";
            getChildren = true;
            while(t && t != prevT) {
                if(prevT) {
                    if(!nodes.length) { break; }
                    getChildren = (t.charAt(0) == " ");
                    t = trim(t);
                }
                prevT = t;
    
                //We should start with one of these first 3 cases (id, tag, class)
                m = idCheck.exec(t);
                if(m) {
                    nodes = selectById(nodes, m[1], t, getChildren);
                    t = t.substr(t.indexOf(m[1]) + m[1].length);
                    continue;
                }
    
                m = classCheck.exec(t);
                if(m) {
                    nodes = selectByClass(nodes, m[1], t, getChildren);
                    t = t.substr(t.indexOf(m[1]) + m[1].length);
                    continue;
                }
    
                m = tagCheck.exec(t);
                if(m) {
                    nodes = selectByTag(nodes, m[1], t, getChildren);
                    t = t.substr(t.indexOf(m[1]) + m[1].length);
                    continue;
                }
    
                //The remaining is subfiltering on nodes
                m = attributeCheck.exec(t);
                if(m) {
                    m[3] = m[3] || true; //if m[3] does not exist we are just checking if attribute exists
                    nodes = selectByAttribute(nodes, m[1], m[2], m[3], t, getChildren);
                    t = t.substr(t.indexOf("]") + 1);
                    continue;
                }
    
                m = pseudoCheckParen.exec(t);
                if (!m) { m = pseudoCheck.exec(t); }
                if(m) {
                    var matchStr = m[0];
                    var pseudo = m[1];
                    var v = m.length > 2 ? m[2] : null; //the value in the parenthesis
                    var vInt = v ? parseInt(v, 10) : null;
    
                    switch(pseudo) {
                        case "first": nodes = [nodes[0]]; break;
                        case "last":  nodes = [nodes[nodes.length - 1]]; break;
                        case "eq":    nodes = [nodes[vInt]]; break;
                        case "lt":    nodes = nodes.splice(0, vInt); break;
                        case "gt":    nodes = nodes.splice(vInt + 1, (nodes.length - vInt)); break;
                        case "even":  nodes = FBjqRY.grep(nodes, function(v, i) { return (i % 2 === 0); }); break;
                        case "odd":   nodes = FBjqRY.grep(nodes, function(v, i) { return (i % 2 == 1); }); break;
                        case "contains":
                                nodes = null;
                                notSupported("We cannot read from nodes, so we cannot support the :contains pseudo selector!");
                                break;
                        case "visible": nodes = filter(nodes, function() {
                                var node = FBjqRY(this);
                                return (node.attr("visibility") != "hidden" && node.attr("display") != "none");
                            }); break;
                        case "hidden": nodes = filter(nodes, function() {
                                var node = FBjqRY(this);
                                return (node.attr("visibility") == "hidden" || node.attr("display") == "none");
                            }); break;
                        //TODO: Finish adding pseudo selectors
                    }
    
                    t = t.substr(matchStr.length);
                    continue;
                }
            }
            if(t) {
                nodes = [];
                //console.log("We could not parse the remaining selector \"" + t + "\"");
            } else {
                allNodes = allNodes.concat(nodes);
                nodes = origNodes;
            }
        }

        return unique(allNodes);
    };
})();

var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/,
    isSimple  = /^.[^:#\[\.]*$/,
    undefined;

FBjqRY.fn = FBjqRY.prototype = {
    //CORE
    //====================================

    init: function(selector, context) {
        this.nodes = []; //each instance should have its own set of nodes
        if(!selector) { return; }
        var d = context || document;
        
        //Are we dealing with an FBjqRY object?
        if(selector.html && selector.css && selector.attr) {
            this.nodes = selector.get();
            this.nodes = this.nodes.length ? this.nodes : [this.nodes];
            this.length = this.nodes.length;
            return this;
        }

        //Are we dealing with FB DOM Nodes?
        if(selector.getNodeType || selector[0] && selector[0].getNodeType) {
            this.nodes = (selector.length) ? selector : [selector];
            this.length = this.nodes.length;
            return this;
        }

        var match = quickExpr.exec(selector);
        if (match && (match[1] || !context)) { // Verify a match, and that no context was specified for #id
            if (match[1]) { // HANDLE: $(html) -> $(array)
                this.nodes = Utility.html(match[1]);
            } else { // HANDLE: $("#id")
                this.nodes = [document.getElementById(match[3])];
            }
            this.length = this.nodes.length;
        } else {
            // HANDLE: $(expr, [context]) -- which is just equivalent to: $(context).find(expr)
            this.nodes = find(this.nodes, selector, d);
        }
        
        //ready state shortcut handler -- no need for ready event because FBJS delays execution
        if(typeof selector == 'function') { selector(); }
        
        this.length = this.nodes.length;

        return this;
    },

    version: "0.1.0",

    size: function() { return this.nodes.length; },
    
    each: function(obj, cb) {
        if(FBjqRY.isFunction(obj)) {
            cb = obj;
            obj = this.nodes;
            each(obj, cb);
            return this;
        }
        return each(obj, cb);
    },

    get: function() {
        if(arguments.length <= 1) {
            if(!this.nodes.length) { return null; }
            var pos = arguments[0] ? arguments[0] : null;
            if(pos === null && this.nodes.length == 1) { return this.nodes[0]; }
            return (pos || pos === 0) ? this.nodes[pos] : this.nodes;
        } else {
            var url, data, cb;
            url = arguments[0];
            data = arguments[1];
            cb = arguments[2] ? arguments[2] : null;
            this.post(url, data, cb);
        }
    },

    eq: function(pos) {
        this.nodes = [this.nodes[pos]];
        this.length = 1;
        return this;
    },

    index: function(elem) {
        for(var i = this.nodes.length - 1; i >= 0; i--) {
            if(elem.__instance == this.nodes[i].__instance) { break; }
        }
        return i;
    },

    //ATTRIBUTES
    //====================================
    attr: function(k, v) {
        if(typeof v != 'undefined') {
            each(this.nodes, function() { Utility.attr(this, k, v); });
            return this;
        }
        var node = this.nodes[0];
        if (!node) return;
        return Utility.attr(node, k);
    },

    addClass: function(cssClass) {
        each(this.nodes, function() { this.addClassName(cssClass); });
        return this;
    },

    removeClass: function(cssClass) {
        each(this.nodes, function() { this.removeClassName(cssClass); });
        return this;
    },
    
    toggleClass: function(cssClass) {
        each(this.nodes, function() {
            var i = FBjqRY(this);
            if(i.hasClass(cssClass)) {
                i.removeClass(cssClass);
            } else {
                i.addClass(cssClass);
            }
        });
        return this;
    },

    html: function(h) {
        if(typeof h != 'undefined') {
            each(this.nodes, function() { Utility.html(h, this); });
            return this;
        }
        return notSupported("There is no html getter in FBJS");
    },
    
    fbml: function(f) {
        if(typeof f != 'undefined') {
            each(this.nodes, function() { this.setInnerFBML(f); });
            return this;
        }
        return notSupported("There is no fbml getter in FBJS");
    },

    text: function(t) {
        if(typeof t != 'undefined') {
            each(this.nodes, function() { this.setTextValue(t); });
            return this;
        }
        return notSupported("There is no text getter in FBJS");
    },

    val: function(v) {
        if(typeof v != 'undefined') {
            each(this.nodes, function() { this.setValue(v); });
            return this;
        }
        return this.nodes[0].getValue();
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
    css: function(name, value) {
        if(typeof name == 'string' && typeof value != 'undefined') {
            if(name == 'float') { name = 'cssFloat'; }
            name = Utility.camelCase(name);
            each(this.nodes, function() { this.setStyle(name, value); });
            return this;
        }
        if(typeof name == 'object') {
            if(name['float'] && !name.cssFloat) { name.cssFloat = name['float']; }
            var camelized = {};
            for(var o in name) {
                if (name.hasOwnProperty(o)) {
                    camelized[Utility.camelCase(o)] = name[o];
                }
            }
            each(this.nodes, function() { this.setStyle(camelized); });
            return this;
        }
        return this.nodes[0].getStyle(name);
    },

    offset: function() {
        var node = this.nodes[0];
        return {
            top:  node.getAbsoluteTop(),
            left: node.getAbsoluteLeft()
        };
    },

    height: function(h) {
        if(typeof h == 'undefined') { return this.nodes[0].getOffsetHeight(); }
        return this.css("height", h);
    },

    width: function(w) { 
        if(typeof w == 'undefined') { return this.nodes[0].getOffsetWidth(); }
        return this.css("width", w);
    },

    //MANIPULATION:
    //========================================
    append: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        each(this.nodes, function() {
            var node = this;
            each(content, function() { node.appendChild(this); });
        });
        return this;
    },

    appendTo: function(nodes) { return FBjqRY(nodes).append(this); },

    prepend: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        each(this.nodes, function() {
            var node = this;
            each(content, function() { node.insertBefore(this); });
        });
        return this;
    },

    prependTo: function(nodes) { return FBjqRY(nodes).prepend(this); },

    after: function(content) {
        content = FBjqRY(content).get();
        content = content.length ? content : [content];
        each(this.nodes, function() {
            var node = this;
            each(content, function() { node.getParentNode().insertBefore(this, node.getNextSibling()); });
        });
        return this;
    },

    before: function(content) {},

    insertAfter: function(content) {},

    insertBefore: function(content) {},

    wrap: function(html) {},

    wrapAll: function(html) {},

    wrapInner: function(html) {},

    replaceWith: function(content) {},

    replaceAll: function(selector) {},

    empty: function() {
        this.children().remove();
        return this;
    },

    remove: function(expr) {
        if(!expr) {
            each(this.nodes, function() { this.getParentNode().removeChild(this); });
        } else { //TODO: TEST this once is(...) is working
            each(this.nodes, function() {
                if(FBjqRY(this).is(expr)) { this.getParentNode().removeChild(this); }
            });
        }
        return this;
    },

    clone: function(includeEvents) {
        var cloned = [];
        each(this.nodes, function() { cloned.push(this.cloneNode()); });
        return FBjqRY(cloned);
    },

    //TRAVERSING:
    //========================================
    hasClass: function(className) {
        var retVal = false;
        each(this.nodes, function() { retVal = retVal || this.hasClassName(className); });
        return retVal;
    },

    filter: function(fn) {
        var remainingNodes = [];
        if(typeof(fn) == "string") {
            fn = function(node) { return node.is(fn); };
        } //else it should already be a function
        for(var i = 0, length = this.nodes.length; i < length; i++) {
            if(fn(FBjqRY(this.nodes[i]))) { remainingNodes.push(this.nodes[i]); }
        }
        this.nodes = remainingNodes;
        return this;
    },

    is: function(expr) {
        //TODO: test, and add node checks
        return (this.find(expr).length > 0);
    },

    not: function(expr) {
        //filter out specified nodes
        if(expr.get) { expr = [expr]; }
        if(expr[0] && expr[0].get) {
            var outerThis = this;
            each(expr, function() {
                var innerNode = this.get();
                outerThis.filter(function(outerNode) {
                    outerNode = outerNode.get();
                    return (innerNode && innerNode.__instance) && (outerNode && outerNode.__instance) && (innerNode.__instance != outerNode.__instance);
                });
            });
        } else {
            var notNodes = this.find(expr);
            this.not(notNodes);
        }
        return this;
    },

    slice: function(start, end) {
        var nodes;
        nodes = end ? this.nodes.slice(start, end) : this.nodes.slice(start);
        return FBjqRY(nodes);
    },

    add: function(expr) {
        var nodes = FBjqRY(expr);
        this.nodes = this.nodes.concat(nodes.get());
        this.nodes = FBjqRY.unique(this.nodes);
        return this;
    },

    children: function(expr) {
        var i, j, jlen, ilen, nodes = [], children = [];
        
        if(expr) {
            nodes = FBjqRY(this.nodes).find(expr).get();
        } else {
            for(i = 0, ilen = this.nodes.length; i < ilen; i++) {
                nodes = nodes.concat(this.nodes[i].getChildNodes());
            }
        }
        return FBjqRY(unique(nodes));
    },

    contents: function() { //TODO: This doesn't feel right... TEST
        function grabNodes(node) {
            var nodes = node.getChildNodes();
            for(var i = 0, length = nodes.length; i < length; i++) {
                nodes = nodes.concat(grabNodes(nodes[i]));
            }
            return nodes;
        }
        
        var i, nodes = this.nodes, length = nodes.length;        
        for(i = 0; i < length; i++) {
            nodes = nodes.concat(grabNodes(nodes[i]));
        }
        return FBjqRY(unique(nodes));
    },

    find: function(expr) {
        return FBjqRY(find(this.nodes, expr));
    },

    //TODO: I can't remember if this is how any of the following traversal methods work?
    next: function(expr) {
        var siblings = [],
            length = this.nodes.length;
        for(var i = 0; i < length; i++) {
            var sibling = this.nodes[i].getNextSibling();
            if(!expr || sibling.is(expr)) {
                siblings.push(sibling);
            }
        }
        return FBjqRY(FBjqRY.unique(siblings));
    },

    nextAll: function(expr) {
        var siblings = [],
            length = this.nodes.length;
        for(var i = 0; i < length; i++) {
            var sibling = this.nodes[i].getNextSibling();
            while(sibling) {
                if(!expr || sibling.is(expr)) {
                    siblings.push(sibling);
                }
                sibling = sibling.getNextSibling();
            }
        }
        return FBjqRY(FBjqRY.unique(siblings));
    },

    parent: function(expr) {
        var parents = [],
            length = this.nodes.length,
            node;

        for(var i = 0; i < length; i++) {
            node = this.nodes[i].getParentNode();
            if(!expr || FBjqRY(node).is(expr)) {
                parents.push(node);
            }
        }
        return FBjqRY(FBjqRY.unique(parents));
    },

    parents: function(expr) {
        var parents = [],
            length = this.nodes.length,
            node,
            parent = null;

        for(var i = 0; i < length; i++) {
            node = this.nodes[i].getParentNode();
            while(node) {
                if(!expr || FBjqRY(node).is(expr)) {
                    parents.push(node);
                }
                node = node.getParentNode();
            }
        }
        return FBjqRY(FBjqRY.unique(parents));
    },

    prev: function(expr) {
        var siblings = [],
            length = this.nodes.length;
        for(var i = 0; i < length; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            if(!expr || sibling.is(expr)) {
                siblings.push(sibling);
            }
        }
        return FBjqRY(FBjqRY.unique(siblings));
    },

    prevAll: function(expr) {
        var siblings = [],
            length = this.nodes.length;
        for(var i = 0; i < length; i++) {
            var sibling = this.nodes[i].getPreviousSibling();
            while(sibling) {
                if(!expr || sibling.is(expr)) {
                    siblings.push(sibling);
                }
                sibling = sibling.getPreviousSibling();
            }
        }
        return FBjqRY(FBjqRY.unique(siblings));
    },

    siblings: function(expr) {
        return this.prevAll(expr).concat(this.nextAll(expr));
    },

    andSelf: function() {},
    end: function() {},


    //EVENTS:
    //========================================
    
    //js events don't trigger until page is loaded, so we don't need to do anything
    ready: function(fn) { fn(); },

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

    triggerHandler: function(type, data) {},

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
                i = (i+ 1) % length;
            });
        });
        return this;
    },
    
    //All other event handlers defined later

    //EFFECTS:
    //========================================
    show: function(speed, cb) {
        if(FBjqRY.isFunction(speed) && !cb) {
            cb = speed;
            speed = null;
        }
        
        if(!speed) {
            this.stop();
            each(this.nodes, function() {
                this.setStyle("display", "block").setStyle("opacity", "1.0");
                if(this.getStyle("height")) { this.setStyle("height", "auto"); }
                if(this.getStyle("width")) { this.setStyle("width", "auto"); }
            });
            if(cb) { cb(); }
            return this;
        }
        return this.animate({height: 'auto', width: 'auto', opacity: '1.0'}, speed, null, cb, 1);
    },

    hide: function(speed, cb) {
        if(FBjqRY.isFunction(speed) && !cb) {
            cb = speed;
            speed = null;
        }

        if(!speed) {
            this.stop();
            //this happens faster than Animation(this).hide();
            each(this.nodes, function() {
                this.setStyle("display", "none").setStyle("opacity", "0.0");
                if(this.getStyle("height")) { this.setStyle("height", "0px"); }
                if(this.getStyle("width")) { this.setStyle("width", "0px"); }
            });
            if(cb) { cb(); }
            return this;
        }
        return this.animate({height: '0px', width: '0px', opacity: '0.0'}, speed, null, cb, 2);
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
            if(node.css("display") == "none" || node.css("visibility") == "hidden") {
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
        return this.animate({opacity: opacity}, speed, null, cb);
    },

    animate: function(params, dur, easing, cb, neitherShowHide) {
        dur = parseSpeed(dur);
        var hide = (neitherShowHide == 2);
        var show = (neitherShowHide == 1);
        
        var animObj = function(n) {
            var obj = Animation(n).duration(dur);
            for(var p in params) {
                if(params.hasOwnProperty(p)) { obj = obj.to(p, params[p]); }
            }
            if(easing) { obj = obj.ease(easing); }
            if(hide) { obj = obj.blind().hide(); }
            if(show) { obj = obj.blind().show(); }
            return obj;
        };

        this.stop();
        each(this.nodes, function() { animObj(this).go(); });
        if(cb) { setTimeout(cb, dur); }
        return this;
    },
    
    stop: function() {
        each(this.nodes, function() { Animation(this).stop(); });
    },
    
    queue: function(cb_Q) {},
    dequeue: function() {},

    //AJAX:
    //========================================
    serialize: function() {
        return this.serializeArray().join("&");
    },
    
    serializeArray: function() {
        var obj = this.serializeHash();
        var ary = [];
        for(var o in obj) {
            if(obj.hasOwnProperty(o)) { ary.push(o + "=" + escape(obj[o])); }
        }
        return ary;
    },
    
    serializeHash: function() {
        //nodes[0] must be a form
        return this.nodes[0].serialize();
    }
};

//Add all common event handler methods
var validEvents = ("blur,change,click,dblclick,error,focus,keydown,keypress,keyup,load,"  +
                   "mousedown,mousemove,mouseout,mouseover,mouseup,resize,scroll,select," +
                   "submit,unload").split(",");
for(var i = validEvents.length - 1; i >= 0; i--) {
    (function() {
        var ev = validEvents[i];
        FBjqRY.fn[ev] = function(fn){
            return fn ? this.bind(ev, fn) : this.trigger(ev);
        };
    })();
}

FBjqRY.fn.init.prototype = FBjqRY.fn;

FBjqRY.extend = FBjqRY.fn.extend = function() {
    // copy reference to target object
    var target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false,
        options;

    // Handle a deep copy situation
    if(typeof(target) == "boolean") {
        deep = target;
        target = arguments[1] || {};
        // skip the boolean and the target
        i = 2;
    }

    // Handle case when target is a string or something (possible in deep copy)
    if(typeof(target) != "object" && typeof(target) != "function") {
        target = {};
    }

    // extend jQuery itself if only one argument is passed
    if(length == i) {
        target = this;
        --i;
    }

    for(; i < length; i++) {
        // Only deal with non-null/undefined values
        if((options = arguments[i])) {
            // Extend the base object
            for(var name in options) {
                var src = target[name],
                    copy = options[name];

                // Prevent never-ending loop
                if(target === copy) { continue; }

                // Recurse if we're merging object values
                if (deep && copy && typeof(copy) == "object" && !copy.getNodeType) {
                    target[name] = FBjqRY.extend(deep, // Never move original objects, clone them
                                    src || (copy.length ? [] : {}), copy);
                } else if (copy !== undefined) { // Don't bring in undefined values
                    target[name] = copy;
                }
            }
        }
    }
    // Return the modified object
    return target;
};

FBjqRY.extend({
    //AJAX:
    //========================================
    ajax: function(options) {},
    //load: function(url, data, cb) {},  //-- defined in EVENTS
    //get:  function(url, data, cb) {},  //-- defined in CORE
    
    genericAJAX: function(url, data, cb, type, retryCount) {
        retryCount = retryCount || 3;
        if(!cb && FBjqRY.isFunction(data)) {
            cb = data;
            data = null;
        }
        var ajax = new Ajax();
        ajax.responseType = type;
        ajax.ondone = cb;
        ajax.onerror = function() {
            console.error("AJAX error occurred! Retrying...");
            if(retryCount > 0) { FBjqRY.genericAJAX(url, data, cb, type, retryCount-1); }
        };
        ajax.post(url, data);
    },
    
    getJSON: function(url, data, cb) {
        this.genericAJAX(url, data, cb, Ajax.JSON);
    },

    getScript: function(url, cb) { notSupported("We can't pull in scripts dynamically using FBJS"); },

    post: function(url, data, cb) {
        this.genericAJAX(url, data, cb, Ajax.FBML);
    },

    ajaxSetup: function(options) {},
    
    
    //UTILITIES:
    //========================================
    //TODO: Investigate the extensions FB has made to arrays (undocumented?) to see if
    //      we can remove some of this stuff
    
    //current version is slightly modified from jQuery version
    isFunction: function( fn ) {
        return !!fn && typeof fn != "string" && !fn.nodeName && (/^[\s[]?function/.test( fn + "" ));
             //the following condition should be in there too, but FBJS prevents access to Array
             //fn.constructor != [].constructor
    },

    trim: trim,
    each: each,

    //extend: function(target) {}, //defined in CORE

    grep: function(arr, cb, inv) {
        var retAry = [];
        for (var i = arr.length - 1; i >= 0; i--) {
            if (!inv != !cb(arr[i], i)) { retAry.push(arr[i]); }
        }
        return retAry;
    },

    makeArray: function( array ) {
        var ret = [];

        if(array !== null) {
            var i = array.length;
            //TODO: not sure if this will work since FB extends array. TEST.
            //the window, strings and functions also have 'length'
            if(i === null || array.split || array.setInterval || array.call) {
                ret[0] = array;
            } else {
                while (i) { ret[--i] = array[i]; }
            }
        }
        return ret;
    },

    map: function( elems, callback ) {
        if(FBjqRY.isFunction(elems)) {
            callback = elems;
            elems = this.nodes;
        }
        var ret = [];

        for(var i = 0, length = elems.length; i < length; i++) {
            var value = callback(elems[i], i);

            if(value !== null) {
                ret[ret.length] = value;
            }
        }

        return ret.concat.apply([], ret);
    },

    indexOf: function(value, arr) { //alias of inArray
        var fn = function(a, b) { return a === b; };
        if(value.equals) { fn = function(a,b) { return a.equals(b); }; }

        for(var i = arr.length - 1; i >= 0; i--) {
            if(fn(value, arr[i])) { break; }
        }
        return i;
    },

    inArray: function(value, arr) { return this.indexOf(value, arr); },

    unique: function(ary) { //swap to jQuery version if we ever implement "data" method
        return unique(ary);
    }
});

})();

//set $ and jQuery to be shortcuts to FBjqRY
var jQuery = FBjqRY,
    $ = FBjqRY;