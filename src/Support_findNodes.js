
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