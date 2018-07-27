__$__.PrimitiveValues = "";


__$__.editor.on('click', (e) => {
	const ast = esprima.parse(__$__.editor.getValue(), {loc: true});
	const range = getWordRangeFromClick(e);
	const obj = findNodeInAST(ast, range);
	const primitiveMap = findPrimitiveValues(obj);
	__$__.PrimitiveValues = mapToString(primitiveMap);
	__$__.nodes.update({title: __$__.PrimitiveValues})
});

function mapToString(map){
	let str = "";
	let bool = true;
	while(bool && map.size > 0){
		const item = map.keys().next();
		bool = item.done;
		if(bool){
			str += item.value + ": " + map.get(item.value);
		} else {
			str += item.value + ": " + map.get(item.value) + "\n";
		}
	}
	return str;
}


function findPrimitiveValues(obj) {
	const value = new Map();
	const identifiers = findVariablesInStatement(obj);
	const currentContext = __$__.Context.SnapshotContext;
	const varList = __$__.Context.PrimitiveValues[currentContext.cpID][currentContext.loopLabel][currentContext.count];
	for (let key of varList.keys()) {
		if (identifiers.includes(key)) value.set(key, varList.get(key));
	}
	return value;
}


function findVariablesInStatement(node) {
	switch (node.type) {
		case "ExpressionStatement":
			const exp = node.expression;
			if (exp.arguments) {
				return exp.arguments.map(x => x.name);
			} else if (exp.argument) {
				return exp.argument.name;
			}
			break;
		case "VariableDeclaration":
			const dec = node.declarations;
			return dec.map(x => x.id.name);
			break;
		default:
			return;
			break;
	}
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


/**
 * This function finds the node in the ast based on cursor position in the editor.
 * @param ast
 * @param range
 * @param info
 * @returns {{functionDeclarations: Array, node: Statement}}
 */
function findNodeInAST(ast, range, info = {sumDiff: Number.MAX_SAFE_INTEGER, node: null,}) {
	ast.body.forEach(statement => {
		const temp = calcRangeSumDiff(range, statement.loc);
		if ((temp.topline === 0 && temp.bottomline === 0) || temp < info.sumDiff) {
			info.sumDiff = temp.sum;
			info.node = statement;
		}
		if (statement.body) {
			findNodeInAST(statement.body, range, info);
		}
	});
	return info.node;
}

function calcRangeSumDiff(localRange, astRange) {
	const square = {
		topline: localRange.start.row - astRange.start.line,
		bottomline: localRange.end.row - astRange.end.line,
		leftCol: localRange.start.column - astRange.start.column,
		rightCol: localRange.end.column - astRange.end.column,
	};
	const sum = square.topline + square.bottomline + square.leftCol + square.rightCol;
	return {
		topline: square.topline,
		bottomline: square.bottomline,
		leftcol: square.leftCol,
		rightcol: square.rightCol,
		sum: sum,
	};
}