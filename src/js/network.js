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
    },
    interaction: {
        zoomView: false
    }
};
__$__.arraySize = 12;
__$__.network = new vis.Network(__$__.container, __$__.data, __$__.options);
__$__.StorePositions.oldNetworkNodesData = __$__.network.body.data.nodes._data;
__$__.StorePositions.oldNetworkEdgesData = __$__.network.body.data.edges._data;

__$__.Update.PositionUpdate();
__$__.editor.getSelection().clearSelection();

document.getElementById('viewmode').textContent = (__$__.Context.Snapshot) ? 'View Mode: Snapshot' : 'View Mode: Summarized';

window.onresize = function() {
    __$__.network.redraw();
};
