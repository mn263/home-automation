module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'build/<%= pkg.name %>.min.js'
      }
    }
  });
  // runn a local file server
  grunt.loadNpmTasks('grunt-serve');
  // remove all console.log instances from project
  grunt.loadNpmTasks("grunt-remove-logging");

  // Default task(s).
  grunt.registerTask('default', []);
};