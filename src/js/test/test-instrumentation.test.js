import "./importer.js";

test('the jest ways of confirming an expected error', () => {
    var a_function = ()=>{
	throw(new Error("a message with a pattern inside"))
    };
    expect(a_function).toThrow(/a pattern/);
    expect(a_function).toThrow(Error);
});

test('if instrument takes code with a syntax error', () => {
    expect(() => {
	__$__.CodeInstrumentation.instrument("(")
    }).toThrow(/Unexpected end of input/);
});

const fs = require('node:fs');

test('to read a local file', () => {
    expect(typeof
	   fs.readFileSync('./examples/basics/AVL.js', 'utf8')
	  ).toBe("string")
});

function each_file_in(dir, f, predicate=(filename) => true) {
    // const fs = require('node:fs');
    // const folderPath = '/Users/joe';
    // fs.readdirSync(folderPath);

    // You can get the full path:
    // fs.readdirSync(folderPath).map(fileName => {
    //   return path.join(folderPath, fileName);
    // });
    const fs = require('node:fs');
    return fs.readdirSync(dir).filter(predicate).map((basename) => {
	f(//path.join(dir,basename)
	    dir +"/"+ basename
	)
    });
}
function each_js_file_in(dir, f) {
    return each_file_in(dir, f,
			(filename)=>filename.match(/\.js$/));
}

function each_test_program(f) {
    return each_js_file_in("examples/basics/",f) +
	each_js_file_in("examples/for_FIFA_layout/",f) +
	each_js_file_in("src/js/test/user-code/",f);
}
function each_test_program_text(f) {
    return each_test_program((filename) => {
	f(filename, fs.readFileSync(filename, 'utf8'));
    });
}

function do_instrument(text) {
    __$__.UpdateLabelPos.Initialize();
    __$__.CallTree.Initialize();
    return __$__.CodeInstrumentation.instrument(text);
}

function surpress_console_log(f) {
    let log = console.log;
    console.log = jest.fn();
    try{ return f(); }
    finally { console.log = log; }
}

function run_instrumented(text) {
    let __objs = [];
    let __loopLabels = ['main'];
    let checkpoint = (args) => {};
    surpress_console_log(() => {
	console.log = jest.fn();
	try {
	    return eval(text);
	} catch(e) {
	    throw new Error('eval(text) failed with ' + e +
			    " where text is:\n" + text);
	}
    });
}

each_test_program_text((filename, text) => {
    test('to evaluate original code of '+filename, () => {
	surpress_console_log(() => {eval(text); });
    });
    test('to instrument '+filename, () => {
	do_instrument(text);
    });
    test('to evaluate instrumented code of '+filename, () => {
	run_instrumented(do_instrument(text));
    });
});

function run_transformers(text) {
    let ast = esprima.parse(text, {loc: true});
    __$__.UpdateLabelPos.Initialize();
    __$__.CallTree.Initialize();
    return __$__.CodeInstrumentation.instrument_ast(ast);
}
function run_transformers_old(text) {
    let ast = esprima.parse(text, {loc: true});
    let tf = __$__.ASTTransforms;
    let visitors = [];
    visitors.push(tf.InsertCheckPoint());
    visitors.push(tf.ConvertCallExpression());
    visitors.push(tf.BlockedProgram());
    visitors.push(tf.AddSomeCodeInHead());
    visitors.push(tf.Context());
    // visitors.push(tf.ConvertCallExpression());
    visitors.push(tf.CollectObjects());

    __$__.ASTTransforms.varEnv = new __$__.Probe.StackEnv();

    __$__.walkAST(ast, null, visitors);
    return ast;
}

test('to transform code', () => {
    expect(run_transformers("1+1").type).toBe("Program");
});


let code = 'class C {} class D extends C { constructor() { super(); } } ';
test('to have class declarations', () => {
    let ast = run_transformers(code);
    expect(find_class(ast, "C")).toBeTruthy();
    expect(find_class(ast, "D")).toBeTruthy();
    expect(find_class(ast, "E")).toBeFalsy();
});

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

function is_method_decl(ast,name) {
    return ast !== null &&
	typeof ast == "object" &&
	ast.type == "MethodDefinition" &&
	(!name || (ast.key.type == "Identifier" &&
		   ast.key.name == name));
}
function is_constructor(ast) {
    return is_method_decl(ast, "constructor");
}

function is_class_decl(ast) {
    return ast !== null &&
	typeof ast == "object" &&
	ast.type == "ClassDeclaration";
}

function is_super_call_exp(ast) {
    return ast !== null &&
	typeof ast == "object" &&
	ast.type == "CallExpression" &&
	ast.callee.type == "Super";
}
function is_super_call_statement(ast) {
    return ast !== null &&
	typeof ast == "object" &&
	ast.type == "ExpressionStatement" &&
	is_super_call_exp(ast.expression);
}

function method_body_statement(ast) {
    if (is_method_decl(ast) &&
	ast.value.type == "FunctionExpression" &&
	ast.value.body.type == "BlockStatement") 
	return ast.value.body.body;
    else
	throw new Error("method does not have an expected shape: "+ast);
}

function find_class(ast, name) {
    return find_in(ast, (node)=>
	node !== null && typeof node == "object" &&
	    node.type == "ClassDeclaration" &&
	    node.id.type == "Identifier" &&
	    node.id.name == name);
}

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

test('to have a constructor', () => {
    let ast = esprima.parse('class C { constructor() {} }');
    expect(find_in(ast,is_constructor)).toBeTruthy();
});
test('to not have a constructor', () => {
    let ast = esprima.parse('class C { }');
    expect(find_in(ast,is_constructor)).toBe(false);
});

function valid_super_calls_in(text) {
    return valid_super_calls(esprima.parse(text));
}

test('valid-super-call when there is no constructor', () => {
    expect(valid_super_calls_in('class C { }')).toBeTruthy();
});
test('valid-super-call when there is an empty constructor', () => {
    expect(valid_super_calls_in('class C { constructor() { } }')).toBeTruthy();
});
test('valid-super-call when there is a constructor with super at first',
     () => {expect(valid_super_calls_in(
	 'class C { constructor() {super(); } }')).toBeTruthy();
});
test('invalid-super-call when super is not a statement',
     () => {expect(valid_super_calls_in(
	 'class C { constructor() {x=super(); } }')).toBeFalsy();
});
test('invalid-super-call when there is a constructor with two supers',
     () => {
	 expect(valid_super_calls_in(
	     'class C { constructor() {super();super();} }')).toBeFalsy();
	 expect(valid_super_calls_in(
	     'class C { constructor() {super();x=super();} }')).toBeFalsy();
     });
test('invalid-super-call when there is a statement before super',
     () => {expect(valid_super_calls_in(
	 'class C { constructor() {x=1;super();} }')).toBeFalsy();
});

function valid_super_calls_after_transformation(text) {
    return valid_super_calls(run_transformers(text));
}
function has_super_calls_after_transformation(text) {
    return has_super_calls(run_transformers(text));
}

test('transformation:valid-super-call when there is no constructor', () => {
    expect(valid_super_calls_after_transformation('class C { }')).toBeTruthy();
});
test('transformation:valid-super-call when there is an empty constructor', () => {
    expect(valid_super_calls_after_transformation('class C { constructor() { } }')).toBeTruthy();
    expect(has_super_call_after_transformation('class C { constructor() { } }')).toBeTruthy();
});
test('transformation:valid-super-call when there is a constructor with super at first',
     () => {
	 expect(valid_super_calls_after_transformation(
	     'class C { constructor() {super(); } }')).toBeTruthy();
	 expect(has_super_calls_after_transformation(
	     'class C { constructor() {super(); } }')).toBeTruthy();
});
test('transformation:invalid-super-call when super is not a statement',
     () => {expect(valid_super_calls_after_transformation(
	 'class C { constructor() {x=super(); } }')).toBeFalsy();
});
test('transformation:invalid-super-call when there is a constructor with two supers',
     () => {
	 expect(valid_super_calls_after_transformation(
	     'class C { constructor() {super();super();} }')).toBeFalsy();
	 expect(valid_super_calls_after_transformation(
	     'class C { constructor() {super();x=super();} }')).toBeFalsy();
     });
test('transformation:invalid-super-call when there is a statement before super',
     () => {expect(valid_super_calls_after_transformation(
	 'class C { constructor() {x=1;super();} }')).toBeFalsy();
});
