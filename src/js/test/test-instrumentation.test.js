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

function run_instrumented(text) {
    let __objs = [];
    let __loopLabels = ['main'];
    let checkpoint = (args) => {};
    console.log = jest.fn();
    try {
	return eval(text);
    } catch(e) {
	throw new Error('eval(text) failed with ' + e + " where text is:\n" +
			text);
    }
}

each_test_program_text((filename, text) => {
    test('to evaluate original code of '+filename, () => {
	console.log = jest.fn();
	eval(text);
    });
    test('to instrument '+filename, () => {
	do_instrument(text);
    });
    test('to evaluate instrumented code of '+filename, () => {
	run_instrumented(do_instrument(text));
    });
});
