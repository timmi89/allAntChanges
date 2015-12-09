/*global module:false*/
module.exports = function(grunt) {

    var rootDir = '../..'; // Path to the root of our repo

    var paths = {
        engage_js_src: [ rootDir + '/rb/static/engage_full.js' ],
        engage_js_dest: rootDir + '/rb/static/engage.js',
        web_css_src: [ rootDir + '/rb/static/site/css/site_sass_compiled.css' ],
        web_css_dest: rootDir + '/rb/static/site/css/styles.min.css',
        web_scss_src: [ rootDir + '/rb/static/site/sass/*.scss' ],
        web_scss_watch_src: [ 
            rootDir + '/rb/static/site/sass/*.scss',
            rootDir + '/rb/static/site/sass/antenna_components/*.scss',
            rootDir + '/rb/static/site/bower_components/chartist/dist/scss/chartist.scss',
            rootDir + '/rb/static/site/bower_components/chartist/dist/scss/settings/_chartist-settings.scss',
            rootDir + '/rb/static/site/sass/materialize_components/*.scss' ],
        web_scss_dest: rootDir + '/rb/static/site/css/site_sass_compiled.css',
        web_js_src: [   rootDir + '/rb/static/widget/js/jquery.cookie.js',
                        rootDir + '/rb/static/widget/js/jquery.json-2.2.min.js',
                        rootDir + '/rb/static/site/js/ant_site_scripts.js',
                        rootDir + '/rb/static/site/js/ant_drip.js',
                        rootDir + '/rb/static/site/js/moment.min.js',
                        rootDir + '/rb/static/site/js/polyfills/matchMedia.js',
                        rootDir + '/rb/static/site/js/polyfills/matchMedia.addListener.js',
                        rootDir + '/rb/static/site/bower_components/chartist/dist/chartist.min.js',
                        rootDir + '/rb/static/site/bower_components/chartist/dist/chartist-plugin-tooltip.min.js',
                        // rootDir + '/rb/static/site/bower_components/chartist/dist/chartist-plugin-tooltip.js',
                        rootDir + '/rb/static/site/bower_components/chartist/dist/chartist-plugin-axistitle.min.js',
                        rootDir + '/rb/static/site/js/materialize/global.js',
                        rootDir + '/rb/static/site/js/materialize/jquery.easing.1.3.js',
                        rootDir + '/rb/static/site/js/materialize/hammer.min.js',
                        rootDir + '/rb/static/site/js/materialize/jquery.hammer.js',
                        rootDir + '/rb/static/site/js/materialize/animation.js',
                        // rootDir + '/rb/static/site/js/materialize/buttons.js',
                        // rootDir + '/rb/static/site/js/materialize/cards.js',
                        // rootDir + '/rb/static/site/js/materialize/character_counter.js',
                        // rootDir + '/rb/static/site/js/materialize/collapsible.js',
                        rootDir + '/rb/static/site/js/materialize/dropdown.js',
                        // rootDir + '/rb/static/site/js/materialize/forms.js',
                        // rootDir + '/rb/static/site/js/materialize/leanModal.js',
                        // rootDir + '/rb/static/site/js/materialize/materialbox.js',
                        // rootDir + '/rb/static/site/js/materialize/parallax.js',
                        rootDir + '/rb/static/site/js/materialize/pushpin.js',
                        // rootDir + '/rb/static/site/js/materialize/scrollFire.js',
                        // rootDir + '/rb/static/site/js/materialize/scrollspy.js',
                        rootDir + '/rb/static/site/js/materialize/sideNav.js',
                        // rootDir + '/rb/static/site/js/materialize/slider.js',
                        // rootDir + '/rb/static/site/js/materialize/tabs.js',
                        // rootDir + '/rb/static/site/js/materialize/toasts.js',
                        // rootDir + '/rb/static/site/js/materialize/tooltip.js',
                        // rootDir + '/rb/static/site/js/materialize/transitions.js',
                        rootDir + '/rb/static/site/js/materialize/date_picker/picker.js',
                        rootDir + '/rb/static/site/js/materialize/date_picker/picker.date.js',
                        rootDir + '/rb/static/site/js/materialize/velocity.min.js',
                        rootDir + '/rb/static/widget/js/ant_user.js'],
        web_js_dest: rootDir + '/rb/static/site/js/antenna-web.min.js'
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
                files: [ '<%= paths.web_js_src %>', '<%= paths.engage_js_src %>' ],
                tasks: [ 'uglify:web_js', 'uglify:engage_js' ]
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
