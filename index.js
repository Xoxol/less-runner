var less = require('less'),
    Features = require('less-features'),
    xhr = require('node-xhr'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    logger,
    config;

function runner(cfg, log) {
    config = cfg || {};
    logger = log || console;

    return function(req, res) {
        var file = req.originalUrl.replace(/(.+)\.css(?:\?.+)?/, config.basepath + '$1.less');

        fs.readFile(file, config.fs, render(res));
    }
}

function features(callback) {

    var list = url.parse(config.list);

    if(list.protocol === 'file:') {
        list = path.resolve(process.cwd(), list.hostname + list.pathname);
        callback(null, require(list) || {});
        return;
    }

    xhr.get({url: list.href}, function(err, result) {
        var list = {};

        if(err) {
            callback(err, null);
            return;
        }

        result.body.forEach(function(feature) {

            if(feature.provider === 'Permanent' && feature.enabled) {
                list[feature.name] = feature.enabled;
            }

        });

        callback(null, list);
    });
}

function render(res) {
    return function(err, data) {
        if(err) {
            logger.error(err.toString());
            error(err);
            return;
        }

        features(function(err, list) {
            if(err) {
                error(err);
                return;
            }

            config.options.plugins = [new Features(list)];

            less.render(data, config.options, function(err, data) {
                if(err) {
                    error(err);
                    return;
                }

                ok(data);
            });

        });
    };

    function ok(data) {
        res.writeHead(200, {'Content-Type': 'text/css', 'Content-Length': Buffer.byteLength(data.css)});
        res.write(data.css);
        res.end();
    }

    function error(err) {
        logger.error(err.toString());
        res.writeHead(500, {'Content-Type': 'text/html', 'Content-Length': Buffer.byteLength(err.toString())});
        res.write(err.toString());
        res.end();
    }
}

module.exports = runner;