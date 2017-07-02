__$__.StorePositions = {
    oldNetworkEdgesData: {},
    oldNetworkNodesData: {},


    // if nodePositions have the position of node.id, set the position at graph.node.
    setPositions: function(graph) {
        for (let i = 0; i < graph.nodes.length; i++) {
            let node = graph.nodes[i];
            let nodeData = __$__.StorePositions.oldNetworkNodesData[node.id];
    
    
            if (nodeData && nodeData.x !== undefined) {
                node.x = nodeData.x;
                node.y = nodeData.y;
                node.fixed = true;
            }
        }
        
    },
    
    
    // register the positions of the nodes to be able to use old network data
    registerPositions: function() {
        let pos = __$__.network.getPositions();
    
    
        Object.keys(pos).forEach(function(id) {
            let temp = __$__.StorePositions.oldNetworkNodesData;
    
            if (temp[id]) {
                temp[id].x = pos[id].x;
                temp[id].y = pos[id].y;
            }
        });
    }
};
