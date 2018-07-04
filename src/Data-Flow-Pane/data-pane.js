const ast = esprima.parse(__$__.editor.getValue());
const vis = require("vis");
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

function createNodeDataSet(set){
	let nodeDataSet = [];
	for(let i = 0; i < set.length; i++){
		nodeDataSet.push({id: i, label: set[i]});
	}
	return new vis.DataSet(nodeDataSet);
}



callToDeclaration.forEach(exp => {
	let args = exp.expression.arguments.map(arg => arg.value);
	let func = callToDeclaration.get(exp).id.name + "()";
	graph.nodes.push(createNodeDataSet(args.concat(func)));

	let funcParams = func.params.map(param => param.name);
	for(let i = 0; i < funcParams.length; i++){
		let edge = {
			from: argNodes[i],
			to: funcNode,
			label: funcParams[i],
		};
		graph.edges.push(edge);
	}
});

graph.nodes = new vis.DataSet(graph.nodes);
graph.edges = new vis.DataSet(graph.edges);


const options = {};
const container = document.getElementById('callTree');
const network = new vis.Network(container, graph, options);









