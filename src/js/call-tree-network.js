__$__.CallTreeNetwork = {
    enable: true,
    switchEnabled() {
        this.enable = !this.enable;
        document.getElementById('callTreeDiagram').style.display = (this.enable) ? '' : 'none';
    },
};

__$__.CallTreeNetwork.data = {
    nodes: [],
    edges: []
};

__$__.CallTreeNetwork.descendantsIDs = {
    nodes: {},
    edges: {}
};

__$__.CallTreeNetwork.hiddenIDs = {
    nodes: {},
    edges: {}
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
    // interaction: {dragNodes: false},
    physics: {
        enabled: false
    }
};


__$__.CallTreeNetwork.draw = function() {
    let data = {
        nodes: [],
        edges: []
    };
    __$__.CallTreeNetwork.childrenNodeIDs = {
        nodes: {},
        edges: {}
    };
    __$__.CallTreeNetwork.constructData(__$__.CallTree.rootNode, data);
    __$__.CallTreeNetwork.data = {
        nodes: new vis.DataSet(data.nodes),
        edges: new vis.DataSet(data.edges)
    };
    __$__.CallTreeNetwork.network.setData(__$__.CallTreeNetwork.data);
    __$__.CallTreeNetwork.highlightCurrentSpecifiedContext();
};


__$__.CallTreeNetwork.constructData = function(node, network, ancestors = []) {
    let contextSensitiveID = node.getContextSensitiveID();
    if (__$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID] === undefined)
        __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID] = ancestors.filter(ancestorID => __$__.CallTreeNetwork.hiddenIDs.nodes[ancestorID]).length > 0;
    let data = {
        label: node.getDisplayedLabel(),
        id: contextSensitiveID,
        shape: node.shape,
        hidden: __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID]
    };
    if (node.constructor.name === 'Loop' || node.constructor.name === 'Function') {
        data.loopLabel = node.label;
    }
    network.nodes.push(data);

    // ancestors.forEach(ancestor => ancestor.descendants.push(contextSensitiveID));
    ancestors.forEach(ancestorID => __$__.CallTreeNetwork.descendantsIDs.nodes[ancestorID].push(contextSensitiveID));
    __$__.CallTreeNetwork.descendantsIDs.nodes[contextSensitiveID] = [];
    __$__.CallTreeNetwork.descendantsIDs.edges[contextSensitiveID] = [];
    ancestors.push(contextSensitiveID);

    let children = [].concat(node.children);
    while (children.length) {
        let child = children.shift();
        if (child.constructor.name === 'FunctionCall') {
            children = child.children.concat(children);
            continue;
        } else if (child.constructor.name === 'Instance') {
            children = child.children.concat(children);
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
        ancestors.forEach(ancestorID => __$__.CallTreeNetwork.descendantsIDs.edges[ancestorID].push(edgeID));
        __$__.CallTreeNetwork.constructData(child, network, ancestors);
    }
    // node.children.forEach(child => {
    //     if (child.constructor.name === 'FunctionCall') {
    //         child.children.forEach(c => {
    //             let childContextSensitiveID = c.getContextSensitiveID();
    //             let edgeID = contextSensitiveID + '_' + childContextSensitiveID;
    //             if (__$__.CallTreeNetwork.hiddenIDs.edges[edgeID] === undefined)
    //                 __$__.CallTreeNetwork.hiddenIDs.edges[edgeID] = __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID];
    //             let edgeData = {
    //                 id: edgeID,
    //                 from: contextSensitiveID,
    //                 to: childContextSensitiveID,
    //                 hidden: __$__.CallTreeNetwork.hiddenIDs.edges[edgeID]
    //             };
    //             network.edges.push(edgeData);
    //             ancestors.forEach(ancestorID => __$__.CallTreeNetwork.descendantsIDs.edges[ancestorID].push(edgeID));
    //             __$__.CallTreeNetwork.constructData(c, network, ancestors);
    //         });
    //     } else {
    //         let childContextSensitiveID = child.getContextSensitiveID();
    //         let edgeID = contextSensitiveID + '_' + childContextSensitiveID;
    //         if (__$__.CallTreeNetwork.hiddenIDs.edges[edgeID] === undefined)
    //             __$__.CallTreeNetwork.hiddenIDs.edges[edgeID] = __$__.CallTreeNetwork.hiddenIDs.nodes[contextSensitiveID];
    //         let edgeData = {
    //             id: edgeID,
    //             from: contextSensitiveID,
    //             to: childContextSensitiveID,
    //             hidden: __$__.CallTreeNetwork.hiddenIDs.edges[edgeID]
    //         };
    //         network.edges.push(edgeData);
    //         ancestors.forEach(ancestorID => __$__.CallTreeNetwork.descendantsIDs.edges[ancestorID].push(edgeID));
    //         __$__.CallTreeNetwork.constructData(child, network, ancestors);
    //     }
    // });

    ancestors.pop();
};


__$__.CallTreeNetwork.highlightCurrentSpecifiedContext = function() {
    let shouldHighlight_map = {};
    Object.entries(__$__.Context.SpecifiedContext).forEach(entry => {
        shouldHighlight_map[entry[1]] = entry[0];
    });
    let updateNodeItems = [];
    Object.keys(__$__.CallTreeNetwork.data.nodes._data).forEach(nodeId => {
        if (shouldHighlight_map[nodeId]) {
            updateNodeItems.push({
                id: nodeId,
                color: {
                    border: 'black',
                    highlight: {
                        border: 'black'
                    }
                }
            });
        } else {
            updateNodeItems.push({
                id: nodeId,
                color: {
                    border: 'skyblue',
                    highlight: {
                        border: 'skyblue'
                    }
                }
            });
        }
    });
    __$__.CallTreeNetwork.data.nodes.update(updateNodeItems);
};


__$__.CallTreeNetwork.selectClickedContext = function(param) {
    if (param.nodes.length > 0) {
        let clickedNodeId = param.nodes[0];
        let nodeData = __$__.CallTreeNetwork.data.nodes._data[clickedNodeId];
        if (nodeData.loopLabel) {
            __$__.Context.SpecifiedContext[nodeData.loopLabel] = clickedNodeId;
            if (__$__.Update.executable)
                __$__.Context.SpecifiedContextWhenExecutable[nodeData.loopLabel] = clickedNodeId;

            __$__.Context.SwitchViewMode(true);
            __$__.Context.Draw();
            __$__.CallTreeNetwork.highlightCurrentSpecifiedContext();
        }
    }
};


__$__.CallTreeNetwork.openAndClose = function(param) {
    if (param.nodes.length > 0) {
        let clickedNodeId = param.nodes[0];
        let descendantNodes = __$__.CallTreeNetwork.descendantsIDs.nodes[clickedNodeId];
        let descendantEdges = __$__.CallTreeNetwork.descendantsIDs.edges[clickedNodeId];
        if (descendantEdges && descendantEdges.length > 0) {
            // let hidden = !__$__.CallTreeNetwork.data.edges.get(descendantEdges[0]).hidden;
            let hidden = !__$__.CallTreeNetwork.hiddenIDs.edges[descendantEdges[0]];

            let updateNodeItems = [];
            descendantNodes.forEach(descendantID => {
                updateNodeItems.push({
                    id: descendantID,
                    hidden: hidden
                });
                __$__.CallTreeNetwork.hiddenIDs.nodes[descendantID] = hidden;
            });
            __$__.CallTreeNetwork.data.nodes.update(updateNodeItems);

            let updateEdgeItems = [];
            descendantEdges.forEach(descendantID => {
                updateEdgeItems.push({
                    id: descendantID,
                    hidden: hidden
                });
                __$__.CallTreeNetwork.hiddenIDs.edges[descendantID] = hidden;
            });
            __$__.CallTreeNetwork.data.edges.update(updateEdgeItems);
        }
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
