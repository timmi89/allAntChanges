/*global module:false*/
module.exports = function(grunt) {

    var paths = {
        // TODO: fill in these values
        css_src: [ 'test-app/src/css/*.css' ],
        css_dest: 'test-app/dist/styles.min.css',
        js_src: 'test-app/src/js/*.js',
        js_dest: 'test-app/dist/antenna-web.min.js'
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
                src: '<%= paths.css_src %>',
                dest: '<%= paths.css_dest %>'
            }
        },
        uglify: {
            web_js: {
                options: {
                    banner: '<%= banner %>',
                    stripBanners: true
                },
                src: ['<%= paths.js_src %>'],
                dest: '<%= paths.js_dest %>'
            }
        },
        watch: {
            gruntfile: {
                files: [ 'Gruntfile.js' ]
            },
            web_js: {
                files: [ '<%= paths.js_src %>' ],
                tasks: [ 'uglify:web_js' ]
            },
            web_css: {
                files: [ '<%= paths.css_src %>' ],
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
