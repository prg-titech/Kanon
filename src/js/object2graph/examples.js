let __makeGraph__ = (() => {
    Object.setProperty = function(o, prop, val) {
        if (o[prop] === undefined) {
            Object.defineProperty(o, prop, {
                value: val,
                enumerable: false,
                writable: false
            });

            return val;
        } else {
            return false;
        }
    }
    let __$__ = {};
    __$__.StoredGraphFormat = {
        Node: class __Node__ {
            constructor(id, label, isLiteral, type) {
                this.id = id;
                this.label = label;
                this.isLiteral = isLiteral;
                this.type = type;
            }

            generateVisjsNode() {
                if (this.isLiteral) {
                    return {
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
                        id: this.id,
                        label: "" + this.label,
                        type: this.type,
                        isLiteral: true,
                        scaling: {
                            min: 10
                        }
                    };
                } else {
                    return {
                        id: this.id,
                        label: "" + this.label
                    };
                }
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
                    node.x = x;
                    node.y = y;
                }
            }
        }
    };
    __$__.Traverse = {
        literals: {
            boolean: true,
            number: true,
            string: true,
            symbol: true
        },


        traverse: function(objs, variables = {}) {
            let retGraph = new __$__.StoredGraphFormat.Graph();
            let graphNodes = {};

            for (let i = 0; i < objs.length; i++) {
                let obj = objs[i];

                if (graphNodes[obj.__id] || obj === null || obj === undefined)
                    continue;

                __$__.Traverse.dfs(retGraph, obj, graphNodes, objs);
            }

            Object.keys(variables).forEach(key => {
                if (variables[key] && variables[key].__id/* && graphNodes[variables[key].__id]*/) {
                    let tempNode = new __$__.StoredGraphFormat.VariableNode(key);
                    let tempEdge = new __$__.StoredGraphFormat.Edge(tempNode.id, variables[key].__id, key);

                    retGraph.pushNode(tempNode);
                    retGraph.pushEdge(tempEdge);
                }
            });


            return retGraph;
        },

        dfs: function(graph, obj, graphNodes, objs) {
            let node;
            if (obj.__id && !graphNodes[obj.__id]) {
                node = new __$__.StoredGraphFormat.Node(
                    obj.__id,
                    obj.__ClassName__ || obj.constructor.name,
                    false,
                    typeof obj
                );
                graph.pushNode(node);
                graphNodes[obj.__id] = obj;
            } else {
                return;
            }

            Object.keys(obj).forEach(key => {
                // Don't search if the head of property name is "__"
                if (key.slice(0, 2) === '__')
                    return;

                // "to" is destination of edge
                let to = obj[key];

                if (typeof to !== "function" && to !== null && to !== undefined) {
                    if (__$__.Traverse.literals[typeof to]) { // if "to" is literal
                        let literalNodeID = obj.__id + '-' + key;
                        let literalNode = new __$__.StoredGraphFormat.Node(
                            literalNodeID,
                            to,
                            true,
                            typeof to
                        );

                        graph.pushNode(literalNode);
                        graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                            obj.__id,
                            literalNodeID,
                            key
                        ));
                    } else {
                        if (!to.__id) Object.setProperty(to, '__id' , obj.__id + '-' + key);
                        __$__.Traverse.dfs(graph, to, graphNodes, objs);

                        graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                            obj.__id,
                            to.__id,
                            key
                        ));
                    }
                }
            });
        }
    };

    let counter = 1;
    return function __makeGraph__(objs, variables) {
        objs.forEach(obj => {
            if (!obj.__id) obj.__id = 'ID' + counter++;
        });
        return __$__.Traverse.traverse(objs, variables);
    }
})();


let exampleList = // 双方向連結リスト
    "class Node {\n" +
    "    constructor (val, next) {\n" +
    "        this.val = val;\n" +
    "        this.next = next;\n" +
    "        if (next) {\n" +
    "            next.prev = this;\n" +
    "        }\n" +
    "    }\n" +
    "    \n" +
    "}\n" +
    "\n" +
    "let l = new Node(1,\n" +
    "            new Node(2,\n" +
    "                new Node(3, null)));\n" +
    "__makeGraph__([l, l.next, l.next.next], {l: l})";


let exampleTree = // 二分木
    "class Node {\n" +
    "    constructor (val, left, right) {\n" +
    "        this.val = val;\n" +
    "        this.left = left;\n" +
    "        this.right = right;\n" +
    "    }\n" +
    "}\n" +
    "\n" +
    "let tree = new Node(3,\n" +
    "                    new Node(1,\n" +
    "                        new Node(0, null, null),\n" +
    "                        new Node(2, null, null)),\n" +
    "                    new Node(5,\n" +
    "                        new Node(4, null, null),\n" +
    "                        new Node(6, null, null)))\n" +
    "__makeGraph__([tree], {tree: tree})";

console.log(eval(exampleList));
console.log(eval(exampleTree));
