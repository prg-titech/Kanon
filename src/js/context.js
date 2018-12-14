__$__.Context = {
    ArrayLabels: [],
    Arrays: [],
    ChangedGraph: true,
    CheckPointID2LoopLabel: {},
    CheckPointTable: {},
    CheckPointAroundCursor: {},
    CheckPointIDAroundFuncCall: {},
    CallTreeNodesOfEachLoop: {},
    InfLoop: '',
    LabelPos: {
        Arr: {},
        Call: {},
        Loop: {},
        Obj: {},
        New: {}
    },
    LastInfo: {},
    LastGraph: undefined,
    SpecifiedContext: {main: 'main'}, // this property represents the user-selected context. So the name of this key should be improved. (e.g., UserSelectedContext)
    SpecifiedContextWhenExecutable: undefined,
    Snapshot: true,
    SnapshotContext: {},
    StoredGraph: {},
    TableTimeCounter: [],

    Initialize: () => {
        __$__.Context.ArrayLabels = [];
        __$__.Context.Arrays = [];
        __$__.Context.ChangedGraph = true;
        __$__.Context.CheckPointID2LoopLabel = {};
        __$__.Context.CheckPointTable = {};
        __$__.Context.CheckPointIDAroundFuncCall = {};
        __$__.Context.CallTreeNodesOfEachLoop = {main: [__$__.CallTree.rootNode]};
        __$__.Context.LastInfo = {};
        __$__.Context.StoredGraph = {};
        __$__.Context.TableTimeCounter = [];
    },

    /**
     * @param {Array} objects: this equals __objs in transformed code
     * @param {string} loopLabel
     * @param {int} count
     * @param {int} timeCounter
     * @param {int} checkPointId
     * @param {Object} probe
     * @param {Object} newExpInfo
     * @param {string} contextSensitiveID
     *
     * this function is checkPoint is located at the head and the tail of each Statement.
     */
    CheckPoint: function(objects, loopLabel, count, timeCounter, checkPointId, probe, newExpInfo, contextSensitiveID) {
        __$__.Context.LastInfo = {
            CPID: checkPointId,
            loopLabel: loopLabel,
            loopCount: count,
            contextSensitiveID: contextSensitiveID
        };

        let storedGraph = __$__.Context.StoreGraph(objects, loopLabel, timeCounter, checkPointId, probe, contextSensitiveID);
    
        __$__.Context.TableTimeCounter.push({loopLabel: loopLabel, loopCount: count});
        __$__.Context.CheckPointID2LoopLabel[checkPointId] = loopLabel;

    
        if (__$__.Context.ChangedGraph) {
            // the node of storedGraph is whether first appearing or not in this part
            storedGraph.nodes.forEach(node => {
                if (!__$__.JumpToConstruction.GraphData.nodes[node.id]) {
                    if (newExpInfo) {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: newExpInfo.loopLabel,
                            count: newExpInfo.loopCount,
                            contextSensitiveID: newExpInfo.contextSensitiveID,
                            pos: newExpInfo.pos
                        };
                    } else {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: loopLabel,
                            count: count,
                            contextSensitiveID: contextSensitiveID,
                            pos: __$__.Context.CheckPointTable[checkPointId]
                        };
                    }
                }
            });
    
            // the edge of storedGraph is whether first appearing or not in this part
            storedGraph.edges.forEach(edge => {
                let flag = false;

                __$__.JumpToConstruction.GraphData.edges.forEach(edgeData => {
                    flag = flag || (edge.from === edgeData.from && edge.to === edgeData.to && edge.label === edgeData.label);
                });
    
    
                if (!flag) {
                    if (newExpInfo) {
                        __$__.JumpToConstruction.GraphData.edges.push({
                            from: edge.from,
                            to: edge.to,
                            label: edge.label,
                            loopLabel: newExpInfo.loopLabel,
                            count: newExpInfo.loopCount,
                            contextSensitiveID: contextSensitiveID,
                            pos: newExpInfo.pos
                        });
                    } else {
                        __$__.JumpToConstruction.GraphData.edges.push({
                            from: edge.from,
                            to: edge.to,
                            label: edge.label,
                            loopLabel: loopLabel,
                            count: count,
                            contextSensitiveID: contextSensitiveID,
                            pos: __$__.Context.CheckPointTable[checkPointId]
                        });
                    }
                }
            });

            __$__.Context.ChangedGraph = false;
        }
    
        __$__.Context.LastGraph = storedGraph;
    },
    
    
    StoreGraph: function(objects, loopLabel, timeCounter, checkPointId, probe, contextSensitiveID) {
        let graph = (__$__.Context.ChangedGraph)
            ? __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, probe))
            : __$__.Context.LastGraph;


        if (!__$__.Context.StoredGraph[checkPointId])
            __$__.Context.StoredGraph[checkPointId] = {};

        __$__.Context.StoredGraph[checkPointId][contextSensitiveID] = graph;
    
    
        return graph;
    },
    
    
    // Draw() method is executed when user code is changed or the cursor position is moved
    Draw: function(e) {
        let cursor_position = __$__.editor.getCursorPosition();
        let checkPointIds = __$__.Context.FindCPIDNearCursorPosition(cursor_position);
        let checkPointId = __$__.Context.CheckPointAroundCursor = {
            beforeId: checkPointIds.beforeIds[0],
            afterId: checkPointIds.afterIds[0]
        };

        if (__$__.Context.Snapshot) {
            let loopLabel, cpID, cpIDs, graph;
            let contextSensitiveID;
            let showLightly = false;
            try {
                if (checkPointId.afterId &&
                    __$__.Context.CheckPointTable[checkPointId.afterId].column === cursor_position.column &&
                    __$__.Context.CheckPointTable[checkPointId.afterId].line === cursor_position.row + 1) {
                    cpID = checkPointId.afterId;
                    cpIDs = checkPointIds.afterIds;
                } else {
                    cpID = checkPointId.beforeId;
                    cpIDs = checkPointIds.beforeIds;
                }

                try {
                    loopLabel = __$__.Context.CheckPointID2LoopLabel[cpID];
                    if (loopLabel) {
                        contextSensitiveID = __$__.Context.SpecifiedContext[loopLabel];
                    } else if (__$__.Error.hasError &&
                        cpIDs.filter(cpid => __$__.ASTTransforms.pairCPID[cpid] === __$__.Context.LastInfo.CPID).length > 0) {


                        let tmp_loopLabel = __$__.Context.CheckPointID2LoopLabel[__$__.Context.LastInfo.CPID];
                        let tmp_contextSensitiveID = __$__.Context.SpecifiedContext[tmp_loopLabel];

                        if (tmp_loopLabel === __$__.Context.LastInfo.loopLabel
                            && tmp_contextSensitiveID === __$__.Context.LastInfo.contextSensitiveID) {
                            showLightly = true;
                            cpID = __$__.Context.LastInfo.CPID;
                            loopLabel = __$__.Context.CheckPointID2LoopLabel[cpID];
                            contextSensitiveID = __$__.Context.SpecifiedContext[loopLabel];
                        }
                    }


                    graph = __$__.Context.StoredGraph[cpID][contextSensitiveID];
                } catch (e) {
                    graph = {nodes: [], edges: []};
                }

                __$__.Context.SnapshotContext.cpID = cpID;
                __$__.Context.SnapshotContext.loopLabel = loopLabel;
                __$__.Context.SnapshotContext.contextSensitiveID = contextSensitiveID;
    
                if (!graph) graph = {nodes: [], edges: []};
            } catch (e) {
                graph = {nodes: [], edges: []};
            }

            __$__.StorePositions.setPositions(graph);

            __$__.ObjectGraphNetwork.options.nodes.color = 'rgba(' + __$__.ObjectGraphNetwork.colorRGB.skyblue + ',' + ((showLightly) ? 0.5 : 1.0) + ')';
            __$__.ObjectGraphNetwork.options.edges.color.opacity = (showLightly) ? 0.5 : 1.0;
            __$__.ObjectGraphNetwork.network.setOptions(__$__.ObjectGraphNetwork.options);

            let isChanged = false;

            if (__$__.Layout.enabled) {
                isChanged = __$__.Layout.setLinkedList(graph);
                isChanged = isChanged || __$__.Layout.setBinaryTree(graph);
            }
    
            if (isChanged || e === 'changed' || e === 'redraw' || __$__.Update.isChange(graph, true)) {
                __$__.Animation.setData(graph);
                if (__$__.Update.useBoxToVisualizeArray) {
                    __$__.Context.Arrays.forEach(arr => {
                        __$__.Update.updateArrayPosition({nodes: [arr[0]]});
                    });
                }
                __$__.StorePositions.registerPositions();
            }
        } else {
            if (!checkPointId.afterId)
                checkPointId.afterId = checkPointId.beforeId;
    
            let beforeLoopLabel = __$__.Context.CheckPointID2LoopLabel[checkPointId.beforeId];
            let afterLoopLabel = __$__.Context.CheckPointID2LoopLabel[checkPointId.afterId];

            let addedNodeId = {}, addedEdgeData = [];
            let removedEdgeData = [];
            let beforeGraphs, afterGraphs;

            // If beforeLoopLabel same afterLoopLabel, calculate the difference between before and after graph.
            if (beforeLoopLabel && afterLoopLabel && beforeLoopLabel === afterLoopLabel) {
                beforeGraphs = __$__.Context.StoredGraph[checkPointId.beforeId];
                afterGraphs  = __$__.Context.StoredGraph[checkPointId.afterId];

                let loopLabelsShouldBeChecked =
                    __$__.Context.CallTreeNodesOfEachLoop[afterLoopLabel]
                        .map(n => n.getContextSensitiveID())
                        .filter(csid => beforeGraphs[csid] && afterGraphs[csid]);

                // calculate the difference between before graph and after graph
                loopLabelsShouldBeChecked.forEach(csid => {
                    let beforeGraph = beforeGraphs[csid];
                    let afterGraph = afterGraphs[csid];

                    // this object checks whether each node is added or removed or not
                    // if 'node1' is added, changeNodeId[node1]: true.
                    // if 'node2' is removed, changeNodeId[node2] : false.
                    // if there is 'node3' in before graph and after graph, changeNodeId[node3]: undefined
                    let changeNodeId = {};

                    beforeGraph.nodes.forEach(node => {
                        changeNodeId[node.id] = false;
                    });

                    afterGraph.nodes.forEach(node => {
                        if (changeNodeId[node.id] === false)
                            delete changeNodeId[node.id];
                        else if (changeNodeId[node.id] === undefined)
                            changeNodeId[node.id] = true;
                    });


                    Object.keys(changeNodeId).forEach(id => {
                        if (changeNodeId[id])
                            addedNodeId[id] = true;
                    });

                    // this object checks whether each edge is added or removed or not
                    // if 'edge1' is added, changeEdgeData[edge1]: true.
                    // if 'edge2' is removed, changeEdgeData[edge2] : false.
                    // if there is 'edge3' in before graph and after graph, changeEdgeData[edge3]: undefined
                    let changeEdgeData = {};

                    beforeGraph.edges.forEach(edge => {
                        if (edge.from.slice(0, 11) === '__Variable-')
                            return;

                        let edgeData = [edge.from, edge.to, edge.label].toString();
                        changeEdgeData[edgeData] = false;
                    });

                    afterGraph.edges.forEach(edge => {
                        if (edge.from.slice(0, 11) === '__variable-')
                            return;

                        let edgeData = [edge.from, edge.to, edge.label].toString();
    
                        if (changeEdgeData[edgeData] === false)
                            delete changeEdgeData[edgeData];
                        else if (changeEdgeData[edgeData] === undefined)
                            changeEdgeData[edgeData] = true;
                    });

                    Object.keys(changeEdgeData).forEach(data => {
                        if (changeEdgeData[data])
                            addedEdgeData.push(data.split(','));
                        else
                            removedEdgeData.push(data.split(','));
                    });
                });

            }
    
            let graph = {nodes: [], edges: []};

            // copy __$__.Context.LastGraph to a abject named graph.
            __$__.Context.LastGraph.nodes.forEach(node => {
                graph.nodes.push(Object.assign({}, node));
            });
            __$__.Context.LastGraph.edges.forEach(edge => {
                graph.edges.push(Object.assign({}, edge));
            });

            __$__.StorePositions.setPositions(graph);

            let isChanged = false;
            if (__$__.Layout.enabled) {
                isChanged = __$__.Layout.setLinkedList(graph);
                isChanged = isChanged || __$__.Layout.setBinaryTree(graph);
            }
    
            // change color of added node to orange in this part
            graph.nodes.forEach(node => {
                if (addedNodeId[node.id]) {
                    node.color = __$__.SummarizedViewColor.AddNode;
                    delete addedNodeId[node.id];
                }
            });
            // change color of added edge to orange in this part
            graph.edges.forEach(edge => {
                if (edge.from.slice(0, 11) === '__Variable-') edge.hidden = true;
    
                addedEdgeData.forEach((edgeData, index) => {
                    if (edgeData[0] === edge.from && edgeData[1] === edge.to && edgeData[2] === edge.label) {
                        edge.color = __$__.SummarizedViewColor.AddEdge;
                        delete addedEdgeData[index];
                    }
                });
            });

            Object.keys(addedNodeId).forEach(id => {
                if (id && id.slice(0, 11) !== '__Variable-') {
                    let label = '';

                    Object.values(afterGraphs).forEach(graph => {
                        graph.nodes.forEach(node => {
                            if (node.id === id) label = node.label;
                        })
                    });

                    graph.nodes.push({
                        fixed: false,
                        id: id,
                        label: label,
                        physics: false,
                        color: __$__.SummarizedViewColor.AddNode
                    });
                }
            });
    
            addedEdgeData.forEach(data => {
                if (data && data[0].slice(0, 11) !== '__Variable-')
                    graph.edges.push({
                        from: data[0],
                        to: data[1],
                        label: data[2],
                        color: __$__.SummarizedViewColor.AddEdge,
                        dashes: true
                    });
            });
    
            removedEdgeData.forEach(data => {
                if (data)
                    graph.edges.push({
                        from: data[0],
                        to: data[1],
                        label: data[2],
                        color: __$__.SummarizedViewColor.RemoveEdge,
                        dashes: true
                    });
            });
    
    
            if (isChanged || e === 'changed' || e === 'redraw' || __$__.Update.isChange(graph, true))
                __$__.Animation.setData(graph);
    
            __$__.StorePositions.registerPositions();
        }
    },
    
    
    FindCPIDNearCursorPosition: function(pos = __$__.editor.getCursorPosition()) {
        let before;
        let after;
        let res = {
            beforeIds: [],
            afterIds: []
        };
    
        Object.keys(__$__.Context.CheckPointTable).forEach(function(key) {
            let temp = __$__.Context.CheckPointTable[key];
    
            // the case that temp can become before
            if (temp.line < pos.row + 1 || temp.line === pos.row + 1 && temp.column < pos.column) {
                if (!before || before.line === temp.line && before.column === temp.column) {
                    before = temp;
                    res.beforeIds.push(key);
                } else if (before.line < temp.line || before.line === temp.line && before.column < temp.column) {
                    before = temp;
                    res.beforeIds = [key];
                }
            } else {
                if (!after || after.line === temp.line && after.column === temp.column) {
                    after = temp;
                    res.afterIds.push(key);
                } else if (temp.line < after.line || after.line === temp.line && after.column > temp.column) {
                    after = temp;
                    res.afterIds = [key];
                }
            }
        });
    
    
        return res;
    },
    
    
    SwitchViewMode: function(isSnapshot) {
        __$__.Context.Snapshot = isSnapshot;

        if (isSnapshot) {
            __$__.Context.SnapshotContext = {};
        }
        document.getElementById('pullDownViewMode').value =
            (isSnapshot) ? 'Snapshot' : 'Summarized';
        __$__.ObjectGraphNetwork.options.manipulation.enabled = isSnapshot;
        __$__.ObjectGraphNetwork.network.setOptions(__$__.ObjectGraphNetwork.options);
    },


    /**
     * @param {string} loopLabel
     *
     * This function is executed when a context is changed.
     * the argument is loop's label, and the loop's label is 'loopLabel' of the loop whose context is changed.
     *
     * TODO: refactor depending on the context-sensitive ID
     */
    ChangeInnerAndParentContext: function(loopLabel) {
        // let new_contextSensitiveID = __$__.Context.LoopContext[loopLabel];
        // let new_loop_count = __$__.Context.LoopContext[loopLabel];
        // let start_end = __$__.Context.StartEndInLoop[loopLabel][new_loop_count-1];
        // let parentAndChildren = __$__.Context.ParentAndChildrenLoop[loopLabel];
        // let checkLoops = [];
        // let traverse = function(label, parent) {
        //     let comp = __$__.UpdateLabelPos.ComparePosition;
        //     checkLoops.push(label);
        //     if (parent) {
        //         if (__$__.Context.ParentAndChildrenLoop[label].parent) {
        //             traverse(__$__.Context.ParentAndChildrenLoop[label].parent, true);
        //         }
        //     } else {
        //         __$__.Context.ParentAndChildrenLoop[label].children.forEach(l => {
        //             traverse(l, false);
        //         });
        //     }
        // };
        // traverse(parentAndChildren.parent, true);
        // parentAndChildren.children.forEach(l => {
        //     traverse(l, false);
        // });
        //
        // checkLoops.forEach(key => {
        //     if (loopLabel === key || key === 'main')
        //         return;
        //
        //     let current_loop_count = __$__.Context.LoopContext[key];
        //     let range_of_key = __$__.Context.StartEndInLoop[key][current_loop_count - 1];
        //     if (range_of_key && (range_of_key.start <= start_end.start && start_end.end <= range_of_key.end ||
        //         start_end.start <= range_of_key.start && range_of_key.end <= start_end.end))
        //         return;
        //
        //     let correct_context = __$__.Context.StartEndInLoop[key].map(checked_s_e => {
        //         return checked_s_e.start <= start_end.start && start_end.end <= checked_s_e.end ||
        //                start_end.start <= checked_s_e.start && checked_s_e.end <= start_end.end
        //     }).indexOf(true);
        //
        //     if (correct_context === -1) {
        //         __$__.Context.setLoopContext(key, '=', null);
        //     } else {
        //         __$__.Context.setLoopContext(key, '=', correct_context + 1);
        //     }
        //
        // });
    },


    /**
     * If this function is called,
     * the context in a loop on the cursor position goes on the next/previous context.
     * @return {boolean}
     */
    MoveContextOnCursorPosition: function(moveTo) {
        let isChanged = false;

        // Find which loop should be changed.
        let nearestLoopLabelObj = __$__.Context.findLoopLabel();
        let nearestLoopLabel = nearestLoopLabelObj.loop,
            contextSensitiveIDOfNearestLoop = __$__.Context.SpecifiedContext[nearestLoopLabel];

        let idx;
        for (let i = 0; i < __$__.Context.CallTreeNodesOfEachLoop[nearestLoopLabel].length; i++) {
            if (__$__.Context.CallTreeNodesOfEachLoop[nearestLoopLabel][i].getContextSensitiveID() === contextSensitiveIDOfNearestLoop) {
                idx = i;
                break;
            }
        }

        if (idx !== undefined) {
            let newlyContextNode = __$__.Context.CallTreeNodesOfEachLoop[nearestLoopLabel][idx + moveTo];
            if (newlyContextNode) {
                __$__.Context.SpecifiedContext[nearestLoopLabel] = newlyContextNode.getContextSensitiveID();
                // __$__.Context.ChangeInnerAndParentContext(nearestLoopLabel);
                isChanged = true;
            }
        }


        return isChanged;
    },
    

    getObjectID: function(obj) {
        return obj.__id;
    },


    /**
     * @param posArg: {row, column} or {line, column}
     * @return {{loop: string, func: string}}
     */
    findLoopLabel: function(posArg = __$__.editor.getCursorPosition()) {
        let pos = {
            line: posArg.line || posArg.row + 1,
            column: posArg.column
        };
        let compare = __$__.UpdateLabelPos.ComparePosition;
        let nearestLoopLabels = {loop: 'main', func: 'main'};

        Object.keys(__$__.Context.LabelPos.Loop).forEach(loopLabel => {
            let checkProperty = ['loop'];
            if (loopLabel.slice(0, 3) !== 'For' && loopLabel.slice(0, 5) !== 'While')
                checkProperty.push('func');

            let loop = __$__.Context.LabelPos.Loop[loopLabel];

            if (compare(loop.start, "<", pos) && compare(pos, (loop.closed) ? "<" : "<=", loop.end)) {
                checkProperty.forEach(prop => {
                    // if nearestLoopLabel === 'main' then nearestLoop is undefined.
                    let nearestLoop = __$__.Context.LabelPos.Loop[nearestLoopLabels[prop]];
                    if (nearestLoopLabels[prop] === 'main'
                        || compare(nearestLoop.start, "<", loop.start) && compare(loop.end, "<", nearestLoop.end))
                        nearestLoopLabels[prop] = loopLabel;
                });
            }
        });

        return nearestLoopLabels;
    }
};
