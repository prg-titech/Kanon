__$__.Traverse = {};

__$__.Traverse.__Edge = function(from, to, label) {
    this.from = from;
    this.to = to;
    this.label = label;
};


__$__.Traverse.__VariableNode = function(id) {
    this.id = id;
    this.__id = '__Variable-' + id;
};


__$__.Traverse.__Literal = function(value) {
    this.value = value;
};


__$__.Traverse.__Graph = function() {
    this.nodes = [];
    this.edges = [];
};


__$__.Traverse.traverse = function(objs, variables = {}) {
    var ret = new __$__.Traverse.__Graph();

    for (var i = 0; i < objs.length; i++) {
        var obj = objs[i];

        if (ret.nodes.indexOf(obj) >= 0 || obj === null || obj === undefined)
            continue;

        __$__.Traverse.dfs(ret, obj);
    }

    Object.keys(variables).forEach(function(key) {
        var obj = variables[key];

        if (ret.nodes.indexOf(obj) >= 0 || obj === null || obj === undefined)
            return;

        __$__.Traverse.dfs(ret, obj);
    });

    for (var i = 0; i < ret.nodes.length; i++) {
        if (ret.nodes[i].__id)
            continue;

        __$__.Traverse.CheckId(ret.nodes[i], ret.edges);
    }

    Object.keys(variables).forEach(function(key) {
        var tempNode = new __$__.Traverse.__VariableNode(key);
        var index = ret.nodes.indexOf(variables[key]);

        if (index >= 0) {
            var tempEdge = new __$__.Traverse.__Edge(tempNode, ret.nodes[index], key);

            ret.nodes.push(tempNode);
            ret.edges.push(tempEdge);
        }
    });


    return ret;
};

__$__.Traverse.dfs = function(graph, node) {
    var literals = ["boolean", "number", "string", "symbol"];

    if (graph.nodes.indexOf(node) == -1) {
        graph.nodes.push(node);
    } else {
        return;
    }

    for (var key in node) {
        // Don't search if the head of property name is "__"
        if (key[0] == "_" && key[1] == "_")
            continue;

        // "to" is destination of edge
        var to = node[key];

        if (!(typeof(to) == "function") && (to !== null && to !== undefined)) {
            if (literals.indexOf(typeof(to)) >= 0) { // if "to" is literal
                var temp = new __$__.Traverse.__Literal(to);

                graph.nodes.push(temp);
                graph.edges.push(new __$__.Traverse.__Edge(node, temp, key));
            } else {
                graph.edges.push(new __$__.Traverse.__Edge(node, to, key));
                __$__.Traverse.dfs(graph, to);
            }
        }
    }
};

// check whether all of the nodes have an id or not
// if there is a node don't have an id, set id
__$__.Traverse.CheckId = function(node, edges) {
    for (var i = 0; i < edges.length; i++) {
        if (node == edges[i].to) {
            if (!edges[i].from.__id)
                __$__.Traverse.CheckId(edges[i].from, edges);

            node.__id = edges[i].from.__id + "-" + edges[i].label;
            return;
        }
    }
};
