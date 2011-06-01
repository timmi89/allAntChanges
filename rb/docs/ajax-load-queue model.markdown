notes:


RDR.actions.init: function(){
    var that = this;
    $RDR = $(RDR);
    $RDR.queue('initAjax', function(next){
        that.initGroupData(RDR.groupPermData.short_name);
        	ajax: "/api/settings/"+RDR.groupPermData.group_id+"/"
        		success: $RDR.dequeue('initAjax');
    });
    $RDR.queue('initAjax', function(next){
        that.initPageData();
        	ajax: "/api/page/"
        		success: $RDR.dequeue('initAjax');
    });
    $RDR.queue('initAjax', function(next){
       that.initEnvironment();
			hashNodes
				sendHashes:
				    ajax: "/api/containers/"
				    	success:
				    		(make indicators)
				    		(fade indicators)
				    		ajax: "/api/containers/create/"
				    			success: //do nothing yet

				$RDR.dequeue('initAjax'); 	
    });
	$RDR.queue('initAjax', function(next){
		RDR.session.createXDMframe();
    });

    //start the dequeue chain
    $RDR.dequeue('initAjax');
},
