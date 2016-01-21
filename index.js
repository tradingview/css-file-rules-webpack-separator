var bless = require('bless');
var RawSource = require('webpack/lib/RawSource');

function CssFileRulesSeparator(options, pattern) {
	this.pattern = pattern || /\.css$/;
	this.options = options || {};
}

CssFileRulesSeparator.prototype._chunkFileName = function (originalName) {
	return originalName.replace(/\.css$/, '') + '-part.css';
};

CssFileRulesSeparator.prototype._unique = function (files) {
	function _onlyUnique(value, index, self) {
		return self.indexOf(value) === index;
	};

	return files.filter(_onlyUnique);
};

CssFileRulesSeparator.prototype.apply = function (compiler) {
	var that = this;
	var separated = {};

	compiler.plugin("this-compilation", function(compilation) {
		compilation.plugin("optimize-assets", function(assets, callback) {
			var cssAssets = Object.keys(assets).filter(that.pattern.test.bind(that.pattern));

			if (!cssAssets.length) {
				return callback();
			}

			cssAssets.forEach(function(name) {
				new bless.Parser({ output: that._chunkFileName(name), options: that.options })
					.parse(assets[name].source(), function(err, files) {
						if (files.length > 1) {
							files.forEach(function(file) {
								assets[file.filename] = new RawSource(file.content);
							});

							separated[name] = files.map(function (file) { return file.filename });
						}
					});
			});

			callback();
		});
	});

	compiler.plugin("done", function (stats) {
		var chunks = stats.compilation.chunks;

		chunks.forEach(function (chunk) {
			Object.keys(separated).forEach(function (filename) {
				if (~chunk.files.indexOf(filename)) {
					Array.prototype.push.apply(chunk.files, separated[filename])
					chunk.files = that._unique(chunk.files);
				}
			});
		});
	});
};

module.exports = CssFileRulesSeparator;
