__$__.Update = {
    CodeWithCP: '',
    waitForStabilized: false,
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
            });
        }

        try {
            try {
                __$__.Update.CodeWithCP = __$__.CodeConversion.TransformCode(__$__.editor.getValue());
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


            let graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(__objs));


            __$__.CallTreeNetwork.draw();

            if (!__$__.Update.isChange(graph)) {
                __$__.Update.waitForStabilized = false;
                __$__.Update.ContextUpdate();
                return;
            }


            __$__.options.nodes.hidden = true;
            __$__.options.edges.hidden = true;
            __$__.StorePositions.setPositions(graph, true);
            __$__.network.setOptions(__$__.options);
            __$__.nodes = new vis.DataSet(graph.nodes);
            __$__.edges = new vis.DataSet(graph.edges);
            __$__.network.setData({
                nodes: __$__.nodes,
                edges: __$__.edges
            });
            __$__.StorePositions.registerPositions(true);
            __$__.StorePositions.oldNetwork.edges = __$__.network.body.data.edges._data;
    
            let stabilized = params => {
                __$__.options.nodes.hidden = false;
                __$__.options.edges.hidden = false;
                __$__.network.setOptions(__$__.options);
                __$__.nodes.forEach(node => {
                    if (node.id.slice(0, 11) !== '__Variable-')
                        __$__.nodes.update({id: node.id, fixed: true});
                });
    
                if (__$__.Update.updateValueOfArray)
                    __$__.Update.updateArrayValuePosition();
    
                __$__.Update.waitForStabilized = false;
                __$__.StorePositions.registerPositions(true);
                __$__.Update.ContextUpdate();
            };
    
            __$__.Context.Arrays.forEach(array => {
                if (array.length >= 0) __$__.Update.updateArrayPosition({nodes: [array[0]]});
            });

            __$__.Update.waitForStabilized = true;
            if (graph.nodes.length > 0 && graph.nodes.filter(node => node.x === undefined).length > 0)
                __$__.network.once('stabilized', stabilized);
            else
                stabilized();
    
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
                if (__$__.Testize.cursorIsInFunctionCall()) {
                    __$__.Testize.enableButton();
                } else {
                    __$__.Testize.disableButton();
                }

            } catch (e) {
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                }
            }
            __$__.network.redraw();
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
        // let temp = (snapshot) ? __$__.nodes._data : __$__.Context.LastGraph.nodes;
        let temp = (snapshot) ? __$__.nodes._data : __$__.StorePositions.oldNetwork._nodesData;
        // let temp = __$__.nodes._data;

        Object.keys(temp).forEach(key => {
            if (snapshot)
                networkNodes.push([temp[key].id, temp[key].label, temp[key].color]);
            else if (temp[key].id && temp[key].id.slice(0, 11) !== '__Variable-')
                networkNodes.push([temp[key].id, temp[key].label]);
        });


        let networkEdges = [];
        // temp = (snapshot) ? __$__.edges._data : __$__.Context.LastGraph.edges;
        temp = (snapshot) ? __$__.edges._data : __$__.StorePositions.oldNetwork._edgesData;
        // temp = __$__.edges._data;

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
    UpdateLabelPositions: function(e) {
        let start = {line: e.start.row + 1, column: e.start.column};
        let end = {line: e.end.row + 1, column: e.end.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;
    
        if (e.action === 'insert') {
            let modify_by_insert = function(pos, kind, label) {
                // if inserted code is the upper part of the loop
                if (compare(start, '<=', pos.start)) {
                    if (pos.start.line === start.line) {
                        if (e.lines.length > 1) {
                            pos.start.column -= start.column;
                        }
                        pos.start.column += e.lines.last().length;
                    }
                    if (pos.end.line === start.line) {
                        if (e.lines.length > 1) {
                            pos.end.column -= start.column;
                        }
                        pos.end.column += e.lines.last().length;
                    }

                    pos.start.line += e.lines.length - 1;
                    pos.end.line   += e.lines.length - 1;
                } else if (compare(start, '<', pos.end)) { // if inserted code is the inner part of the loop
                    if (pos.end.line === start.line) {
                        if (e.lines.length > 1) {
                            pos.end.column -= start.column;
                        }
                        pos.end.column += e.lines.last().length;
                    }
                    pos.end.line += e.lines.length - 1;
                }
                // register position of this node to the table for when editing the boundary.
                __$__.UpdateLabelPos.table.get(pos.start.line, pos.start.column)[label] = {
                    pairPos: {line: pos.end.line, column: pos.end.column},
                    kind: kind
                };
                __$__.UpdateLabelPos.table.get(pos.end.line, pos.end.column)[label] = {
                    pairPos: {line: pos.start.line, column: pos.start.column},
                    kind: kind
                };
            };

            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    modify_by_insert(__$__.Context.LabelPos[kind][label], kind, label);
                });
            });
        } else { // e.action == 'remove'
            let modify_by_remove = function(pos, kind, label) {
                if (compare(start, '<=', pos.start) && compare(pos.end, '<=', end)) {
                    // if removed code is the outer part of the loop
                    delete __$__.Context.LabelPos[kind][label];
                } else {
                    // if removed code is the upper part of the loop
                    if (compare(end, '<=', pos.start)) {
                        if (pos.start.line === end.line) {
                            if (e.lines.length > 1) {
                                pos.start.column += start.column;
                            }
                            pos.start.column -= e.lines.last().length;
                        }
                        if (pos.end.line === end.line) {
                            if (e.lines.length > 1) {
                                pos.end.column += start.column;
                            }
                            pos.end.column -= e.lines.last().length;
                        }

                        pos.start.line -= e.lines.length - 1;
                        pos.end.line   -= e.lines.length - 1;
                    } else if (compare(pos.start, '<', start) && compare(end, '<', pos.end)) { // if removed code is the inner part of the loop
                        if (pos.end.line === end.line) {
                            if (e.lines.length > 1) {
                                pos.end.column += start.column;
                            }
                            pos.end.column -= e.lines.last().length;
                        }

                        pos.end.line   -= e.lines.length - 1;
                    } else if (compare(pos.start, '<', start) && compare(end, '==', pos.end) && !pos.closed) {
                        pos.end.column = start.column;
                        pos.end.line -= e.lines.length - 1;
                    }
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
            };

            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    let dlt = modify_by_remove(__$__.Context.LabelPos[kind][label], kind, label);
                    if (dlt)
                        delete __$__.Context.LabelPos[kind][label];
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
                let arrayLabels = Object.keys(__$__.network.body.data.nodes._data).filter(label => {
                    return label.indexOf(arr_label + '@block') >= 0;
                });
                let idx0 = arrayLabels.indexOf(id);
                let pos = __$__.network.getPositions(id)[id];
                for (let i = 0; i < arrayLabels.length; i++) {
                    __$__.network.moveNode(arrayLabels[i], pos.x + (i - idx0) * __$__.arraySize * 2, pos.y);
                }

                if (__$__.Update.updateValueOfArray)
                    __$__.Update.updateArrayValuePosition(arrayLabels);
            }
        }
    },

    updateArrayValuePosition: (arrayBlocks = Object.keys(__$__.nodes._data).filter(label => {return label.indexOf('@block') >= 0;})) => {
        Object.values(__$__.edges._data).forEach(edge => {
            let index = arrayBlocks.indexOf(edge.from);

            if (index >= 0) {
                if (__$__.nodes._data[edge.to].color && __$__.nodes._data[edge.to].color === 'white') {
                    let pos = __$__.network.getPositions(edge.from)[edge.from];
                    __$__.network.moveNode(edge.to, pos.x, pos.y + 100);
                    __$__.nodes.update({id: edge.to, fixed: true});
                }
            }
        });
    }
};
