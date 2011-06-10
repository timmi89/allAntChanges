/**
 * Adds a Upon focusing on an input field, the defaultValue of the field will be
 * removed so that a user can add a new value. If a user does not change the 
 * value, then defaultValue is replaced into the 
 * 
 * @return jQuery collection
 */
 
(function($) {
	$.fn.defval = function (dv) {
		var defClass = 'default-value',
			namespace = '.defval',
			eligible = new RegExp('^$|' + dv);

		this
			.each(function () {
				var $input = $(this),
					val = $input.val();
				this.dv = dv;
				if (eligible.test(val) && dv) {
					$input
						.val(dv)
						.addClass(defClass);
					// Perhaps this event will need to be forced to fire first
					$(this.form).bind(
						'submit' + namespace,
						function (e) {
							if ($input.val() === dv) {
							$input.val('');
							}
						}
					);
				}
			})
			.bind(
				'focus' + namespace,
				function (e) {
					var $this = $(this);
					if ($this.val() === dv) {
						$this.val('');
					}
					$(this).removeClass(defClass);					
				}
			)
			.bind(
				'blur' + namespace,
				function (e) {
					if (this.value === '' && !this.hasChanged) {
						this.value = dv;
					}
					if (this.value === dv) {
						$(this).addClass(defClass);
					}
				}
			)
			.bind(
				'keydown' + namespace,
				function (e) {
					if (e.keyCode !== 9) {
						this.hasChanged = true;
						$(this).unbind(namespace);
					}
				}
			);
		return this;
	};
})(jQuery);