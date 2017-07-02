__$__.Traverse = {
    __Edge: function(from, to, label) {
        this.from = from;
        this.to = to;
        this.label = label;
    },

    __VariableNode: function(id) {
        this.id = id;
        __$__.Context.Objects['__Variable-' + id] = this;
    },

    __Literal: function(value) {
        this.value = value;
    },
    
    
    __Graph: function() {
        this.nodes = [];
        this.edges = [];
    },
    
    
    traverse: function(objs, variables = {}) {
        let ret = new __$__.Traverse.__Graph();

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
    
            if (ret.nodes.indexOf(obj) >= 0 || obj === null || obj === undefined)
                continue;
    
            __$__.Traverse.dfs(ret, obj);
        }
    
        Object.keys(variables).forEach(function(key) {
            let tempNode = new __$__.Traverse.__VariableNode(key);
            let index = ret.nodes.indexOf(variables[key]);
    
            if (index >= 0) {
                let tempEdge = new __$__.Traverse.__Edge(tempNode, ret.nodes[index], key);
    
                ret.nodes.push(tempNode);
                ret.edges.push(tempEdge);
            // } else {
            //     if (typeof variables[key] === 'function') {
            //         var fun_node = new __$__.Traverse.__Function(variables[key]);
            //         var tempEdge = new __$__.Traverse.__Edge(tempNode, fun_node, key);
            //         ret.nodes.push(fun_node);
            //         ret.nodes.push(tempNode);
            //         ret.edges.push(tempEdge);
            //     } else if (typeof variables[key] === 'number') {
            //         var num_node = new __$__.Traverse.__Literal(variables[key]);
            //         var tempEdge = new __$__.Traverse.__Edge(tempNode, num_node, key);
            //         ret.nodes.push(num_node);
            //         ret.nodes.push(tempNode);
            //         ret.edges.push(tempEdge);
            //     } else if (typeof variables[key] === 'string') {
            //         var str_node = new __$__.Traverse.__Literal(variables[key]);
            //         var tempEdge = new __$__.Traverse.__Edge(tempNode, str_node, key);
            //         ret.nodes.push(str_node);
            //         ret.nodes.push(tempNode);
            //         ret.edges.push(tempEdge);
            //     }
            }
        });
    
        for (let i = 0; i < ret.nodes.length; i++) {
            if (Object.values(__$__.Context.Objects).indexOf(ret.nodes[i]) > 0)
                continue;
    
            __$__.Traverse.CheckId(ret.nodes[i], ret.edges);
        }
    
    
        return ret;
    },
    
    dfs: function(graph, node) {
        let literals = ["boolean", "number", "string", "symbol"];
    
        if (graph.nodes.indexOf(node) === -1) {
            graph.nodes.push(node);
        } else {
            return;
        }
    
        Object.keys(node).forEach(key => {
            // Don't search if the head of property name is "__"
            if (key[0] === "_" && key[1] === "_")
                return;
    
            // "to" is destination of edge
            let to = node[key];
    
            if (!(typeof(to) === "function") && (to !== null && to !== undefined)) {
                if (literals.indexOf(typeof(to)) >= 0) { // if "to" is literal
                    let temp = new __$__.Traverse.__Literal(to);
    
                    graph.nodes.push(temp);
                    graph.edges.push(new __$__.Traverse.__Edge(node, temp, key));
                } else {
                    graph.edges.push(new __$__.Traverse.__Edge(node, to, key));
                    __$__.Traverse.dfs(graph, to);
                }
            }
        })
    },
    
    // check whether all of the nodes have an id or not
    // if there is a node don't have an id, set id
    CheckId: function(node, edges) {
        for (let i = 0; i < edges.length; i++) {
            if (node === edges[i].to) {
                if (Object.values(__$__.Context.Objects).indexOf(edges[i].from) === -1)
                    __$__.Traverse.CheckId(edges[i].from, edges);
    
                let newID = __$__.Context.getObjectID(edges[i].from) + '-' + edges[i].label;
                __$__.Context.Objects[newID] = node;
                return;
            }
        }
    }
};
