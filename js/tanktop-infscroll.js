/*
 * tanktop-infscroll - an infinite scroll supporting variable mosaics by Tank Top TV
 *
 * Copyright 2012-3 Tank Top TV Ltd
 *
 * Licensed under the Apache License, Version 2.0 - http://www.apache.org/licenses/LICENSE-2.0
 */

(function($) {

    var current_page = function($this, height) {
        var page = Math.floor($this.scrollTop() / height);
        if (page < 0) {
            page = 0;
        }
        return page;
    };

    var getHeight = function(data) {
        var candidates = data.moving_tiles.$target.children().slice(-(data.moving_tiles.settings.numberToLoad));
        var bottoms = candidates.map(function() {
            return $(this).position().top + $(this).outerHeight();
        }).get();

        return Math.max.apply(Math, bottoms);
    };

    var setLoadedLimits = function(loadDown, tiles, number) {
        if (loadDown) {
            tiles.maxLoaded += number;
        } else {
            tiles.minLoaded -= number;
        }
        console.log("Now loaded " + tiles.minLoaded + "-" + tiles.maxLoaded);
    };

    function render_data(data, json, fixed_json) {
        var do_fixed = data.fixed_tiles && fixed_json;
        var moving_items = (data.moving_tiles.settings.jsonField && json[data.moving_tiles.settings.jsonField]) || json;

        setLoadedLimits(data.loadDown, data.moving_tiles, moving_items.length);

        if (moving_items.length < data.moving_tiles.settings.numberToLoad) {
            data.loadComplete = true;
        }

        var fixed_items = null;
        if (do_fixed) {
            fixed_items = (data.fixed_tiles.settings.jsonField && fixed_json[data.fixed_tiles.settings.jsonField]) || fixed_json;

            // If we have loaded all the main items, we might need to truncate the small blocks
            if (data.loadComplete) {
                var fixed_item_truncate_length = data.fixed_tiles.settings.helpers.truncate(moving_items.length);
                fixed_items = fixed_items.slice(0, fixed_item_truncate_length);
                console.log("Truncating fixed tiles to " + fixed_item_truncate_length);
            }

            setLoadedLimits(data.loadDown, data.fixed_tiles, fixed_items.length);
        }

        // If there aren't very many items, use the fewer blocks settings
        var use_fewer_tiles = (data.settings.fewer_tiles && (data.moving_tiles.maxLoaded + data.fixed_tiles.maxLoaded < data.settings.fewer_tiles.limit));
        if (use_fewer_tiles) {
            console.log("Fewer tiles");
        }

        var main_target = use_fewer_tiles ? data.settings.fewer_tiles.target : data.moving_tiles.settings.target;
        var fixed_target = use_fewer_tiles ? data.settings.fewer_tiles.target : data.fixed_tiles.settings.target;
        var main_helpers = use_fewer_tiles ? data.settings.fewer_tiles.helpers : data.moving_tiles.settings.helpers;
        var fixed_helpers = use_fewer_tiles ? data.settings.fewer_tiles.helpers : data.fixed_tiles.settings.helpers;

        // Index of the first tile we're going to place
        var moving_item_offset = data.loadDown ? data.moving_tiles.maxLoaded - moving_items.length : data.moving_tiles.minLoaded;
        var fixed_item_offset = do_fixed ? (data.loadDown ? data.fixed_tiles.maxLoaded - fixed_items.length : data.fixed_tiles.minLoaded) : 0;

        $.when(tanktop.utils.renderExtTemplate({
            name: data.moving_tiles.settings.template,
            selector: main_target,
            data: moving_items,
            append: true,
            helpers: main_helpers,
            prepend: !(data.loadDown),
            index_offset: moving_item_offset
        }),
        tanktop.utils.renderExtTemplate({
            name: data.fixed_tiles.settings.template,
            selector: fixed_target,
            data: fixed_items,
            append: true,
            helpers: fixed_helpers,
            prepend: !(data.loadDown),
            index_offset: fixed_item_offset
        }))
            .done(function() {
            if (data.settings.fewer_tiles && (data.moving_tiles.maxLoaded + data.fixed_tiles.maxLoaded < data.settings.fewer_tiles.limit)) {
                data.moving_tiles.$target.children().addClass(data.settings.fewer_tiles.extra_class);
            }

            data.current_height = getHeight(data);
            data.moving_tiles.$target.css("height", data.current_height);
            data.fixed_tiles.$target.css("height", data.current_height);
            var container_pos = data.moving_tiles.$target.position();
            if (container_pos) {
                data.fixed_tiles.$target.css({
                    "top": container_pos.top + "px",
                    "left": container_pos.left + "px"
                });
            }

            if (json[0] && json[0][data.settings.jsonField] && data.settings.completion) {
                data.settings.completion(data.moving_tiles.settings.target);
            }

            console.log("render complete");

            $("#loading").hide();

            data.loading = false;
            data.settings.after_loading(data.moving_tiles.maxLoaded);

            if (data.setPage) {
                data.$this.scrollTop(data.moving_tiles.minLoaded * data.settings.pageHeight / data.moving_tiles.settings.numberToLoad);
                data.setPage = false;
            }

            check_for_more(data);
        });
        return;
    }

    var load_data = function load_json_data(loadDown, tiles) {
        if ((tiles === null) || (tiles.settings.numberToLoad === 0)) {
            console.log("No data to load");
            return;
        }

        var start = loadDown ? tiles.maxLoaded : tiles.minLoaded - tiles.settings.numberToLoad;
        console.log("Loading from " + start);

        var params = tiles.settings.base_params;
        params[tiles.settings.start_param] = start;
        params[tiles.settings.count_param] = tiles.settings.numberToLoad;

        return $.getJSON(tiles.settings.url, params);
    };

    function check_for_more(data) {
        var load_from_page = 0;
        if (data.current_page > data.settings.scrollFactor) {
            load_from_page = data.current_page - data.settings.scrollFactor;
        }
        var load_to_page = data.current_page + data.settings.scrollFactor;

        if (!data.loading && (data.moving_tiles.minLoaded / data.moving_tiles.settings.numberToLoad) > load_from_page) {
            console.log("Load more above");
            console.log("Current min: " + data.moving_tiles.minLoaded + " on page: " + (data.moving_tiles.minLoaded / data.moving_tiles.settings.numberToLoad));
            data.loadDown = false;
            load(data);
        }

        if (!data.loading && !data.loadComplete && ((data.moving_tiles.maxLoaded / data.moving_tiles.settings.numberToLoad) < load_to_page)) {
            console.log("Load more below");
            console.log("Current max: " + data.moving_tiles.maxLoaded + " on page: " + (data.moving_tiles.maxLoaded / data.moving_tiles.settings.numberToLoad));
            data.loadDown = true;
            load(data);
        }
    }

    var load = function(data) {
        if (!data.loading && (!data.loadComplete || (!data.loadDown && data.moving_tiles.minLoaded > 0))) {
            data.loading = true;
            $("#loading").show();

            $.when(data.moving_tiles.settings.load_data_fn(data.loadDown, data.moving_tiles),
            data.fixed_tiles.settings.load_data_fn(data.loadDown, data.fixed_tiles))
                .then(function(main_data, fixed_data) { // each of these returns jqXHR, need to get the data out
                main_data_0 = main_data && main_data[0];
                fixed_data_0 = fixed_data && fixed_data[0];
                render_data(data, main_data_0, fixed_data_0);
                // render_data(data, main_data, fixed_data);
            },

            function(jqXHR, textStatus, errorThrown) { // fail
                console.log("something went wrong");
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
            },

            function(p) { // progress
                console.log("progress");
                console.log(p);
            });
        }
    };

    var methods = {
        init: function(options) {
            // Create some defaults, extending them with any options that were provided
            var settings = $.extend(true, {
                scrollFactor: 3, // number of pages to load above / below
                discardFactor: 5, // discard pages this far away - TODO! not currently implemented
                pageHeight: 1000, // Height of each page in pixels
                moving_tiles: {
                    url: document.location.href, // URL for data feed
                    base_params: {
                        json: true
                    }, // params to be supplied to the
                    start_param: 'start',
                    count_param: 'count',
                    jsonField: null, // JSON field containing array of items to load.  If left null, expect a JSON array.
                    target: null, // selector of element to add to
                    template: null, // JSRender template for each tile
                    numberToLoad: 16, // Number of tiles of this type per page
                    helpers: {}, // helper functions
                    load_data_fn: load_data
                },
                fixed_tiles: {
                    url: document.location.href, // URL for data feed
                    base_params: {
                        json: true
                    }, // params to be supplied to the
                    start_param: 'start',
                    count_param: 'count',
                    jsonField: null, // JSON field containing array of items to load.  If left null, expect a JSON array.
                    target: null, // selector of element to add to
                    template: null, // JSRender template for each tile
                    numberToLoad: 16, // Number of tiles of this type per page
                    helpers: {}, // helper functions
                    load_data_fn: load_data
                },
                fewer_tiles: {},
                current_page: 0,
                doAfterFirstLoad: function() {},
                doAfterEachLoad: function() {}
            }, options);

            return this.each(function() {

                var $this = $(this);
                var data = $this.data('infscroll');

                if (!data) {
                    var page = +settings.current_page;
                    data = {
                        $this: $this,
                        settings: settings,
                        loading: false,
                        loadComplete: false,
                        current_height: 0,
                        loadDown: true,
                        setPage: (page !== 0),
                        current_page: page
                    };

                    data['moving_tiles'] = {
                        $target: $(settings.moving_tiles.target),
                        settings: settings.moving_tiles,
                        maxLoaded: 0,
                        minLoaded: 0
                    };

                    if (settings.fixed_tiles) {
                        data['fixed_tiles'] = {
                            $target: $(settings.fixed_tiles.target),
                            settings: settings.fixed_tiles,
                            maxLoaded: 0,
                            minLoaded: 0
                        };
                    } else if (data['fixed_tiles']) {
                        delete data['fixed_tiles'];
                    }

                    $this.data('infscroll', data);
                }

                // Load more items as you scroll near the end of the page
                $this.scroll(function() {
                    var page = current_page($this, data.settings.pageHeight);

                    if (data.current_page != page) {
                        data.current_page = page;

                        // Push this scroll state
                        var url = window.location.pathname;
                        url += "?page=" + page;
                        window.history.replaceState({}, document.title, url);
                    }

                    check_for_more(data);
                });

                $(document).on("reload.infscroll", function() {
                    $this.infscroll("reload");
                });

                // Initial load
                data.moving_tiles.minLoaded = data.moving_tiles.settings.numberToLoad * data.current_page;
                data.moving_tiles.maxLoaded = data.moving_tiles.settings.numberToLoad * data.current_page;
                if (data.fixed_tiles) {
                    data.fixed_tiles.minLoaded = data.fixed_tiles.settings.numberToLoad * data.current_page;
                    data.fixed_tiles.maxLoaded = data.fixed_tiles.settings.numberToLoad * data.current_page;
                }

                load(data);
            });
        },
        decrement: function() {
            var $this = $(this);
            var data = $this.data('infscroll');
            data.moving_tiles.maxLoaded -= 1;
        },
        reload: function() {
            console.log("reload");
            var $this = $(this);
            var data = $this.data('infscroll');

            data.loading = false;
            data.loadComplete = false;
            data.current_height = 0;
            data.current_page = 0;
            if (data.moving_tiles) {
                data.moving_tiles.$target.empty();
            }

            if (data.fixed_tiles) {
                data.fixed_tiles.$target.empty();
            }

            if (data.settings.moving_tiles) {
                data.moving_tiles.maxLoaded = 0;
                data.moving_tiles.minLoaded = 0;
            }

            if (data.settings.fixed_tiles) {
                data.fixed_tiles.maxLoaded = 0;
                data.fixed_tiles.minLoaded = 0;
            }

            load(data);
        }
    };

    $.fn.infscroll = function(method) {

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.infscroll');
        }

    };

})(jQuery);