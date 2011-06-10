var comment_counter = {
	elements_to_process: {},
	host_name_to_append: 'http://www.good.is',
	count: 0,
	add_comment_to_count: function (url, element_to_update) {
		if (this.elements_to_process[this.host_name_to_append + url] != null) {
			this.load();
		}
		this.elements_to_process[this.host_name_to_append + url] = element_to_update;
		this.count += 1;
		if (this.count >= 5) {
			this.load();
		}
	},
	
	load : function() {
		this.perform_load_and_update(this.elements_to_process);
		this.elements_to_process = {};
		this.count = 0;
	},

	perform_load_and_update: function (elements_to_process) {
		var array_of_requests = this.build_array_of_requests();
		$.ajax({
			url: 'http://api.echoenabled.com/v1/mux',
			type: 'GET',
			data: {
				'appkey': 'dev.good.is',
				'requests': JSON.stringify(array_of_requests)
			},
			dataType: 'jsonp',
			success: function (results) {
				for (var url in elements_to_process) {
					if (parseInt(results[url]['count']) > 0) {
						elements_to_process[url].text(results[url]['count']);
					}
				}
			}
		});
	},
	
	build_array_of_requests: function () {
		var to_return = [];
		for (var url in this.elements_to_process) {
			to_return.push({
				'id':url,
                'method':'count',
                'q':'childrenof:' + url
			});
		}
		return to_return;
	}
};

function load_comment_counts() {
	$('.js-kit-comments-count').each(function () {
		var $this = $(this);
		comment_counter.add_comment_to_count($this.attr('uniq') , $this);
	});
	comment_counter.load();
}

load_comment_counts();