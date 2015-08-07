;var ANTdrip = ANTdrip ? ANTdrip : {};

ANTdrip.init = function() {
    $('.drip-form').each(function() {
      $(this).submit(function () {
        var $form = $(this);

        // var drip_form_id = $form.find('[name="fields[drip_form_id]"]').val(),
        var valid = true,
            email = $form.find('[name="fields[email]"]').val(),
            website_url = $form.find('[name="fields[website_url]"]').val(),
            form_id = $form.find('[name="fields[form_id]"]').val(),
            goal_name = $form.find('[name="fields[goal_name]"]').val(),
            fields = {
                email: email,
                website_url: website_url,
                form_id: form_id
            };

        $form.find('[data-required]').each(function() {
            if ( !$(this).val() ) {
                valid = false;
            }
        });

        if (valid === true) {
            _dcq.push(["identify", {
              email: email,
              prospect: true,
              website_url: website_url,
              form_id:form_id,
              success: function() {
                _dcq.push(["track", goal_name ]);
                $form.find('.success').removeClass('hide').siblings('.form-message').addClass('hide');
              },
              error: function() {
                $form.find('.error').removeClass('hide').siblings('.form-message').addClass('hide');
              }
            }]);
        } else {
            $form.find('.not-valid').removeClass('hide').siblings('.form-message').addClass('hide');
        }


        return false;
      });
    });
};