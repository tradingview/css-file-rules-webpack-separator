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
        var assets = compilation.assets;

        function processChunk(chunk){
            var cssAssets = chunk.files.filter(that.pattern.test.bind(that.pattern));

            function blessParseCB(err, files){
                if (files.length > 1) {
                    files.forEach(function(file) {
                        assets[file.filename] = new RawSource(file.content);
                        chunk.files.push(file.filename);
                    });
                }
            }

            function parseAssetName(name){
                new bless.Parser({ output: that._chunkFileName(name), options: that.options })
                    .parse(assets[name].source(), blessParseCB);
            }

            cssAssets.forEach(parseAssetName);
        }

        function chunksHandler(chunks, callback){
            chunks.forEach(processChunk);
            callback();
        }

        compilation.plugin("optimize-chunk-assets", chunksHandler);
    });
};

module.exports = CssFileRulesSeparator;
