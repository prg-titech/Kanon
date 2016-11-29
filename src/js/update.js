__$__.Update = {};


__$__.Update.CodeWithCheckPoint = '';

// this function is called when ace editor is edited.
__$__.Update.PositionUpdate = function() {
    window.localStorage["Kanon-Code"] = __$__.editor.getValue();
    let code = __$__.CodeConversion.TransformCode(__$__.editor.getValue());
    var __objs;
    try {
        eval(code);
        document.getElementById('console').textContent = '';
        var graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(__objs));
        
        if (!__$__.Update.isChange(graph)) {
            __$__.Update.context__$__.Update();
            return;
        }

        __$__.options.nodes.physics = true;
        __$__.StorePositions.setPositions(graph, true);
        __$__.network = new vis.Network(__$__.container, {nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)}, __$__.options);
        __$__.StorePositions.oldNetworkNodesData = __$__.network.body.data.nodes._data;
        __$__.StorePositions.oldNetworkEdgesData = __$__.network.body.data.edges._data;

        __$__.network.on("dragEnd", function(params) {
            __$__.StorePositions.registerPositions();
        });
        __$__.network.once("stabilized", function(params) {
            __$__.options.nodes.physics = false;
            __$__.network.setOptions(__$__.options);

            __$__.StorePositions.registerPositions();
            __$__.StorePositions.setPositions(graph);
            __$__.network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});


            __$__.Update.ContextUpdate();
        });
        __$__.network.on('click', __$__.Trace.ClickEventFunction);
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
__$__.Update.ContextUpdate = function(e) {
    if ((!__$__.network._callbacks.stabilized || !__$__.network._callbacks.stabilized.length) && document.getElementById('console').textContent == '') {
        __$__.Context.CheckPointTable = {};
        __$__.Update.CodeWithCheckPoint = __$__.CodeConversion.TransformCode(__$__.editor.getValue(), true);
        try {
            __$__.Context.StoredGraph = {};
            __$__.Context.StartEndInLoop = {}; // TODO: new!
            __$__.Context.TableTimeCounter = []; // TODO: new!
            __$__.Context.NestLoop = {}; // TODO: new!
            __$__.Context.StackToCheckLoop = ['noLoop'];
            __$__.Trace.TraceGraphData = {nodes: [], edges: []};
            eval(__$__.Update.CodeWithCheckPoint);

            // check maximum of Context.__loopContext
            // if loop doesn't include now context, now context is changed at the max of loop count
            Object.keys(__loopCounter).forEach(function(loopId) {
                if (__$__.Context.__loopContext[loopId] > __loopCounter[loopId]) __$__.Context.__loopContext[loopId] = __loopCounter[loopId];
            });

            __$__.Context.Draw();
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
__$__.Update.isChange = function(graph) {
    var graphNodes = graph.nodes.map(function(node) {
        return [node.id, node.label];
    });
    var graphEdges = graph.edges.map(function(edge) {
        return [edge.from, edge.to, edge.label];
    });

    var networkNodes = [];
    var temp = __$__.StorePositions.oldNetworkNodesData;
    Object.keys(temp).forEach(function(key){
        networkNodes.push([temp[key].id, temp[key].label]);
    });
    
    var networkEdges = [];
    temp = __$__.StorePositions.oldNetworkEdgesData;
    Object.keys(temp).forEach(function(key){
        networkEdges.push([temp[key].from, temp[key].to, temp[key].label]);
    });

    return (!Boolean(networkNodes) || !Boolean(networkEdges) ||
            JSON.stringify(graphNodes.sort()) != JSON.stringify(networkNodes.sort()) ||
            JSON.stringify(graphEdges.sort()) != JSON.stringify(networkEdges.sort()));
};
