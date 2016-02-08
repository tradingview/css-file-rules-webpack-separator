var bless = require('bless');
var RawSource = require('webpack/lib/RawSource');

function CssFileRulesSeparator(options, pattern) {
    this.pattern = pattern || /\.css$/;
    this.options = options || {};
}

CssFileRulesSeparator.prototype._chunkFileName = function (originalName) {
    return originalName.replace(/\.css$/, '') + '-part.css';
};

CssFileRulesSeparator.prototype.apply = function (compiler) {
    var that = this;

    compiler.plugin("this-compilation", function(compilation) {
        compilation.plugin("optimize-chunk-assets", function(chunks, callback) {
            var assets = compilation.assets;
            chunks.forEach(function(chunk) {
                var cssAssets = chunk.files.filter(that.pattern.test.bind(that.pattern));
                cssAssets.forEach(function(name) {
                    new bless.Parser({ output: that._chunkFileName(name), options: that.options })
                        .parse(assets[name].source(), function(err, files) {
                            if (files.length > 1) {
                                files.forEach(function(file) {
                                    assets[file.filename] = new RawSource(file.content);
                                    chunk.files.push(file.filename);
                                });
                            }
                        })
                    });
                });

            callback();
        });
    });
};

module.exports = CssFileRulesSeparator;
