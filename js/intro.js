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