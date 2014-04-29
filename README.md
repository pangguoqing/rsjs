前端模块加载器
===
##示例
<https://github.com/pangguoqing/rs-examples/tree/master>

##原理
<https://github.com/pangguoqing/rsjs/wiki/rsjs%E5%AE%9E%E7%8E%B0%E5%8F%8A%E5%8E%9F%E7%90%86>

##配置
如果请求的是跨域资源(比如从cdn服务器请求资源)，那么需要在静态服务器上进行一定的配置。详情，请参见`wiki`。
在http header中添加 `Access-Control-Allow-Origin:*`
在静态域名根目录下添加 `crossdomain.xml`

注:这个配置并不是必须的，打包工具生成的目标文件，可以直接通过script标签引用。

##大概了解
1.更加贴合nodejs中模块的编写方式，无需`define`包裹。

2.任何后缀的文本文件都可以被认为是一个模块。可以是.js,.json,.css,.text等，如果没有后缀，默认为.js。

3.api更简单，去除了define，调整了入口函数。

4.所有模块都可以被打包在一个文件里面。（官方提供了专门的grunt脚本）

5.兼容seajs定义的模块（并不推荐在rsjs里使用seajs定义的模块，考虑到seajs用户众多，方便大家调试）。

##缺陷
1.目前不支持离线开发

2.ie浏览器调试开发支持不够

欢迎踊跃参与讨论，完善rsjs，参见`wiki`

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






