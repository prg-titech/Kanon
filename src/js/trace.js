__$__.Trace = {
    ClickElementContext: {},
    ClickElement: {},
    TraceGraphData: {nodes: [], edges: []}
};


/**
 * if you click on a node or edge, this function is executed.
 */
__$__.Trace.ClickEventFunction = function(param) {
    // choose node
    if (param.nodes.length) {
        __$__.Trace.ClickElement.node = param.nodes[0];
    }
    // choose edge
    else if (param.edges.length) {
        var edgeId = param.edges[0];
        __$__.Trace.ClickElement.edge = __$__.network.body.data.edges._data[edgeId];
    }
    // no choose
    else return;

    __$__.Context.SwitchContext(true);
    document.getElementById('context').textContent = 'Use Context';

    if (__$__.Trace.ClickElement.node)
        __$__.Trace.TraceGraphData.nodes.forEach(nodeData => {
            if (__$__.Trace.ClickElement.node == nodeData.id) {
                __$__.Context.LoopContext[nodeData.loopId] = nodeData.count;
                __$__.Context.ChangeInnerAndParentContext(nodeData.loopId);

                __$__.editor.moveCursorToPosition({row: nodeData.pos.line - 1, column: nodeData.pos.column});
            }
        });
    else
        __$__.Trace.TraceGraphData.edges.forEach(edgeData => {
            if (__$__.Trace.ClickElement.edge.from == edgeData.from &&
                __$__.Trace.ClickElement.edge.to == edgeData.to &&
                __$__.Trace.ClickElement.edge.label == edgeData.label) {

                __$__.Context.LoopContext[edgeData.loopId] = edgeData.count;
                __$__.Context.ChangeInnerAndParentContext(edgeData.loopId);

                __$__.editor.moveCursorToPosition({row: edgeData.pos.line - 1, column: edgeData.pos.column});
            }
        });
    if (__$__.editor.getSelection().isEmpty()) {
        __$__.Update.ContextUpdate();
    } else {
        __$__.editor.getSelection().clearSelection();
    }

    __$__.Trace.ClickElementContext = {};
    __$__.Trace.ClickElement = {};
};
