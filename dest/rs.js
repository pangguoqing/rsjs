/*! rsjs - v0.1.0 - 2014-04-29 */
(function(global, undefined) {
// Avoid conflicting when `rs.js` is loaded multiple times
if (global.rsjs) {
  return;
}
var rsjs = global.rsjs = {
  // The current version of rs.js being used
  version: "2.2.0"
};

var data = {};
/**
 * util-lang.js - The minimal language enhancement
 */

function isType(type) {
	return function(obj) {
		return Object.prototype.toString.call(obj) === "[object " + type + "]";
	};
}

var isObject = isType("Object");
var isString = isType("String");
var isArray = Array.isArray || isType("Array");
var isFunction = isType("Function");
/**
 * util-events.js - The minimal events support
 */

var events = data.events = {};

// Bind event
rsjs.on = function(name, callback) {
	var list = events[name] || (events[name] = []);
	list.push(callback);
	return rsjs;
};

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
rsjs.off = function(name, callback) {
	// Remove *all* events
	if (!(name || callback)) {
		events = data.events = {};
		return rsjs;
	}

	var list = events[name];
	if (list) {
		if (callback) {
			for ( var i = list.length - 1; i >= 0; i--) {
				if (list[i] === callback) {
					list.splice(i, 1);
				}
			}
		} else {
			delete events[name];
		}
	}

	return rsjs;
};

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = rsjs.emit = function(name, data) {
	var list = events[name], fn;

	if (list) {
		// Copy callback lists to prevent modification
		list = list.slice();

		// Execute event callbacks
		while ((fn = list.shift())) {
			fn(data);
		}
	}

	return rsjs;
};

/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var DIRNAME_RE = /[^?#]*\//;

var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /\/[^\/]+\/\.\.\//;

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
	return path.match(DIRNAME_RE)[0];
}

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
	// /a/b/./c/./d ==> /a/b/c/d
	path = path.replace(DOT_RE, "/");

	// a/b/c/../../d ==> a/b/../d ==> a/d
	while (path.match(DOUBLE_DOT_RE)) {
		path = path.replace(DOUBLE_DOT_RE, "/");
	}

	return path;
}

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// normalize("path/to/a.1.0.1") ==> "path/to/a.1.0.1.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
	var last = path.length - 1;
	var lastC = path.charAt(last);

	// If the uri ends with `#`, just return it without '#'
	if (lastC === "#") {
		return path.substring(0, last);
	}
	var arr = path.split(".");
	var extname = "js";
	if (arr.length > 1) {
		extname = arr[arr.length - 1];
		if (indexOf.call(data.extnames, extname) == -1) {
			return path + ".js";
		} else {
			return path;
		}
	} else {
		return path + ".js";
	}
}

var PATHS_RE = /^([^\/:]+)(\/.+)$/;
var VARS_RE = /\{([^\{]+)\}/g;

function parseAlias(id) {
	var alias = data.alias;
	return alias && isString(alias[id]) ? alias[id] : id;
}

function parsePaths(id) {
	var paths = data.paths;
	var m;

	if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
		id = paths[m[1]] + m[2];
	}

	return id;
}

function parseVars(id) {
	var vars = data.vars;

	if (vars && id.indexOf("{") > -1) {
		id = id.replace(VARS_RE, function(m, key) {
			return isString(vars[key]) ? vars[key] : m;
		});
	}

	return id;
}

function parseMap(uri) {
	var map = data.map;
	var ret = uri;

	if (map) {
		for ( var i = 0, len = map.length; i < len; i++) {
			var rule = map[i];

			ret = isFunction(rule) ? (rule(uri) || uri) : uri.replace(rule[0],
					rule[1]);

			// Only apply the first matched rule
			if (ret !== uri)
				break;
		}
	}

	return ret;
}

var ABSOLUTE_RE = /^\/\/.|:\//;
var ROOT_DIR_RE = /^.*?\/\/.*?\//;

function addBase(id, refUri) {
	var ret;
	var first = id.charAt(0);

	// Absolute
	if (ABSOLUTE_RE.test(id)) {
		ret = id;
	}
	// Relative
	else if (first === ".") {
		ret = realpath((refUri ? dirname(refUri) : data.cwd) + id);
	}
	// Root
	else if (first === "/") {
		var m = data.cwd.match(ROOT_DIR_RE);
		ret = m ? m[0] + id.substring(1) : id;
	}
	// Top-level
	else {
		ret = data.base + id;
	}

	return ret;
}

function id2Uri(id, refUri) {
	if (!id)
		return "";

	id = parseAlias(id);
	id = parsePaths(id);
	id = parseVars(id);
	id = normalize(id);

	var uri = addBase(id, refUri);
	uri = parseMap(uri);

	return uri;
}

var doc = document;
var loc = location;
var cwd = dirname(loc.href);
var scripts = doc.getElementsByTagName("script");

// Recommend to add `rsjs` id for the `rs.js` script element
var loaderScript = doc.getElementById("rsjs") || scripts[scripts.length - 1];

// When `rs.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd);

function getScriptAbsoluteSrc(node) {
	return node.hasAttribute ? // non-IE6/7
	node.src :
	// see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
	node.getAttribute("src", 4);
}
/**
 * util-request.js - The utilities for requesting script and style files ref:
 * tests/research/load-js-css/test.html
 */

var head = doc.head || doc.getElementsByTagName("head")[0]
		|| doc.documentElement;
var baseElement = head.getElementsByTagName("base")[0];

var IS_CSS_RE = /\.css(?:\?|$)/i;

// `onload` event is not supported in WebKit < 535.23 and Firefox < 9.0
// ref:
// - https://bugs.webkit.org/show_activity.cgi?id=38995
// - https://bugzilla.mozilla.org/show_bug.cgi?id=185236
// - https://developer.mozilla.org/en/HTML/Element/link#Stylesheet_load_events
var isOldWebKit = +navigator.userAgent
		.replace(/.*AppleWebKit\/(\d+)\..*/, "$1") < 536;

function request(url, callback, charset) {
	var isCSS = IS_CSS_RE.test(url);
	var node = doc.createElement(isCSS ? "link" : "script");
	if (charset) {
		var cs = isFunction(charset) ? charset(url) : charset;
		if (cs) {
			node.charset = cs;
		}
	}

	addOnload(node, callback, isCSS, url);

	if (isCSS) {
		node.rel = "stylesheet";
		node.href = url;
	} else {
		node.async = true;
		node.src = url;
	}
	// ref: #185 & http://dev.jquery.com/ticket/2709
	baseElement ? head.insertBefore(node, baseElement) : head.appendChild(node);
}

function addOnload(node, callback, isCSS, url) {
	var supportOnload = "onload" in node;

	// for Old WebKit and Old Firefox
	if (isCSS && (isOldWebKit || !supportOnload)) {
		setTimeout(function() {
			pollCss(node, callback);
		}, 1); // Begin after node insertion
		return;
	}

	if (supportOnload) {
		node.onload = onload;
		node.onerror = function() {
			emit("error", {
				uri : url,
				node : node
			});
			onload();
		};
	} else {
		node.onreadystatechange = function() {
			if (/loaded|complete/.test(node.readyState)) {
				onload();
			}
		};
	}

	function onload() {
		// Ensure only run once and handle memory leak in IE
		node.onload = node.onerror = node.onreadystatechange = null;

		// Remove the script to reduce memory leak
		if (!isCSS && !data.debug) {
			head.removeChild(node);
		}

		// Dereference the node
		node = null;

		callback();
	}
}

function pollCss(node, callback) {
	var sheet = node.sheet;
	var isLoaded;

	// for WebKit < 536
	if (isOldWebKit) {
		if (sheet) {
			isLoaded = true;
		}
	}
	// for Firefox < 9.0
	else if (sheet) {
		try {
			if (sheet.cssRules) {
				isLoaded = true;
			}
		} catch (ex) {
			// The value of `ex.name` is changed from
			// "NS_ERROR_DOM_SECURITY_ERR"
			// to "SecurityError" since Firefox 13.0. But Firefox is less than
			// 9.0
			// in here, So it is ok to just rely on "NS_ERROR_DOM_SECURITY_ERR"
			if (ex.name === "NS_ERROR_DOM_SECURITY_ERR") {
				isLoaded = true;
			}
		}
	}

	setTimeout(function() {
		if (isLoaded) {
			// Place callback here to give time for style rendering
			callback();
		} else {
			pollCss(node, callback);
		}
	}, 20);
}
/**
 * util-deps.js - The parser for dependencies ref:
 * tests/research/parse-dependencies/test.html
 */

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
var SLASH_RE = /\\\\/g;

function parseDependencies(code) {
	var ret = [];

	code.replace(SLASH_RE, "").replace(REQUIRE_RE, function(m, m1, m2) {
		if (m2) {
			ret.push(m2);
		}
	});

	return ret;
}

var codes = {};
var modules = {};
var dependents = {};
var factorys = {};
var DEFINE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*define|(?:^|[^$])\b(define\s*\(\s*)/g;
var DEFINE_SHORT_RE = /\bdefine\s*\(/;
var currentUri = "";
var indexOf = [].indexOf || function(elem) {
	var i = 0, len = this.length;
	for (; i < len; i++) {
		if (this[i] === elem) {
			return i;
		}
	}
	return -1;
};
function isEmptyObject(obj){
    for(var name in obj){
        return false;
    }
    return true;
}
var head = document.getElementsByTagName("head")[0] || document.documentElement;
var baseElement = head.getElementsByTagName("base")[0];
function define(id, deps, factory) {
	var module = getModule(currentUri);
	var argsLen = arguments.length;
	// define(factory)
	if (argsLen === 1) {
		factory = id;
		id = undefined;
	} else if (argsLen === 2) {
		factory = deps;
		// define(deps, factory)
		if (isArray(id)) {
			deps = id;
			id = undefined;
		}
		// define(id, factory)
		else {
			deps = undefined;
		}
	}
	var uri = (id === undefined) ? module.uri : getUri(id, module.uri);
	var extname = getExtname(uri);
	if (uri === module.uri) {
		module.isASelfDefineModule = true;
	}
	var shimData = data._shim[uri];
	if (isFunction(factory) && extname == "js") {
		var code = factory.toString();
		code = code.substring(code.indexOf("{") + 1);
		code = code.substring(0, code.length - 1);
		codes[uri] = code;
		dependents[uri] = deps;
		if(!(shimData && shimData.exports)){
			factorys[uri] = factory;
		}
		module.defines.push(uri);
	} else {
		if (extname == 'css') {
			var node = document.createElement("style");
			node.textContent = factory;
			baseElement ? head.insertBefore(node, baseElement) : head
					.appendChild(node);
		}
		var _module = getModule(uri);
		_module.exports = (extname == 'css')?"":factory;
		//if (_module.uri !== module.uri) {
			_module.ready();
		//}
	}
}

function isEmpty(obj) {
	for ( var name in obj) {
		return false;
	}
	return true;
}
function containsDefine(code) {
	var ret = [];
	code.replace(SLASH_RE, "").replace(DEFINE_RE, function(m, m1) {
		if (m1) {
			ret.push(m1);
		}
	});
	return !!ret.length;
}
function getExtname(uri) {
	var arr = uri.split(".");
	if (arr.length > 1) {
		var extname = arr[arr.length - 1];
		if (indexOf.call(data.extnames, extname) !== -1) {
			return extname;
		}
	}
}
function getModule(uri) {
	var module = modules[uri];
	if (!module) {
		module = new Module(uri);
		modules[uri] = module;
	}
	return module;
}
function getUri(id, refUri) {
	return id2Uri(id, refUri);
}
function Module(uri) {
	this.uri = uri;
	this.childUris = [];
	this.parentUris = [];
	this.exports = null;
	this.status = 0;
	this.asyncCallbacks = [];
	this.extname = getExtname(uri) || "js";
	this.defines = [];
	this.deps = [];
	this.isASelfDefineModule = false;
	this.childReadyNum = 0;
}
Module.status = {
	FETCHING : 1,
	FETCHING_CHINDREN : 2,
	EXECUTING : 3,
	READY : 4
};
Module.prototype.fetch = function() {
	if (this.status !== 0) {
		return;
	}
	var self = this;
	var uri = this.uri;
	this.status = Module.status.FETCHING;
	if (this.extname === "css") {
		request(this.uri, function() {
			self.ready();
		});
		return;
	}
	var code = codes[uri];
	if (code!==undefined) {
		this.fetched(code);
		return;
	}
	loader({
		url : uri,
		success : function(code) {
			codes[uri] = code;
			self.fetched(code);
		}
	});
};
Module.prototype.fetched = function(code) {
	if (this.extname === "js") {
		if (DEFINE_SHORT_RE.test(code) && containsDefine(code)) {
			this.execute();
			if (!this.isASelfDefineModule) {
				this.ready();
			}else{
				this.fetchChildren();				
			}
		} else {
			this.fetchChildren();
		}
	} else {
		this.execute();
		this.ready();
	}
};
Module.prototype.fetchDefines = function() {
	var defines = this.defines;
	for ( var i = 0, len = defines.length; i < len; i++) {
		var uri = defines[i];
		var module = getModule(uri);
		if(!module.isReady()) module.fetchChildren();
	}
};
Module.prototype.fetchChildren = function() {
	this.status = Module.status.FETCHING_CHINDREN;
	this.childUris = this.getChildUris();
	var uris = this.childUris;
	if (uris.length) {
		for ( var i = 0, len = uris.length; i < len; i++) {
			var uri = uris[i];
			var child = getModule(uri);
			if(!child.parentUris[this.uri]){
				child.parentUris.push(this.uri);
			}
			if (child.isReady()) {
				this.childReadyNum++;
				if (this.childReadyNum == this.childUris.length && this.executable()) {
					this.execute();
					this.ready();
				}
			} else {
				child.fetch();
			}
		}
	} else {
		this.execute();
		this.ready();
	}
};
Module.prototype.getChildUris = function() {
	var code = codes[this.uri];
	var uris = [];
	var shimData = data._shim[this.uri];
	var deps1 = shimData ? (shimData.deps || []) : [];
	var deps2 = dependents[this.uri] || parseDependencies(code);
	var deps = deps1.concat(deps2);
	for ( var i = 0, len = deps.length; i < len; i++) {
		var id = deps[i];
		var uri = getUri(id, this.uri);
		uris.push(uri);
	}
	uris.concat(this.childUris);
	return uris;
};
Module.prototype.execute = function() {
	var code = codes[this.uri];
	this.status = Module.status.EXECUTING;
	if (this.extname === "js") {
		var factory = factorys[this.uri];
		var exports = this.exports = {};
		if (factory) {
			currentUri = this.uri;
			this._return = factory(this.require, this.exports, this, define);
		}else{
			var node = document.createElement("script");
			var shimData = data._shim[this.uri];
			if (shimData && shimData.exports) {
				code = code + ";module.exports=" + shimData.exports;
			}
			code = 'rsjs._modules["' + this.uri
					+ '"]._return = (function(require,exports,module,define){\n\t'
					+ code + '})(rsjs._modules["' + this.uri
					+ '"].require,rsjs._modules["' + this.uri
					+ '"].exports,rsjs._modules["' + this.uri
					+ '"],define)\n//# sourceURL=' + this.uri;
			node.text = code;
			currentUri = this.uri;
			baseElement ? head.insertBefore(node, baseElement) : head
					.appendChild(node);
		}
		currentUri = "";
		this.exports = (this.exports === exports && isEmptyObject(exports))?null:this.exports;
		this.exports = (this._return === undefined) ? this.exports
				: this._return;
	} else if (this.extname === "json") {
		if (code === "") {
			code = '""';
		}
		eval('modules["' + this.uri + '"].exports=' + code);
	} else {
		this.exports = code;
	}
};
Module.prototype.ready = function() {
	var asyncCallbacks = this.asyncCallbacks;
	var parentUris = this.parentUris;
	this.status = Module.status.READY;
	while (asyncCallbacks.length) {
		var callback = asyncCallbacks.shift();
		callback(this.exports);
	}
	if (parentUris.length) {
		for ( var i = 0, len = parentUris.length; i < len; i++) {
			var uri = parentUris[i];
			var parent = modules[uri];
			parent.childUris[this.uri];
			if (parent.executable()) {
				parent.execute();
				parent.ready();
			}
		}
	}
};
Module.prototype.require = function(id) {
	var parent = arguments.callee.caller.arguments[2];
	var uri = getUri(id, parent ? parent.uri : "");
	var module = getModule(uri);
	return module.exports;
};
Module.prototype.require.async = function(id, callback) {
	var parent = arguments.callee.caller.arguments[2];
	callback = callback || rsjs.noop;
	if (isArray(id)) {
		this._asyncArray(id, callback, parent);
	} else {
		this._asyncSingle(id, callback, parent);
	}
};
Module.prototype.require._asyncSingle = function(id, callback, parent) {
	var uri = getUri(id, parent.uri);
	var module = getModule(uri);
	if (module.isReady()) {
		callback(module.exports);
	} else {
		module.asyncCallbacks.push(callback);
		module.fetch();
	}
};
Module.prototype.require._asyncArray = function(paths, callback, parent) {
	var self = this;
	var results = [];
	var resultsNum = 0;
	for ( var i = 0, len = paths.length; i < len; i++) {
		var id = paths[i];
		(function(i, id) {
			self._asyncSingle(id, function(result) {
				results[i] = result;
				if (len == ++resultsNum) {
					callback.apply(null, results);
				}
			}, parent);
		})(i, id);
	}
};
Module.prototype.isReady = function() {
	return this.status == Module.status.READY;
};
Module.prototype.executable = function() {
	if (this.status === Module.status.READY) {
		return false;
	}
	var uris = this.childUris;
	for ( var i = 0, len = uris.length; i < len; i++) {
		var uri = uris[i];
		var child = modules[uri];
		// 模块还没来得及初始化，这时child==undefined
		if (!child || !child.isReady()) {
			return false;
		}
	}
	return true;
};

rsjs.noop = function() {
};
rsjs._modules = modules;
rsjs._ready = false;
rsjs._flashLoader = null;
rsjs._flashLoaderOnReadyCallback = rsjs.noop;
rsjs._flashLoaderOnSuccessCallbacks = {};
rsjs._flashLoaderOnErrorCallbacks = {};
rsjs.main = function(id, callback) {
	if (rsjs._ready) {
		rsjs._main(id, callback);
	} else {
		rsjs._flashLoaderOnReadyCallback = function() {
			rsjs._main(id, callback);
		};
	}
};
rsjs._main = function(id, callback) {
	var uri = getUri(id);
	var module = getModule(uri);
	if (callback) {
		module.asyncCallbacks.push(callback);
	}
	module.fetch();
};
rsjs._flashLoaderOnSuccess = function(uri, text) {
	rsjs._flashLoaderOnSuccessCallbacks[uri](unescape(text));
	rsjs._flashLoaderOnSuccessCallbacks[uri] = null;
};
rsjs._flashLoaderOnError = function(uri, e) {
	rsjs._flashLoaderOnErrorCallbacks[uri](e);
	rsjs._flashLoaderOnErrorCallbacks[uri] = null;
};
rsjs._flashLoaderOnReady = function() {
	rsjs._ready = true;
	rsjs._flashLoader = document.getElementById("rsjs_flash_loader");
	rsjs._flashLoaderOnReadyCallback();
};
global.define = define;
global.rsjs = rsjs;
var loader = function(options) {
	var onerror = options.error || loader.noop;
	var onsuccess = options.success || loader.noop;
	if (!options.url) {
		console.log("requrest need a url");
		return;
	}
	var url = options.url;
	var needCORS = options.url.indexOf(location.host) === -1;
	if ((needCORS && !loader.supportCORS) || loader.preferFlash) {
		rsjs._flashLoader.load(url);
		rsjs._flashLoaderOnSuccessCallbacks[url] = onsuccess;
		rsjs._flashLoaderOnErrorCallbacks[url] = onerror;
		return;
	}
	
	var xhr = needCORS?loader.createCORSRequest(url):loader.createRequest(url);
	if (needCORS){
		xhr.onerror = onerror;
		xhr.onload = function() {
			onsuccess(xhr.responseText);
		};	
	}else{
		xhr.onreadystatechange = function(){
			if(xhr.readyState === 4){
				if(xhr.status === 200){
					onsuccess(xhr.responseText);
				}else{
					onerror(xhr.statusText);
				}
			}
		};
	}
	xhr.send();
};
loader.preferFlash = false;
loader.createRequest = function(url){
	var xhr;
	if(window.XMLHttpRequest === undefined){
		try{
			xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0");
		}
		catch(e1){
			try {
				xhr = new ActiveXObject("Msxml2.XMLHTTP.3.0");	
			}
			catch(e2){
				throw new Error("XMLHttpRequest is not supported");
			}
		}
	}else{
		xhr = new XMLHttpRequest();
	}
	xhr.open("get", url);
	return xhr;
};
loader.createCORSRequest = function(url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// XHR for Chrome/Firefox/Opera/Safari.
		xhr.open("get", url, true);
	} else if (typeof XDomainRequest != "undefined") {
		// XDomainRequest for IE.
		xhr = new XDomainRequest();
		xhr.open("get", url);
	} else {
		// CORS not supported.
		xhr = null;
	}
	return xhr;
};
loader.prepareFlashLoader = function() {
	var body = document.getElementsByTagName("body")[0]
			|| document.documentElement;
	var node = document.createElement("div");
	var script = document.createElement("script");
	var swfobjectUri = loaderDir+"swfobject.js";
	var swfUri = loaderDir+"rs.swf";
	node.id = "rsjs_flash_loader_content";
	node.setAttribute("style", "display:none");
	node.innerHTML = '<p><a href="http://www.adobe.com/go/getflashplayer">Get Adobe Flash player</a></p>';
	body.appendChild(node);
	var flashvars = {};
	var params = {
		menu : "false",
		scale : "noScale",
		allowFullscreen : "true",
		allowScriptAccess : "always",
		bgcolor : "",
		wmode : "direct" // can cause issues with FP settings & webcam
	};
	var attributes = {
		id : "rsjs_flash_loader"
	};
	if (typeof swfobject != "undefined") {
		onload();
	} else {
		request(swfobjectUri, function() {
			swfobject.embedSWF(swfUri, "rsjs_flash_loader_content", "1", "1", "10.0.0",
					"expressInstall.swf", flashvars, params, attributes);
		});
	}
};
loader.supportCORS = (function() {
	return (typeof XDomainRequest != "undefined")
			|| (typeof XMLHttpRequest != "undefined")
			&& ("withCredentials" in new XMLHttpRequest());
})();
loader.noop = function() {
};
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

})(this);
