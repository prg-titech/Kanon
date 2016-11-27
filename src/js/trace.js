__$__.Trace = {};


__$__.Trace.ClickElementContext = {};
__$__.Trace.ClickElement = {};


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

    try {
        eval(__$__.Update.CodeWithCheckPoint);
        __$__.Context.__loopContext[__$__.Trace.ClickElementContext.id] = __$__.Trace.ClickElementContext.count;

        // move cursor position to check point made the node or the edge 
        __$__.editor.moveCursorToPosition({row: __$__.Trace.ClickElementContext.pos.line - 1, column: __$__.Trace.ClickElementContext.pos.column});
        if (__$__.editor.getSelection().isEmpty()) {
            __$__.Update.ContextUpdate();
        } else {
            __$__.editor.getSelection().clearSelection();
        }
    } catch (e) {
        if (e == 'Infinite Loop') {
            document.getElementById('console').textContent = 'infinite loop?';
        } else {
            console.log(e);
        }
    }

    __$__.Trace.ClickElementContext = {};
    __$__.Trace.ClickElement = {};
};
