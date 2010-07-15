/**
 * A build script based on RingoJS.
 *
 * available tasks :
 *
 *      `ringo build.js concat` - concatenate sources into a single .js
 *
 *      `ringo build.js minify` - minify the concatenated .js file
 *
 *      `ringo build.js` - by default concats and minifies
 * 
 */
var srcDir = 'src'

var srcFiles = [
    'intro.js',
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
    'outro.js'
];
var outDir = '.';
var outFile = 'fbjqry.js';
var outMinFile = 'fbjqry.min.js';

var compilerUrl = 'http://closure-compiler.appspot.com/compile';
var compilerJarUrl = 'http://closure-compiler.googlecode.com/files/compiler-latest.zip';
var compilerJarPath = 'lib/compiler.jar';
var compilerOptions = {};
compilerOptions['output_info'] = 'compiled_code';
compilerOptions['output_format'] = 'text';
compilerOptions['compilation_level'] = 'SIMPLE_OPTIMIZATIONS';

var concat = function() {
    var fs = require("fs");
    var content = '', path = fs.Path(srcDir);
    for ( var i = 0; i < srcFiles.length; i++ ) {
        content += fs.read( path.join( srcFiles[i] ) );
    }

    path = fs.Path( fs.absolute(outDir) );
    fs.write( path.join(outFile), content );

    sys.print('writen sources content into:', outFile);
};

var minify = function() {
    var fs = require("fs");
    var path = fs.Path( fs.absolute(outDir) );
    var content = fs.read( path.join( outFile ) );
    
    importPackage(java.io, java.net);
    /**
    * POST data to an url.
    * @param url
    * @param data
    * @returns response
    */
    var responseHeaders = null;
    function postData(url, data) {
        var connection = new URL(url).openConnection();
        connection.setRequestMethod('POST');
        connection.addRequestProperty('Content-type', 'application/x-www-form-urlencoded');

        connection.setDoOutput(true);
        var outStream = connection.getOutputStream();
        var dataBuffer = new java.lang.String(data).getBytes('UTF-8');
        outStream.write(dataBuffer, 0, dataBuffer.length);
        outStream.close();

        var c = connection;responseHeaders = {};
        for ( var i = 1; i < c.getHeaderFields().size(); i++ ) {
            responseHeaders[c.getHeaderFieldKey(i)] = c.getHeaderField(i);
        }

        var reader = new BufferedReader( new InputStreamReader( connection.getInputStream() ) );
        var line, response = [];
        while ( (line = reader.readLine()) != null ) response.push(line);
        response = response.join('\n');

        sys.print('HTTP response: ' + connection.getResponseCode() +
                    ' ' + connection.getResponseMessage() +
                    ' (size = ' + response.length + ')');

        return response;
    }
    function printResponseHeaders() {
        for (var prop in responseHeaders) sys.print(prop + ' = ' + responseHeaders[prop]);
    }
    /**
    * Encode the given content.
    * @returns encoded content
    */
    function encodeContent(content) {
        if (typeof content === 'string') {
            return encodeURI(content);
        }
        if (typeof content !== 'object') {
            throw 'could not encode content of type: ' + (typeof content);
        }
        var prop, contentMap = [];
        for ( prop in content ) {
            contentMap.push( encodeURIComponent(prop) + '=' + encodeURIComponent(content[prop]) );
        }
        return contentMap.join('&');
    }
    /**
    * Validate the received response from the compiler.
    */
    function validateResponse(response) {
        var jResponse = new java.lang.String(response).trim();
        if ( jResponse.length == 0 ) {
            printResponseHeaders();
            throw 'the HTTP response was empty !';
        }
        if ( jResponse.startsWith('Error(') ) {
            sys.print(response);
            throw 'compiler returned an error ...';
        }
    }

    var data = { 'js_code': content };
    for ( var opt in compilerOptions ) {
        if ( compilerOptions.hasOwnProperty(opt) ) {
            data[ opt ] = compilerOptions[ opt ];
        }
    }
    var minified = postData( compilerUrl, encodeContent(data) );
    validateResponse(minified);
    var minFileWriter = new FileWriter(new File(outMinFile), false);
    minFileWriter.write(minified, 0, minified.length);
    minFileWriter.close();

    sys.print('writen minified content into:', outMinFile,
             '(size reduced from '+ content.length +' bytes to '+ minified.length +' bytes)');
};

/**
 * Can't use the online version of the closure compiler due to the appengine
 * request 2MB POST limit !
 *
 * Redefining the minify function with an "almost" offline version, downloads
 * the compiler.zip on-demand and compiles javascript locally.
 */
minify = function() {
    var fs = require("fs"), fsBase = require("fs-base");
    if ( ! fsBase.exists(compilerJarPath) ) {
        var jarPath = fs.split(compilerJarPath);
        var jarFile = jarPath[ jarPath.length - 1 ];
        var zipFile = fs.base( jarFile, fs.extension(jarFile) ) + '.zip';
        jarPath = fs.Path( fs.absolute( fs.join( jarPath.slice(0, -1) ) ) );
        fs.makeTree(jarPath);

        importPackage(java.lang, java.lang.reflect, java.net, java.io);
        var zipInStream = new URL(compilerJarUrl).openStream();
        zipFile = new File(jarPath, zipFile);
        var zipOutStream = new FileOutputStream(zipFile);
        var buffer = Array.newInstance(Byte.TYPE, 8192), len;
        try {
            while ( ( len = zipInStream.read(buffer) ) != -1 ) {
                zipOutStream.write(buffer, 0, len);
            }
        }
        finally {
            zipInStream.close();
            zipOutStream.close();
        }

        importPackage(java.util.zip);
        zipFile = new ZipFile(zipFile);
        var jarInStream = zipFile.getInputStream( zipFile.getEntry('compiler.jar') );
        var jarOutStream = new FileOutputStream(compilerJarPath);
        try {
            while ( ( len = jarInStream.read(buffer) ) != -1 ) {
                jarOutStream.write(buffer, 0, len);
            }
        }
        finally {
            jarInStream.close();
            jarOutStream.close();
        }
    }

    addToClasspath( fs.Path( fs.absolute(compilerJarPath) ).toString() );

    var compilerArgs = [];
    for ( var opt in compilerOptions ) {
        if ( compilerOptions.hasOwnProperty(opt)
            && opt.substring(0, 6) != 'output' ) {
            compilerArgs.push( '--' + opt );
            compilerArgs.push( compilerOptions[ opt ] );
        }
    }
    var path = fs.Path( fs.absolute(outDir) );
    compilerArgs.push('--js');
    compilerArgs.push( path.join( outFile ) );
    compilerArgs.push('--js_output_file');
    compilerArgs.push( outMinFile );

    com.google.javascript.jscomp.CommandLineRunner.main(compilerArgs);
    // main() does a System.exit thus we do not get here ... ;-(
    sys.print('writen minified content into:', outMinFile,
             '(size reduced from ' + fsBase.size( path.join( outFile ) ) +
             ' bytes to ' + fsBase.size( path.join( outMinFile ) ) + ' bytes)');
}

var tasks = { concat: null, minify: 'concat', _default: 'concat' };

function run(task) {
    var depTask = tasks[ task ], queue = [ task ];
    if ( task === undefined ) throw 'unsupported task: ' + task;
    while ( depTask ) {
        queue.push( depTask );
        depTask = tasks[ depTask ];
    }
    // run them in the correct order (reversed) :
    queue = queue.reverse();
    for ( var i = 0; i < queue.length; i++ ) {
        this[ queue[i] ]();
    }
}

var sys = require("system");

var task = sys.args[1];
if ( ! task ) task = tasks._default;

run( task );
