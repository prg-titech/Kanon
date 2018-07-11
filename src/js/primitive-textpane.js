__$__.editor.on('click', (e) => {
	const ast = esprima.parse(__$__.editor.getValue(), {loc: true});
	const range = getWordRangeFromClick(e);
	const node = findNodeInAST(ast, range);
	const fd = getFunctionDeclaration(ast, node);
	// console.log(node);
	getResult(node, fd);

});


function getResult(node, fd) {
	eval(__$__.Update.CodeWithCP);
	let fnName = fd.id.name;
	let args = node.expression.arguments.map(x => x.value);
	console.log(add(...args));
	// console.log(window[fnName](...args)); //TODO Instead of manually adding add, it needs to use the function name to call the method.

}



function getFunctionDeclaration(ast, node) {
	let fds = [];
	ast.body.forEach(st => {
		if (st.type === "FunctionDeclaration") {
			fds.push(st);
		}
	});

	let finalFd;

	fds.forEach(fd => {
		if (node.expression.callee.name === fd.id.name) {
			finalFd = fd;
		}
	});

	return finalFd;
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