module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            all: ['Gruntfile.js', 'src/*.js']
        },
        uglify: {
            options: {
                banner: '/*!\n Tie-ng - http://develman.github.io/tiejs\n Licensed under the MIT license\n Copyright (c) 2014 Christoph Huppertz <huppertz.chr@gmail.com>, Georg Henkel <georg@develman.de>\n */\n'
            },
            build: {
                src: 'src/tie-ng.js',
                dest: 'dist/tie-ng.min.js'
            }
        },
        copy: {
            main: {
                src: 'src/tie-ng.js',
                dest: 'dist/tie-ng.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', [/*'jshint',*/ 'uglify', 'copy']);
};