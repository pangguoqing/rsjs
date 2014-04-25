module.exports = function(grunt) {
	function getConfig(){
		var pkg = grunt.file.readJSON('package.json');
		var rs = pkg.rs||{};
		rs.cwd = rs.cwd||"src/";
		rs.src = rs.src||["**"];
		rs.src = Array.isArray(rs.src)?rs.src:[rs.src];
		rs.filter = rs.filter||"";
		rs.concat = rs.concat ||{"to":"index.js", "from":["**/*.js","**/*.json","**/*.text"]};
		return rs;
	}
	function getSrcExcept(rs, needMark, filter){
		var except = [];
		var filter = filter||function(){return true};
		for(var i=0,len=rs.concat.length;i<len;i++){
			var concat = rs.concat[i];
			var from = concat.from;
			if(from){
				for(var j=0;j<from.length;j++){
					var file = from[j];
					if(file[0]==="!" && filter(file)){
						except.push(needMark?file:file.substr(1));
					}
				}
			}
		}
		return except;
	}
	var path = require("path");
	var rs = getConfig();
	var concatFrom = rs.concat.from;
	var concatTo =  rs.concat.to;
	var concatToParts = concatTo.split(path.sep);
	var idPer = "";
	var otherSrc = ["**/*"];
	if (concatToParts.length == 1) {
		idPer = "./";
	} else {
		for ( var i = 0, len = concatToParts.length; i < len - 1; i++) {
			idPer += "../";
		}
	}
	for ( var i = 0, len =concatFrom.length; i < len; i++) {
		var srcPart = concatFrom[i];
		if (srcPart[0] != "!") {
			otherSrc.push("!" + srcPart.substr(0));
		}
	}
	for ( i = 0, len = concatFrom.length; i < len; i++) {
		srcPart = concatFrom[i];
		if (srcPart[0] == "!") {
			otherSrc.push(srcPart.substr(1));
		}
	}
	otherSrc = otherSrc.concat(["!**/*.css","!**/*.js"]);
	
	grunt.initConfig({
		clean : {
			tmp : {
				src : [ "tmp" ]
			},
			dest : {
				src : [ "dest" ]
			}
		},
		copy : {
			all: {
				expand: true,
				cwd: rs.cwd,
				src: rs.src,
				dest: 'tmp/copy',
				filter: rs.filter
			},
			other_except_to_dest: {
				expand: true,
				cwd: 'tmp/copy',
				src: otherSrc,
				dest: 'dest'
			}
		},
		cssmin : {
			css_to_cssmin : {
				expand : true,
				cwd : 'tmp/copy/',
				src : concatFrom,
				dest : 'tmp/cssmin/',
				ext : '.css',
				filter : function(path){
					return path.substr(-4)===".css";
				}
			},
			css_except_to_dest : {
				expand : true,
				cwd : 'tmp/copy/',
				src : ["**/*.css"].concat(concatFrom.map(function(file) {return (file[0]==="!")?file.substr(1):("!"+file); })),
				dest : 'dest/',
				ext : '.css',
				filter : function(path){
					return path.substr(-4)===".css";
				}
			}
		},
		rsjs_transcoding : {
			other_to_rs: {
				options : {
					idPer : idPer
				},
				files : [ {
					expand : true,
					src : concatFrom.concat("!**/*.css","!**.*.js"),
					cwd : 'tmp/copy/',
					dest : 'tmp/rs/',
					filter : "isFile"
				}]
			},
			css_to_rs : {
				options : {
					idPer : idPer
				},
				files : [ {
					expand : true,
					src : '**/*.css',
					cwd : 'tmp/cssmin/',
					dest : 'tmp/rs/',
					filter : 'isFile'
				}]
			},
			js_to_rs : {
				options : {
					idPer : idPer
				},
				files : [ {
					expand : true,
					src : concatFrom,
					cwd : 'tmp/copy/',
					dest : 'tmp/rs/',
					filter : function(path){
						return path.substr(-3)===".js";
					}
				}]
			},
			js_except_to_rsJsExcept : {
				options : {
					isASelfDefineModule : true
				},
				files : [ {
					expand : true,
					src : ["**/*.js"].concat(concatFrom.map(function(file) {return (file[0]==="!")?file.substr(1):("!"+file); })),
					cwd : 'tmp/copy/',
					dest : 'tmp/rsJsExcept/',
					filter : function(path){
						return path.substr(-3)===".js";
					}
				}]
			}
		},
		uglify : {
			js_except_to_dest : {
				options : {
				// beautify: true
				},
				files : [ {
					expand : true,
					src : '**/*.js',
					cwd : 'tmp/rsJsExcept/',
					dest : 'dest/'
				} ]
			},
			concat_to_dest: {
				options : {
				// beautify: true
				},
				files : [ {
					expand : true,
					src : '**/*.js',
					cwd : 'tmp/concat/',
					dest : 'dest/'
				} ]
			}
		},
		concat : {
			options : {
				separator : '\n',
			},
			debug : {
				src :concatFrom.map(function(file) { return (file[0]=="!")?('!tmp/rs/'+file.substr(1)):('tmp/rs/' + file); }),
				dest : 'dest/' + concatTo,
				filter : 'isFile'
			},
			product : {
				src :concatFrom.map(function(file) { return (file[0]=="!")?('!tmp/rs/'+file.substr(1)):('tmp/rs/' + file); }),
				dest : 'tmp/concat/' + concatTo,
				filter : 'isFile'
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-rsjs-transcoding');

	grunt.registerTask('product', [ 'clean', 'copy:all', 'copy:other_except_to_dest' ,'rsjs_transcoding:other_to_rs' , 'cssmin:css_to_cssmin', 'cssmin:css_except_to_dest', 'rsjs_transcoding:css_to_rs','rsjs_transcoding:js_to_rs','rsjs_transcoding:js_except_to_rsJsExcept','uglify:js_except_to_dest','concat:product', 'uglify:concat_to_dest','clean:tmp']);
	grunt.registerTask('debug', [ 'clean', 'copy:all', 'copy:other_async_to_dest' ,'rsjs_transcoding:other_to_rs' , 'cssmin:css_to_cssmin', 'cssmin:css_async_to_dest', 'rsjs_transcoding:css_to_rs','rsjs_transcoding:js_to_rs','rsjs_transcoding:js_async_to_dest','concat:debug','clean:tmp']);
	grunt.registerTask('default', 'product');
};