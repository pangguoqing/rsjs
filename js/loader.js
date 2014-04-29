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