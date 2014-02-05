var ff = require('ffef/FatFractal');

function ExtensionTest(json) {
    print("\n\n");
    print("\t*** ExtensionTest test extension\n");
    print("\t*** JSON data is " + json + "\n");
    data = JSON.parse(json);
    print("\t*** HTTP method is "       + data.httpMethod + "\n");
    print("\t*** HTTP request URI is "  + data.httpRequestUri + "\n");
    print("\t*** HTTP parameters are "  + JSON.stringify(data.httpParameters) + "\n");
    print("\t*** HTTP headers are "     + JSON.stringify(data.httpHeaders) + "\n");
    print("\t*** HTTP content is "      + data.httpContent + "\n");
    print("\t*** HTTP Cookies are "     + data.httpCookies + "\n");
    print("\t*** Logged-in user is "    + data.httpCookies['userGuid'] + "\n");
    print("\n\n");
    
    var createdBy = data.httpCookies['userGuid'];
    function TestObject(data) {
        // If clazz is set the the FatFractal client library will use it to try to instantiate an 
        // appropriate client class. (For example in the hoodyoodoo iOS app we have a StatsObject class)
        // If clazz is not set, or the client library cannot locate a client class, then the client library 
        // will create a Map (Java) or Dictionary (obj-c) or whatever it's called in WinPho land
        this.clazz = "TestObject";
        // this.params = JSON.stringify(data.httpParameters);
        // this.sentJson = json;
        return this;
    }

    testObject = new TestObject();
    // // print("\t*** aggregateStats got here");
    testObject.totalUsers = ff.getAllGuids("/FFUser").length;
    testObject.totalGroups = ff.getAllGuids("/GroupsTest").length;
    // testObject.totalMatchingPages = ff.getArrayFromUri("/PagesTest/(url contains_all 'theguardian.com')").length;
    testObject.totalMatchingPages = ff.getArrayFromUri("/PagesTest/(url ne '" + data.httpContent.pageUrl + "')").length;
    testObject.matchingPages = ff.getArrayFromUri("/PagesTest/(url ne '" + data.httpContent.pageUrl + "')");
    testObject.urlToMatch = data.httpContent['pageUrl'];
    // var ff = require('ffef/FatFractal');
    // var decoStuff = ff.getArrayFromUri("/Furniture/(style eq 'deco')");

    r = ff.response();
    r.result = JSON.stringify(testObject);
    r.responseCode = "200";
    r.statusMessage = "Getting the stuff you want in one round trip";
    r.mimeType = "application/json";

    return r;
}

exports.ExtensionTest = ExtensionTest;

