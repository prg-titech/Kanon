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
                node.fixed = true;
            }
        }
        
    },
    
    
    // register the positions of the nodes to be able to use old network data
    registerPositions: function(positionUpdate = false) {
        let pos = __$__.network.getPositions();

    
        Object.keys(pos).forEach(function(id) {
            let temp = __$__.StorePositions.oldNetwork.nodes;
    
            if (temp[id]) {
                temp[id].x = pos[id].x;
                temp[id].y = pos[id].y;
            } else {
                temp[id] = {x: pos[id].x, y: pos[id].y};
            }
        });
        if (positionUpdate) {
            __$__.StorePositions.oldNetwork._nodesData = __$__.nodes._data;
            __$__.StorePositions.oldNetwork._edgesData = __$__.edges._data;
        }
    }
};
