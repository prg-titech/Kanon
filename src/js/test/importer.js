// import all modules in a proper order.

// The next module creates global variables, which are accessed by the
// subsequently imported modules.  
import "./global.js";

// Though the order of the import declarations is usually not
// important, it can matter when the top-level statements in
// each module have side-effects.  In that case, it would be
// safe to follow the order in ../../import.js.
import "../code-instrumentation/ast-transforms.js";
import "../probe.js";
import "../context.js";
import "../updateLabelPos.js";
import "../code-instrumentation/ast-walker.js";
import "../code-instrumentation/instrument.js";
import "../code-instrumentation/ast-builder.js";
