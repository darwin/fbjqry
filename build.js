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
var srcFiles = [ 'Support.js', 'Support_findNodes.js', 'FBjqRY.js' ];
var outDir = '.';
var outFile = 'fbjqry.js';
var outMinFile = 'fbjqry.min.js';

var compilerUrl = 'http://closure-compiler.appspot.com/compile';
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
