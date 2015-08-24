/*global module:false*/
module.exports = function(grunt) {

    var paths = {
        engage_js_src: [ '../engage_full.js' ],
        engage_js_dest: '../engage.js',
        web_css_src: [ '../site/css/site_sass_compiled.css' ],
        web_css_dest: '../site/css/styles.min.css',
        web_scss_src: [ '../site/sass/*.scss' ],
        web_scss_watch_src: [ '../site/sass/*.scss','../site/sass/antenna_components/*.scss','../site/sass/materialize_components/*.scss' ],
        web_scss_dest: '../site/css/site_sass_compiled.css',
        web_js_src: [   '../widget/js/jquery.cookie.js', 
                        '../widget/js/jquery.json-2.2.min.js', 
                        '../site/js/ant_site_scripts.js', 
                        '../site/js/ant_drip.js', 
                        '../site/js/materialize/global.js', 
                        '../site/js/materialize/jquery.easing.1.3.js', 
                        '../site/js/materialize/hammer.min.js', 
                        '../site/js/materialize/jquery.hammer.js', 
                        '../site/js/materialize/animation.js', 
                        // '../site/js/materialize/buttons.js', 
                        // '../site/js/materialize/cards.js', 
                        // '../site/js/materialize/character_counter.js', 
                        // '../site/js/materialize/collapsible.js', 
                        '../site/js/materialize/dropdown.js', 
                        // '../site/js/materialize/forms.js', 
                        // '../site/js/materialize/leanModal.js', 
                        // '../site/js/materialize/materialbox.js', 
                        // '../site/js/materialize/parallax.js', 
                        '../site/js/materialize/pushpin.js', 
                        // '../site/js/materialize/scrollFire.js', 
                        // '../site/js/materialize/scrollspy.js', 
                        '../site/js/materialize/sideNav.js', 
                        // '../site/js/materialize/slider.js', 
                        // '../site/js/materialize/tabs.js', 
                        // '../site/js/materialize/toasts.js', 
                        // '../site/js/materialize/tooltip.js', 
                        // '../site/js/materialize/transitions.js', 
                        // '../site/js/materialize/date_picker/picker.js', 
                        // '../site/js/materialize/date_picker/picker.date.js', 
                        '../site/js/materialize/velocity.min.js', 
                        '../widget/js/ant_user.js'],
        web_js_dest: '../site/js/antenna-web.min.js'
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
                    stripBanners: true,
                    mangle: false
                },
                src: ['<%= paths.web_js_src %>'],
                dest: '<%= paths.web_js_dest %>'
            },
            engage_js: {
                src: ['<%= paths.engage_js_src %>'],
                dest: '<%= paths.engage_js_dest %>'
            }
        },
        sass: {
            dist: {
                files: {
                    '<%= paths.web_scss_dest %>' : '<%= paths.web_scss_src %>'
                }
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
            scss: {
                files: [ '<%= paths.web_scss_watch_src %>' ],
                tasks: ['sass']
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
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    // Default task.
    grunt.registerTask('default', [ 'uglify:web_js', 'sass', 'cssmin:web_css' ]);
    grunt.registerTask('engage', [ 'uglify:engage_js' ]);

};
