__$__.container = document.getElementById('mynetwork');
__$__.nodes = new vis.DataSet({});
__$__.edges = new vis.DataSet({});
__$__.data = {nodes: __$__.nodes, edges: __$__.edges};
__$__.options = {
    autoResize: false,
    nodes: {
        color: 'skyblue'
    },
    edges: {
        arrows: 'to',
        color: 'skyblue',
        width: 3,
        smooth: {
            enabled: true,
            forceDirection: 'none',
            roundness: 1.0
        }
    },
    physics: {
        enabled: true
    // },
    // interaction: {
    //     zoomView: false
    }
};
__$__.arraySize = 12;
__$__.network = new vis.Network(__$__.container, __$__.data, __$__.options);
__$__.network.on('click', __$__.JumpToConstruction.ClickEventFunction);
__$__.network.on('dragStart', params => {
    if (params.nodes.length > 0) {
        let nodeId = params.nodes[0];
        __$__.nodes.update({id: nodeId, fixed: false});
    }
});
__$__.network.on('dragEnd', params => {
    if (params.nodes.length > 0) {
        let nodeId = params.nodes[0];
        __$__.nodes.update({id: nodeId, fixed: true})
    }
});
__$__.network.on('dragging', __$__.Update.updateArray);
__$__.network.on('dragEnd', __$__.Update.updateArray);
__$__.network.on('dragEnd', __$__.StorePositions.registerPositions);
__$__.StorePositions.registerPositions();
__$__.StorePositions.oldNetwork.edges = __$__.edges._data;

__$__.Update.PositionUpdate();
__$__.editor.getSelection().clearSelection();

document.getElementById('viewmode').textContent = (__$__.Context.Snapshot) ? 'View Mode: Snapshot' : 'View Mode: Summarized';

window.onresize = function() {
    __$__.network.redraw();
    __$__.ShowContext.show();
};
