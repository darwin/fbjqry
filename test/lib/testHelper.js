
// assertion functions shortcut :
var Asserts = jsUnity.assertions;

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

    var assertEqual = Asserts.assertEqual;
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
            assertEqual.call(this, expected, actual, message);
        }
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
