 __$__.container = document.getElementById('mynetwork');
 __$__.data = {nodes: new vis.DataSet({}), edges: new vis.DataSet({})};
 __$__.options = {
     autoResize: false,
     nodes: {color: 'cyan', font: {size: 18}, physics: false},
     edges: {arrows: 'to', color: 'cyan', width: 3, font: {size: 18}},
     interaction: {zoomView: false},
 };
 __$__.network = new vis.Network(__$__.container, __$__.data, __$__.options);
 __$__.StorePositions.oldNetworkNodesData = __$__.network.body.data.nodes._data;
 __$__.StorePositions.oldNetworkEdgesData = __$__.network.body.data.edges._data;

 __$__.Update.PositionUpdate();
 __$__.editor.getSelection().clearSelection();

 document.getElementById('viewmode').textContent = (__$__.Context.Snapshot) ? 'View Mode: Snapshot' : 'View Mode: Summarized';

 window.onresize = function() {
     __$__.network.redraw();
 };
