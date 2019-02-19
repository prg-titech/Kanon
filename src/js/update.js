__$__.Update = {
    CodeWithCP: '',
    waitForStabilized: false,
    useBoxToVisualizeArray: false,
    updateValueOfArray: true,
    onlyMoveCursor: false,

    // this function is called when ace editor is edited.
    PositionUpdate: function(__arg__) {
        try {
            window.localStorage.setItem('Kanon-Code', __$__.editor.getValue());
        } catch (e) {
        }

        __$__.CallTree.Initialize();
        __$__.Context.Initialize();
        __$__.UpdateLabelPos.Initialize();
        __$__.Testize.initialize();
        __$__.JumpToConstruction.resetGraphData();
        __$__.editor.task.ContextUpdate = [];

        if (__arg__) {
            __arg__.forEach(act => {
                __$__.Update.UpdateLabelPositions(act);
                __$__.Testize.updateMarkerPosition(act);
            });
        }

        try {
            try {
                __$__.Update.CodeWithCP = __$__.CodeInstrumentation.instrument(__$__.editor.getValue());
            } catch (e) {
                document.getElementById('console').textContent = 'Syntax Error';
                if (e.message.slice(0, 5) === 'Line ')
                    document.getElementById('console').textContent += ': ' + e.message;
                throw e;
            }

            let __objs = [];
            // execution of the converted program
            // here, we collect constructed objects in the program
            // and duplicate object structure graphs at each checkpoint
            // inserted before and after all statements.
            try {
                (() => {eval(__$__.Update.CodeWithCP)})();
                __$__.Context.InfLoop = '';
                if (__$__.Error.hasError && __$__.Context.SpecifiedContextWhenExecutable) {
                    Object.keys(__$__.Context.SpecifiedContext).forEach(loopLabel => {
                        __$__.Context.SpecifiedContextWhenExecutable[loopLabel] = __$__.Context.SpecifiedContextWhenExecutable[loopLabel] ||  __$__.Context.SpecifiedContext[loopLabel];
                    });
                    __$__.Context.SpecifiedContext = __$__.Context.SpecifiedContextWhenExecutable;
                }
                __$__.Error.hasError = false;
                document.getElementById('console').textContent = '';
                 __$__.Context.InfLoop = '';
            } catch (e) {
                __$__.Error.hasError = true;
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                } else {
                    __$__.Context.InfLoop = '';
                    try {
                        eval(__$__.editor.getValue());
                    } catch (e) {
                        document.getElementById('console').textContent = 'Runtime Error: ' + e.message;
                    }
                }
            }

            if (!__$__.Error.hasError) {
                __$__.Context.SpecifiedContextWhenExecutable = Object.assign({}, __$__.Context.SpecifiedContext);
            }

            __$__.Testize.updateMarker();

            let graph = __$__.ToVisjs.translator(__$__.Traverse.traverse(__objs));


            __$__.CallTreeNetwork.updateTestInfo();
            __$__.CallTreeNetwork.draw();

            if (!__$__.Update.isChange(graph)) {
                __$__.Update.waitForStabilized = false;
                __$__.Update.ContextUpdate();
                return;
            }


            __$__.ObjectGraphNetwork.options.nodes.hidden = true;
            __$__.ObjectGraphNetwork.options.edges.hidden = true;
            __$__.StorePositions.setPositions(graph, true);
            __$__.ObjectGraphNetwork.network.setOptions(__$__.ObjectGraphNetwork.options);
            __$__.ObjectGraphNetwork.nodes = new vis.DataSet(graph.nodes);
            __$__.ObjectGraphNetwork.edges = new vis.DataSet(graph.edges);
            __$__.ObjectGraphNetwork.network.setData({
                nodes: __$__.ObjectGraphNetwork.nodes,
                edges: __$__.ObjectGraphNetwork.edges
            });
            __$__.StorePositions.registerPositions(true);
            __$__.StorePositions.oldNetwork.edges = __$__.ObjectGraphNetwork.network.body.data.edges._data;


            if (__$__.Update.useBoxToVisualizeArray)
                __$__.Context.Arrays.forEach(array => {
                    if (array.length >= 0) __$__.Update.updateArrayPosition({nodes: [array[0]]});
                });

            __$__.Update.waitForStabilized = true;
            if (graph.nodes.length > 0 && graph.nodes.find(node => node.x === undefined))
                __$__.ObjectGraphNetwork.network.once('stabilized', __$__.ObjectGraphNetwork.stabilizedEvent);
            else
                __$__.ObjectGraphNetwork.stabilizedEvent();

        } catch (e) {
            if (e === 'Infinite Loop') {
                document.getElementById('console').textContent = 'infinite loop?';
            }
            __$__.Update.waitForStabilized = true;
        }
    },
    

    /**
     * This function is called when the cursor position in ace editor is changed.
     * This update the network with the context at the cursor position.
     */
    ContextUpdate: function(e) {
        if (__$__.Update.waitForStabilized === false || e === 'changed') {
            try {
                Object.keys(__$__.Context.SpecifiedContext).forEach(loopLabel => {
                    if (!__$__.Context.CallTreeNodesOfEachLoop[loopLabel] || __$__.Context.CallTreeNodesOfEachLoop[loopLabel].length === 0) {
                        delete __$__.Context.SpecifiedContext[loopLabel];
                    } else if (__$__.Context.CallTreeNodesOfEachLoop[loopLabel].filter(node => node.getContextSensitiveID() === __$__.Context.SpecifiedContext[loopLabel]).length === 0) {
                        __$__.Context.SpecifiedContext[loopLabel] = __$__.Context.CallTreeNodesOfEachLoop[loopLabel][0].getContextSensitiveID();
                    }
                });

                __$__.Context.Draw(e);
                __$__.CallTreeNetwork.updateHighlightCircles();

            } catch (e) {
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                }
            }
            __$__.ObjectGraphNetwork.network.redraw();
        }
    },


    /**
     * @param {Object} graph: graph has the property is nodes and edges
     * @param {Boolean} snapshot
     *
     * This function compares old graph and new graph.
     * return true if new graph is different from old graph
     * return false otherwise
     */
    isChange: function(graph, snapshot = false) {
        let graphNodes = graph.nodes.map(node => {
            if (snapshot)
                return [node.id, node.label, node.color];
            else 
                return [node.id, node.label];
        });
        let graphEdges = graph.edges.map(edge => {
            if (snapshot)
                return [edge.from, edge.to, edge.label, edge.color];
            else
                return [edge.from, edge.to, edge.label];
        });
        let networkNodes = [];
        // let temp = (snapshot) ? __$__.ObjectGraphNetwork.nodes._data : __$__.Context.LastGraph.nodes;
        let temp = (snapshot) ? __$__.ObjectGraphNetwork.nodes._data : __$__.StorePositions.oldNetwork._nodesData;
        // let temp = __$__.ObjectGraphNetwork.nodes._data;

        Object.keys(temp).forEach(key => {
            if (snapshot)
                networkNodes.push([temp[key].id, temp[key].label, temp[key].color]);
            else if (temp[key].id && temp[key].id.slice(0, 11) !== '__Variable-')
                networkNodes.push([temp[key].id, temp[key].label]);
        });


        let networkEdges = [];
        // temp = (snapshot) ? __$__.ObjectGraphNetwork.edges._data : __$__.Context.LastGraph.edges;
        temp = (snapshot) ? __$__.ObjectGraphNetwork.edges._data : __$__.StorePositions.oldNetwork._edgesData;
        // temp = __$__.ObjectGraphNetwork.edges._data;

        Object.keys(temp).forEach(function(key){
            if (snapshot)
                networkEdges.push([temp[key].from, temp[key].to, temp[key].label, temp[key].color]);
            else if (temp[key].from.slice(0, 11) !== '__Variable-')
                networkEdges.push([temp[key].from, temp[key].to, temp[key].label]);
        });
    
    
        return (!Boolean(networkNodes) ||
                !Boolean(networkEdges) ||
                JSON.stringify(graphNodes.sort()) !== JSON.stringify(networkNodes.sort()) ||
                JSON.stringify(graphEdges.sort()) !== JSON.stringify(networkEdges.sort()));
    },


    /**
     * @param {Object} e : the data of changed code
     *
     * In this function, update the positions of newLabel, loopLabel and callLabel.
     * If user code is edited, this function is executed.
     */
    UpdateLabelPositions: function(editEvent) {
        let start = {line: editEvent.start.row + 1, column: editEvent.start.column};
        let end = {line: editEvent.end.row + 1, column: editEvent.end.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;
    
        if (editEvent.action === 'insert') {
            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    let pos = __$__.Context.LabelPos[kind][label];
                    __$__.UpdateLabelPos.modify_by_insert(editEvent, pos);

                    // register position of this node to the table for when editing the boundary.
                    __$__.UpdateLabelPos.table.get(pos.start.line, pos.start.column)[label] = {
                        pairPos: {line: pos.end.line, column: pos.end.column},
                        kind: kind
                    };
                    __$__.UpdateLabelPos.table.get(pos.end.line, pos.end.column)[label] = {
                        pairPos: {line: pos.start.line, column: pos.start.column},
                        kind: kind
                    };
                });
            });
        } else { // editEvent.action == 'remove'
            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    let pos = __$__.Context.LabelPos[kind][label];
                    if (compare(start, '<=', pos.start) && compare(pos.end, '<=', end)) {
                        // if removed code is the outer part of the loop
                        delete __$__.Context.LabelPos[kind][label];
                    } else {
                        __$__.UpdateLabelPos.modify_by_remove(editEvent, __$__.Context.LabelPos[kind][label]);

                        // register position of this node to the table for when editing the boundary.
                        __$__.UpdateLabelPos.table.get(pos.start.line, pos.start.column)[label] = {
                            pairPos: {line: pos.end.line, column: pos.end.column},
                            kind: kind
                        };
                        __$__.UpdateLabelPos.table.get(pos.end.line, pos.end.column)[label] = {
                            pairPos: {line: pos.start.line, column: pos.start.column},
                            kind: kind
                        };
                    }
                });
            });
        }
    },


    updateArrayPosition: params => {
        if (params.nodes.length > 0) {
            let id = params.nodes[0];
            let arr_label;
            let isBlock;

            // check that the id is belong to array
            __$__.Context.ArrayLabels.forEach(arr_l => {
                if (id.indexOf(arr_l) >= 0) {
                    arr_label = arr_l;
                    isBlock = id.indexOf('@block') >= 0;
                }
            });

            if (isBlock) {
                let arrayLabels = Object.keys(__$__.ObjectGraphNetwork.network.body.data.nodes._data).filter(label => {
                    return label.indexOf(arr_label + '@block') >= 0;
                });
                let idx0 = arrayLabels.indexOf(id);
                let pos = __$__.ObjectGraphNetwork.network.getPositions(id)[id];
                for (let i = 0; i < arrayLabels.length; i++) {
                    __$__.ObjectGraphNetwork.network.moveNode(arrayLabels[i], pos.x + (i - idx0) * __$__.ObjectGraphNetwork.arraySize * 2, pos.y);
                }

                if (__$__.Update.updateValueOfArray)
                    __$__.Update.updateArrayValuePosition(arrayLabels);
            }
        }
    },

    updateArrayValuePosition: (arrayBlocks = Object.keys(__$__.ObjectGraphNetwork.nodes._data).filter(label => label.indexOf('@block') >= 0)) => {
        Object.values(__$__.ObjectGraphNetwork.edges._data).forEach(edge => {
            let index = arrayBlocks.indexOf(edge.from);

            if (index >= 0) {
                if (__$__.ObjectGraphNetwork.nodes._data[edge.to].isLiteral) {
                    let pos = __$__.ObjectGraphNetwork.network.getPositions(edge.from)[edge.from];
                    __$__.ObjectGraphNetwork.network.moveNode(edge.to, pos.x, pos.y + 100);
                    __$__.ObjectGraphNetwork.nodes.update({id: edge.to, fixed: true});
                }
            }
        });
    }
};
