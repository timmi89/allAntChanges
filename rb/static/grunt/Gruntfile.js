/*global module:false*/
module.exports = function(grunt) {

    var paths = {
        // TODO: fill in these values
        web_css_src: [ '../site/css/*.css' ],
        web_css_dest: '../site/styles.min.css',
        web_js_src: '../site/js/*.js',
        web_js_dest: '../site/antenna-web.min.js'
    };

  // Project configuration.
    grunt.initConfig({
        paths: paths,
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> */\n',
        // Task configuration.
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            web_css: {
                src: '<%= paths.web_css_src %>',
                dest: '<%= paths.web_css_dest %>'
            }
        },
        uglify: {
            web_js: {
                options: {
                    banner: '<%= banner %>',
                    stripBanners: true
                },
                src: ['<%= paths.web_js_src %>'],
                dest: '<%= paths.web_js_dest %>'
            }
        },
        watch: {
            gruntfile: {
                files: [ 'Gruntfile.js' ]
            },
            web_js: {
                files: [ '<%= paths.web_js_src %>' ],
                tasks: [ 'uglify:web_js' ]
            },
            web_css: {
                files: [ '<%= paths.web_css_src %>' ],
                tasks: [ 'cssmin:web_css' ]
            }
        }
        });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task.
    grunt.registerTask('default', [ 'uglify:web_js', 'cssmin:web_css' ]);

};
