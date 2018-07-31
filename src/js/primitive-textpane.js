__$__.PrimitiveValues = "";


function primitiveTextPane() {
	const ast = esprima.parse(__$__.editor.getValue(), {loc: true});
	const range = getWordRangeFromClick();
	const obj = findNodeInAST(ast, range);
	__$__.PrimitiveValues = findPrimitiveValues(obj);
	const primitiveString = mapToString(__$__.PrimitiveValues);
	const toNode = findGreenArrow();
	addPrimitiveToGraph(primitiveString, toNode);

}

__$__.PrimitiveTextPane = primitiveTextPane;

function addPrimitiveToGraph(primitive, toNode) {
	// get last id
	const ids = __$__.nodes.getIds();
	const lastId = (toNode) ? toNode : ids[ids.length - 1];
	const nodeId = "primitive-val";

	__$__.nodes.add({
		id: nodeId,
		label: primitive,
		shape: "box",
	});
	__$__.edges.add({
		from: lastId,
		to: nodeId,
		arrows: {
			to: false,
		},
	})
}

function mapToString(map) {
	let str = "";
	for(let key of map.keys()){
		if(typeof map.get(key) === "object"){
			str += key + " = " + "Object" + "\n";
		} else {
			str += key + " = " + map.get(key) + "\n";
		}
	}
	return str;
}

function findGreenArrow(){
	const currentContext = __$__.Context.SnapshotContext;
	const graph = __$__.Context.StoredGraph[currentContext.cpID][currentContext.loopLabel][currentContext.count];
	// seagreen indicates current important node
	const edge = graph.edges.find(x => x.color === "seagreen");
	const node = (edge) ? graph.nodes.find(x => x.id === edge.to) : undefined;
	return (node) ? node.id : undefined;
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
				if (exp.callee) return exp.arguments.map(x => x.name).concat(exp.callee.object.name);
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
 */
function getWordRangeFromClick(event) {
	const pos = __$__.editor.getCursorPosition();
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