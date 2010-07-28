FBjqRY
======

THIS CODE IS A WORK IN PROGRESS AND IS CHANGING FAST, PLEASE STAY TUNED OR USE
THE LAST AVAILABLE "STABLE" VERSION FROM [http://code.google.com/p/fbjqry/] !

A wrapper library around Facebook's FBJS, which provides a jQuery-like interface
for working with FBML (as much as possible).

  FB   = Facebook
  jqRY = jQuery
  RY   = RockYou!

API
===

Code is based on jQuery 1.3.2 with some 1.4.2 goodies.

Extensions
----------

The `FBjqRY.fbjs` module contains function for dealing with FBJS "DOM" nodes.

There's an `FBjqRY.isString` for determining whether the argument is a String,
that works with "pre-rendered" FBML blocks besides regular Javascript strings.

There is a `FBjqRY.fn.fbml` function similar to `FBjqRY.fn.html` for setting
FBML markup content into Facebook DOM nodes (based on `setInnerFBML`).


LIMITATIONS
-----------

   FBJS does only support regular nodes, thus don't ever expect comments or
   text nodes to be returned e.g. :

    var cont = $('#header').contents(); // returns only nodes with a "tagName"
    
   FBJS does not provide a reliable way to compare FB nodes, thus FBjqRY will
   generate ids for the accessed HTML (canvas) elements unless explicitly set !

   the previous limitation also implies that changing a FB element's id using
   Javascript might have unexpected behavior if the id You set was previously
   used for a different FB element !

   FBJS only provides access to a limited set of attributes - thus custom
   element attributes or even some valid ones might not be accessible

   FBML "normalizes" Your anchor's href values e.g. :

    <!-- Your canvas "source" (FBML) : -->
    <a href="http://www.example.com"></a>
    <a href="#"></a>

    <!-- Becomes rendered as (HTML) : -->
    <a href="http://www.example.com/"></a>
    <a href="[YOUR_CANVAS_HOME_URL]/"></a>

   array style access for FBjqRY ("jQuery") objects does not work, use `get` :

    var $div = $('div')[0]; // BAD - will be undefined cause of FBJS !
    var $div = $('div').get(0); // OK

   calling the FBjqRY function with arbitrary HTML won't work, some HTML types
   are not supported by the parser e.g. `<object>` or `<button>` :

    var $el = $('<button/>'); // FAILS

   XHTMLize tags in Your HTML markup to be accepted by the XHTML parser :

    var $el = $('<div/><hr/><br>'); // BAD - <br> is not valid XHTML !
    var $el = $('<div/><hr/><br/>'); // OK - <br/> is valid XHTML

   the XHTML parser does not allow inline style with opacity (set manually) :

    var $el = $("<div id='main' style='opacity: 0.55;'/>"); // BAD - fails
    var $el = $("<div id='main'/>").css('opacity', '0.55'); // OK - works

   the `FBjqRY.data()` method does not trigger any handlers as jQuery does

Issues
------



Setup
=====

For building/developing FBjqRY You'll need [http://ringojs.org](RingoJS).

For building the project see the `build.js` file.

Instructions for development setup might be found under test/README !

Logging
-------

TODO


[http://docs.jquery.com](jQuery Documentation)

[http://wiki.developers.facebook.com/index.php/FBJS](FBJS Documentation)

[http://code.google.com/p/fbjqry](FbjqRY 'old' project page)

Code inspired by [http://jquery.com](jQuery), jQuery is licensed under MIT.

Authors: Nate McQuay, Antonin Hildebrand, Karol Bucek
