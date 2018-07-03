const ast = esprima.parse(__$__.editor.getValue());

const graph = {
	nodes: [],
	edges: [],
};

let callToDeclaration = new Map();

let functionDeclarations = [];

let expressionStatements = [];

ast.body.forEach(statement => {
	switch(statement.type){
		case "FunctionDeclaration":
			functionDeclarations.push(statement);
			break;
		case "ExpressionStatement":
			expressionStatements.push(statement);
			break;
	}
});

expressionStatements.forEach(exp => {
	functionDeclarations.forEach(func => {
		if(exp.expression.callee.name === func.id.name){
			callToDeclaration.set(exp, func);
		}
	})
});

callToDeclaration.forEach(exp => {
	let argNodes = exp.expression.arguments.map(arg => arg.value);
	let func = callToDeclaration.get(exp);
	let funcParams = func.params.map(param => param.name);
	let funcNode = func.id.name + "()";
	graph.nodes.push(argNodes, funcNode);
	for(let i = 0; i < funcParams.length; i++){
		let edge = {
			from: argNodes[i],
			to: funcNode,
			label: funcParams[i],
		};
		graph.edges.push(edge);
	}
});



const drawn =__$__.ToVisjs.Translator(graph);







