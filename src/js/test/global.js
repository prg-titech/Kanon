// installs global variables.

// With ES Modules, globalThis.x = ... in an imported module creates a
// global variable.  That variable can be accessed from the modules
// that are imported afterwards.
//
// ---global.js
// globalThis.x = 123;
// ---some.js
// print(x); // prints 123
// ---main.js
// import "global.js";
// import "some.js";
// ---

globalThis.__$__ = {};
globalThis.esprima = require("esprima");
globalThis.escodegen = require("escodegen");
