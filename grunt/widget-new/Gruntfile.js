/*global module:false*/
module.exports = function(grunt) {

    var rootDir = '../..'; // Path to the root of our repo

    var paths = {
        widget_src: [ rootDir + '/rb/static/widget-new/src/js/*.js', rootDir + '/rb/static/widget-new/src/templates/*.html' ],
        widget_js_debug: rootDir + '/rb/static/widget-new/debug/antenna.js',
        widget_js_prod: rootDir + '/rb/static/widget-new/antenna.min.js',
        widget_css_src: rootDir + '/rb/static/widget-new/src/css/*.css',
        widget_css_dest: rootDir + '/rb/static/widget-new/debug/antenna.css',

        rangy_src: [ rootDir + '/rb/static/js/cdn/rangy/1.3.0/uncompressed/rangy-core.js', rootDir + '/rb/static/js/cdn/rangy/1.3.0/uncompressed/*.js' ],
        rangy_dest: rootDir + '/rb/static/widget-new/lib/rangy-compiled.js'
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
            widget_css: {
                src: '<%= paths.widget_css_src %>',
                dest: '<%= paths.widget_css_dest %>'
            }
        },
        browserify: {
            widget_js: {
                options: {
                    browserifyOptions: {
                        transform: [ 'ractivate' ],
                        debug: true
                    }
                },
                src: ['<%= paths.widget_src %>'],
                dest: '<%= paths.widget_js_debug %>'
            },
            watchify_widget_js: {
                options: {
                    browserifyOptions: {
                        transform: [ 'ractivate' ],
                        debug: true
                    },
                    watch: true,
                    keepAlive: false // Allow this task to exit so the 'watch' task can run after it.
                },
                src: ['<%= paths.widget_src %>'],
                dest: '<%= paths.widget_js_debug %>'
            }
        },
        concat: {
            rangy: {
                src: ['<%= paths.rangy_src %>'],
                dest: '<%= paths.rangy_dest %>'
            }
        },
        uglify: {
            widget_js: {
                options: {
                    banner: '<%= banner %>',
                    stripBanners: true
                },
                src: ['<%= paths.widget_js_debug %>'],
                dest: '<%= paths.widget_js_prod %>'
            }
        },
        watch: {
            gruntfile: {
                files: [ 'Gruntfile.js' ]
            },
            widget_css: {
                options: {
                    atBegin: true
                },
                files: [ '<%= paths.widget_css_src %>'],
                tasks: [ 'cssmin:widget_css' ]
            }
            // our watch on the widget src is handled by 'watchify', included in browserify.
            // (see the 'watch' option in the browserify config.)
        }
        });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', [ 'browserify:widget_js', 'uglify:widget_js', 'cssmin:widget_css' ]);
    grunt.registerTask('monitor', [ 'browserify:watchify_widget_js', 'watch:widget_css'  ]);
    grunt.registerTask('rangy', [ 'concat:rangy' ]); // This task assembles our custom rangy "build". Run it when upgrading rangy or adding/removing rangy modules.

};
