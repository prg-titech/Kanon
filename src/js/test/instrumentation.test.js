// tests for src/js/code-instrumentation/

import "./importer.js";

const fs = require('node:fs');
//////////////////////////////////////////////////////////////////////
// helper functions

// for each file n in DIR, when PREDICATE(n) holds, apply n to F
function map_pathnames_in(dir, f, predicate=(filename) => true) {
    const fs = require('node:fs');
    return fs.readdirSync(dir).filter(predicate).map((basename) => {
	f(//path.join(dir,basename)
	    dir +"/"+ basename
	)
    });
}

// for each JavaScript file n in DIR, apply n to F.
function map_js_pathnames_in(dir, f) {
    return map_pathnames_in(dir, f,
			(filename)=>filename.match(/\.js$/));
}

// call function f with suppressing console output
function suppress_console_log(f) {
    let log = console.log;
    console.log = jest.fn();
    try{ return f(); }
    finally { console.log = log; }
}

//////////////////////////////////////////////////////////////////////
// helper function for Kanon

// for each example program of Kanon, apply the file name to F
function map_on_example_program_pathnames(f) {
    return map_js_pathnames_in("examples/basics/",f) +
	map_js_pathnames_in("examples/for_FIFA_layout/",f) +
	map_js_pathnames_in("src/js/test/user-code/",f);
}

// map on all example program texts of Kanon
function map_on_example_program_text(f) {
    return map_on_example_program_pathnames((filename) => {
	f(filename, fs.readFileSync(filename, 'utf8'));
    });
}

// apply a program text to all or selected transformers and returns an AST
function run_transformers(text, factories=true) {
    let ast = esprima.parse(text, {loc: true});
    __$__.UpdateLabelPos.Initialize();
    __$__.CallTree.Initialize();
    return __$__.CodeInstrumentation.instrument_ast(ast,factories);
}

// apply a program text to the instrument module and returns text
function do_instrument(text, factories=true) {
    return escodegen.generate(run_transformers(text,factories));
}

// eval the given JS program text without console output
function run_instrumented(text, postfix="") {
    let __objs = [];
    let __loopLabels = ['main'];
    let checkpoint = (args) => {};
    return suppress_console_log(() => {
	try {
	    return {result: eval(text+postfix),
		    __objs: __objs,
		    __loopLabels: __loopLabels};
	} catch(e) {
	    throw new Error('eval(text) failed with ' + e
			    // + " where text is:\n" + text
			   );
	}
    });
}

// eval the given JS program text, and check if the objects created in
// the 
function run_instrumented_check_object_id(text) {
    let objects = run_instrumented(text).__objs;
    return objects.length > 0 &&
	objects.every(obj =>
	    obj instanceof Object &&
		Object.hasOwn(obj, "__id") &&
		(typeof obj.__id === "string" ||
		 obj.__id instanceof String));
}

// apply a program text only the InsertCheckPoint transformer
function run_insertCheckPoint(text) {
    return run_transformers(text, [__$__.ASTTransforms.InsertCheckPoint]);
}

//////////////////////////////////////////////////////////////////////
// helper function on AST

// return the first element in AST that satisfies F
function find_in(ast, f) {
    for(var key in ast) {
	let v = ast[key];
	let a = f(v);
	if(a) return v;
	if (v !== null && typeof(v) == "object") {
	    let a = find_in(v, f);
	    if (a) return a;
	}
    }
    return false;
}

// determine whether all elements in AST satisfies F
function all(ast, f) {
    for(var key in ast) {
	let v = ast[key];
	let a = f(v);
	if(!a) return false;
	if (v !== null && typeof(v) == "object") {
	    let a = all(v, f);
	    if (!a) return false;
	}
    }
    return true;
}

// determine if AST is an AST node
function is_ast_node(ast) {
    return ast !== null && typeof ast == "object";
}

// determine if AST is a method declaration of the given NAME; i.e.,
// AST == NAME(...) { ... }.
function is_method_decl(ast,name) {
    return is_ast_node(ast) &&
	ast.type == "MethodDefinition" &&
	(!name || (ast.key.type == "Identifier" &&
		   ast.key.name == name));
}

// determine if AST is a constructor declaration; i.e.,
// AST == constructor(...) { ... }
function is_constructor(ast) { return is_method_decl(ast, "constructor"); }

// determine if AST is a class declaration; i.e.,
// AST == class NAME ... { ... }
function is_class_decl(ast,name=null) {
    return is_ast_node(ast) &&
	ast.type === "ClassDeclaration" &&
	(name===null ||
	 (ast.id.type === "Identifier" &&
	  ast.id.name === name));
}

// determine if AST is a super call _expression_; i.e.,
// AST == super(...)
function is_super_call_exp(ast) {
    return is_ast_node(ast) &&
	ast.type == "CallExpression" &&
	ast.callee.type == "Super";
}

// determine if AST is a statement that calls super; i.e.,
// AST == super(...);  (the last semicolon matters)
function is_super_call_statement(ast) {
    return is_ast_node(ast) &&
	ast.type == "ExpressionStatement" &&
	is_super_call_exp(ast.expression);
}

// determine if AST is the immediate body block of a method/function; i.e.,
// AST == NAME(...) [[ {...} ]] 
function method_body_statement(ast) {
    if (is_method_decl(ast) &&
	ast.value.type == "FunctionExpression" &&
	ast.value.body.type == "BlockStatement") 
	return ast.value.body.body;
    else
	throw new Error("method does not have an expected shape: "+ast);
}

// find a class declaration of NAME in the given AST
function find_class(ast, name) {
    return find_in(ast, (node)=> is_class_decl(node,name));
}

// for any super call in a constructor in AST, it appears at the beginning
function valid_super_calls(ast) {
    // for all class declaration CDECL
    return all(ast, cdecl =>	
	(!is_class_decl(cdecl)) ||
	    // for all constructor declaration MDECL in CDECL
	all(cdecl, (mdecl) =>  
	    (!is_method_decl(mdecl, "constructor")) ||
		(() => {
		    let [first,...rest] = method_body_statement(mdecl);
		            // the first statement is a super call or 
		    return (is_super_call_statement(first) ||
			    // anything but no super call expressions
			    all(first, (exp) => !is_super_call_exp(exp))) &&
			   // and the rest statements have no super call exps
		           all(rest, (exp) => !is_super_call_exp(exp));
		})()));
}

// for any constructor in AST, it has a super call at the beginning
function has_super_calls(ast) {
    // for all class declaration CDECL
    return all(ast, cdecl =>	
	(!is_class_decl(cdecl)) ||
	    // for all constructor declaration MDECL in CDECL
	all(cdecl, (mdecl) =>  
	    (!is_method_decl(mdecl, "constructor")) ||
		(() => {
		    let [first,...rest] = method_body_statement(mdecl);
		            // the first statement is a super call or 
		    return (is_super_call_statement(first));
		})()));
}

function valid_super_calls_in(text) {
    return valid_super_calls(esprima.parse(text));
}

function valid_super_calls_after_transformation(text,factories=true) {
    return valid_super_calls(run_transformers(text,factories));
}
function has_super_calls_after_transformation(text,factories=true) {
    return has_super_calls(run_transformers(text,factories));
}
function convartable_to_string_after_transformation(text,factories=true) {
    return escodegen.generate(run_transformers(text,factories));
}

//////////////////////////////////////////////////////////////////////
// tests

describe('the jest way',() => {
    test('confirming an expected error', () => {
	var a_function = ()=>{
	    throw(new Error("a message with a pattern inside"))
	};
	expect(a_function).toThrow(/a pattern/);
	expect(a_function).toThrow(Error);
    });
    
    test('reading a local file', () => {
	expect(typeof fs.readFileSync('./examples/basics/AVL.js', 'utf8')).
	    toBe("string")
    });
});

describe('instrument',() => {
    test('raising a syntax error for an erronous program', () => {
	expect(() => {
	    __$__.CodeInstrumentation.instrument("(")
	}).toThrow(/Unexpected end of input/);
    });
});


describe('for all examples', () => {
    map_on_example_program_text((filename, text) => {
	test('original ' + filename + ' runs without an error', () => {
	    suppress_console_log(() => {eval(text); });
	});
	test('instrumented '+filename+ ' runs without an error', () => {
	    run_instrumented(do_instrument(text));
	});
	test('instrumented '+filename+ ' creates objects with ID', () => {
	    expect(run_instrumented_check_object_id(
		do_instrument(text))).toBeTruthy();
	});
    });
});


describe('basic transformers properties', () => {
    test('processes a simple expression', () => {
	expect(run_transformers("1+1").type).toBe("Program");
    });
    test('preserves classes', () => {
	let ast = run_transformers(
	    'class C {} class D extends C { constructor() { super(); } } ');
	expect(find_class(ast, "C")).toBeTruthy();
	expect(find_class(ast, "D")).toBeTruthy();
	expect(find_class(ast, "E")).toBeFalsy();
    });
});

// we consider classes with/without constructors,
// constructors with/without super calls, and
// super calls appearing valid/invalid positions.
let simple_classes = [
    {src: 'class C { }',
     valid: true, has_constructor: false, has_super: false},
    {src: 'class C { constructor() { } }',
     valid: true, has_constructor: true, has_super: false},
    {src: 'class C { constructor() {super(); } }',
     valid: true, has_constructor: true, has_super: true},
    {src: 'class C { constructor() {super(); this.x=0;} }',
     valid: true, has_constructor: true, has_super: true},
    {src: 'class C { constructor() {x=super(); } }',
     valid: false, has_constructor: true, has_super: true},
    {src: 'class C { constructor() {x=1;super();} }',
     valid: false, constructor: true, has_super: true},
    {src: 
    `class Node {
    constructor(val) {
        this.val = val;
        this.right = null;
        this.left = null;
    }}`, valid: true, constructor: true, has_super: false}
];

describe('AST helper functions',()=>{

    test('is_constructor finds a constructor', () => {
	let astWithConst = esprima.parse('class C { constructor() {} }');
	expect(find_in(astWithConst,is_constructor)).toBeTruthy();
	let astWithoutConst = esprima.parse('class C { }');
	expect(find_in(astWithoutConst,is_constructor)).toBe(false);
    });

    describe('valid_super_calls with original ASTs',()=>{
	for(const {src:src, valid:valid} of simple_classes){
	    test(src+ " is " +(valid?"valid":"invalid"), () =>{
		if(valid) expect(valid_super_calls_in(src)).toBeTruthy();
		else      expect(valid_super_calls_in(src)).toBeFalsy();
	    });
	}
    });
});

let transformer_sets = {
    none: false,
    all: true,
    insertCheckPoint:      [__$__.ASTTransforms.InsertCheckPoint],
    ConvertCallExpression: [__$__.ASTTransforms.ConvertCallExpression],
    BlockedProgram:        [__$__.ASTTransforms.BlockedProgram],
    AddSomeCodeInHead:     [__$__.ASTTransforms.AddSomeCodeInHead],
    Context:               [__$__.ASTTransforms.Context],
};

// These tests are to inspect transformation result by your own eyes.
// They are turned off because they are too noisy. Remove 'x' in
// xdescribe below when they are used.
xdescribe('print transformed', () =>{
    test('in text',()=>{
	console.log(do_instrument("class C { constructor() { super(); } }",
				  transformer_sets.all));
    });
    test('in AST', ()=>{
	console.log(JSON.stringify(run_transformers(
	    "class C { constructor() {} }",
	    transformer_sets.insertCheckPoint), null, 2));
    });
});

describe('transformations', () => {
    for(const [name, set] of Object.entries(transformer_sets)) {
	describe(name,()=>{
	    for(const{src:src, valid:valid, has_constructor:has_constructor,
		      has_super:has_super} of simple_classes) {
		if(valid) {
		    test(src+ " is still valid", () =>{
			expect(
			    valid_super_calls_after_transformation(src,set)).
			    toBeTruthy();
		    });
		    test(src+ " is convartable to string", () =>{
			expect(
			    convartable_to_string_after_transformation(src,set)).
			    toBeTruthy();
		    });
		}
		if(valid && has_constructor)
		    test(src+ " keeps super call", () =>{
			expect(
			    has_super_calls_after_transformation(src,set)).
			    toBe(has_super);
		    });
	    }
	});
    }
});

