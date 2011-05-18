//test ajax

(function($){

    function updateNode($node, urlPath, cacheBool) {
        $.ajax({
            url: urlPath,
            cache: cacheBool,
            success: function(frag){
                $node.html(frag);
            //console.log(frag);
            }
        });
    };

    $(document).ready(function() {
		
        //test a ajax polling chat
        $("#chatContent").bind('update', function(e){
            updateNode( $(this), "/messages", false);
        });

        var updateNodes = function(){
            updateNode( $("#chatContent"), "/messages", false);

        //make multiple updates
        //updateNode( $(someother), "/somepath", false);
        //updateNode( $(andanother), "/someotherpath", false);

        };
        //do once at the start
        updateNodes();
        setInterval(updateNodes, 1500);
    });
})(jQuery);