window.Trace = {};


Trace.ClickElementContext = {};
Trace.ClickElement = {};


/**
 * if you click on a node or edge, this function is executed.
 */
Trace.ClickEventFunction = function(param) {
    // choose node
    if (param.nodes.length) {
        Trace.ClickElement.node = param.nodes[0];
    }
    // choose edge
    else if (param.edges.length) {
        var edgeId = param.edges[0];
        Trace.ClickElement.edge = network.body.data.edges._data[edgeId];
    }
    // no choose
    else return;

    Context.ChangeContext(true);
    document.getElementById('context').textContent = 'Use Context';

    try {
        eval(Update.CodeWithCheckPoint);
        Context.__loopContext[Trace.ClickElementContext.id] = Trace.ClickElementContext.count;

        // move cursor position to check point made the node or the edge 
        editor.moveCursorToPosition({row: Trace.ClickElementContext.pos.line - 1, column: Trace.ClickElementContext.pos.column});
        if (editor.getSelection().isEmpty()) {
            Update.contextUpdate();
        } else {
            editor.getSelection().clearSelection();
        }
    } catch (e) {
        if (e == 'Infinite Loop') {
            document.getElementById('console').textContent = 'infinite loop?';
        }
    }

    Trace.ClickElementContext = {};
    Trace.ClickElement = {};
};
