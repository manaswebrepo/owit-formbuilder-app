const fabAssemble = require('fabricator-assemble');
const browserSync = require('browser-sync');
const del = require('del');
const gulp = require('gulp');
const argv = require('minimist')(process.argv.slice(2));
const imagemin = require('gulp-imagemin');
const prefix = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const concat = require('gulp-concat');
const log = require('fancy-log');
const nodeW3CValidator = require('node-w3c-validator');
const webpack = require('webpack');
var mode = require('gulp-mode')();
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const handlebars = require('handlebars');
var sassLint = require('gulp-sass-lint');
var plato = require('plato');
var eslint = require('gulp-eslint'),
    gulpIf = require('gulp-if');
var header = require('gulp-header'),

localTimeStamp = new Date(),
headerComment = '/*\nGenerated on:' + localTimeStamp + '\n*/\n';
var replace = require('gulp-replace');

let server = false;
function reload(done) {
  if (server) server.reload();
  done();
}

// configuration
const config = {
  dev: !!argv.dev,
  styles: {
    browsers: [
      'ie 11',
      'edge >= 16',
      'chrome >= 70',
      'firefox >= 63',
      'safari >= 11',
      'iOS >= 12',
      'ChromeAndroid >= 70',
    ],
    fabricator: {
      src: 'src/assets/fabricator/styles/fabricator.scss',
      dest: 'dist/assets/fabricator/styles',
      watch: 'src/assets/fabricator/styles/**/*.scss',
    },
    toolkit: {
      src: ['node_modules/bootstrap/scss/bootstrap.scss','src/assets/toolkit/styles/toolkit.scss'],
      dest: 'dist/assets/toolkit/styles',
      watch: 'src/assets/toolkit/styles/**/*',
    }
  },
  fonts:{
    dest: 'dist/assets/toolkit/fonts',
    watch: 'src/assets/toolkit/fonts/**/*',
  },
  scripts: {
    fabricator: {
      src: './src/assets/fabricator/scripts/fabricator.js',
      dest: 'dist/assets/fabricator/scripts',
      watch: 'src/assets/fabricator/scripts/**/*',
    },
    toolkit: {
      src: './src/assets/toolkit/scripts/toolkit.js',
      dest: 'dist/assets/toolkit/scripts',
      watch: 'src/assets/toolkit/scripts/**/*',
    },
    platoReport: './report'
  },
  images: {
    toolkit: {
      src: ['src/assets/toolkit/images/**/*', 'src/favicon.ico'],
      dest: 'dist/assets/toolkit/images',
      watch: 'src/assets/toolkit/images/**/*',
    },
  },
  contentimages: {
    toolkit: {
      src: ['src/assets/toolkit/content-images/**/*'],
      dest: 'dist/assets/toolkit/content-images',
      watch: 'src/assets/toolkit/content-images/**/*',
    },
  },
  jsonData: {
	  toolkit:{
		  src: ['src/assets/toolkit/json-data/**/*'],
		  dest: 'dist/assets/toolkit/json-data',
		  watch: 'src/assets/toolkit/json-data/**/*',
	  }
  },
  templates: {
    watch: 'src/**/*.{html,md,json,yml}',
  },
  markup: {
    src: './dist/pages/*.html',
    dest: './reports/markup-validator-result.html',
  },
  dest: 'dist',
};

// clean
const clean = () => del([config.dest]);

function fabricatorStyles() {
  return gulp
  .src(config.styles.fabricator.src)
  .pipe(sass().on('error', sass.logError))
  //minify fabricator CSS in production environment
  .pipe(mode.production(cleanCSS()))
  .pipe(concat('fabricator.min.css'))
  //Added local time stamp as header to files
  .pipe(header(headerComment))
  .pipe(gulp.dest(config.styles.fabricator.dest));
}

//bundles component styles
function componentStyles() {
  return gulp
  .src(config.styles.toolkit.src)
  .pipe(sass())
  //minify component level CSS in production environment
  .pipe(cleanCSS())
  .pipe(concat('main.min.css'))
  //Added local time stamp as header to files
  .pipe(header(headerComment))
  .pipe(gulp.dest(config.styles.toolkit.dest));
}
function sassLintErrors(){
  return gulp
  .src('./src/assets/toolkit/styles/toolkit.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(sassLint())
  .pipe(sassLint.format())
  .pipe(sassLint.failOnError())
}
const styles = gulp.parallel(componentStyles, fabricatorStyles, sassLintErrors);
function isFixed(file) {
    // Has ESLint fixed the file contents?
    return file.eslint != null && file.eslint.fixed;
}
const webpackConfig = require('./webpack.config')(config);

function minifiedScripts(done) {
  
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      log.error(err());
    }
    const result = stats.toJson();
    if (result.errors.length) {
      result.errors.forEach(error => {
        log.error(error);
      });
    }
    done();
  });


}

//bundles component scripts
function esLintErrors() {
  return gulp
    .src('./src/assets/toolkit/scripts/*.js')
    .pipe(eslint({fix:true}))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('../test/fixtures')))
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError 
    // last.
    .pipe(eslint.failAfterError())
}
const scripts = gulp.parallel(minifiedScripts, esLintErrors); 
// images
function imgFavicon() {
  return gulp.src('src/favicon.ico').pipe(gulp.dest(config.dest));
}

function imgMinification() {
  return gulp
    .src(config.images.toolkit.src)
    //.pipe(imagemin())
    .pipe(gulp.dest(config.images.toolkit.dest));
}
function contentImgMinification() {
  return gulp
    .src(config.contentimages.toolkit.src)
    //.pipe(imagemin())
    .pipe(gulp.dest(config.contentimages.toolkit.dest));
}
function jsonData() {
  return gulp
    .src(config.jsonData.toolkit.src)
    .pipe(gulp.dest(config.jsonData.toolkit.dest));
}
const images = gulp.series(imgFavicon, imgMinification, contentImgMinification);

function fonts(){  
    return gulp.src('./src/assets/toolkit/fonts/*.*')
    .pipe(gulp.dest(config.fonts.dest));
}
// assembly
function assembler(done) {
  fabAssemble({
    logErrors: config.dev,
    dest: config.dest,
    helpers: {
      // {{ default description "string of content used if description var is undefined" }}
      default: function defaultFn(...args) {
        return args.find(value => !!value);
      },
      // {{ concat str1 "string 2" }}
      concat: function concat(...args) {
        return args.slice(0, args.length - 1).join('');
      },
      // {{> (dynamicPartial name) }} ---- name = 'nameOfComponent'
      dynamicPartial: function dynamicPartial(name) {
        return name;
      },
      eq: function eq(v1, v2) {
        return v1 === v2;
      },
      ne: function ne(v1, v2) {
        return v1 !== v2;
      },
      and: function and(v1, v2) {
        return v1 && v2;
      },
      or: function or(v1, v2) {
        return v1 || v2;
      },
      not: function not(v1) {
        return !v1;
      },
      gte: function gte(a, b) {
        return +a >= +b;
      },
      lte: function lte(a, b) {
        return +a <= +b;
      },
      plus: function plus(a, b) {
        return +a + +b;
      },
      minus: function minus(a, b) {
        return +a - +b;
      },
      divide: function divide(a, b) {
        return +a / +b;
      },
      multiply: function multiply(a, b) {
        return +a * +b;
      },
      abs: function abs(a) {
        return Math.abs(a);
      },
      mod: function mod(a, b) {
        return +a % +b;
      },
    },
  });
  done();
  
}

function w3cMarkupValidator(done){
  nodeW3CValidator(config.markup.src, {
    format: 'html',
    skipNonHtml: true,
    verbose: true
}, function (err, output) {
    if (err === null) {
        return;
    }
    nodeW3CValidator.writeFile(config.markup.dest, output);
});
done();
}

function platoJSValidator(done) {
  var options = {
    title: ' JavaScript Source Analysis'
  };
  var callback = function (report){
    done();
    };
  return plato.inspect('./src/assets/toolkit/scripts/*.js', config.scripts.platoReport, options, callback);

}

// server
function serve(done) {
  server = browserSync.create();
  server.init({
    server: {
      baseDir: config.dest,
    },
    notify: false,
    logPrefix: '',
  });
  done();
}

function watch() {
  gulp.watch(
    config.templates.watch,
    { interval: 500 },
    gulp.series(assembler, reload)
  );
  gulp.watch(
    [config.scripts.toolkit.watch],
    { interval: 500 },
    gulp.series(scripts, reload)
  );
  gulp.watch(
    config.images.toolkit.watch,
    { interval: 500 },
    gulp.series(images, reload)
  );
  gulp.watch(
    [ config.styles.toolkit.watch],
    { interval: 500 },
    gulp.series(styles, reload)
  );
}

function updateImagesRef() {
	return gulp.src(['./dist/assets/toolkit/styles/main.min.css'])
	.pipe(replace('/assets/toolkit/images','/etc.clientlibs//clientlibs/clientlib-site/resources/images'))
	.pipe(gulp.dest('./dist/assets/toolkit/styles'));
}

function updateImagesRefInJS() {
	return gulp.src(['./dist/assets/toolkit/scripts/main.min.js'])
	.pipe(replace('/assets/toolkit/images','/etc.clientlibs//clientlibs/clientlib-site/resources/images'))
	.pipe(gulp.dest('./dist/assets/toolkit/scripts'));
}

function updateFontsRef() {
	return gulp.src(['./dist/assets/toolkit/styles/main.min.css'])
	.pipe(replace('/assets/toolkit/fonts','/etc.clientlibs//clientlibs/clientlib-site/resources/fonts'))
	.pipe(gulp.dest('./dist/assets/toolkit/styles'));
}

function copyStylesToAEM() {
	return gulp.src(['./dist/assets/toolkit/styles/**/*'])
		.pipe(gulp.dest('./../ui.apps/src/main/content/jcr_root/apps//clientlibs/clientlib-site/styles'));
}

function copyFontsToAEM() {
	return gulp.src(['./dist/assets/toolkit/fonts/**/*'])
		.pipe(gulp.dest('./../ui.apps/src/main/content/jcr_root/apps//clientlibs/clientlib-site/resources/fonts'));
}

function copyImagesToAEM() {
	return gulp.src(['./dist/assets/toolkit/images/**/*'])
		.pipe(gulp.dest('./../ui.apps/src/main/content/jcr_root/apps//clientlibs/clientlib-site/resources/images'));
}

function copyScriptsToAEM() {
	return gulp.src(['./dist/assets/toolkit/scripts/**/*'])
		.pipe(gulp.dest('./../ui.apps/src/main/content/jcr_root/apps//clientlibs/clientlib-site/scripts'));
}

// default build task
let tasks = [clean, styles, scripts, images,jsonData, fonts, assembler, platoJSValidator];
if (config.dev) tasks = tasks.concat([serve, watch]);
gulp.task('default', gulp.series(tasks));
let AEMTask = [clean, componentStyles, minifiedScripts, imgMinification, fonts, updateImagesRef, updateImagesRefInJS, updateFontsRef, copyStylesToAEM, copyFontsToAEM, copyImagesToAEM, copyScriptsToAEM];
gulp.task('aem-build', gulp.series(AEMTask));

/*
Handlebars custom block helper to swap parameter instead of gray matter value
*/
handlebars.registerHelper('swapif', function(v1, v2, options) {
  if(typeof v2 !== 'undefined') { return v2; }
  else { return v1; }
});
