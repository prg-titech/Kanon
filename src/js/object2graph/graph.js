__$__.StoredGraphFormat = {
    Node: class __Node__ {
        constructor(id, label, isLiteral, type, color) {
            this.id = id;
            this.value = label;
            this.label = label + '';
            this.isLiteral = isLiteral;
            this.type = type;
            if (color) {
                this.color = color;
            } else if (isLiteral) {
                this.color = {
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
                };
            }
        }

        generateVisjsNode(fixed = false) {
            let node;
            if (this.isLiteral) {
                node = {
                    color: this.color,
                    id: this.id,
                    label: "" + this.label,
                    type: this.type,
                    isLiteral: true,
                    scaling: {
                        min: 10
                    },
                    fixed: fixed
                };
            } else {
                node = {
                    id: this.id,
                    label: "" + this.label,
                    fixed: fixed
                };
            }
            if (this.x !== undefined) node.x = this.x;
            if (this.y !== undefined) node.y = this.y;
            return node;
        }

        setLocation(x, y) {
            this.x = x;
            this.y = y;
        }

        duplicate() {
            let newNode = new __$__.StoredGraphFormat.Node(this.id, this.value, this.isLiteral, this.type);
            if (this.x) newNode.x = this.x;
            if (this.y) newNode.y = this.y;
            return newNode;
        }
    },


    VariableNode: class __VariableNode__ {
        constructor(variableName) {
            this.id = '__Variable-' + variableName;
            this.label = variableName;
        }

        generateVisjsNode() {
            return {
                hidden: true,
                id: this.id,
                label: this.label
            };
        }

        duplicate() {
            return new __$__.StoredGraphFormat.VariableNode(this.label);
        }
    },


    Edge: class __Edge__ {
        constructor(from, to, label) {
            this.from = from;
            this.to = to;
            this.label = label;
        }

        generateVisjsEdge() {
            let edge = {
                from: this.from,
                to: this.to,
                label: this.label
            };

            if (this.from.slice(0, 11) === '__Variable-') {
                edge.color = 'seagreen';
                edge.length = 30;
            }

            return edge;
        }

        duplicate() {
            return new __$__.StoredGraphFormat.Edge(this.from, this.to, this.label);
        }
    },


    Graph: class __Graph__ {
        constructor() {
            this.nodes = {};
            this.edges = [];
            this.variableNodes = {};
            this.variableEdges = [];
        }

        pushNode(node) {
            if (node.constructor === __$__.StoredGraphFormat.Node)
                this.nodes[node.id] = node;
            else
                this.variableNodes[node.id] = node;
        }

        pushEdge(edge) {
            if (edge.from.slice(0, 11) !== '__Variable-')
                this.edges.push(edge);
            else
                this.variableEdges.push(edge);
        }


        /**
         * @return {Array of string} array of unique IDs of all objects
         */
        getObjectIDs() {
            return Object.keys(this.nodes);
        }

        /**
         * @param {string} ID: a unique object ID
         * @return {Class}
         */
        getClass(ID) {
            let node = this.nodes[ID];
            if (node) {
                if (node.isLiteral) {
                    return node.type;
                } else {
                    return node.label;
                }
            }
        }

        /**
         * @param {string} ID
         */
        getFields(ID) {
            let node = this.nodes[ID];
            if (node) {
                let fields = [];
                for (let i = 0; i < this.edges.length; i++) {
                    let edge = this.edges[i];
                    if (edge.from === ID) {
                        fields.push(edge.label);
                    }
                }
                return fields;
            } else {
                return [];
            }
        }

        /**
         * @param {string} ID
         * @param {string} FN
         */
        getField(ID, FN) {
            let node = this.nodes[ID];
            if (node) {
                for (let i = 0; i < this.edges.length; i++) {
                    let edge = this.edges[i];
                    if (edge.from === ID && edge.label === FN) {
                        return edge.to;
                    }
                }
            }
        }

        /**
         * @param {string} ID
         * @param {number} x
         * @param {number} y
         */
        setLocation(ID, x, y) {
            let node = this.nodes[ID];
            if (node) {
                node.setLocation(x, y);
            }
        }

        /**
         * @param {boolean} nodeFixed
         * @return {{nodes: Array, edges: Array}}
         */
        generateVisjsGraph(nodeFixed = false) {
            let visGraph = {nodes: [], edges: []};

            for (let nodeID of Object.keys(this.nodes)) {
                visGraph.nodes.push(this.nodes[nodeID].generateVisjsNode(nodeFixed));
            }

            for (let nodeID of Object.keys(this.variableNodes)) {
                visGraph.nodes.push(this.variableNodes[nodeID].generateVisjsNode());
            }

            for (let i = 0; i < this.edges.length; i++) {
                visGraph.edges.push(this.edges[i].generateVisjsEdge());
            }

            for (let i = 0; i < this.variableEdges.length; i++) {
                visGraph.edges.push(this.variableEdges[i].generateVisjsEdge());
            }
            return visGraph;
        }

        duplicate() {
            let newGraph = new __$__.StoredGraphFormat.Graph();

            Object.keys(this.nodes).forEach(nodeID => {
                let node = this.nodes[nodeID];
                if (node) newGraph.nodes[nodeID] = node.duplicate();
            });

            Object.keys(this.variableNodes).forEach(nodeID => {
                let node = this.variableNodes[nodeID];
                if (node) newGraph.variableNodes[nodeID] = node.duplicate();
            });

            for (let i = 0; i < this.edges.length; i++) {
                newGraph.edges.push(this.edges[i].duplicate());
            }

            for (let i = 0; i < this.variableEdges.length; i++) {
                newGraph.variableEdges.push(this.variableEdges[i].duplicate());
            }

            return newGraph;
        }
    }
};
