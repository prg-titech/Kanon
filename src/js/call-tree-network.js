__$__.CallTreeNetwork = {};

__$__.CallTreeNetwork.data = {
    nodes: [],
    edges: []
};
__$__.CallTreeNetwork.container = document.getElementById('callTree');
__$__.CallTreeNetwork.options = {
    nodes: {
        color: 'skyblue'
    },
    edges: {
        color: 'skyblue'
    },
    layout: {
        hierarchical: {
            direction: 'UD',
            sortMethod: 'directed'
        }
    },
    interaction: {dragNodes: false},
    physics: {
        enabled: false
    }
};


__$__.CallTreeNetwork.draw = function() {
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
    __$__.CallTreeNetwork.coloringCurrentSpecifiedContext();
};


__$__.CallTreeNetwork.constructData = function(node, network) {
    let contextSensitiveID = node.getContextSensitiveID();
    let data = {
        label: node.getDisplayedLabel(),
        id: contextSensitiveID,
        shape: node.shape
    };
    if (node.constructor.name === 'Loop' || node.constructor.name === 'Function') {
        data.loopLabel = node.label;
    }
    network.nodes.push(data);

    node.children.forEach(child => {
        let childContextSensitiveID = child.getContextSensitiveID();
        network.edges.push({
            from: contextSensitiveID,
            to: childContextSensitiveID
        });
        __$__.CallTreeNetwork.constructData(child, network);
    });
};


__$__.CallTreeNetwork.coloringCurrentSpecifiedContext = function() {
    let shouldHighlight_map = {};
    Object.entries(__$__.Context.SpecifiedContext).forEach(entry => {
        shouldHighlight_map[entry[1]] = entry[0];
    });
    Object.keys(__$__.CallTreeNetwork.data.nodes._data).forEach(nodeId => {
        if (shouldHighlight_map[nodeId]) {
            __$__.CallTreeNetwork.data.nodes.update({
                id: nodeId,
                color: 'red'
            });
        } else {
            __$__.CallTreeNetwork.data.nodes.update({
                id: nodeId,
                color: 'skyblue'
            });
        }
    });
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
            __$__.CallTreeNetwork.coloringCurrentSpecifiedContext();
        }
    }
};


__$__.CallTreeNetwork.openAndClose = function(param) {
};


__$__.CallTreeNetwork.network = new vis.Network(__$__.CallTreeNetwork.container, __$__.CallTreeNetwork.data, __$__.CallTreeNetwork.options);
__$__.CallTreeNetwork.network.on('click', __$__.CallTreeNetwork.selectClickedContext);
__$__.CallTreeNetwork.network.on('doubleClick', __$__.CallTreeNetwork.openAndClose);
