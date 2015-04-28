var less = require('less'),
    Features = require('less-features'),
    fs = require('fs'),
    path = require('path'),
    logger,
    config;

function runner(cfg, log) {
    var list;

    config = cfg || {};
    logger = log || console;

    config.list = path.resolve(process.cwd(), config.list);
    logger.info('The features will be read from: ', config.list);

    list = require(config.list);
    config.options.plugins = [new Features(list)];

    return function(req, res) {
        var file = req.originalUrl.replace(/(.+)\.css(?:\?.+)?/, config.basepath + '$1.less');

        fs.readFile(file, config.fs, render(res));
    }
}

function render(res) {
    return function(err, data) {
        if(err) {
            logger.error(err.toString());
            error(err);
            return;
        }

        less.render(data, config.options, function(err, data) {
            if(err) {
                error(err);
                return;
            }

            ok(data);
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