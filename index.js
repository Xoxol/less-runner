var less = require('less'),
    fs = require('fs'),
    logger = console.log, //Replace for true logger
    Features = require('less-features');

function Runner (config) {
    this._config = config || {};
    this._path = this._config.path || '.';
    this._options = this._config.options || {};
    this._env = this._config.env || 'default';
    this._list = getFeaturesList(this._path + '/config.json', this._env);

    fs.watchFile(this._path + '/config.json', update(this));

    function getFeaturesList (path, env) {
        var config;

        config = fs.readFileSync(path, {encoding: 'utf-8'});
        config = JSON.parse(config);

        return config[env];
    }

    function update (self) {
        return function() {
            console.log(self._list);
            self._list = getFeaturesList(self._path + '/config.json', self._env);
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