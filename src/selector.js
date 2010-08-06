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
        pseudoCheckParen = /^:([\w\-]+)\("?'?([^\)]+)'?"?\)/,
        pseudoCheck = /^:([\w\-]+)/;

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
        var theType = node.getType();
        return theType && theType.toLowerCase() === type;
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
        if ( nodes == null ) nodes = [ document.getRootElement() ];
        
        return filterNodes( nodes,
            function() { return this.hasClassName(cssClass); },
            recurse
        );
    }

    function selectByTag(nodes, tagName, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            return document.getRootElement().getElementsByTagName(tagName);
        }
        else { // @todo optimize :
            tagName = tagName.toUpperCase();
            /*
            if ( recurse ) { // optimization for a "common" case :
                var tagNodes1 = [], tagNodes2 = [];
                for ( var i = 0, len = nodes.length; i < len; i++ ) {
                    var node = nodes[i];
                    if ( node.getTagName() === tagName || tagName === '*' ) {
                        tagNodes1.push( node );
                    }
                    tagNodes2 = tagNodes2.concat( node.getElementsByTagName(tagName) );
                }
                nodes = tagNodes1.concat( tagNodes2 );
            } */
            //else {
                //if ( tagName === '*' ) return nodes; // ok cause recurse == false
                var allTags = tagName === '*';
                return filterNodes( nodes,
                    function() { return tagName === this.getTagName() || allTags; },
                    recurse
                );
            //}
        }
    }

    function selectByAttribute(nodes, name, type, value, sel, recurse) {
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

    function selectByPseudo(nodes, pseudo, innerVal, sel, recurse) {
        //if ( nodes.length === 0 ) {
        if ( nodes == null ) {
            if ( pseudo === 'root' ) return [ document.getRootElement() ];
            nodes = document.getRootElement().getElementsByTagName('*');
        }

        var innerValInt = innerVal ? parseInt(innerVal, 10) : null;
        var retNodes;
        
        switch ( pseudo ) {
            case "first":
                retNodes = [ nodes[0] ]; break;
            case "last":
                retNodes = [ nodes[nodes.length - 1] ]; break;
            case "eq":
                retNodes = [ nodes[innerValInt] ]; break;
            case "lt":
                retNodes = nodes.splice(0, innerValInt); break;
            case "gt":
                retNodes = nodes.splice(innerValInt + 1, (nodes.length - innerValInt)); break;
            case "even":
                retNodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 0); } ); break;
            case "odd":
                retNodes = FBjqRY.grep(nodes, function(node, i) { return (i % 2 === 1); } ); break;
            case "contains":
                retNodes = null;
                return FBjqRY.error("find() :contains pseudo selector not supported");
                break;
            case "hidden":
                retNodes = FBjqRY.grep(nodes, _isHidden); break;
            case "visible":
                retNodes = FBjqRY.grep(nodes, function(node) { return ! _isHidden(node); }); break;
            case "has":
                //console.log('has', innerVal, nodes);
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var matches = FBjqRY.find(innerVal, node);
                    return matches.length > 0;
                });
                break;
            case "not":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var notMatches = FBjqRY.find(innerVal, false, [ node ]);
                    // if smt is matched return false :
                    return notMatches.length === 0;
                });
                break;
            case "nth-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    //var childs = this.getChildNodes(), child;
                    //if ( childs && (child = childs[innerValInt]) ) retNodes.push( child );
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var childs = parent.getChildNodes(), child;
                        if ( childs && (child = childs[innerValInt]) ) retNodes.push( child );
                    }
                });
                break;
            case "first-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var child = parent.getFirstChild();
                        if ( child ) retNodes.push( child );
                    }
                });
                break;
            case "last-child":
                retNodes = [];
                FBjqRY.each(nodes, function() {
                    //var child = this.getLastChild();
                    //if ( child ) retNodes.push( child );
                    var parent = this.getParentNode();
                    if ( parent ) {
                        var child = parent.getLastChild();
                        if ( child ) retNodes.push( child );
                    }
                });
                break;
            case "only-child":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var parentChilds = node.getParentNode().getChildNodes();
                    return parentChilds.length === 1;
                });
                break;
            case "parent": // all elements that are the parent of another element :
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var childNodes = node.getChildNodes();
                    return childNodes && childNodes.length > 0;
                });
                break;
            case "empty": // all elements that have no children :
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var childNodes = node.getChildNodes();
                    return ! childNodes || childNodes.length === 0;
                });
                break;
            case "disabled":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var disabled = node.getDisabled();
                    return !! disabled; // @todo disabled === 'disabled'
                });
                break;
            case "enabled":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var disabled = node.getDisabled();
                    return ! disabled;
                });
                break;
            case "selected":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var selected = node.getSelected();
                    return !! selected; // @todo selected === 'selected'
                });
                break;
            case "checked":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var checked = node.getChecked();
                    return !! checked; // @todo checked === 'checked'
                });
                break;
            case "input": // all input, textarea, select and button elements
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var tagName = node.getTagName().toLowerCase();
                    return tagName === 'input' || tagName === 'textarea'
                        || tagName === 'select' || tagName === 'button';
                });
                break;
            case "text":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'text') });
                break;
            case "password":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'password') });
                break;
            case "radio":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'radio') });
                break;
            case "file":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'file') });
                break;
            case "image": // all image inputs
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'image') });
                break;
            case "reset":
                retNodes = FBjqRY.grep(nodes, function(node) { return _isInputType(node, 'reset') });
                break;
            case "submit":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var type = node.getType(), tagName = node.getTagName().toLowerCase();
                    return (tagName === 'input' && type && type.toLowerCase() === 'submit') ||
                           (tagName === 'button' && ! type && type.toLowerCase() === 'submit');
                });
                break;
            case "header":
                retNodes = FBjqRY.grep(nodes, function(node) {
                    var tagName = node.getTagName().toLowerCase();
                    return tagName.length === 2 && tagName.charAt(0) === 'h';
                });
                break;
            case "root": // returns the root element
                var rootNode = document.getRootElement();
                var sameNode = FBjqRY.fbjs.sameNode;
                retNodes = FBjqRY.grep(nodes, function(node) { return sameNode(rootNode, node); });
                break;
        }
        return retNodes;
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
                return FBjqRY.error("find() invalid context: ", context);
            }
        }
        else {
            var filter = context === false; // special case to handle filter-ing
        }

        var recurse, match, prevSel,
            selectors = sel.split( /([^,]*\(.*?\))|,/ ),
            //selectors = sel.split(","),
            allNodes = [], origNodes = nodes;

        var trim = FBjqRY.trim;
        for ( i = 0, len = selectors.length; i < len; i++ ) {
            
            if ( ! selectors[i] ) continue;

            sel = trim( selectors[i] );
            prevSel = "";
            recurse = ! filter; //true;
            while ( sel && sel !== prevSel ) {
                if ( prevSel ) {
                    var char0 = sel.charAt(0);
                    recurse = (char0 === ' ' || char0 === '>' || char0 === '~' || char0 === '+');
                    if ( recurse ) {
                        sel = trim( sel );
                        var nextNodes = [], j, sibling;
                        switch ( sel.charAt(0) ) { // handling selector "hierarchy" :
                            case '>':
                                sel = trim( sel.substr(1) ); // ltrim
                                for ( j = 0; j < nodes.length; j++ ) {
                                    nextNodes = nextNodes.concat( nodes[j].getChildNodes() );
                                }
                                recurse = false; // only 1st level childs
                                break;
                            case '~':
                                sel = trim( sel.substr(1) ); // ltrim
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
                                sel = trim( sel.substr(1) ); // ltrim
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
                if ( ( match = idCheck.exec(sel) ) ) {
                    nodes = selectById(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                if ( ( match = classCheck.exec(sel) ) ) {
                    nodes = selectByClass(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                if ( ( match = tagCheck.exec(sel) ) ) {
                    nodes = selectByTag(nodes, match[1], sel, recurse);
                    sel = sel.substr( sel.indexOf(match[1]) + match[1].length );
                    continue;
                }

                //The remaining is subfiltering on nodes
                if ( ( match = attributeCheck.exec(sel) ) ) {
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
                    var innerVal = match.length > 2 ? match[2] : null; // the value in the parenthesis

                    nodes = selectByPseudo(nodes, pseudo, innerVal, sel, recurse);

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
