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