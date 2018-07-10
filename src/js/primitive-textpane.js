__$__.editor.on('click', (e) => {
	const ast = esprima.parse(__$__.editor.getValue(), {loc: true});
	const fds = getFunctionDeclarations(ast);
	const range = getWordRangeFromClick(e);
	const node = findNodeInAST(ast, range);
	evalNode(node, fds);

});


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

function getFunctionDeclarations(ast){
	let fds = [];
	ast.body.forEach(st => {
		if(st.type === "FunctionDeclaration") fds.push(st);
	});
	return fds;
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

function evalNode(node, fds){

}