'use strict';

const path = require('path');
const gulp = require('gulp');
const less = require('gulp-less');
const concat = require('gulp-concat');
const gulpIf = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const newer = require('gulp-newer');
const autoprefixer = require('gulp-autoprefixer');
const debug = require('gulp-debug');
const svgSprite = require('gulp-svg-sprite');
const urlAdjuster = require('gulp-css-url-adjuster');
const browserSync = require('browser-sync').create();
const rename = require('gulp-rename');


const isDevelopment = !process.env.NODE_ENV == 'development';


gulp.task ('clean', function() {
    return del('public');
});
gulp.task('clean:svg', function() {
    return del(['frontend/tmp','public/images/sprite/']);
});


gulp.task ('styles', function() {
    return gulp.src('frontend/styles/**/*.less', {base:'frontend'})
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(less())
        .pipe(gulpIf(isDevelopment,  sourcemaps.write()))
        .pipe(autoprefixer())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('public/css'));
});


gulp.task ('assets', function() {
    return gulp.src('frontend/assets/**/*.*', {since: gulp.lastRun('assets')})
        .pipe(gulp.dest('public'));
});


gulp.task('styles:assets', function() {
    return gulp.src('frontend/styles/**/*.{png,jpg,jpeg}', {since: gulp.lastRun('styles:assets')})
        .pipe(rename({dirname:  ''}))
        .pipe(gulp.dest('public/images'));
});


gulp.task('style:svg', function() {
    return gulp.src('frontend/sprite/**/*.svg')
        .pipe( svgSprite({
        mode: {
            css: {
                dest:       '.', // where to put style && sprite, default: 'css'
                bust:       !isDevelopment,
                sprite:     'sprite.svg', // filename for sprite relative to dest
                layout:     'vertical',
                prefix:     '.svg-', // .svg-
                dimensions: true,
                render:     {
                    less: {
                        dest: 'sprite.less'  // filename for .styl relative to dest^
                    }
                }
            }
        }

    }))
        .pipe(debug({ title: 'sprite:' }))
        .pipe(gulpIf( '*.less', gulp.dest('frontend/tmp'), gulp.dest('public/images/sprite')));
});


gulp.task('replaceurl', function() {
    return gulp.src('public/css/style.css')
    .pipe(urlAdjuster({
        replace:['sprite','/images/sprite/sprite']
    }))
        .pipe(gulp.dest('public/css'));
});


gulp.task ('build', gulp.series('clean', 'styles:assets', 'style:svg', 'styles', 'assets', 'replaceurl'));


gulp.task ('watch', function() {
    gulp.watch(['frontend/styles/**/*.less', 'frontend/tmp/sprite.less'], gulp.series('styles', 'replaceurl'));
    gulp.watch('frontend/assets/**/*.*', gulp.series('assets'));
    gulp.watch('frontend/styles/**/*.{png,jpg,jpeg}', gulp.series('styles:assets'));
    gulp.watch('frontend/styles/**/*.svg', gulp.series('style:svg', 'replaceurl'));
});


gulp.task ('server', function() {
    browserSync.init({
        server: "public"
    });
    browserSync.watch('public/**/*.*').on('change', browserSync.reload);
});

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'server')));
