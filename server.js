/** Only ES5 is allowed in this file! **/

// setup babel
require("babel/register")({ // will become "babel-core/register" in babel >= 6.0.0
  extensions: [".es6", ".es", ".jsx", ".js"]
});
require("babel/polyfill"); // will become "babel-poyfill" in babel >= 6.0.0

// load your app
require("./app");
