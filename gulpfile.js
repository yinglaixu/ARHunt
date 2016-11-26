var gulp = require('gulp');
var connect = require('gulp-connect');
 
gulp.task('connect', function() {
	connect.server();
});


// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', function() {

    gulp.src(['node_modules/@argonjs/argon/dist/argon.js', 'node_modules/@argonjs/argon/dist/argon.min.js'])
        .pipe(gulp.dest('vendor/argon'))

    gulp.src(['node_modules/three/build/three.js', 'node_modules/three/build/three.min.js'])
        .pipe(gulp.dest('vendor/three'))

});

gulp.task('default', ['copy','connect']);