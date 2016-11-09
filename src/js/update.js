window.Update = {};


Update.CodeWithCheckPoint = '';

// this function is called when ace editor is edited.
Update.positionUpdate = function() {
    window.localStorage["code"] = editor.getValue();
    let code = CodeConversion.transformCode(editor.getValue());
    var __objs;
    try {
        eval(code);
        document.getElementById('console').textContent = '';
        var graph = translator(traverse(__objs));
        
        if (!Update.isChange(graph)) {
            Update.contextUpdate();
            return;
        }

        options.nodes.physics = true;
        StorePositions.setPositions(graph, true);
        network = new vis.Network(container, {nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)}, options);
        StorePositions.oldNetworkNodesData = network.body.data.nodes._data;
        StorePositions.oldNetworkEdgesData = network.body.data.edges._data;


        network.on("dragEnd", function(params) {
            StorePositions.registerPositions();
        });
        network.once("stabilized", function(params) {
            options.nodes.physics = false;
            network.setOptions(options);

            StorePositions.registerPositions();
            StorePositions.setPositions(graph);
            network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});


            Update.contextUpdate();
        });
        network.on('click', Trace.ClickEventFunction);
    } catch (e) {
        if (e == 'Infinite Loop') {
            document.getElementById('console').textContent = 'infinite loop?';
        }
    }
};


/**
 * This function is called when the cursor position in ace editor is changed.
 * This update the network with the context at the cursor position.
 */
Update.contextUpdate = function(e) {
    if ((!network._callbacks.stabilized || !network._callbacks.stabilized.length) && document.getElementById('console').textContent == '') {
        Context.CheckPointTable = {};
        Update.CodeWithCheckPoint = CodeConversion.transformCode(editor.getValue(), true);
        try {
            Context.StoreGraph = {};
            eval(Update.CodeWithCheckPoint);

            // check maximum of Context.__loopContext
            // if loop doesn't include now context, now context is changed at the max of loop count
            Object.keys(__loopCounter).forEach(function(loopId) {
                if (Context.__loopContext[loopId] > __loopCounter[loopId]) Context.__loopContext[loopId] = __loopCounter[loopId];
            });

            Context.__draw();
        } catch (e) {
            if (e == 'Infinite Loop') {
                document.getElementById('console').textContent = 'infinite loop?';
            }
        }
    }
};


/**
 * @param {Object} graph: graph has the property is nodes and edges
 *
 * This function compares old graph and new graph.
 * return true if new graph is different from old graph
 * return false otherwise
 */
Update.isChange = function(graph) {
    var graphNodes = graph.nodes.map(function(node) {
        return [node.id, node.label];
    });
    var graphEdges = graph.edges.map(function(edge) {
        return [edge.from, edge.to, edge.label];
    });

    var networkNodes = [];
    var temp = StorePositions.oldNetworkNodesData;
    Object.keys(temp).forEach(function(key){
        networkNodes.push([temp[key].id, temp[key].label]);
    });
    
    var networkEdges = [];
    temp = StorePositions.oldNetworkEdgesData;
    Object.keys(temp).forEach(function(key){
        networkEdges.push([temp[key].from, temp[key].to, temp[key].label]);
    });

    return (!Boolean(networkNodes) || !Boolean(networkEdges) ||
            JSON.stringify(graphNodes.sort()) != JSON.stringify(networkNodes.sort()) ||
            JSON.stringify(graphEdges.sort()) != JSON.stringify(networkEdges.sort()));
};


