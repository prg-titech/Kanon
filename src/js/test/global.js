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

// ACE editor mocks
globalThis.__$__.Range = (...args) => {};
globalThis.__$__.editor = {
    "session": { "getTextRange": (args) => {return "()";} }
};

globalThis.window = {};

// globalThis.ace = require("../../../node_modules/ace-builds/src/ace.js");
// The error below may be caused by using the wrong test environment, see https://jestjs.io/docs/configuration#testenvironment-string.
// Consider using the "jsdom" test environment.
// ReferenceError: window is not defined
