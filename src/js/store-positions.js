window.StorePositions = {};

StorePositions.oldNetworkNodesData = {};
StorePositions.oldNetworkEdgesData = {};


// if nodePositions have the position of node.id, set the position at graph.node.
StorePositions.setPositions = function(graph, isFixed = false) {
    for (var i = 0; i < graph.nodes.length; i++) {
        var node = graph.nodes[i];

        var nodeData = StorePositions.oldNetworkNodesData[node.id];
        if (nodeData && nodeData.x) {
            node.x = nodeData.x;
            node.y = nodeData.y;
            node.fixed = isFixed;
            node.physics = isFixed;
        }
    }
};


// register the positions of the nodes to be able to use old network data
StorePositions.registerPositions = function() {
    var pos = network.getPositions();

    Object.keys(pos).forEach(function(id) {
        var temp = StorePositions.oldNetworkNodesData;
        if (temp[id]) {
            temp[id].x = pos[id].x;
            temp[id].y = pos[id].y;
        }
    });
};
