A set of test data is composed of a page, a group settings response, and a page data response.

The test-server.js app relies on the directory structure of the test data as well as a couple parameters in the group
settings and page data in order to find pages and serve up the correct json responses.

For each set of data, pick a name. Then make sure the following holds:
1. Place the page to be tested under the /resources/<name> as in:
    /resources/<name>/<whatever>.html
2. Make sure the page sets the window.antenna_host property to <name> as in:
    <script>
        (function() {
            window.antenna_host = '<name>';
        })();
    </script>
3. Include the antenna.js file from the test server in the test page. Include the ?debug param in the URL and we'll add
the hashes we compute into the test page DOM. You can use these hashes later to build up your page-data.json content.
   <script src="http://localhost:3000/static/widget-new/debug/antenna.js?debug" defer type="text/javascript"></script>
4. Create a group-settings.json file at:
    /resources/<name/group-settings.json
5. Make sure the group-settings file returns at least an id matching <name>. e.g.:
   {
     "summary_widget_selector": ".summary",
     "id":"<name>"
   }
6. Create a page-data.json file at:
    /resources/<name>page-data.json