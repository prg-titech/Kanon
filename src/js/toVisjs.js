__$__.ToVisjs = {};

__$__.ToVisjs.Translator = function(graph) {
    var retData = {nodes: [], edges: []};

    for (var i = 0; i < graph.edges.length; i++) {
        var edge = {};

        edge.from = graph.edges[i].from;
        edge.to = graph.edges[i].to;
        edge.label = graph.edges[i].label;
        retData.edges.push(edge);
    }

    for (var i = 0; i < graph.nodes.length; i++) {
        var node = {};

        if (graph.nodes[i] instanceof __$__.Traverse.__Literal) {
            node.label = "" + graph.nodes[i].value;
            node.color = 'white';
        } else if (graph.nodes[i] instanceof __$__.Traverse.__VariableNode) {
            node.label = graph.nodes[i].id;
            node.physics = true;
            node.hidden = true;
        } else {
            node.label = graph.nodes[i].constructor.name;
        }

        node.id = graph.nodes[i].__id;
        retData.nodes.push(node);
        for (var j = 0; j < retData.edges.length; j++) {
            if (retData.edges[j].from == graph.nodes[i]) {
                retData.edges[j].from = node.id;
                if (graph.nodes[i] instanceof __$__.Traverse.__VariableNode) {
                    retData.edges[j].color = 'seagreen';
                }
            }
            if (retData.edges[j].to == graph.nodes[i])
                retData.edges[j].to = node.id;
        }
    }

    return retData;
}
