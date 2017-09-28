__$__.Traverse = {
    __Edge: function(from, to, label) {
        this.from = from;
        this.to = to;
        this.label = label;
    },

    __VariableNode: function(id) {
        this.label = id;
        Object.setProperty(this, '__id', '__Variable-' + id);
    },

    __Literal: function(value) {
        this.value = value;
    },
    
    
    __Graph: function() {
        this.nodes = [];
        this.edges = [];
    },

    literals: {
        boolean: true,
        number: true,
        string: true,
        symbol: true
    },
    
    
    traverse: function(objs, variables = {}) {
        let ret = new __$__.Traverse.__Graph();
        let graphNodes = {};

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
    
            if (graphNodes[obj.__id] || obj === null || obj === undefined)
                continue;
    
            __$__.Traverse.dfs(ret, obj, graphNodes, objs);
        }

        Object.keys(variables).forEach(key => {
            if (variables[key] && graphNodes[variables[key].__id]) {
                let tempNode = new __$__.Traverse.__VariableNode(key);
                let tempEdge = new __$__.Traverse.__Edge(tempNode, graphNodes[variables[key].__id], key);

                ret.nodes.push(tempNode);
                ret.edges.push(tempEdge);
            }
        });
    
        for (let i = 0; i < ret.nodes.length; i++) {
            if (ret.nodes[i].__id)
                continue;

            __$__.Traverse.CheckId(ret.nodes[i], ret.edges);
        }


        return ret;
    },
    
    dfs: function(graph, node, graphNodes, objs) {
        if (!graphNodes[node.__id]) {
            graph.nodes.push(node);
            graphNodes[node.__id] = node;
        } else {
            return;
        }
    
        Object.keys(node).forEach(key => {
            // Don't search if the head of property name is "__"
            if (key[0] === "_" && key[1] === "_")
                return;
    
            // "to" is destination of edge
            let to = node[key];
    
            if (typeof to !== "function" && to !== null && to !== undefined) {
                if (__$__.Traverse.literals[typeof to]) { // if "to" is literal
                    let temp = new __$__.Traverse.__Literal(to);
    
                    graph.nodes.push(temp);
                    graph.edges.push(new __$__.Traverse.__Edge(node, temp, key));
                } else {
                    graph.edges.push(new __$__.Traverse.__Edge(node, to, key));
                    if (objs.indexOf(to) === -1)
                        __$__.Traverse.dfs(graph, to, graphNodes, objs);
                }
            }
        });
    },
    
    // check whether all of the nodes have an id or not
    // if there is a node don't have an id, set id
    CheckId: function(node, edges) {
        for (let i = 0; i < edges.length; i++) {
            if (node === edges[i].to) {
                if (!edges[i].from.__id)
                    __$__.Traverse.CheckId(edges[i].from, edges);
    
                let newID = __$__.Context.getObjectID(edges[i].from) + '-' + edges[i].label;
                Object.setProperty(node, '__id', newID);
                return;
            }
        }
    }
};
