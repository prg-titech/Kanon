__$__.ToVisjs = {
    Translator: function(graph) {
        // initialize
        __$__.Context.Arrays = [];
        let retData = {nodes: [], edges: []};

        for (let i = 0; i < graph.nodes.length; i++) {
            let node;

            if (graph.nodes[i] instanceof __$__.Traverse.__Literal) {
                node = {
                    color: {
                        border: 'white',
                        background: 'white',
                        highlight: {
                            border: 'white',
                            background: 'white'
                        },
                        hover: {
                            border: 'white',
                            background: 'white'
                        }
                    },
                    id: __$__.Context.getObjectID(graph.nodes[i]),
                    label: "" + graph.nodes[i].value,
                    type: typeof graph.nodes[i].value,
                    isLiteral: true,
                    scaling: {
                        min: 10
                    }
                };

                retData.nodes.push(node);
            } else if (graph.nodes[i] instanceof __$__.Traverse.__VariableNode) {
                node = {
                    hidden: true,
                    id: __$__.Context.getObjectID(graph.nodes[i]),
                    label: graph.nodes[i].label
                };

                retData.nodes.push(node);
            } else if (graph.nodes[i].constructor === [].constructor && graph.nodes[i].length > 0) {
                let arrayLabels = [];
                for (let j = 0; j < graph.nodes[i].length; j++) {
                    let arrLabel = __$__.Context.getObjectID(graph.nodes[i]);
                    if (__$__.Context.ArrayLabels.indexOf(arrLabel) === -1) {
                        __$__.Context.ArrayLabels.push(arrLabel);
                    }
                    node = {
                        borderWidthSelected: 1,
                        color: {
                            border: 'black',
                            highlight: {
                                border: 'black'
                            }
                        },
                        id: arrLabel + '@block' + j + '@',
                        physics: false,
                        shape: 'square',
                        size: __$__.ObjectGraphNetwork.arraySize
                    };
                    arrayLabels.push(node.id);

                    retData.nodes.push(node);
                }
                __$__.Context.Arrays.push(arrayLabels);
            } else {
                node = {};

                node.label = graph.nodes[i].__ClassName__ || graph.nodes[i].constructor.name;
                node.id = __$__.Context.getObjectID(graph.nodes[i]);

                retData.nodes.push(node);
            }
        }

        for (let i = 0; i < graph.edges.length; i++) {
            let edge = {};

            edge.from = __$__.Context.getObjectID(graph.edges[i].from);
            // if the type of the start node of the edge is Array
            if (graph.edges[i].from.constructor === [].constructor)
                edge.from += '@block' + graph.edges[i].label + '@';

            edge.to = __$__.Context.getObjectID(graph.edges[i].to);
            // if the type of the end node of the edge is Array
            if (graph.edges[i].to.constructor === [].constructor && graph.edges[i].to.length > 0)
                edge.to += '@block0@';

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
