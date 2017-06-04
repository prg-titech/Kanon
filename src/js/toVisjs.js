__$__.ToVisjs = {
    Translator: function(graph) {
        // initialize
        __$__.Context.Arrays = [];
        __$__.Context.Literals = [];
        var retData = {nodes: [], edges: []};

        for (var i = 0; i < graph.nodes.length; i++) {
            var node;

            if (graph.nodes[i] instanceof __$__.Traverse.__Literal) {
                node = {
                    color: 'white',
                    id: __$__.Context.getObjectID(graph.nodes[i]),
                    label: "" + graph.nodes[i].value
                };

                retData.nodes.push(node);
                __$__.Context.Literals.push(node.id);
            } else if (graph.nodes[i] instanceof __$__.Traverse.__VariableNode) {
                node = {
                    hidden: true,
                    id: __$__.Context.getObjectID(graph.nodes[i]),
                    label: graph.nodes[i].id,
                    physics: true
                };

                retData.nodes.push(node);
            } else if (graph.nodes[i].constructor === [].constructor) {
                let arrayLabels = [];
                for (let j = 0; j < graph.nodes[i].length; j++) {
                    node = {
                        borderWidthSelected: 1,
                        color: {
                            border: 'black',
                            highlight: {
                                border: 'black'
                            }
                        },
                        id: __$__.Context.getObjectID(graph.nodes[i]) + '_' + j,
                        physics: false,
                        shape: 'square',
                        size: 10
                    };
                    arrayLabels.push(node.id);

                    retData.nodes.push(node);
                }
                __$__.Context.Arrays.push(arrayLabels)
            } else {
                node = {};

                node.label = graph.nodes[i].constructor.name;
                node.id = __$__.Context.getObjectID(graph.nodes[i]);

                retData.nodes.push(node);
            }
        }

        for (var i = 0; i < graph.edges.length; i++) {
            let edge = {};

            edge.from = __$__.Context.getObjectID(graph.edges[i].from);
            if (graph.edges[i].from.constructor === [].constructor)
                edge.from += '_' + graph.edges[i].label;

            edge.to = __$__.Context.getObjectID(graph.edges[i].to);
            if (graph.edges[i].to.constructor === [].constructor) 
                edge.to += '_0';

            edge.label = graph.edges[i].label;

            if (graph.edges[i].from instanceof __$__.Traverse.__VariableNode) {
                edge.color = 'seagreen';
                edge.length = 30;
            }

            retData.edges.push(edge);
        }

        return retData;
    }
};
