tanktop-infscroll
=================

A mosaic infinite scroll 

 * Supports any mosiac layout
 * Fixed items that remain in place, and moving items that can be deleted
 * Supports paging

 TODO: 

 * Discard / hide images if they are scrolled far enough off the screen (for performance)
 * Check to see if enough moving items have been deleted to warrant skipping a page before loading a page of fixed items


Installation
------------

I'm experimenting with [Bower](http://twitter.github.io/bower/) to manage this package.  Apologies if this is wrong but you might be able to do this:

    bower install git://github.com/TankTopTV/tanktop-infscroll.git

Or you can just clone the Git repo.  

Dependencies
------------

You'll need [jQuery](http://jquery.com) and [jsRender](https://github.com/BorisMoore/jsrender).


Background
----------

To see the mosaic scroll in action, check out these examples: 

 * Example scroll code in this project
 * Tank Top Movies (http://movies.tanktop.tv)
 * Add your example here! 

I presented about this at Hacker News London in February 2013 - if you'd like to know more about why we built this and what it can do, check out the video and slides here: http://blog.tanktop.tv/2013/03/to-infinity-and-beyond.html

Example
-------

There is a simple Django application example in the infscroll directory.  Note that for this to execute correctly you'll need to install the infinite scroll js directory underneath infscroll/static.  

Copyright 2012-13 Tank Top TV Ltd
