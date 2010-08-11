
/**
 * jsUnity Universal JavaScript Testing Framework v0.6
 * http://jsunity.com/
 *
 * Copyright (c) 2009 Ates Goral
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright (c) 2010 Karol Bucek - FBJS compatible
 * 
 * Further Extensions to jsUnity 0.6 :
 * - beside the default jsUnity.log where all output is directed there's a
 *   separate jsUnity.result function that gets called after each and every
 *   test with the following arguments: (passed, name, [ e ])
 * - added start/done callback function for which are called at the start/end
 *   of jsUnity.run
 * - added startSuite/doneSuite callback function which are called before/after
 *   tests in a suite are run (once for every suite) with a suite name argument
 */

jsUnity = (function () {

    var slice = [].slice;

    function format(str) {
        var a = slice.call(arguments, 1);
        return str.replace(/\?/g, function () { return a.shift(); });
    }

    function hash(v) {
        if (typeof(v) === 'object') { // null case as well
            var arr = [];
            
            for (var p in v) {
                arr.push(p);
                arr.push(hash(v[p]));    
            }
            
            return arr.join("#");
        } else {
            //return String(v);
            if ( typeof(v) === 'undefined' ) {
                return 'undefined'
            }
            else {
                return v.toString();
            }
        }
    }

    var defaultAssertions = {
        assertException: function (fn, message) {
            try {
                typeof(fn) === 'function' && fn();
            }
            catch (e) { return; }
            this.fail( format("?: (?) does not raise an exception or not a function",
                message || "assertException", fn) );
        },

        assertTrue: function (actual, message) {
            if (!actual) {
                this.fail( format("?: (?) does not evaluate to true",
                    message || "assertTrue", actual), actual );
            }
        },
        
        assertFalse: function (actual, message) {
            if (actual) {
                this.fail( format("?: (?) does not evaluate to false",
                    message || "assertFalse", actual), actual );
            }
        },
        
        assertIdentical: function (expected, actual, message) {
            if (expected !== actual) {
                this.fail( format("?: (?) is not identical to (?)",
                    message || "assertIdentical", actual, expected), expected, actual );
            }
        },

        assertNotIdentical: function (expected, actual, message) {
            if (expected === actual) {
                this.fail( format("?: (?) is identical to (?)",
                    message || "assertNotIdentical", actual, expected), expected, actual );
            }
        },

        assertEqual: function (expected, actual, message) {
            if (hash(expected) != hash(actual)) {
                this.fail( format("?: (?) is not equal to (?)",
                    message || "assertEqual", actual, expected), expected, actual );
            }
        },
        
        assertNotEqual: function (expected, actual, message) {
            if (hash(expected) == hash(actual)) {
                this.fail( format("?: (?) is equal to (?)",
                    message || "assertNotEqual", actual, expected), expected, actual );
            }
        },
        
        assertMatch: function (re, actual, message) {
            if (!re.test(actual)) {
                this.fail( format("?: (?) does not match (?)",
                    message || "assertMatch", actual, re), re, actual );
            }
        },
        
        assertNotMatch: function (re, actual, message) {
            if (re.test(actual)) {
                this.fail( format("?: (?) matches (?)",
                    message || "assertNotMatch", actual, re), re, actual );
            }
        },
        
        assertTypeOf: function (type, actual, message) {
            if (typeof actual !== type) {
                this.fail( format("?: (?) is not of type (?)",
                    message || "assertTypeOf", actual, type), type, actual );
            }
        },

        assertNotTypeOf: function (type, actual, message) {
            if (typeof actual === type) {
                this.fail( format("?: (?) is of type (?)",
                    message || "assertNotTypeOf", actual, type), type, actual );
            }
        },
        
        assertInstanceOf: function (clazz, actual, message) {
            if (!(actual instanceof clazz)) {
                this.fail( format("?: (?) is not an instance of (?)",
                    message || "assertInstanceOf", actual, clazz), clazz, actual );
            }
        },

        assertNotInstanceOf: function (clazz, actual, message) {
            if (actual instanceof clazz) {
                this.fail( format("?: (?) is an instance of (?)",
                    message || "assertNotInstanceOf", actual, clazz), clazz, actual );
            }
        },

        assertNull: function (actual, message) {
            if (actual !== null) {
                this.fail( format("?: (?) is not null",
                    message || "assertNull", actual), actual );
            }
        },
        
        assertNotNull: function (actual, message) {
            if (actual === null) {
                this.fail( format("?: (?) is null",
                    message || "assertNotNull", actual), actual );
            }
        },
        
        assertUndefined: function (actual, message) {
            if (typeof(actual) !== 'undefined') {
                this.fail( format("?: (?) is not undefined",
                    message || "assertUndefined", actual), actual );
            }
        },
        
        assertNotUndefined: function (actual, message) {
            if (typeof(actual) === 'undefined') {
                this.fail( format("?: (?) is undefined",
                    message || "assertNotUndefined", actual), actual );
            }
        },
        
        assertNaN: function (actual, message) {
            if (!isNaN(actual)) {
                this.fail( format("?: (?) is not NaN",
                    message || "assertNaN", actual), actual );
            }
        },
        
        assertNotNaN: function (actual, message) {
            if (isNaN(actual)) {
                this.fail( format("?: (?) is NaN",
                    message || "assertNotNaN", actual), actual );
            }
        },
        
        fail: function (message) { // optional args: [expected,] actual
            throw message || "fail";
        }
    };
    
    function plural(cnt, unit) {
        return cnt + " " + unit + (cnt == 1 ? "" : "s");
    }

    function splitFunction(fn) {
        var tokens =
            /^[\s\r\n]*function[\s\r\n]*([^\(\s\r\n]*?)[\s\r\n]*\([^\)\s\r\n]*\)[\s\r\n]*\{((?:[^}]*\}?)+)\}[\s\r\n]*$/
            .exec(fn);
        
        if (!tokens) throw "Invalid function.";
        
        return {
            name: tokens[1].length ? tokens[1] : undefined,
            body: tokens[2]
        };
    }
    
    var probeOutside = function () {
        try { // NOTE: this will always fail in FBJS !
            return eval([ "typeof ", " === \"function\" && ", "" ].join(arguments[0]));
        }
        catch (e) { return false; }
    };

    function parseSuiteString(str) {
        var obj = {};

        var probeInside = new Function(
            splitFunction(probeOutside).body + str);

        var tokenRe = /(\w+)/g; // todo: wiser regex
        var tokens;

        while ((tokens = tokenRe.exec(str))) {
            var token = tokens[1];
            var fn;
    
            if (!obj[token]
                && (fn = probeInside(token))
                && fn != probeOutside(token)) {

                obj[token] = fn;
            }
        }

        return parseSuiteObject(obj);
    }

    function parseSuiteFunction(fn) {
        var fnParts = splitFunction(fn);
        var suite = parseSuiteString(fnParts.body);

        suite.suiteName = fnParts.name;

        return suite;
    }

    function parseSuiteArray(tests) {
        var obj = {};

        for (var i = 0; i < tests.length; i++) {
            var item = tests[i];
            
            if (! obj[item] ) {
                switch (typeof item) {
                case "function":
                    var fnParts = splitFunction(item);
                    obj[fnParts.name] = item;
                    break;
                case "string":
                    var fn = probeOutside(item);
                    
                    if (fn) obj[item] = fn;
                }
            }
        }

        return parseSuiteObject(obj);
    }

    function parseSuiteObject(obj) {
        var suite = new jsUnity.TestSuite(obj.suiteName, obj);

        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                var fn = obj[name];
                
                if (typeof fn === "function") {
                    if (/^test/.test(name)) {
                        suite.tests.push({ name: name, fn: fn });
                    } else if (/^setUp|tearDown$/.test(name)) {
                        suite[name] = fn;
                    }
                }
            }
        }
        
        return suite;
    }

    // Is the given value a regular expression?
    function isRegExp(obj) {
        return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
    }

    return {
        TestSuite: function (suiteName, scope) {
            this.suiteName = suiteName;
            this.scope = scope;
            this.tests = [];
            this.setUp = undefined;
            this.tearDown = undefined;
        },

        TestResults: function () {
            this.suiteName = undefined;
            this.total = 0;
            this.passed = 0;
            this.failed = 0;
            this.duration = 0;
            this.asserts = 0;
        },

        assertions: defaultAssertions,

        env: {
            defaultScope: this,
            getDate: function () {
                return new Date();
            }
        },
        
        attachAssertions: function (scope) {
            scope = scope || this.env.defaultScope;

            for ( var fn in jsUnity.assertions ) {
                scope[fn] = jsUnity.assertions[fn];
            }
        },

        format: format, // export format helper for custom assetrions

        log: function () {},

        start: function() {},
        startSuite: function(name) {},

        result: function (passed, name, e) {
            // e might be undefined in case the test passed :
            var status = passed ? 'PASSED' : 'FAILED';
            var error = typeof(e) === 'undefined' ? '' : e;
            this.log("[" + status + "]" + ' ' + name + ' ' + error);
        },
        
        done: function() {},
        doneSuite: function(name) {},
        
        compile: function (v) {
            if ( v instanceof jsUnity.TestSuite ) {
                return v;
            } else if ( typeof(v) === 'function' ) {
                return parseSuiteFunction(v);
            } else if ( typeof(v) === 'array' ) {
                return parseSuiteArray(v);
            } else if ( typeof(v) === 'object' ) {
                return parseSuiteObject(v);
            } else if ( typeof(v) === 'string' ) {
                return parseSuiteString(v);
            } else {
                throw "Argument must be a function, array, object, string or "
                    + "TestSuite instance.";
            }
        },

        run: function () {
            var results = new jsUnity.TestResults();

            var suiteNames = [];
            var start = jsUnity.env.getDate();
            
            this.start();

            var suites = arguments, testRegExp;
            // last argument might be a test filter "pattern" :
            if ( isRegExp( arguments[arguments.length - 1] ) ) {
                testRegExp = arguments[arguments.length - 1];
                suites = arguments.slice(0, -1);
            }

            for ( var i = 0; i < suites.length; i++ ) {
                try {
                    var suite = jsUnity.compile( suites[i] );
                }
                catch (e) {
                    this.log('[ERROR] invalid test suite: "' + suites[i] + '" ' + e);
                    return false;
                }

                var cnt = suite.tests.length;

                this.log( "Running " + (suite.suiteName || "unnamed test suite") );
                this.log( plural(cnt, "test") + " found" );

                this.startSuite(suite.suiteName);

                suiteNames.push(suite.suiteName);
                results.total += cnt;

                for ( var j = 0; j < cnt; j++ ) {
                    var test = suite.tests[j], tearedDown;
                    
                    if ( testRegExp && ! testRegExp.test( test.name ) ) {
                        results.total--; // don't count if not run
                        continue;
                    }
                    
                    try {
                        suite.setUp && suite.setUp();
                        test.fn.call(suite.scope);
                        tearedDown = true; // don't call tearDown() twice
                        suite.tearDown && suite.tearDown();

                        results.passed++;

                        this.result(true, test.name); // passed
                    }
                    catch (e) {
                        tearedDown || ( suite.tearDown && suite.tearDown() );
                        
                        this.result(false, test.name, e); // failed
                    }
                }

                this.doneSuite(suite.suiteName);
            }

            results.suiteName = suiteNames.join(",");
            results.failed = results.total - results.passed;
            results.duration = jsUnity.env.getDate() - start;
            
            this.log( plural(results.passed, "test") + " passed" );
            this.log( plural(results.failed, "test") + " failed" );
            this.log( plural(results.duration, "millisecond") + " elapsed" );

            this.done();

            return results;
        }
    };
})();
