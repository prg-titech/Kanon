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
    __$__.CallTreeNetwork.data = {
        nodes: [],
        edges: []
    };
    __$__.CallTreeNetwork.constructData(__$__.CallTree.rootNode, __$__.CallTreeNetwork.data);
    __$__.CallTreeNetwork.network.setData(__$__.CallTreeNetwork.data);
    __$__.CallTreeNetwork.coloringCurrentSpecifiedContext();
};


__$__.CallTreeNetwork.constructData = function(node, network) {
    let contextSensitiveID = node.getContextSensitiveID();
    network.nodes.push({
        label: node.getDisplayedLabel(),
        id: contextSensitiveID
    });

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
    Object.keys(__$__.CallTreeNetwork.network.body.data.nodes._data).forEach(nodeId => {
        if (shouldHighlight_map[nodeId]) {
            __$__.CallTreeNetwork.network.body.data.nodes.update({
                id: nodeId,
                color: 'red'
            });
        } else {
            __$__.CallTreeNetwork.network.body.data.nodes.update({
                id: nodeId,
                color: 'skyblue'
            });
        }
    })
};


__$__.CallTreeNetwork.network = new vis.Network(__$__.CallTreeNetwork.container, __$__.CallTreeNetwork.data, __$__.CallTreeNetwork.options);
