// Test of testing: to import one of the modules and access provided
// elements in tests.

// A module that imports CodeInstrumentation and its dependent modules.
import "./importer.js";

test('if this test file is loaded', () => {
    // just to observe if this test file is considered by jest.
    expect((1+1)).toBe(2);
});

test('if __$__ is accessible', () => {
    // ./importer.js imports ./global.js, which sets up global variables.
    // __$__ is the global variable in Kanon that accommodates almost
    // all module definitions.  The followings test whether __$__ exists
    // and it contains module CodeInstrumentation.
    expect(typeof __$__).toBe("object");
    expect(__$__).toHaveProperty("CodeInstrumentation");
});

test('if this test file can access a function in instrument', () => {
    // not only CodeInstrumentation (Kanon) module exists but also the
    // functions provided by the module should exist.
    expect(typeof __$__.CodeInstrumentation.instrument).toBe("function");
});

test('if CodeInstrumentation.instrument works', () => {
    // finally, this confirms instrument function runs without errors.
    expect(typeof __$__.CodeInstrumentation.instrument("1+1")).toBe("string");
});
