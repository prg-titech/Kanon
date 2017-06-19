__$__.JumpToConstruction = {
    ClickElement: {},
    ClickElementContext: {},
    GraphData: {nodes: [], edges: []},


    /**
     * if you click on a node or edge, this function is executed.
     */
    ClickEventFunction: function(param) {
        // choose node
        if (param.nodes.length) {
            __$__.JumpToConstruction.ClickElement.node = param.nodes[0];
        }
    
        // choose edge
        else if (param.edges.length) {
            var edgeId = param.edges[0];
            __$__.JumpToConstruction.ClickElement.edge = __$__.network.body.data.edges._data[edgeId];
        }
    
        // no choose
        else return;
    
        __$__.Context.SwitchViewMode(true);
    
        if (__$__.JumpToConstruction.ClickElement.node)
            __$__.JumpToConstruction.GraphData.nodes.forEach(nodeData => {
                if (__$__.JumpToConstruction.ClickElement.node == nodeData.id) {
                    __$__.Context.setLoopContext(nodeData.loopLabel, '=', nodeData.count);
                    __$__.Context.ChangeInnerAndParentContext(nodeData.loopLabel);
    
                    __$__.editor.moveCursorToPosition({
                        row: nodeData.pos.line - 1,
                        column: nodeData.pos.column
                    });
                }
            });
    
        else
            __$__.JumpToConstruction.GraphData.edges.forEach(edgeData => {
                if (__$__.JumpToConstruction.ClickElement.edge.from == edgeData.from &&
                    __$__.JumpToConstruction.ClickElement.edge.to == edgeData.to &&
                    __$__.JumpToConstruction.ClickElement.edge.label == edgeData.label) {
    
                    __$__.Context.setLoopContext(edgeData.loopLabel, '=', edgeData.count);
                    __$__.Context.ChangeInnerAndParentContext(edgeData.loopLabel);
    
                    __$__.editor.moveCursorToPosition({
                        row: edgeData.pos.line - 1,
                        column: edgeData.pos.column
                    });
                }
            });
    
        if (__$__.editor.getSelection().isEmpty()) {
            __$__.Update.ContextUpdate();
        } else {
            __$__.editor.getSelection().clearSelection();
        }
    
    
        __$__.JumpToConstruction.ClickElementContext = {};
        __$__.JumpToConstruction.ClickElement = {};
    }
};
