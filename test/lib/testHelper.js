
// assertion functions shortcut :
var Asserts = jsUnity.assertions;

(function() {

    var logEnabled = true;
    var consoleLog = (typeof console !== 'undefined') && console.log;

    FBjqRY.log = function() {
        if ( logEnabled && consoleLog ) {
            consoleLog.apply(console, arguments);
        }
    };

    /*
    FBjqRY.log = function(msg, e) {
        if ( logEnabled && consoleLog ) {
            e ? consoleLog(msg, e) : consoleLog(msg);
        }
        if ( e && throwErrors ) throw e;
    };
    
    FBjqRY.error = function(msg) {
        try { throw msg; }
        catch (e) {
            FBjqRY.log('[ERROR]', e);
        }
        return undefined;
    }; */

    // underscore.js inspired helpers for equality check :
    var _ = (function() {

        var underscore = function() {};

        var toString = {}.toString;
        var hasOwnProperty = {}.hasOwnProperty;
        var slice = [].slice;
        // Is a given value a date?
        underscore.isDate = function(obj) {
            return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
        };
        // Is the given value NaN -- this one is interesting. NaN != NaN, and
        // isNaN(undefined) == true, so we make sure it's a number first.
        underscore.isNaN = function(obj) {
            return underscore.isNumber(obj) && isNaN(obj);
        };
        // Is a given value a number?
        underscore.isNumber = function(obj) {
            return (obj === +obj) || (toString.call(obj) === '[object Number]');
        };
        // Is the given value a regular expression?
        underscore.isRegExp = function(obj) {
            return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
        };
        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        underscore.isArray = function(obj) {
            return !!(obj && obj.concat && obj.unshift && !obj.callee);
        };
        // Is a given variable an arguments object?
        underscore.isArguments = function(obj) {
            return obj && obj.callee;
        };
        // Is a given value a DOM element?
        underscore.isElement = function(obj) {
            return !!(obj && obj.getNodeType && obj.getNodeType() == 1);
        };
        // Keep the identity function around for default iterators.
        underscore.identity = function(value) {
            return value;
        };
        // The cornerstone, an each implementation.
        // Handles objects implementing forEach, arrays, and raw objects.
        // Delegates to JavaScript 1.6's native forEach if available.
        var each = underscore.forEach = function(obj, iterator, context) {
            try {
                if (underscore.isNumber(obj.length)) {
                    for (var i = 0, l = obj.length; i < l; i++) iterator.call(context, obj[i], i, obj);
                } else {
                    for (var key in obj) {
                        if (hasOwnProperty.call(obj, key)) iterator.call(context, obj[key], key, obj);
                    }
                }
            } catch(e) {
                if (e != breaker) throw e;
            }
            return obj;
        };
        // Return the results of applying the iterator to each element.
        // Delegates to JavaScript 1.6's native map if available.
        underscore.map = function(obj, iterator, context) {
            var results = [];
            each(obj, function(value, index, list) {
                results.push(iterator.call(context, value, index, list));
            });
            return results;
        };
        // Retrieve the values of an object's properties.
        underscore.values = function(obj) {
            return underscore.map(obj, underscore.identity);
        };
        // Convert anything iterable into a real, live array.
        underscore.toArray = function(iterable) {
            if (!iterable) return [];
            if (iterable.toArray) return iterable.toArray();
            if (underscore.isArray(iterable)) return iterable;
            if (underscore.isArguments(iterable)) return slice.call(iterable);
            return underscore.values(iterable);
        };
        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python range() function. See:
        // http://docs.python.org/library/functions.html#range
        underscore.range = function(start, stop, step) {
            var a = underscore.toArray(arguments);
            var solo = a.length <= 1;
            start = solo ? 0 : a[0], stop = solo ? a[0] : a[1], step = a[2] || 1;
            var len = Math.ceil((stop - start) / step);
            if (len <= 0) return [];
            var range = []; range.length = len; //new Array(len);
            for (var i = start, idx = 0; true; i += step) {
                if ((step > 0 ? i - stop : stop - i) >= 0) return range;
                range[idx++] = i;
            }
        };
        // Retrieve the names of an object's properties.
        // Delegates to ECMA5's native Object.keys
        underscore.keys = function(obj) {
            if (underscore.isArray(obj)) return underscore.range(0, obj.length);
            var keys = [];
            for (var key in obj) if (hasOwnProperty.call(obj, key)) keys.push(key);
            return keys;
        };
        // Perform a deep comparison to check if two objects are equal.
        underscore.isEqual = function(a, b, equals) {
            //console.log('isEqual 0', a, b);
            // Check object identity.
            if (a === b) return true;
            // Different types?
            var atype = typeof(a), btype = typeof(b);
            if (atype != btype) return false;
            // Basic equality test (watch out for coercions).
            if (a == b) return true;
            // One is falsy and the other truthy.
            if ((!a && b) || (a && !b)) return false;
            // One of them implements an isEqual()?
            if (a.isEqual) return a.isEqual(b);
            // Check dates' integer values.
            if (underscore.isDate(a) && underscore.isDate(b)) return a.getTime() === b.getTime();
            // Both are NaN?
            if (underscore.isNaN(a) && underscore.isNaN(b)) return false;
            // Compare regular expressions.
            if (underscore.isRegExp(a) && underscore.isRegExp(b))
              return a.source === b.source &&
                     a.global === b.global &&
                     a.ignoreCase === b.ignoreCase &&
                     a.multiline === b.multiline;

            // If a is not an object by this point, we can't handle it.
            if (atype !== 'object') return false;
            // Check for different array lengths before comparing contents.
            if (a.length && (a.length !== b.length)) return false;
            // Nothing else worked, deep compare the contents.
            var aKeys = underscore.keys(a), bKeys = underscore.keys(b);
            // Different object sizes?
            if (aKeys.length != bKeys.length) return false;
            // Recursive comparison of contents.
            if ( ! equals ) equals = underscore.isEqual;
            for (var key in a) if (!(key in b) || !equals(a[key], b[key])) return false;
            return true;
        };

        return underscore;

    })();

    //var assertEqual = Asserts.assertEqual;
    Asserts.assertEqual = function(expected, actual, message) {
        if ( FBjqRY.fbjs.isNode(expected) ) {
            if ( ! FBjqRY.fbjs.isNode(actual) ) {
                Asserts.fail( jsUnity.format("?: (?) is not a FB node",
                    message || "assertEqual", actual), expected, actual );
            }
            if ( ! FBjqRY.fbjs.sameNode(expected, actual) ) {
                Asserts.fail( jsUnity.format("?: (?) is not equal to FB node (?)",
                    message || "assertEqual", actual, expected), expected, actual );
            }
        }
        else {
            //assertEqual.call(this, expected, actual, message);
            if ( ! _.isEqual(expected, actual, Asserts.assertEqual) ) {
                Asserts.fail( jsUnity.format("?: (?) is not equal to (?)",
                    message || "assertEqual", actual, expected), expected, actual );
            }
        }
        return true; // passing this fn to _.isEquals !
    };

    // customize assertion failure :
    var fail = Asserts.fail;
    Asserts.fail = function(message) {
        if ( arguments.length > 1 ) {
            var expected = arguments[1], actual = arguments[2];
            if ( arguments.length === 2 ) {
                expected = undefined; actual = arguments[1];
            }
            if (consoleLog) {
                if ( expected === undefined ) {
                    consoleLog(message, 'actual:', actual);
                }
                else {
                    consoleLog(message, 'expected:', expected, 'actual:', actual);
                }
            }
        }
        fail.apply(this, arguments);
    };

    jsUnity.log = function() {
        if (consoleLog) consoleLog( arguments[0] );
    };

    var suiteResults = {}, currentResults = null;
    
    jsUnity.startSuite = function(name) {
        currentResults = suiteResults[name] = [];
    };
    jsUnity.doneSuite = function(name) {
        currentResults = null;
    };

    //var incrementAssertionCount = function() {
    //   var count = currentSuite.assertionCount || 0;
    //   currentSuite.assertionCount = ++count;
    //};

    jsUnity.done = function () {
        var content = '<div class="testResults">';
        var totalAssertionCount = 0;
        for ( var name in suiteResults ) {
            if ( suiteResults.hasOwnProperty(name) ) {
                content += '<h1 class="suiteName">' + name + '</h1>'; // suite name
                var testResults = suiteResults[name];
                if ( testResults.assertionCount ) totalAssertionCount += testResults.assertionCount;
                for ( var i = 0; i < testResults.length; i++ ) {
                    var result = testResults[i];
                    content += '<div class="' + (result.passed ? 'passed' : 'failed') + '">';
                    content +=   '<span class="testName">' + result.name + '</span>';
                    content +=   result.e ? ' ' + result.e + ' ' : '';
                    content += '</div>';
                }
            }
        }
        content += '</div>';
        suiteResults = {};
        
        var dialog = new Dialog( Dialog.DIALOG_POP ).showMessage('Test Results', dialogContent, 'close');
        // the dialog has a fixed width - change it :
        //dialog.setStyle('overflow', 'auto');

        dialogContent = document.getElementById('dialogContent');
        dialogContent.setInnerXHTML(content);
        dialogContent.setStyle('display', 'block');

        if ( totalAssertionCount ) jsUnity.log('' + totalAssertionCount + ' assertions passed');
    };

    var result = jsUnity.result;
    jsUnity.result = function (passed, name, e) {
        result.call(this, passed, name, e);
        if ( e ) console.log(name, e);
        // keep the test result for the "green - red" test bar :
        currentResults.push({name: name, passed: passed, e: e});
        // count the assetrions in a given suite :
        //incrementAssertionCount();
    };
})();

var testSuites = [];
function createTestSuite(name) {
    var suite = {suiteName: name};
    testSuites.push( suite );
    return suite;
}

function allTestSuites() {
    return testSuites;
}

// qUnit compatibility :

function test(name, fn, suite) {
    suite['testQUnit_' + name + ''] = fn;
}
function expect(count) { // @todo not used !
    currentSuite.count = count;
}

var currentSuite = null;
(function() {

    function findSuiteByName(name) {
        var suites = allTestSuites();
        for ( var i = 0; i < suites.length; i++ ) {
            if ( suites[i].suiteName === name ) return suites[i];
        }
        return null;
    }

    var startSuite = jsUnity.startSuite;
    jsUnity.startSuite = function(name) {
        if ( startSuite ) startSuite(name);
        
        currentSuite = findSuiteByName(name);
    };

    var doneSuite = jsUnity.doneSuite;
    jsUnity.doneSuite = function(name) {
        if ( doneSuite ) doneSuite(name);

        currentSuite = null;
    };

})();

function reset() {
    if (currentSuite.tearDown) currentSuite.tearDown();
    if (currentSuite.setUp) currentSuite.setUp();
}

function equals(actual, expected, message) {
    Asserts.assertEqual(expected, actual, message || 'equals');
}
function same(actual, expected, message) {
    //console.log('same() start', message);
    message = message ? message : '';
    if ( expected && typeof(expected.length) === 'number' ) {
        if ( ! actual || typeof(actual.length) !== 'number' ) {
            Asserts.fail( jsUnity.format("?: (?) is not an array",
                message || "same", actual), expected, actual );
        }
        if ( actual.length !== expected.length ) {
            Asserts.fail( jsUnity.format("?: length of (?) is not equal to the expected length of (?)",
                message || "same", actual, expected), expected, actual );
        }
        for ( var i = 0, len = expected.length; i < len; i++ ) {
            //console.log('same() check', i);
            Asserts.assertEqual( expected[i], actual[i], message + ' failed on ['+ i +']' );
        }
    }
    else {
        //console.log('same() assertEqual', expected);
        Asserts.assertEqual(expected, actual, message);
    }
}
function ok(actual, message) {
    Asserts.assertTrue(actual, message || 'ok');
}

function q() {
    var ret = [];
    for ( var i = 0; i < arguments.length; i++ ) {
        if ( arguments[i] == ':root' ) {
            ret.push( document.getRootElement() );
        }
        else {
            ret.push( document.getElementById( arguments[i] ) );
        }
    }
    return ret;
}
