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
