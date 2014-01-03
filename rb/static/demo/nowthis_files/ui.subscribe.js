(function($) {
    $.widget("ui.subscribe", {
	    _create: function() {
            this.load_subscribe_form();
	    },

        load_subscribe_form: function(data) {
            var widget = this;
            var _data = data || null;
            this.element.load('/user/ajax/subscribe/', data, function() {widget.add_button_hooks()});
        },


        add_button_hooks: function() {
            this.element.find('#id_subscribe').click({'widget': this}, this.subscribe);
        },

        subscribe: function(event) {
            var widget = event.data.widget;
            widget.load_subscribe_form({'email': $('input[name="email"]').val()});
        },
    });

    $.widget("ui.lightbox", {
	    _create: function() {
            var widget = this;
            if (this.options.is_sponsored == 'False') {
                this.load_subscribe_form();
            }
	    },

        load_subscribe_form: function(data) {
            var widget = this;
            var _data = data || null;
            this.element.load('/user/ajax/lightbox_subscribe/', data, function() {widget.add_button_hooks()});
        },


        add_button_hooks: function() {
            this.element.find('#id_subscribe').click({'widget': this}, this.subscribe);
            this.element.find('#id_ok').click({'widget': this}, this.close);
            this.element.find('a.close').click({'widget': this}, this.close);
            this.element.find('a.skip').click({'widget': this}, this.close);
        },

        subscribe: function(event) {
            var widget = event.data.widget;
            widget.load_subscribe_form({'email': $('.newsletter-lightbox input[name="email"]').val()});
        },

        close: function(event) {
            var widget = event.data.widget;
            widget.element.empty();
            return false;
        }
    });

})(jQuery);
