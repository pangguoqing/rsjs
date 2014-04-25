前端模块加载器
===

现在已经有很多很好用的模块加载器，如seajs，requirejs等。但是否您仅满足于此，加入进来，完善rsjs，它会成为大家另一个选择。

##配置
如果请求的是跨域资源(比如从cdn服务器请求资源)，那么需要在静态服务器上进行一定的配置。详情，请参见wiki。
在http header中添加 `Access-Control-Allow-Origin:*`
在静态域名根目录下添加 `crossdomain.xml`

##大概了解
1.更加贴合nodejs中模块的编写方式，无需包裹。

2.更多模块形态，更加直观 *.js,*.css,*.json,*.text 等。

3.更简单的api。

4.单一文件输出（目前支持*.js,*.css,*.json,*.text,以及其他文本格式的文件压缩合并成一个目标文件）

5.兼容seajs定义的模块（并不推荐在rsjs里使用seajs定义的模块，考虑到seajs用户众多，方便大家调试）。

##API参考
###rsjs.config
用来对rsjs进行配置
```js
rsjs.config({
  // 别名配置
  alias: {
    'es5-safe': 'gallery/es5-safe/0.9.3/es5-safe',
    'json': 'gallery/json/1.0.2/json',
    'jquery': 'jquery/jquery/1.10.1/jquery'
  },
  // 路径配置
  paths: {
    'gallery': 'https://a.alipayobjects.com/gallery'
  },
  // 变量配置
  vars: {
    'locale': 'zh-cn'
  },
  // 映射配置
  map: [
    ['http://example.com/js/app/', 'http://localhost/js/app/']
  ],
  // Sea.js 的基础路径
  base: 'http://example.com/path/to/base/'
});
```
###rsjs.main
rsjs的入口
```js
// 加载一个模块
rsjs.main('./a');
// 加载一个模块，在加载完成时，执行回调
rsjs.main('./a', function(a) {
  a.doSomething();
});
// 加载多个模块，在加载完成时，执行回调
rsjs.main(['./a', './b'], function(a, b) {
  a.doSomething();
  b.doSomething();
});
```
###require
require 用来获取指定模块的接口。
```js
  // 获取模块 a 的接口
  var a = require('./a');
  // 调用模块 a 的方法
  a.doSomething();
```
###require.async
用来在模块内部异步加载一个或多个模块。
```js
  // 异步加载一个模块，在加载完成时，执行回调
  require.async('./b', function(b) {
    b.doSomething();
  });
  // 异步加载多个模块，在加载完成时，执行回调
  require.async(['./c', './d'], function(c, d) {
    c.doSomething();
    d.doSomething();
  });
```
###exports
用来在模块内部对外提供接口。
```js
  // 对外提供 foo 属性
  exports.foo = 'bar';
  // 对外提供 doSomething 方法
  exports.doSomething = function() {};
```
###module.exports
与 exports 类似，用来在模块内部对外提供接口。
```js
// 对外提供接口
  module.exports = {
    name: 'a',
    doSomething: function() {};
  };
```






