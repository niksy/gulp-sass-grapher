(function() {
  var File, SassGrapher, error, fs, grapher, path, through;

  File = require('vinyl');

  fs = require('fs');

  grapher = require('sass-graph');

  path = require('path');

  through = require('through2');

  error = function(message) {
    return new gutil.PluginError('gulp-sass-grapher', message);
  };

  SassGrapher = (function() {
    function SassGrapher() {}


    /*
     * Ancestors
     * Gets the root level sass files to process
     * Returns a through transform stream
     */

    SassGrapher.prototype.ancestors = function() {
      var buildGraph, graph;
      graph = this.graph;
      buildGraph = this.buildGraph;
      return through.obj(function(file, enc, next) {
        var hasImports, sassData;
        hasImports = false;
        if (file.isNull()) {
          this.push(file);
          return next();
        }
        if (file.isStream()) {
          this.emit('error', error('Streaming not supported'));
          this.push(file);
          return next();
        }
        if (file.event && file.event === 'added') {
          this.buildGraph();
        }
        sassData = graph.index[file.path];
        if (!sassData) {
          this.builGraph();
          sassData = graph.index[file.path];
        }
        if (!sassData || sassData.importedBy.length === 0) {
          this.push(file);
          return next();
        }
        graph.visitAncestors(file.path, (function(_this) {
          return function(filepath) {
            if (path.basename(filepath).slice(0, 1) === '_') {
              return;
            }
            hasImports = true;
            return _this.push(new File({
              cwd: file.cwd,
              base: path.dirname(filepath),
              path: filepath,
              contents: new Buffer(fs.readFileSync(filepath, 'utf8'))
            }));
          };
        })(this));
        if (!hasImports) {
          this.push(file);
        }
        return next();
      });
    };


    /*
     * Init
     * Method for creating the graph instance
    #
     * @private
     */

    SassGrapher.prototype.init = function(sourceDir, options) {
      this.sourceDir = sourceDir;
      this.options = options;
      return this.buildGraph();
    };

    SassGrapher.prototype.buildGraph = function() {
      return this.graph = grapher.parseDir(path.resolve(this.sourceDir), this.options);
    };

    return SassGrapher;

  })();

  module.exports = new SassGrapher();

  module.exports.SassGrapher = SassGrapher;

}).call(this);