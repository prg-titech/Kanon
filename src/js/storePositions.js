__$__.StorePositions = {
    oldNetwork: {
        nodes: {},
        edges: {},
        _nodesData: {},
        _edgesData: {}
    },


    // if nodePositions have the position of node.id, set the position at graph.node.
    setPositions: function(graph) {
        for (let i = 0; i < graph.nodes.length; i++) {
            let node = graph.nodes[i];
            let nodeData = __$__.StorePositions.oldNetwork.nodes[node.id];
    
            if (nodeData && nodeData.x !== undefined) {
                node.x = nodeData.x;
                node.y = nodeData.y;
                if (node.id.slice(0, 11) !== '__Variable-')
                    node.fixed = true;
            } else {
                node.x = undefined;
                node.y = undefined;
            }
        }
        
    },
    
    
    // register the positions of the nodes to be able to use old network data
    registerPositions: function(positionUpdate = false) {
        let pos = __$__.ObjectGraphNetwork.network.getPositions();

    
        Object.keys(pos).forEach(function(id) {
            let temp = __$__.StorePositions.oldNetwork.nodes;
    
            if (temp[id]) {
                temp[id].x = pos[id].x;
                temp[id].y = pos[id].y;
            } else if (!isNaN(pos[id].x) && !isNaN(pos[id].y)) {
                temp[id] = {x: pos[id].x, y: pos[id].y};
            }
        });
        if (positionUpdate) {
            __$__.StorePositions.oldNetwork._nodesData = __$__.ObjectGraphNetwork.nodes._data;
            __$__.StorePositions.oldNetwork._edgesData = __$__.ObjectGraphNetwork.edges._data;
        }
    }
};
