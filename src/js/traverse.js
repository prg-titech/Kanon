class __Edge {
    constructor(from, to, label) {
        this.from = from;
        this.to = to;
        this.label = label;
    }
};

class __VariableNode {
    constructor(id) {
        this.id = id;
        this.__id = 'Variable-' + id;
    }
};

class __Literal {
    constructor(value) {
        this.value = value;
    }
};

class __Graph {
    constructor() {
        this.nodes = []; // Array of Object
        this.edges = []; // Array of __Edge
    }
};

var traverse = function(objs, variables = {}) {
    var ret = new __Graph();

    for (var i = 0; i < objs.length; i++) {
        var obj = objs[i];
        if (ret.nodes.indexOf(obj) >= 0 || obj === null || obj === undefined) continue;

        dfs(ret, obj);
    }

    Object.keys(variables).forEach(function(key) {
        var obj = variables[key];
        if (ret.nodes.indexOf(obj) >= 0 || obj === null || obj === undefined) return;

        dfs(ret, obj);
    })

    for (var i = 0; i < ret.nodes.length; i++) {
        if (ret.nodes[i].__id) continue;
        checkId(ret.nodes[i], ret.edges);
    }

    Object.keys(variables).forEach(function(key) {
        var tempNode = new __VariableNode(key);

        var index = ret.nodes.indexOf(variables[key]);
        if (index >= 0) {
            var tempEdge = new __Edge(tempNode, ret.nodes[index], key);
            ret.nodes.push(tempNode);
            ret.edges.push(tempEdge);
        }
    });

    return ret;
};

var dfs = function(graph, node) {
    var literals = ["boolean", "number", "string", "symbol"];
    if (graph.nodes.indexOf(node) == -1) {
        graph.nodes.push(node);
    } else {
        return;
    }

    for (var key in node) {
        // Don't search if the head of property name is "__"
        if (key[0] == "_" && key[1] == "_") continue;

        // "to" is destination of edge
        var to = node[key];

        if (!(typeof(to) == "function") && (to !== null && to !== undefined)) {
            if (literals.indexOf(typeof(to)) >= 0) { // if "to" is literal
                var temp = new __Literal(to);
                graph.nodes.push(temp);
                graph.edges.push(new __Edge(node, temp, key));
            } else {
                graph.edges.push(new __Edge(node, to, key));
                dfs(graph, to);
            }
        }
    }
};

// check whether all of the nodes have an id or not
// if there is a node don't have an id, set id
var checkId = function(node, edges) {
    for (var i = 0; i < edges.length; i++) {
        if (node == edges[i].to) {
            if (!edges[i].from.__id) checkId(edges[i].from, edges);

            node.__id = edges[i].from.__id + "-" + edges[i].label;
            return;
        }
    }
}
