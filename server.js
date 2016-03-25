/** Only ES5 is allowed in this file! **/

// setup babel
require("babel-register")({
  extensions: [".es6", ".es", ".jsx", ".js"]
});
require("babel-polyfill");

// load your app
require("./app");
