var less = require('less'),
    Features = require('less-features'),
    fs = require('fs'),
    logger,
    config;

/*
 cfg = {
    'env': 'ad',
    'basepath': '..', корневая папка для построение относительных путей
    'fs: { опции, используемые для чтения файла
        'encoding': 'utf-8'
    },
    'options': { конфигурация для less
        'compress': false,
        'relativeUrls: true,
        'paths': ['../styles/']
    },
    'list': '../styles/features.json' путь к файлу, в котором будед указан список активных фич
 }
 */

function runner(cfg, log) {
    var list;

    config = cfg || {};
    logger = log || console;

    list = require(config.list)[config.env];
    config.options.plugins = [new Features(less.tree, list)];

    return function(req, res){
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
        res.writeHead(200, {'Content-Type': 'text/css', 'Content-Length': Buffer.byteLength(data)});
        res.write(data);
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