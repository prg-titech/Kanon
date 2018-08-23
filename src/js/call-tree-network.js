__$__.CallTreeNetwork = {
    enable: true,

    data: {
        nodes: [],
        edges: []
    },

    hiddenIDs: {
        nodes: {'main': false},
        edges: {}
    },

    switchEnabled() {
        this.enable = !this.enable;
        document.getElementById('callTreeDiagram').style.display = (this.enable) ? '' : 'none';
    },

    draw() {
        let data = {
            nodes: [],
            edges: []
        };
        __$__.CallTreeNetwork.constructData(__$__.CallTree.rootNode, data);
        __$__.CallTreeNetwork.data = {
            nodes: new vis.DataSet(data.nodes),
            edges: new vis.DataSet(data.edges)
        };
        __$__.CallTreeNetwork.network.setData(__$__.CallTreeNetwork.data);
        __$__.CallTreeNetwork.highlightCurrentSpecifiedContext();
    },

    constructData(node, network, parentNode = false) {
        let contextSensitiveID = node.getContextSensitiveID();
        if (__$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID] === undefined)
            __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID] = parentNode.hidden;
        let nodeData = {
            label: node.getDisplayedLabel(),
            id: contextSensitiveID,
            shape: node.shape,
            hidden: __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID],
            children: {
                nodes: [],
                edges: []
            }
        };
        if (node.constructor.name === 'Loop' || node.constructor.name === 'Function') {
            nodeData.loopLabel = node.label;
        }
        network.nodes.push(nodeData);
        if (parentNode) parentNode.children.nodes.push(nodeData);

        let children = [].concat(node.children);
        while (children.length) {
            let child = children.shift();
            if (child.constructor.name === 'FunctionCall' || child.constructor.name === 'Instance') {
                children.unshift(...child.children);
                continue;
            }

            let childContextSensitiveID = child.getContextSensitiveID();
            let edgeID = contextSensitiveID + '_' + childContextSensitiveID;
            if (__$__.CallTreeNetwork.hiddenIDs.edges[edgeID] === undefined)
                __$__.CallTreeNetwork.hiddenIDs.edges[edgeID] = __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID];
            let edgeData = {
                id: edgeID,
                from: contextSensitiveID,
                to: childContextSensitiveID,
                hidden: __$__.CallTreeNetwork.hiddenIDs.edges[edgeID]
            };
            network.edges.push(edgeData);
            nodeData.children.edges.push(edgeData);
            __$__.CallTreeNetwork.constructData(child, network, nodeData);
        }
    },

    highlightCurrentSpecifiedContext() {
        let shouldHighlight_map = {};
        Object.entries(__$__.Context.SpecifiedContext).forEach(entry => {
            shouldHighlight_map[entry[1]] = entry[0];
        });

        let updateNodeItems = [];
        Object.keys(__$__.CallTreeNetwork.data.nodes._data).forEach(nodeId => {
            let color = (shouldHighlight_map[nodeId]) ? 'black' : 'skyblue';
            updateNodeItems.push({
                id: nodeId,
                color: {
                    border: color,
                    highlight: {
                        border: color
                    }
                }
            });
        });
        __$__.CallTreeNetwork.data.nodes.update(updateNodeItems);
    },

    selectClickedContext(param) {
        if (param.nodes.length > 0) {
            let clickedNodeId = param.nodes[0];
            let nodeData = __$__.CallTreeNetwork.data.nodes.get(clickedNodeId);
            if (nodeData.loopLabel) {
                __$__.Context.SpecifiedContext[nodeData.loopLabel] = clickedNodeId;
                if (!__$__.Error.hasError)
                    __$__.Context.SpecifiedContextWhenExecutable[nodeData.loopLabel] = clickedNodeId;

                __$__.Context.SwitchViewMode(true);
                __$__.Context.Draw();
                __$__.CallTreeNetwork.highlightCurrentSpecifiedContext();
            }
        }
    },

    openAndClose(param) {
        if (param.nodes.length > 0) {
            let clickedNodeId = param.nodes[0];
            let nodeData = __$__.CallTreeNetwork.data.nodes.get(clickedNodeId);
            if (nodeData && nodeData.children.edges.length > 0) {
                let hidden = !__$__.CallTreeNetwork.hiddenIDs.edges[nodeData.children.edges[0].id];

                let taskQueueForNodes = [].concat(nodeData.children.nodes);
                let taskQueueForEdges = [].concat(nodeData.children.edges);

                let updateNodeItems = [];
                while (taskQueueForNodes.length > 0) {
                    let childNodeData = taskQueueForNodes.shift();
                    updateNodeItems.push({
                        id: childNodeData.id,
                        hidden: hidden
                    });
                    __$__.CallTreeNetwork.hiddenIDs.nodes[childNodeData.id] = hidden;
                    Array.prototype.push.apply(taskQueueForNodes, childNodeData.children.nodes);
                    Array.prototype.push.apply(taskQueueForEdges, childNodeData.children.edges);
                }

                let updateEdgeItems = [];
                while (taskQueueForEdges.length > 0) {
                    let edgeData = taskQueueForEdges.shift();
                    updateEdgeItems.push({
                        id: edgeData.id,
                        hidden: hidden
                    });
                    __$__.CallTreeNetwork.hiddenIDs.edges[edgeData.id] = hidden;
                }

                __$__.CallTreeNetwork.data.nodes.update(updateNodeItems);
                __$__.CallTreeNetwork.data.edges.update(updateEdgeItems);
            }
        }
    }
};


__$__.CallTreeNetwork.container = document.getElementById('callTree');
__$__.CallTreeNetwork.options = {
    nodes: {
        borderWidth: 3,
        borderWidthSelected: 3,
        color: {
            border: 'skyblue',
            background: 'skyblue',
            highlight: {
                border: 'skyblue',
                background: 'skyblue'
            }
        }
    },
    edges: {
        color: 'skyblue'
    },
    layout: {
        hierarchical: {
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 70,
            levelSeparation: 70
        }
    },
    interaction: {
        dragNodes: false
    },
    physics: {
        enabled: false
    }
};

__$__.CallTreeNetwork.network = new vis.Network(__$__.CallTreeNetwork.container, __$__.CallTreeNetwork.data, __$__.CallTreeNetwork.options);
__$__.CallTreeNetwork.network.on('click', __$__.CallTreeNetwork.selectClickedContext);
__$__.CallTreeNetwork.network.on('doubleClick', __$__.CallTreeNetwork.openAndClose);
// __$__.CallTreeNetwork.network.on('oncontext', function(param) {
//     let nodeID = this.getNodeAt(param.pointer.DOM);
//     if (nodeID)
//         param.nodes.push(nodeID);
//     __$__.CallTreeNetwork.openAndClose(param);
// });
