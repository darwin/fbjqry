
// assertion functions shortcut :
var Asserts = jsUnity.assertions;
Asserts.assertEqualNode = function(expected, actual, message) {
    if ( ! Support.sameFBNode(expected, actual) ) {
        throw jsUnity.format("?: (?) is not equal to node (?)",
            message || "assertEqualNode", actual, expected);
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

    Support.log.enabled = true;
    Support.log.throwErrors = true;

    jsUnity.log = function() {
        console.log( arguments[0] );
    };

    var suiteResults = {}, currentSuite = null;
    
    jsUnity.startSuite = function(name) {
        currentSuite = suiteResults[name] = [];
    };
    jsUnity.doneSuite = function(name) {
        currentSuite = null;
    };

    jsUnity.done = function () {
        var content = '<div class="testResults">';
        for ( var name in suiteResults ) {
            if ( suiteResults.hasOwnProperty(name) ) {
                content += '<h1 class="suiteName">' + name + '</h1>'; // suite name
                var testResults = suiteResults[name];
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
    };

    var result = jsUnity.result;
    jsUnity.result = function (passed, name, e) {
        result.call(this, passed, name, e);
        if ( e ) console.log(name, e);
        // keep the test result for the "green - red" test bar :
        currentSuite.push({ name: name, passed: passed, e: e });
    };
})();
