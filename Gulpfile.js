var gulp = require('gulp');
var responsive = require('gulp-responsive');

gulp.task('default', function () {
  return gulp.src('img/*.{png,jpg}')
    .pipe(responsive({
      '*.jpg': [{
        quality: 30,
        width: 320,
        rename: { suffix: '-320px' },
      }, {
        quality: 35,
        width: 480,
        rename: { suffix: '-480px' },
      }, {
        quality: 25,
        width: 600,
        rename: { suffix: '-600px' },
      }, {
        // Compress, strip metadata, and rename original image
        rename: { suffix: '-original' },
      }]
    }
  ))
    .pipe(gulp.dest('imgSrc'));
});