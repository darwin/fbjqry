include('ringo/webapp/response');
include('ringo/webapp/env');

var DEVELOPMENT = config.env == 'development';

var fs = require("fs");
var ts = new Date().getTime();
var staticDir = config.httpConfig.staticDir;
var staticURL = staticDir;

var baseURL;
if ( DEVELOPMENT ) {
    var sys = require("system");
    baseURL = sys.args[0];
    if ( baseURL ) {
        staticURL = baseURL[baseURL.length - 1] === '/' ? 
            ( baseURL + staticURL ) : ( baseURL + '/' + staticURL );
    }
    else {
        throw "no (base) canvas URL specified use: `ringo main.js [CANVAS_URL]` during development"
    }
}

exports.index = function (req) {
    //sys.print('config:', config.env);
    //sys.print('env:', req['env']);
    //sys.print('cfg:', req['cfg']);
    
    var args = req.params['run'] || 'all';
    if (args == 'all') {
        args = 'allTestSuites()';
    }
    else {
        if ( ! args.match(/.+?Suite/) ) args += 'Suite';
    }
    
    var only = req.params['only'];
    if (only) {
        args += ', ';
        if ( ! only.match(/\/.+?\//) ) {
            args += '/' + only + '/i';
        } 
        else args += only;
    }

    var content = renderSourceScripts();
    content = content.concat( renderTestHelpers() );
    content = content.concat( renderUnitTests() );

    content.push("\
    <script type='text/javascript'> \n\
        jsUnity.run( "+ args +" ); \n\
    </script>");

    return {
        status: 200,
        headers: {'Content-Type': 'text/html'},
        body: [ content.join("\n") ]
    };
};

/**
 * build should copy the 'lib' dir to 'static' dir !
 */
function renderTestHelpers() {
    var content = [];
    if ( DEVELOPMENT ) {
        var fsBase = require("fs-base");
        var libPath = fs.Path('lib');
        var staticLibPath = fs.Path(staticDir).join('lib');

        var fPublicPaths = {};
        ['jsUnity.js', 'testHelper.js', 'testHelper.css'].forEach( function(f) {
            var libFPath = libPath.join(f), staticLibFPath = staticLibPath.join(f);
            if ( ! fsBase.exists(staticLibFPath) ||
                fsBase.lastModified( libFPath ) > fsBase.lastModified( staticLibFPath ) ) {
                fs.makeTree( staticLibPath );
                fs.copy( libFPath, staticLibFPath );
            }

            fPublicPaths[f] = staticURL + "/lib/" + f + "?" + fsBase.lastModified( libFPath ).getTime();
        });
        
        content.push("<script src='"+ fPublicPaths['jsUnity.js'] + "'></script>");
        content.push("<script src='"+ fPublicPaths['testHelper.js'] + "'></script>");
        content.push("<link href='"+ fPublicPaths['testHelper.css'] +"' type='text/css'></link>");
    }
    else {
        content.push("<script src='" + staticURL + "/lib/jsUnity.js?"+ ts + "'></script>");
        content.push("<script src='" + staticURL + "/lib/testHelper.js?"+ ts + "'></script>");
        content.push("<link href='" + staticURL + "/lib/testHelper.css?"+ ts +"' type='text/css'></link>");
    }

    // helper for tused by the testHelper.js to create the green-red dialog
    content.push("\n\
    <fb:js-string var='dialogContent'>\n\
    <div id='dialogContent' style='display: none;'></div>\n\
    </fb:js-string>\n\
    ");
    
    return content;
}

/**
 * 'unit' dir needs to be packaged !
 */
function renderUnitTests() {
    var content = [];
    fs.Path('unit').listPaths().forEach( function(unitPath) {
        if ( fs.extension(unitPath) == '.html' ) {
            content.push( "<!-- " + unitPath + " -->" );
            content.push( fs.read( unitPath ) );
        }
    });
    return content;
}

/**
 * build needs to copy the 'FBjqRY.js' to the 'static' dir !
 */
function renderSourceScripts() {
    if ( DEVELOPMENT ) {
        return _renderSourceScriptsDevelopment();
    }
    else {
        return _renderSourceScriptsProduction();
    }
}

function _renderSourceScriptsProduction() {
    var content = [];
    var src = 'http://github.com/kares/fbjqry/raw/master/fbjqry.js';
    content.push("<script type='text/javascript' src='" + src + "?" + ts + "'></script>\n");
    return content;
}

function _renderSourceScriptsDevelopment() {
    var fsBase = require("fs-base");
    var staticPath = fs.Path(staticDir);
    
    var sourcePath = fs.Path('../src'),
        sourceFiles = [
        //'intro.js',
        'core.js',
        'support.js',
        'data_queue.js',
        'attributes.js',
        'css_dimensions.js',
        'selector.js',
        'traversing.js',
        'manipulation.js',
        'event.js',
        'ajax.js',
        'effects.js',
        'offset.js',
        //'outro.js'
    ];
    var maxScripts = 3; // FBJS can't handle too many script tags with src
    
    var content = [];
    content.push("\
    <script type='text/javascript'> \n\
    var FBjqRY = function(selector, context) { // intro.js \n\
        return new FBjqRY.prototype.init(selector, context); \n\
    }; \n\
    var jQuery = FBjqRY, $ = FBjqRY; // outro.js \n\
    </script>");

    var concatCount = Math.floor( sourceFiles.length / maxScripts );
    if ( maxScripts * concatCount < sourceFiles.length ) concatCount++;
    
    var i = 0;
    for ( var m = 1; m <= maxScripts; m++ ) {
        var concatFile = 'concat' + m + '.js';
        var concatPath = staticPath.join( concatFile );
        
        var count = concatCount, iStart = i;
        var doConcat = ! fsBase.exists(concatPath), concatContent = '';
        var concatMod = doConcat ? null : fsBase.lastModified( concatPath );

        while ( count-- > 0 && i < sourceFiles.length ) {
            var path = sourcePath.join( sourceFiles[i++] );
            if ( doConcat ) {
                concatContent += fs.read( path );
            }
            else {
                if ( fsBase.lastModified( path ) > concatMod ) {
                    doConcat = true;
                    count = concatCount;
                    i = iStart;
                    continue;
                }
            }
        }

        if ( doConcat ) fs.write( concatPath, concatContent );
        concatMod = fsBase.lastModified( concatPath ).getTime();

        content.push("<script src='" + staticURL + "/"+ concatFile + "?" + concatMod + "'></script>");
    }
    
    return content;
}
