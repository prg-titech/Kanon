__$__.editor.on('click', (e) => {
	const ast = esprima.parse(__$__.editor.getValue(), {loc: true});
	const range = getWordRangeFromClick(e);
	const node = findNodeInAST(ast, range);
	getResult(node);

});


function getResult(node) {
	eval(__$__.Update.CodeWithCP);
	let fnName = node.expression.callee.name;
	let args = typeOfArgs(node.expression.arguments);
	console.log(eval(fnName)(...args));
}

function typeOfArgs(args){
	for(let i = 0; i < args.length; i++){
		args[i] = findPrimitiveValue(args[i]);
	}
	console.log(args);
	return args;
}


function findPrimitiveValue(arg) {
	if(arg.arguments && arg.arguments.length > 1) typeOfArgs(arg.arguments);
	switch(arg.type){
		// case "BinaryExpression":
		// 	arg = new Function(arg.left.name, arg.right.name, arg.left.name + arg.operator + arg.right.name);
		// 	break;
		case "ArrowFunctionExpression":
			eval(__$__.Update.CodeWithCP);
			arg = findPrimitiveValue(arg.body);
			break;
		case "CallExpression":
			eval(__$__.Update.CodeWithCP);
			arg = eval(arg.callee.name)(...arg.arguments.map(x => findPrimitiveValue(x)));
			break;
		case "Literal":
			arg = arg.value;
			break;
	}
	return arg;
}


/***
 * Returns the range of the word/identifier that has been clicked on.
 * @param e click event
 */
function getWordRangeFromClick(e) {
	const pos = e.getDocumentPosition();
	let start = __$__.editor.getSelection().getWordRange(pos).start;
	let end = __$__.editor.getSelection().getWordRange(pos).end;
	start.row += 1;
	end.row += 1;
	return {
		start: start,
		end: end,
	}
}

function findNodeInAST(ast, range) {
	let node;
	ast.body.forEach(statement => {
		if (statement.type === "ExpressionStatement") {
			const withinRange = isWithinRange(range, statement.loc);
			if (withinRange) node = statement;
		}
	});
	return node;
}

function isWithinRange(localRange, astRange) {
	const topline = astRange.start.line;
	const bottomline = astRange.end.line;
	return (localRange.start.row >= topline && localRange.end.row <= bottomline);
}