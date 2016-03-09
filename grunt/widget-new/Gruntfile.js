/*global module:false*/
var envify = require('envify');

module.exports = function(grunt) {

    var rootDir = '../..'; // Path to the root of our repo

    var paths = {
        widget_src: [ rootDir + '/rb/static/widget-new/src/js/*.js', rootDir + '/rb/static/widget-new/src/templates/*.html' ],
        widget_js_debug: rootDir + '/rb/static/widget-new/debug/antenna.js',
        widget_js_prod: rootDir + '/rb/static/widget-new/antenna.min.js',
        // our widget_css_src files are minified into widget_css_temp
        // reset.css and widget_css_temp are then combined, so the reset comes before any other styles
        widget_css_src: rootDir + '/rb/static/widget-new/src/css/*.css',
        widget_css_src_temp: rootDir + '/rb/static/widget-new/debug/temp.css',
        widget_css_reset: rootDir + '/rb/static/widget-new/src/css/reset.css',
        widget_css_reset_temp: rootDir + '/rb/static/widget-new/debug/reset_temp.css',
        widget_css_dest: rootDir + '/rb/static/widget-new/antenna.css',

        engage_loader_js_src: [ rootDir + '/rb/static/engage_loader.js' ],
        engage_loader_js_dest: rootDir + '/rb/static/engage.js',

        readmore_js_src: [ rootDir + '/rb/static/readmore/src/readmore.js' ],
        readmore_js_dest: rootDir + '/rb/static/readmore.min.js',

        rangy_src: [ rootDir + '/rb/static/js/cdn/rangy/1.3.0/uncompressed/rangy-core.js', rootDir + '/rb/static/js/cdn/rangy/1.3.0/uncompressed/*.js' ],
        rangy_dest: rootDir + '/rb/static/widget-new/lib/rangy.compiled-1.3.0.js',
        rangy_min: rootDir + '/rb/static/widget-new/lib/rangy.compiled-1.3.0.min.js',

        ractive_src: rootDir + '/rb/static/widget-new/lib/ractive.runtime-0.7.3.js',
        ractive_dest: rootDir + '/rb/static/widget-new/lib/ractive.runtime-0.7.3.min.js',

        antuser_src: rootDir + '/rb/static/widget-new/src/xdm/ant_user.js',
        antuser_dest: rootDir + '/rb/static/widget-new/ant_user.min.js',

        fb_login_env: rootDir + '/rb/static/widget-new/fb_login.env.html',
        fb_login_dest: rootDir + '/rb/static/widget-new/fb_login.html',
        xdm_env: rootDir + '/rb/static/widget-new/xdm.env.html',
        xdm_dest: rootDir + '/rb/static/widget-new/xdm.html',
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
                src: ['<%= paths.widget_css_src %>','!<%= paths.widget_css_reset %>'],
                dest: '<%= paths.widget_css_src_temp %>',
            },
            reset_css: {
                src: ['<%= paths.widget_css_reset %>'],
                dest: '<%= paths.widget_css_reset_temp %>',
            }
        },
        browserify: {
            widget_js: {
                options: {
                    browserifyOptions: {
                        transform: [ 'ractivate', envify ],
                        debug: true
                    }
                },
                src: ['<%= paths.widget_src %>'],
                dest: '<%= paths.widget_js_debug %>'
            },
            watchify_widget_js: {
                options: {
                    browserifyOptions: {
                        transform: [ 'ractivate', envify ],
                        debug: true,
                        fullPaths: false
                    },
                    watch: true,
                    keepAlive: false // Allow this task to exit so the 'watch' task can run after it.
                },
                src: ['<%= paths.widget_src %>'],
                dest: '<%= paths.widget_js_debug %>'
            },
        },
        preprocess : {
          options: {
            type: 'js'
          },
          fb_login : {
            src : '<%= paths.fb_login_env %>',
            dest : '<%= paths.fb_login_dest %>'
          },
          xdm : {
            src : '<%= paths.xdm_env %>',
            dest : '<%= paths.xdm_dest %>'
          }
        },
        concat: {
            rangy: {
                src: ['<%= paths.rangy_src %>'],
                dest: '<%= paths.rangy_dest %>'
            },
            widget_css: {
                src: ['<%= paths.widget_css_reset_temp %>', '<%= paths.widget_css_src_temp %>'],
                dest: '<%= paths.widget_css_dest %>'
            }
        },
        clean: {
            options: {
                force: true
            },
            temp_css: {
                src: ['<%= paths.widget_css_reset_temp %>', '<%= paths.widget_css_src_temp %>']
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
            },
            engage_loader_js: {
                src: ['<%= paths.engage_loader_js_src %>'],
                dest: '<%= paths.engage_loader_js_dest %>'
            },
            readmore_js: {
                src: ['<%= paths.readmore_js_src %>'],
                dest: '<%= paths.readmore_js_dest %>'
            },
            rangy: {
                src: ['<%= paths.rangy_dest %>'],
                dest: '<%= paths.rangy_min %>'
            },
            ractive: {
                src: ['<%= paths.ractive_src %>'],
                dest: '<%= paths.ractive_dest %>'
            },
            antuser: {
                src: ['<%= paths.antuser_src %>'],
                dest: '<%= paths.antuser_dest %>'
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
                files: [ '<%= paths.widget_css_src %>', '<%= paths.widget_css_reset %>'],
                tasks: [ 'cssmin', 'concat:widget_css', 'clean:temp_css' ]
            },
            widget_js: {
                options: {
                    atBegin: true
                },
                files: [ '<%= paths.widget_js_debug %>' ],
                tasks: [ 'uglify:widget_js' ]
            },
            engage_loader_js: {
                options: {
                    atBegin: true
                },
                files: [ '<%= paths.engage_loader_js_src %>' ],
                tasks: [ 'uglify:engage_loader_js' ]
            },
            readmore_js: {
                options: {
                    atBegin: true
                },
                files: [ '<%= paths.readmore_js_src %>' ],
                tasks: [ 'uglify:readmore_js' ]
            }
            // our watch on the widget src is handled by 'watchify', included in browserify.
            // (see the 'watch' option in the browserify config.)
        },
        concurrent: {
            watch_all: {
                tasks: [ 'watch:gruntfile', 'watch:widget_js', 'watch:widget_css', 'watch:engage_loader_js', 'watch:readmore_js' ],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-preprocess');

    grunt.registerTask('default', [ 'preprocess:xdm', 'preprocess:fb_login', 'browserify:widget_js', 'uglify:widget_js', 'cssmin', 'concat:widget_css', 'clean:temp_css' ]);
    grunt.registerTask('monitor', [ 'browserify:watchify_widget_js', 'concurrent:watch_all'  ]);
    grunt.registerTask('rangy-compile', [ 'concat:rangy' ]);// This task assembles our custom rangy "build". Run it when upgrading rangy or adding/removing rangy modules.
    grunt.registerTask('rangy-min', [ 'uglify:rangy' ]); // After manually applying our workaround to disable AMD, run this task to minify our compiled Rangy.
    grunt.registerTask('ractive-min', [ 'uglify:ractive' ]);
    grunt.registerTask('antuser-min', [ 'uglify:antuser' ]);
    grunt.registerTask('widget', [ 'browserify:widget_js', 'uglify:widget_js', 'cssmin', 'concat:widget_css', 'clean:temp_css' ]);
    grunt.registerTask('readmore', [ 'uglify:readmore_js' ]);

};
