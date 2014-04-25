module.exports = function(grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		concat : {
			rsjs : {
				options : {
					banner : '/*! <%= pkg.name %> - v<%= pkg.version %> - '
							+ '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
				},
				src : [ 'js/intro.js', 'js/util-lang.js', 'js/util-events.js',
						'js/util-path.js', 'js/util-request.js',
						'js/util-deps.js', 'js/module.js', 'js/rs.js',
						'js/loader.js', 'js/config.js', 'js/outro.js' ],
				dest : 'dest/rs.js',
			}
		},
		copy : {
			swf : {
				files : [ {
					expand : true,
					src : [ 'rs.swf','swfobject.js' ],
					cwd : 'as/',
					dest : 'dest/'
				} ]
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', [ 'concat', 'copy' ]);
};