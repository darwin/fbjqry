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

TODO


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

   array style access for FBjqRY ("jQuery") objects does not work, use get :

    var $div = $('div')[0]; // BAD - won't work cause of FBJS !
    var $div = $('div').get(0); // OK

   calling the FBjqRY function with arbitrary HTML won't work, it's based on
   the `setInnerXHTML()` FBJS feature thus only accepts valid XHTML strings :

    var $el = $('<div/><hr/><b/>'); // BAD - not valid XHTML !
    var $el = $('<div><hr/><b/></div>'); // OK - valid XHTML

    var $el = $('<div id="main"><div/>'); // BAD - double quotes !
    var $el = $("<div id='main'><div/>"); // OK - single quotes

   the `FBjqRY.data()` method does not trigger any handlers as jQuery does

Issues
------


Setup
=====

TODO

Logging
-------

TODO


[http://docs.jquery.com](jQuery Documentation)

[http://wiki.developers.facebook.com/index.php/FBJS](FBJS Documentation)

[http://code.google.com/p/fbjqry](FbjqRY 'old' project page)

Code inspired by [http://jquery.com](jQuery), jQuery is licensed under MIT.

Authors: Nate McQuay, Antonin Hildebrand, Karol Bucek
