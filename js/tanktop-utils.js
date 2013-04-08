

var tanktop = tanktop || {};
tanktop.utils = (function() {
	
	var price = function(value) {
		if (!value || (value == "0")) {
			return "free"; 
		} else if (value == -1) {
			return "subscription"; 
		}
		return value;					
	};
	
	var ellipsis = function (value) {
		if (value.length > 20) {
			return value.substring(0, 17) + "..."; 
		}
		return value;
	}	

    // This relies on this script being the last one when this code runs
    var scriptSource = (function() {
    	var ss = $('script[src*="tanktop"]').last().attr('src');
        return ss.substring(0, ss.lastIndexOf('/'));
    })();
    
	/*
	 * Get the full path for a template 
	 */
    var getPath = function(name) {
        return scriptSource + '/../templates/' + name;
    };

	/*
	 * renderExtTemplate({
	 * 		name  : template name,
	 *  	selector : selector where to render data,
	 *      data : data to render
	 *  	append : whether to append (otherwise set html)
	 *  	completion : function to call on this rendered data
	 *      helpers : helper functions to use in this template
	 *      prepend : set to true if we're replacing some empty space with mosaic
	 *      index_offset : so we can render items that aren't necessarily the first in the list
	 * }) 
	 */  
    var renderExtTemplate = function(item) {

    	if (item.data != null) {
    		// Set up the indices for each item so we know where to position it
    		for (var i = 0; i < item.data.length; i++) {
        		item.data[i]['item_index'] = i + item.index_offset;    				
    		}
    		
            var file = getPath( item.name );
            return $.when($.get(file))
             .done(function(tmplData) {
                 $.templates({ tmpl: 
                 	{
                	 	markup : tmplData,
                	 	helpers : item.helpers
                 	}
                });
             
                 if (item.append) {
                	if (item.prepend) {
                		$(item.selector).prepend($.render.tmpl(item.data));
                	} else {
                     	$(item.selector).append($.render.tmpl(item.data));
                	}                 	 
                 } else {
                 	$(item.selector).html($.render.tmpl(item.data));
                 }
             });        		
    	}
    };

    return {
        getPath: getPath,
        renderExtTemplate: renderExtTemplate, 
        price: price,
        ellipsis: ellipsis,
    };
})();