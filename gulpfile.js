var gulp = require('gulp');
const del = require('del');
const typescript = require("gulp-typescript");
const gulpTypings = require("gulp-typings");
const sourcemaps = require("gulp-sourcemaps");
const gutil = require('gulp-util');
var map = require('map-stream');
var nodemon = require('gulp-nodemon');
var webpack = require("webpack-stream");

//var tsProject = typescript.createProject('tsconfig.json');
var tsProject = typescript.createProject('tsconfig.json', {
    typescript: require('typescript')
});

gulp.task('clean_server', function () {
    // clean the contents of the distribution directory
    return del(['dist/server/**/*']);
});

gulp.task('clean_www', function () {
    // clean the contents of the distribution directory
    return del(['dist/www/**/*']);
});


gulp.task("installTypings",function(){
    var stream = gulp.src("./typings.json")
        .pipe(gulpTypings()); //will install all typingsfiles in pipeline. 
    return stream; // by returning stream gulp can listen to events from the stream and knows when it is finished. 
});

gulp.task('copylibs', 
    ['clean_server'], 
    function () {
    /*return gulp.src([
        "node_modules/core-js/client/shim.min.js", 
        "node_modules/zone.js/dist/zone.js",
        "node_modules/reflect-metadata/Reflect.js",
        "node_modules/systemjs/dist/system.src.js"])
    .pipe(gulp.dest("dist/lib/angular2"));
    */
});

gulp.task('typescript_server', 
    ['clean_server', "installTypings"], 
    function () {
        return gulp
            .src('src/server/**/*.ts')
            .pipe(sourcemaps.init())
            .pipe(map(log))
            .pipe(typescript(tsProject))
            .pipe(map(log))
            .pipe(sourcemaps.write(".", { 
                includeContent: false,                  // Use separate map files.
                // See for this trick: https://github.com/Microsoft/vscode/issues/936
                sourceRoot: function (file) {
                    return file.cwd + '/src/server';    // Use this to be able to set "rootSource" in map files, pointing to the new rellative location of the .ts file.!
                }
            }))
            .pipe(gulp.dest('./dist/server'))
            .pipe(map(log));
    }
);


var log = function(file, cb) {
  console.log(file.path);
  cb(null, file);
};

gulp.task("watch", function(){
    gulp.watch('src/**/*.ts', ['typescript']);
});

// start our server and listen for changes
gulp.task('serve', function() {
    // configure nodemon
    nodemon({
        // the script to run the app
        script: './dist/server/main.js',
        // this listens to changes in any of these files/routes and restarts the application
        watch: ["./dist/*"],//, "app.js", "routes/", 'public/*', 'public/*/**'],
        ext: 'js'
        // Below i'm using es6 arrow functions but you can remove the arrow and have it a normal .on('restart', function() { // then place your stuff in here }
    }).on('restart', () => {
        gulp.src('server.js')
        // I've added notify, which displays a message on restart. Was more for me to test so you can remove this
        .pipe(notify('Restarting server...'));
    });
});

//***********************************************************************************************
// Build web-app
gulp.task('build_app', ['clean_www'], function() {
    return gulp.src('./src/www/main.ts')
        .pipe(map(log))
        .pipe(webpack( require('./webpack.config.js') ))
        .pipe(map(log))
        .pipe(gulp.dest('./dist/www/'));
});

gulp.task('build', ["copylibs", "typescript_server"]);
gulp.task('default', ["build", "serve"]);
