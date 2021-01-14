__$__.StoredGraphFormat = {
    Node: class __Node__ {
        constructor(id, label, isLiteral, type, color) {
            this.id = id;
            this.value = label;
            this.label = label + '';
            this.isLiteral = isLiteral;
            this.type = type;
            this.distance = -1;     //追加部分
            this.size = -1;         //追加部分
            this.shape = 'ellipse';
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
            } else {
                this.color = 'skyblue';
            }
        }

        generateVisjsNode(fixed = false) {
            let node;
            if (this.isLiteral) {
                let nodeSize = (this.size == -1) ? 10 : this.size;
                node = {
                    color: this.color,
                    id: this.id,
                    label: "" + this.label,
                    type: this.type,
                    isLiteral: true,
                    scaling: {
                        min: 10
                    },
                    fixed: fixed,
                    value: nodeSize,
                    scaling: {
                        label: {
                            enable: true,
                            min: nodeSize,
                            max: nodeSize
                        }
                    }
                };
            } else {
                let nodeSize = (this.size == -1) ? 15 : this.size;
                node = {
                    color: this.color,
                    id: this.id,
                    label: "" + this.label,
                    shape: this.shape,
                    fixed: fixed,
                    value: nodeSize,
                    scaling: {
                        label: {
                            enable: true,
                            min: nodeSize,
                            max: nodeSize
                        }
                    }
                };
                // node = {
                //     id: this.id,
                //     label: "" + this.label,
                //     fixed: fixed
                // };
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
            let variableNode;
            variableNode = {
                hidden: true,
                id: this.id,
                label: this.label
            };
            if (this.x !== undefined) variableNode.x = this.x;
            if (this.y !== undefined) variableNode.y = this.y;
            return variableNode;
        }

        setLocation(x, y) {
            this.x = x;
            this.y = y;
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
            this.length = undefined;
            this.width = 3;
            this.fontSize = 14;
            this.isArrow = true;
            this.smooth = true;
        }

        generateVisjsEdge() {
            let edge, arrowheadSize = 1;
            if(this.length != undefined){
                arrowheadSize = Math.min(this.length / 130, 1);
            }
            
            if(this.isArrow) {
                edge = {
                    arrows: {
                        to: {
                            enabled: true,
                            scaleFactor: arrowheadSize
                        }
                    },
                    from: this.from,
                    to: this.to,
                    label: this.label,
                    length: this.length,
                    width: this.width,
                    font: {
                        size: this.fontSize
                    },
                    smooth: {
                        enabled: this.smooth
                    }
                };
            } else {
                edge = {
                    from: this.from,
                    to: this.to,
                    label: this.label,
                    length: this.length,
                    width: this.width,
                    font: {
                        size: this.fontSize
                    },
                    smooth: {
                        enabled: this.smooth
                    }
                };
            }
            

            if (this.from.slice(0, 11) === '__Variable-') {
                edge.color = 'seagreen';
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
            this.makeChanges = false;
            this.CustomMode = false;
            this.FisheyeView = true;
            this.notInterestedClass = [];
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
                    return node.value;
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
         * 追加部分：ノードの値がリテラルかどうかを返す
         * @param {string} ID
         * @return {boolean}
         */
        isLiteral(ID) {
            let node = this.nodes[ID];
            if (node) {
                return node.isLiteral;
            }
        }

        /**
         * 追加部分：グローバル変数のstring配列を返す
         * @return {Array of string}
         */
        getGlobalVariables() {
            return __$__.ASTTransforms.varEnv.Variables();
        }

        /**
         * 追加部分：入力のノードと隣接している全てのノードの配列を返す
         * @param {string} ID
         * @return {Array of string}
         */
        getConnectNodes(ID) {
            let node = this.nodes[ID];
            let ans = new Array();
            if(node) {
                for(let i = 0; i < this.edges.length; i++) {
                    if(this.edges[i].from == ID && ans.indexOf(this.edges[i].to) == -1) {
                        ans.push(this.edges[i].to);
                    } else if(this.edges[i].to == ID && ans.indexOf(this.edges[i].from) == -1) {
                        ans.push(this.edges[i].from);
                    }
                }
            }
            return ans;
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
         * 追加部分：ノードのカラーを変更する
         * @param {string} ID
         * @param {string} color
         */
        setColor(ID, color) {
            let node = this.nodes[ID];
            if (node) {
                node.color = color;
            }
        }

        /**
         * 追加部分：ノードの距離を変更する
         * @param {string} ID
         * @param {number} distance
         */
        setDistance(ID, distance) {
            let node = this.nodes[ID];
            if (node) {
                node.distance = distance;
            }
        }

        /**
         * 追加部分：ノードのサイズを変更する
         * @param {string} ID
         * @param {number} size
         */
        setSize(ID, size) {
            let node = this.nodes[ID];
            if (node) {
                node.size = size;
            }
        }

        /**
         * 追加部分：ノードのラベルを変更する
         * @param {string} ID
         * @param {string} label
         */
        setLabel(ID, label) {
            let node = this.nodes[ID];
            if (node) {
                node.label = label;
            }
        }

        /**
         * 追加部分：配列を表すノードだけ仕様を変更する
         * @param {string} ID
         */
        setArrayNode(ID) {
            let node = this.nodes[ID];
            if (node) {
                node.shape = 'box';
                node.color = {
                    border: 'deepskyblue',
                    background: 'lightcyan',
                    highlight: {
                        border: 'deepskyblue',
                        background: 'lightcyan'
                    },
                    hover: {
                        border: 'deepskyblue',
                        background: 'lightcyan'
                    }
                };
            }
        }

        /**
         * 追加部分：エッジの長さを変更する
         * @param {string} fromID
         * @param {string} toID
         * @param {number} length
         */
        setEdgeLength(fromID, toID, length) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.length = length;
            }
        }

        /**
         * 追加部分：エッジの太さを変更する
         * @param {string} fromID
         * @param {string} toID
         * @param {number} width
         */
        setEdgeWidth(fromID, toID, width) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.width = width;
            }
        }

        /**
         * 追加部分：エッジのラベルのサイズを変更する
         * @param {string} fromID
         * @param {string} toID
         * @param {number} fontSize
         */
        setEdgeLabelSize(fromID, toID, fontSize) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.fontSize = fontSize;
            }
        }

        /**
         * 追加部分：緑エッジの長さを変更する
         * @param {string} toID
         * @param {number} length
         */
        setVariableEdgeLength(toID, length) {
            let edge;
            for(let i = 0; i < this.variableEdges.length; i++) {
                if(this.variableEdges[i].to == toID) {
                    edge = this.variableEdges[i];
                }
            }
            if (edge) {
                edge.length = length;
            }
        }

        /**
         * 追加部分：緑エッジの太さを変更する
         * @param {string} toID
         * @param {number} length
         */
        setVariableEdgeWidth(toID, width) {
            let edge;
            for(let i = 0; i < this.variableEdges.length; i++) {
                if(this.variableEdges[i].to == toID) {
                    edge = this.variableEdges[i];
                }
            }
            if (edge) {
                edge.width = width;
            }
        }

        /**
         * 追加部分：緑エッジのラベルのサイズを変更する
         * @param {string} toID
         * @param {number} fontSize
         */
        setVariableEdgeLabelSize(toID, fontSize) {
            let edge;
            for(let i = 0; i < this.variableEdges.length; i++) {
                if(this.variableEdges[i].to == toID) {
                    edge = this.variableEdges[i];
                }
            }
            if (edge) {
                edge.fontSize = fontSize;
            }
        }

        /**
         * 追加部分：エッジのラベルを変更する
         * @param {string} fromID
         * @param {string} toID
         * @param {string} label
         */
        setEdgeLabel(fromID, toID, label) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.label = label;
            }
        }

        /**
         * 追加部分：エッジの矢印をオフにし、ラベルを空にする
         * @param {string} fromID
         * @param {string} toID
         */
        setEdgeArrowOff(fromID, toID) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.isArrow = false;
                edge.label = '';
            }
        }

        /**
         * 追加部分：エッジのベジェ曲線のオン・オフを指定する
         * @param {string} fromID
         * @param {string} toID
         * @param {boolean} bool
         */
        setEdgeSmooth(fromID, toID, bool) {
            let edge;
            for(let i = 0; i < this.edges.length; i++) {
                if(this.edges[i].from == fromID && this.edges[i].to == toID) {
                    edge = this.edges[i];
                }
            }
            if (edge) {
                edge.smooth = bool;
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
