package 
{
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.IOErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.net.*;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	
	Security.allowDomain("*");
	Security.allowInsecureDomain("*"); 
	public class Rs extends Sprite
	{
		public function Rs():void 
		{
			try {
				ExternalInterface.addCallback("load", load);
				ExternalInterface.call("rsjs._flashLoaderOnReady");
			}catch(e: Error) {
				trace('Fatal: ExternalInterface error: ' + e.toString());
			}
		}
		public function load(url:String):void {
			var request:URLRequest = new URLRequest();
			request.url =url;
			var loader:URLLoader = new URLLoader();
			loader.dataFormat = URLLoaderDataFormat.TEXT;
			loader.load(request);
			loader.addEventListener(Event.COMPLETE, loaderCompleteHandler);
			loader.addEventListener(IOErrorEvent.IO_ERROR, loaderErrorHandler);
			function loaderCompleteHandler(e:Event):void {
				var text:String = URLLoader( e.target ).data;
				ExternalInterface.call("rsjs._flashLoaderOnSuccess", url, escape(text));
			}
			function loaderErrorHandler(e:IOErrorEvent):void {
				ExternalInterface.call("rsjs._flashLoaderOnError", url, e);
			}
		}
	}
	
}