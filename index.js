var less = require('less'),
    fs = require('fs'),
    Features = require('less-features'),
    parser = less.Parser(),
    logger;

function Runner(c, l) {
    var config = c || {};

    logger = l || console;
    this._path = config.path || '.';
    this._options = config.options || {};
    this._env = this._config.env || 'default';
    this._list = getFeaturesList(this._path + '/config.json', this._env);
    fs.watchFile(this._path + '/config.json', update(this));

    function getFeaturesList(path, env) {

        var config = JSON.parse(fs.readFileSync(path, {
            encoding: 'utf-8'
        }));

        return config[env];
    }

    function update(self) {


        return function() {
            logger.log(self._list);
            self._list = getFeaturesList(self._path + '/config.json', self._env);
        };

    }

}

function toCSS(err, data) {
    var features;

    if (err) {
        logger.log(err);
        return;
    }

    features = new Features(less.tree, this._list);

    this._res.end(data.toCSS({

        plugins: [
            features
        ]

    }));
}

Runner.prototype = {

    run: function(req, res) {
        var file = req._parsedUrl.pathname.replace(/(.+)\.css(?:\?.+)?/, this._path + '$1.less');

        this._res = res;
        fs.readFile(file, this._options, this.parse.bind(this));
    },

    parse: function(err, code) {

        if (err) {
            logger.log(err);
            return;
        }

        parser.parse(code, toCSS.bind(this));
    }

};

module.exports = Runner;
