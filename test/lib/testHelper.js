
// assertion functions shortcut :
var Asserts = jsUnity.assertions;
Asserts.assertEqualNode = function(expected, actual, message) {
    if ( ! FBjqRY.fbjs.isNode(actual) ) {
        this.fail( jsUnity.format("?: (?) is not a FB node",
            message || "assertEqualNode", actual), expected, actual );
    }
    if ( ! FBjqRY.fbjs.sameNode(expected, actual) ) {
        this.fail( jsUnity.format("?: (?) is not equal to node (?)",
            message || "assertEqualNode", actual, expected), expected, actual );
    }
};

/**
 * Removes all elements (nodes) from the canvas.
 * Each of the test suites expects a clean/empty canvas.
 */
/*
var removeAllElements = function() {
    var root = document.getRootElement();
    var childNodes = root.getChildNodes();
    for ( var i = 0; i < childNodes.length; i++ ) {
        root.removeChild( childNodes[i] );
    }
};
*/

(function() {

    var logEnabled = true, throwErrors = true;
    var consoleLog = (typeof console !== 'undefined') && console.log;

    FBjqRY.log = function(msg, e) {
        if ( logEnabled && consoleLog ) {
            e ? consoleLog(msg, e) : consoleLog(msg);
        }
        if ( e && throwErrors ) throw e;
    };

    FBjqRY.error = function(msg) {
        try {throw msg;}
        catch (e) {
            FBjqRY.log('[ERROR]', e);
        }
        return undefined;
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

    var suiteResults = {}, currentSuite = null;
    
    jsUnity.startSuite = function(name) {
        currentSuite = suiteResults[name] = [];
    };
    jsUnity.doneSuite = function(name) {
        currentSuite = null;
    };

    // extension used by qUnit test emulation :
    jsUnity.currentSuite = function() {
        return currentSuite;
    };
    var incrementAssertionCount = function() {
       var count = currentSuite.assertionCount || 0;
       currentSuite.assertionCount = ++count;
    };

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
        currentSuite.push({name: name, passed: passed, e: e});
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
    jsUnity.currentSuite().count = count;
}
function reset() {
    var currentSuite = jsUnity.currentSuite();
    if (currentSuite.tearDown) currentSuite.tearDown();
    if (currentSuite.setUp) currentSuite.setUp();
}

function equals(actual, expected, message) {
    Asserts.assertEqual(expected, actual, message);
}
function same(actual, expected, message) {
    message = message ? message : '';
    if ( FBjqRY.fbjs.isNode(expected) ) {
        return Asserts.assertEqualNode(expected, actual, message || 'same()')
    }
    if ( typeof(expected.length) === 'number' ) {
        Asserts.assertTypeOf( 'number', actual.length, message + ' same() ('+ actual +') is not an array' );
        Asserts.assertEqual( expected.length, actual.length, message + ' same() expected.length !== actual.length' );
        for (var i=0; i<expected.length; i++) {
            same( actual[i], expected[i], message /*+ ' same() failed on '+ i +'-th array element'*/ );
        }
        return undefined;
    }
    return Asserts.assertEqual(expected, actual, message);
}
function ok(actual, message) {
    Asserts.assertTrue(actual, message);
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