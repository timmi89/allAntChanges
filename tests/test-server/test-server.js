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
    app.use('/pages/', express.static(__dirname + '/resources/'));
    app.use('/static/', express.static(__dirname + '/../../rb/static'));
}

function setupRouting(app) {
    app.get('/api/settings', getGroupSettings);
    app.get('/api/pagenewer', getPageDataNew);
}

function sendJSONP(json, res) {
    res.status(200).jsonp({ data: json });
}

function getPageDataNew(req, res) {
    var params = JSON.parse(req.query.json);
    var page = params['pages'][0];
    var groupName = page['group_id'];
    readJSONFile(__dirname + '/resources/' + groupName + '/page-data.json', function(json) {
        sendJSONP(json, res);
    });
}

function getGroupSettings(req, res) {
    var params = JSON.parse(req.query.json);
    var groupName = params['host_name'];
    readJSONFile(__dirname + '/resources/' + groupName + '/group-settings.json', function(json) {
        setDefaultGroupSettings(json);
        sendJSONP(json, res);
    });
}

function setDefaultGroupSettings(group_settings) {
    setPropertyDefault(group_settings, 'anno_whitelist', 'p,img,li,blockquote');
    setPropertyDefault(group_settings, 'default_reactions', [
        {
            "body": "Love It",
            "id": 101
        },
        {
            "body": "Don't think so",
            "id": 11688
        },
        {
            "body": "Agreed",
            "id": 829
        },
        {
            "body": "Really?",
            "id": 356
        },
        {
            "body": "Interesting",
            "id": 6873
        },
        {
            "body": "Hilarious",
            "id": 1998
        }
    ]);

}

function setPropertyDefault(object, property, value) {
    if (object[property] === undefined) {
        object[property] = value;
    }
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