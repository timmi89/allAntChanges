(function($) {

    $.widget("ui.video_list", {
        options: {
            current_playlist_id: null,
            is_splash: false
        },
	    _create: function() {
            this.options.current_playlist_id = $('#id_current_playlist_id').text();
            this.options.current_playlist_id = $('#id_current_playlist_id').text();
            this.add_button_hooks();
	    },

        get_video_list: function(url) {
            var widget = this;
            this.element.load(url, {
                'current_playlist_id': this.options.current_playlist_id,
                'current_entry_id': this.options.current_entry_id || '',
                'is_splash': widget.options.is_splash
            }, function() {widget.add_button_hooks()});
        },


        add_button_hooks: function() {
            this.element.find('.btn_prev').click({'widget': this}, this.get_prev_playlist);
            this.element.find('.btn_next').click({'widget': this}, this.get_next_playlist);
        },

        get_prev_playlist: function(event) {
            var widget = event.data.widget;
            widget.options.current_playlist_id = widget.element.find('#id_current_playlist_id').text();
            widget.get_video_list('/entry/ajax/get_prev_video_list/');
            return false;
        },

        get_next_playlist: function(event) {
            var widget = event.data.widget;
            widget.options.current_playlist_id = widget.element.find('#id_current_playlist_id').text();
            widget.get_video_list('/entry/ajax/get_next_video_list/');
            return false;
        },

    });
})(jQuery);
