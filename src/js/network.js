__$__.ObjectGraphNetwork = {
    container: document.getElementById('mynetwork'),
    nodes: new vis.DataSet({}),
    edges: new vis.DataSet({}),

    colorRGB: {
        skyblue: '135,206,235',
        pink: '200,0,200'   //追加部分
    },
    options: {
        autoResize: false,
        nodes: {
            // color: {
            //     border: 'rgba(' + __$__.colorRGB.skyblue + ',1)',
            //     background: 'rgba(' + __$__.colorRGB.skyblue + ',1)'
            // }
            //color: 'skyblue'
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
        groups: {       //追加部分
            pink: {
                color: 'rgba(255, 0, 255, 1.0)'
            },
            skyblue: {
                color: 'rgba(135, 206, 235, 1.0)'
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
    arraySize: 12,
    stabilizedEvent(param) {
        __$__.ObjectGraphNetwork.options.nodes.hidden = false;
        __$__.ObjectGraphNetwork.options.edges.hidden = false;
        __$__.ObjectGraphNetwork.network.setOptions(__$__.ObjectGraphNetwork.options);
        __$__.ObjectGraphNetwork.nodes.forEach(node => {
            if (node.id.slice(0, 11) !== '__Variable-')
                __$__.ObjectGraphNetwork.nodes.update({id: node.id, fixed: true});
                // __$__.ObjectGraphNetwork.nodes.update({id: node.id, fixed: true, group: node.color});
        });

        if (__$__.Update.updateValueOfArray)
            __$__.Update.updateArrayValuePosition();

        __$__.Update.waitForStabilized = false;
        __$__.StorePositions.registerPositions(true);
        __$__.Update.ContextUpdate();
    }
};

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
        __$__.ObjectGraphNetwork.nodes.update({id: nodeId, fixed: true});
    }
});
__$__.ObjectGraphNetwork.network.on('dragging', __$__.Update.updateArrayPosition);
__$__.ObjectGraphNetwork.network.on('dragEnd', __$__.Update.updateArrayPosition);
__$__.ObjectGraphNetwork.network.on('dragEnd', __$__.StorePositions.registerPositions);
