/*!
 * A wrapper for FBJS to make it feel more like jQuery.
 *  FB   = Facebook
 *  jqRY = jQuery
 *  RY   = RockYou!
 * @author: Nate McQuay [borrowing heavily from jQuery 1.2.6]
 * @author: Karol Bucek [building on top of Nate's version to make it more "complete"]
 *
 * Copyright 2010, Karol Bucek
 * Released under the MIT license.
 */

//can't wrap this because it needs to be "global" and we don't have access to the window object
var FBjqRY = function(selector, context) {
    return new FBjqRY.prototype.init(selector, context);
};
//We can wrap everything else
(function() {