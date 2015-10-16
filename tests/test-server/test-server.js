var express = require('express');
var fs = require('fs');
var URL = require('url');
var app = express();

setupMiddleware(app);
setupRouting(app);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Test Server listening at http://%s:%s', host, port);
});

function setupMiddleware(app) {
    app.use('/pages/', express.static(__dirname + '/resources/pages'));
    app.use('/static/', express.static(__dirname + '/../../rb/static'));
}

function setupRouting(app) {
    app.get('/api/settings', getGroupSettings);
    app.get('/api/pagenewer', getPageData);
    app.get('/antenna.js', function() {console.log('antenna.js');});
}

function sendJSONP(json, res) {
    res.status(200).jsonp({ data: json });
}

function getPageData(req, res) {
    var params = JSON.parse(req.query.json);
    var pages = params.pages;
    var pageData = [];
    for (var i = 0; i < pages.length; i++) {
        var path = URL.parse(pages[i].url).pathname;
        var pageName = path.substring(path.lastIndexOf('/') + 1);
        readJSONFile(__dirname + '/resources/page-data/' + pageName + '.json', function(json) {
            sendJSONP(json, res);
        });
    }
}

function getGroupSettings(req, res) {
    var params = JSON.parse(req.query.json);
    var groupName = params['host_name'];
    readJSONFile(__dirname + '/resources/group-settings/' + groupName + '.json', function(json) {
        sendJSONP(json, res);
    });
}

function readJSONFile(path, callback) {
    fs.readFile(path, function(error, data) {
        if (error) {
            throw error;
        }
        var json = JSON.parse(data);
        callback(json);
    });
}