/**
 * find function - the selector "engine" behing FBjqRY.
 *
 * @param sel the selector (string)
 * @param context the context of the search e.g. a FB node or a FBjqRY object
 * @param nodes the nodes to filter (assumes no context given if not null), set
 * to null if You're providing a context or want to start at the root element
 * @return an array of matched nodes
 */
FBjqRY.find = (function() {
    var idCheck = /^#(\w+)/,
        classCheck = /^\.([\w\-]+)/,
        tagCheck = /^([A-Za-z_\*]{1}\w*)/,
        attributeCheck = /^\[(\w+)(!|\^|\$|\*|~|\|)?=?["|']?([^\]]+?)?["|']?\]/,
        pseudoCheckParen = /^:(\w+)\("?'?([^\)]+)'?"?\)/,
        pseudoCheck = /^:(\w+)/;

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
        var nodeType = node.getType();
        return nodeType && nodeType.toLowerCase() === type;
    };

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
            case "~": matchFunc = function(a, v) { return FBjqRY.inArray(v, a.split(' ')) !== -1; }; break; // indexOf
            default:
                if ( value === true ) matchFunc = function(a, v) { return !!a; };
                else matchFunc = function(a, v) { return a === v; };
        }
        return filterNodes( nodes,
            function() {
                return matchFunc( FBjqRY.attr(this, name), value );
            },
            recurse
        );
    }

    return function(sel, context, nodes) { // the find function
        if ( typeof(sel) !== "string" ) {
            if ( sel.length || sel.length === 0 ) return sel;
            return [ sel ];
        }

        var i, len;

        //Is context a valid FBDOM element
        if ( context ) { // context != document
            if ( nodes && nodes.length > 0 ) {
                return FBjqRY.error("find() could not handle context with nodes");
            }
            if ( FBjqRY.fbjs.isNode(context) ) {
                nodes = context.getChildNodes(); // context is never part of the result
            }
            else if ( typeof(context.length) === 'number' ) { // FBjqRY or array
                if ( context.jquery ) context = context.nodes;
                nodes = [];
                for ( i = 0, len = context.length; i < len; i++ ) {
                    nodes = nodes.concat( context[i].getChildNodes() );
                }
            }
            else {
                return FBjqRY.error("find() invalid context: " + context);
            }
        }

        var recurse, match,
            prevSel, selectors = sel.split(","),
            allNodes = [], origNodes = nodes;

        var trim = FBjqRY.trim;
        for ( i = 0, len = selectors.length; i < len; i++ ) {
            sel = trim(selectors[i]);
            prevSel = "";
            recurse = true;
            while ( sel && sel !== prevSel ) {
                if ( prevSel ) {
                    recurse = (sel.charAt(0) === ' ');
                    if ( recurse ) {
                        sel = trim(sel);
                        var nextNodes = [], j, sibling;
                        switch ( sel.charAt(0) ) { // handling selector "hierarchy" :
                            case '>':
                                sel = trim(sel.substr(1)); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                recurse = false; // only 1st level childs
                                break;
                            case '~':
                                sel = trim(sel.substr(1)); // ltrim
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
                                sel = trim(sel.substr(1)); // ltrim
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
                            nodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 0); } ); break;
                        case "odd":
                            nodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 1); } ); break;
                        case "contains":
                            nodes = null;
                            return FBjqRY.error("find() :contains pseudo selector not supported");
                            //break;
                        case "hidden":
                            nodes = FBjqRY.grep(nodes, _isHidden); break;
                        case "visible":
                            nodes = FBjqRY.grep(nodes, function(node) { return ! _isHidden(node); }); break;
                        case "has":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var matches = FBjqRY.find(value, null, [ node ]);
                                return matches.length > 0;
                            });
                            break;
                        case "not":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var notMatches = FBjqRY.find(value, null, [ node ]);
                                // if smt is matched return false :
                                return notMatches.length == 0;
                            });
                            break;
                        case "nth-child":
                            nodes = [];
                            FBjqRY.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                if ( childs && childs[intValue] ) nodes.push( childs[intValue] );
                            });
                            break;
                        case "first-child":
                            nodes = [];
                            FBjqRY.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                if ( childs && childs[0] ) nodes.push( childs[0] );
                            });
                            break;
                        case "last-child":
                            nodes = [];
                            FBjqRY.each(_nodes, function(node) {
                                var childs = node.getChildNodes();
                                var length = childs && childs.length;
                                if ( length ) nodes.push( childs[length - 1] );
                            });
                            break;
                        case "only-child":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var parentChilds = node.getParentNode().getChildNodes();
                                return parentChilds.length === 1;
                            });
                            break;
                        case "parent": // all elements that are the parent of another element :
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var childNodes = node.getChildNodes();
                                return childNodes && childNodes.length > 0;
                            });
                            break;
                        case "empty": // all elements that have no children :
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var childNodes = node.getChildNodes();
                                return ! childNodes || childNodes.length === 0;
                            });
                            break;
                        case "disabled":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var disabled = node.getDisabled();
                                return !! disabled; // @todo disabled === 'disabled'
                            });
                            break;
                        case "enabled":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var disabled = node.getDisabled();
                                return ! disabled;
                            });
                            break;
                        case "selected":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var selected = node.getSelected();
                                return !! selected; // @todo selected === 'selected'
                            });
                            break;
                        case "input": // all input, textarea, select and button elements
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var tagName = node.getTagName().toLowerCase();
                                return tagName === 'input' || tagName === 'textarea'
                                    || tagName === 'select' || tagName === 'button';
                            });
                            break;
                        case "text":
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'text') });
                            break;
                        case "password":
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'password') });
                            break;
                        case "radio":
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'radio') });
                            break;
                        case "file":
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'file') });
                            break;
                        case "image": // all image inputs
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'image') });
                            break;
                        case "reset":
                            nodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'reset') });
                            break;
                        case "submit":
                            nodes = FBjqRY.grep(nodes, function(node) {
                                var type = node.getType(), tagName = node.getTagName().toLowerCase();
                                return (tagName === 'input' && type && type.toLowerCase() === 'submit') ||
                                       (tagName === 'button' && ! type && type.toLowerCase() === 'submit');
                            });
                            break;
                        case "header":
                            nodes = FBjqRY.grep(nodes, function(node) {
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
                return FBjqRY.error("find() could not parse the remaining selector: '" + sel + "'");
            }
            else {
                allNodes = allNodes.concat(nodes);
                nodes = origNodes;
            }
        }

        return FBjqRY.unique(allNodes);
    };
})();
