// Test of testing: to import one of the modules and access provided
// elements in tests.

// A module that imports CodeInstrumentation and its dependent modules.
import "./importer.js";

// import the instrumentation module
test('if this test file is loaded', () => {
    expect((1+1)).toBe(2);
});


test('if __$__ is accessible', () => {
    expect(typeof __$__).toBe("object");
    expect(__$__).toHaveProperty("CodeInstrumentation");
});

test('if this test file can access a function in instrument', () => {
    expect(typeof __$__.CodeInstrumentation.instrument).toBe("function");
});

test('if CodeInstrumentation.instrument works', () => {
    expect(typeof __$__.CodeInstrumentation.instrument("1+1")).toBe("string");
});
