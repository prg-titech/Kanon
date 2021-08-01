__$__.StorePositions = {
    oldNetwork: {
        nodes: {},
        edges: {},
        _nodesData: {},
        _edgesData: {}
    },
    positionsOfExpectedStructure: undefined,


    // if nodePositions have the position of node.id, set the position at graph.node.
    setPositions: function(graph, positionUpdate = false) {
        Object.keys(graph.nodes).forEach(nodeID => {
            let node = graph.nodes[nodeID];
            let nodeData = __$__.StorePositions.oldNetwork.nodes[nodeID];
            let posOfExpStr = __$__.StorePositions.positionsOfExpectedStructure;

            if (!positionUpdate && posOfExpStr && posOfExpStr[node.id]){

                graph.setLocation(nodeID, posOfExpStr[nodeID].x, posOfExpStr[nodeID].y);
            } else if (nodeData && nodeData.x !== undefined) {
                graph.setLocation(nodeID, nodeData.x, nodeData.y);
            } else {
                graph.setLocation(nodeID, undefined, undefined);
            }
            if (!positionUpdate) node.fixed = true;
        });
        // if (!positionUpdate)
        //     delete __$__.StorePositions.positionsOfExpectedStructure;
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
    },


    registerPositionsOfExpectedStructure() {
        __$__.StorePositions.positionsOfExpectedStructure = __$__.Testize.network.network.getPositions();
    },


    updateIDForExpectedStructure(oldID, newID) {
        let posOfExpStr = __$__.StorePositions.positionsOfExpectedStructure;
        if (posOfExpStr && !posOfExpStr[newID]) {
            posOfExpStr[newID] = posOfExpStr[oldID];
            delete posOfExpStr[oldID];
        }
    }
};
