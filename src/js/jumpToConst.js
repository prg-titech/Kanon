__$__.JumpToConstruction = {
    ClickElement: {},
    GraphData: {nodes: {}, edges: []},


    /**
     * if you click on a node or edge, this function is executed.
     */
    ClickEventFunction: function(param) {
        // choose node
        if (param.nodes.length && param.nodes[0] !== '__Variable-this') {
            __$__.JumpToConstruction.ClickElement.node = param.nodes[0];
        }
    
        // choose edge
        else if (param.edges.length) {
            let edgeId = param.edges[0];
            __$__.JumpToConstruction.ClickElement.edge = __$__.ObjectGraphNetwork.network.body.data.edges._data[edgeId];
        }
    
        // no choose
        else return;
    
        __$__.Context.SwitchViewMode(true);

        if (__$__.JumpToConstruction.ClickElement.node) {
            let nodeData = __$__.JumpToConstruction.GraphData.nodes[__$__.JumpToConstruction.ClickElement.node];
            if (nodeData) {
                if (nodeData.loopLabel !== 'main') {
                    __$__.Context.SpecifiedContext[nodeData.loopLabel] = nodeData.contextSensitiveID;
                    if (!__$__.Error.hasError) {
                        __$__.Context.SpecifiedContextWhenExecutable[nodeData.loopLabel] = nodeData.contextSensitiveID;
                    }
                    __$__.Context.ChangeInnerAndParentContext(nodeData.loopLabel);
                }

                __$__.editor.moveCursorToPosition({
                    row: nodeData.pos.line - 1,
                    column: nodeData.pos.column
                });
            }
        }

        else
            __$__.JumpToConstruction.GraphData.edges.forEach(edgeData => {
                if (__$__.JumpToConstruction.ClickElement.edge.from === edgeData.from &&
                    __$__.JumpToConstruction.ClickElement.edge.to === edgeData.to &&
                    __$__.JumpToConstruction.ClickElement.edge.label === edgeData.label) {

                    if (edgeData.loopLabel !== 'main') {
                        __$__.Context.SpecifiedContext[edgeData.loopLabel] = edgeData.contextSensitiveID;
                        if (!__$__.Error.hasError) {
                            __$__.Context.SpecifiedContextWhenExecutable[edgeData.loopLabel] = edgeData.contextSensitiveID;
                        }
                        __$__.Context.ChangeInnerAndParentContext(edgeData.loopLabel);
                    }

                    __$__.editor.moveCursorToPosition({
                        row: edgeData.pos.line - 1,
                        column: edgeData.pos.column
                    });
                }
            });

        // if the cursor is changed, the editor selects a range from the previous cursor position to the newly position.
        // Therefore, if the editor has a selection, all Kanon has to do is remove the selection because the moving cursor invokes __$__.Update.ContextUpdate.
        // If the editor does not have a selection, Kanon has to execute the function __$__.Update.ContextUpdate.
        if (__$__.editor.getSelection().isEmpty()) {
            __$__.Update.ContextUpdate();
        } else {
            __$__.editor.getSelection().clearSelection();
        }
    
    
        __$__.JumpToConstruction.ClickElement = {};
    },

    resetGraphData: function() {
        __$__.JumpToConstruction.GraphData = {nodes: {}, edges: []};
    }
};
