var less = require('less'),
    fs = require('fs'),
    logger = console.log, //Replace for true logger
    Features = require('less-features');

function Runner (config) {
    this._config = config || {};
    this._path = this._config.path || '.';
    this._options = this._config.options || {};
    this._env = this._config.env || 'default';
    this._list = require('.' + this._path + '/config')[this._env];

    fs.watchFile(this._path + '/config', update(this));

    function update (self) {
        return function() {
            self._list = require(self._path + '/config')[self._env];
        }
    }
}

Runner.prototype = {
    run: function(req, res) {
        var path = this._path,
            options = this._options,
            file = req._parsedUrl.pathname.replace(/(.+)\.css(?:\?.+)?/, path + '$1.less');

        this._res = res;
        fs.readFile(file, options, this.parse.bind(this));
    },
    parse: function(err, code) {
        var parser = less.Parser();

        if(err) {
            logger(err);
            return;
        }

        parser.parse(code, this.toCSS.bind(this));
    },
    toCSS: function(err, data) {
        var options = {},
            list = this._list,
            features = new Features(less.tree, list),
            res = this._res;

        if(err) {
            logger(err);
            return;
        }

        options.plugins = [features];
        res.end(data.toCSS(options));
    }
};

module.exports = Runner;