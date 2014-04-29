/**
 * config.js - The configuration for the loader
 */

var BASE_RE = /^(.+?\/)(\?\?)?(rsjs\/)+/;

// The root path to use for id2uri parsing
// If loaderUri is `http://test.com/libs/rsjs/[??][rsjs/1.2.3/]rs.js`, the
// baseUri should be `http://test.com/libs/`
data.base = (loaderDir.match(BASE_RE) || [ "", loaderDir ])[1];

// The loader directory
data.dir = loaderDir;

// The current working directory
data.cwd = cwd;

// The charset for requesting files
data.charset = "utf-8";
data.shim = {};
data._shim = {};
data.extnames = [ "js", "json", "css", "html", "htm", "tpl", "text", "txt","swf" ];
data.preferFlash = false;
// Modules that are needed to load before all other modules
data.preload = (function() {
	var plugins = [];

	// Convert `rsjs-xxx` to `rsjs-xxx=1`
	// NOTE: use `rsjs-xxx=1` flag in uri or cookie to preload `rsjs-xxx`
	var str = loc.search.replace(/(rsjs-\w+)(&|$)/g, "$1=1$2");

	// Add cookie string
	str += " " + doc.cookie;

	// Exclude rsjs-xxx=0
	str.replace(/(rsjs-\w+)=1/g, function(m, name) {
		plugins.push(name);
	});

	return plugins;
})();

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

rsjs.config = function(configData) {
	for ( var key in configData) {
		var curr = configData[key];
		var prev = data[key];

		// Merge object config such as alias, vars
		if (prev && isObject(prev)) {
			for ( var k in curr) {
				prev[k] = curr[k];
			}
		} else {
			// Concat array config such as map, preload
			if (isArray(prev)) {
				curr = prev.concat(curr);
			}
			// Make sure that `data.base` is an absolute path
			else if (key === "base") {
				(curr.slice(-1) === "/") || (curr += "/");
				curr = addBase(curr);
			}

			// Set config
			data[key] = curr;
		}
	}
	for ( var id in data.shim) {
		var uri = id2Uri(id);
		data._shim[uri] = data.shim[id];
	}
	if (data.preferFlash) {
		loader.preferFlash = true;
	}
	if (loader.preferFlash || !loader.supportCORS) {
		loader.prepareFlashLoader();
	} else {
		rsjs._ready = true;
	}
	emit("config", configData);
	return rsjs;
};
