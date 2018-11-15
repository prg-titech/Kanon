__$__.ObjectGraphNetwork = {
    container: document.getElementById('mynetwork'),
    nodes: new vis.DataSet({}),
    edges: new vis.DataSet({}),

    colorRGB: {
        skyblue: '135,206,235'
    },
    options: {
        autoResize: false,
        nodes: {
            // color: {
            //     border: 'rgba(' + __$__.colorRGB.skyblue + ',1)',
            //     background: 'rgba(' + __$__.colorRGB.skyblue + ',1)'
            // }
            color: 'skyblue'
        },
        edges: {
            arrows: 'to',
            color: {
                color: 'skyblue',
                opacity: 1.0,
                highlight: 'skyblue',
                hover: 'skyblue'
            },
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
            hover: true
            // zoomView: false
        },
        manipulation: {
            enabled: true,
            addNode: false,
            addEdge: __$__.Manipulate.addEdge,
            editEdge: __$__.Manipulate.editEdge,
            deleteNode: false,
            deleteEdge: false
        }
    },
    arraySize: 12
};
// __$__.container = document.getElementById('mynetwork');
// __$__.ObjectGraphNetwork.nodes = new vis.DataSet({});
// __$__.ObjectGraphNetwork.edges = new vis.DataSet({});
// __$__.data = {nodes: __$__.ObjectGraphNetwork.nodes, edges: __$__.ObjectGraphNetwork.edges};
// __$__.colorRGB = {
//     skyblue: '135,206,235'
// };
// __$__.options = {
//     autoResize: false,
//     nodes: {
//         // color: {
//         //     border: 'rgba(' + __$__.colorRGB.skyblue + ',1)',
//         //     background: 'rgba(' + __$__.colorRGB.skyblue + ',1)'
//         // }
//         color: 'skyblue'
//     },
//     edges: {
//         arrows: 'to',
//         color: {
//             color: 'skyblue',
//             opacity: 1.0,
//             highlight: 'skyblue',
//             hover: 'skyblue'
//         },
//         width: 3,
//         smooth: {
//             enabled: true,
//             forceDirection: 'none',
//             roundness: 1.0
//         }
//     },
//     physics: {
//         enabled: true
//     },
//     interaction: {
//         hover: true
//         // zoomView: false
//     },
//     manipulation: {
//         enabled: true,
//         addNode: false,
//         addEdge: __$__.Manipulate.addEdge,
//         editEdge: __$__.Manipulate.editEdge,
//         deleteNode: false,
//         deleteEdge: false
//     }
// };
// __$__.arraySize = 12;

__$__.ObjectGraphNetwork.data = {nodes: __$__.ObjectGraphNetwork.nodes, edges: __$__.ObjectGraphNetwork.edges};
__$__.ObjectGraphNetwork.network = new vis.Network(__$__.ObjectGraphNetwork.container, __$__.ObjectGraphNetwork.data, __$__.ObjectGraphNetwork.options);
__$__.ObjectGraphNetwork.network.on('doubleClick', __$__.JumpToConstruction.ClickEventFunction);
__$__.ObjectGraphNetwork.network.on('dragStart', params => {
    if (params.nodes.length > 0) {
        let nodeId = params.nodes[0];
        __$__.ObjectGraphNetwork.nodes.update({id: nodeId, fixed: false});
    }
});
__$__.ObjectGraphNetwork.network.on('dragEnd', params => {
    if (params.nodes.length > 0) {
        let nodeId = params.nodes[0];
        __$__.ObjectGraphNetwork.nodes.update({id: nodeId, fixed: true})
    }
});
__$__.ObjectGraphNetwork.network.on('dragging', __$__.Update.updateArrayPosition);
__$__.ObjectGraphNetwork.network.on('dragEnd', __$__.Update.updateArrayPosition);
__$__.ObjectGraphNetwork.network.on('dragEnd', __$__.StorePositions.registerPositions);
