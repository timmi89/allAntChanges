;var ANTdrip = ANTdrip ? ANTdrip : {};

// ANTdrip.subscribe = function() {
//     _dcq.push(["identify", {
//       email: "john@acme.com",
//       first_name: "John",
//       tags: ["Customer"]
//     }]);    
// };

ANTdrip.init = function() {
    console.log('init drip form');
    $('.drip-form').each(function() {
      $(this).submit(function () {
        var $form = $(this);

        var drip_form_id = $form.find('[name="fields[drip_form_id]"]').val(),
            email = $form.find('[name="fields[email]"]').val(),
            website_url = $form.find('[name="fields[website_url]"]').val(),
            form_id = $form.find('[name="fields[form_id]"]').val(),
            fields = {
                email: email,
                website_url: website_url,
                form_id: form_id
            };

        console.log(drip_form_id);
        console.log(fields);

        _dcq.push(["subscribe", { 
            campaign_id: drip_form_id, 
            fields: fields,
            double_optin: false,
            success: function() {
                console.log('SUCCESS YO!!!');
            },
            error: function() {
                console.log('ack there was a bug');
            }
        }]);
        return false;
      });
    });
};