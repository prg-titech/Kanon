__$__.StorePositions = {
    oldNetworkNodesData: {},
    oldNetworkEdgesData: {}
};


// if nodePositions have the position of node.id, set the position at graph.node.
__$__.StorePositions.setPositions = function(graph, isFixed = false) {
    for (var i = 0; i < graph.nodes.length; i++) {
        var node = graph.nodes[i];
        var nodeData = __$__.StorePositions.oldNetworkNodesData[node.id];


        if (nodeData && nodeData.x !== undefined) {
            node.x = nodeData.x;
            node.y = nodeData.y;
            node.fixed = isFixed;
            node.physics = isFixed;
        }
    }
    
};


// register the positions of the nodes to be able to use old network data
__$__.StorePositions.registerPositions = function() {
    var pos = __$__.network.getPositions();


    Object.keys(pos).forEach(function(id) {
        var temp = __$__.StorePositions.oldNetworkNodesData;

        if (temp[id]) {
            temp[id].x = pos[id].x;
            temp[id].y = pos[id].y;
        }
    });
};
