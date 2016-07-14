var gulp = require('gulp');
const del = require('del');
const typescript = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
//const webserver = require("gulp-webserver");

//const tscConfig = require('./tsconfig.json');
var tsProject = typescript.createProject('tsconfig.json');


gulp.task('clean', function () {
    // clean the contents of the distribution directory
    return del('dist/**/*');
});

gulp.task('copylibs', 
    ['clean'], 
    function () {
    /*return gulp.src([
        "node_modules/core-js/client/shim.min.js", 
        "node_modules/zone.js/dist/zone.js",
        "node_modules/reflect-metadata/Reflect.js",
        "node_modules/systemjs/dist/system.src.js"])
    .pipe(gulp.dest("dist/lib/angular2"));
    */
    return gulp.src([
        "node_modules/express/lib/express.js"]) 
        .pipe(gulp.dest("dist/lib/"));
});

gulp.task('typescript_server', 
    ['clean'], 
    function () {
    // TypeScript compile
//    return tsProject.src(['src/server/**/*.ts', '!node_modules/**/*.*']) // instead of gulp.src(...)
/*        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest('dist/'));
*/
    return gulp
        .src('src/server/**/*.ts')
//      .pipe(gulp.dest('dist/server/'))  // Store ts files for debugging - doesnt work! :O(
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest('dist/server/'));
});

gulp.task("watch", function(){
    gulp.watch('src/**/*.ts', ['typescript']);
    //gulp.watch("src/**/*.ts", ["typescript"]);
    //gulp.watch("src/**/*.ts", ["typescript"]);
});

gulp.task("serve", function(){
    gulp.src("dist/**/*")
    .pipe(webserver({livereload: true, open: true}));
});

gulp.task('build', ["copylibs", "typescript_server"]);
gulp.task('default', ["build", "watch", "serve"]);
