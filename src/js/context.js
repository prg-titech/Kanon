__$__.Context = {
    ArrayLabels: [],
    Arrays: [],
    ChangedGraph: true,
    CheckPointID2LoopLabel: {},
    CheckPointTable: {},
    CheckPointAroundCursor: {},
    CheckPointIDAroundFuncCall: {},
    CallRelationship: {},
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
        __$__.Context.CallRelationship = {};
        __$__.Context.CallTreeNodesOfEachLoop = {main: [__$__.CallTree.rootNode]};
        __$__.Context.LastInfo = {};
        __$__.Context.StoredGraph = {};
        __$__.Context.TableTimeCounter = [];
    },


    // Draw() method is executed when user code is changed or the cursor position is moved
    Draw: function(e) {
        let cursor_position = __$__.editor.getCursorPosition();
        let checkPointIds = __$__.Context.FindCPIDNearCursorPosition(cursor_position);
        let checkPointId = __$__.Context.CheckPointAroundCursor = {
            beforeId: checkPointIds.beforeIds[0],
            afterId: checkPointIds.afterIds.last()
        };

        if (__$__.Context.Snapshot) {
            let loopLabel, cpID, graph;
            let contextSensitiveID;
            let showLightly = false;
            try {
                if (!checkPointId.afterId) {
                    cpID = checkPointId.beforeId = checkPointIds.beforeIds.last();
                } else if (__$__.Context.CheckPointTable[checkPointId.afterId].column === cursor_position.column &&
                           __$__.Context.CheckPointTable[checkPointId.afterId].line === cursor_position.row + 1) {
                    cpID = checkPointId.afterId;
                } else {
                    cpID = checkPointId.beforeId;
                }

                try {
                    loopLabel = __$__.Context.CheckPointID2LoopLabel[cpID];
                    if (loopLabel) {
                        contextSensitiveID = __$__.Context.SpecifiedContext[loopLabel];
                        graph = __$__.Context.StoredGraph[cpID][contextSensitiveID];
                        __$__.Context.SnapshotContext.cpID = cpID;
                        __$__.Context.SnapshotContext.loopLabel = loopLabel;
                        __$__.Context.SnapshotContext.contextSensitiveID = contextSensitiveID;
                    } else if (__$__.Context.CheckPointID2LoopLabel[__$__.ASTTransforms.pairCPID[cpID]]) {
                        let tmp_cpID = __$__.ASTTransforms.pairCPID[cpID];
                        let tmp_loopLabel = __$__.Context.CheckPointID2LoopLabel[tmp_cpID];
                        let tmp_contextSensitiveID = __$__.Context.SpecifiedContext[tmp_loopLabel];

                        if (__$__.Context.StoredGraph[tmp_cpID] && __$__.Context.StoredGraph[tmp_cpID][tmp_contextSensitiveID]) {
                            graph = __$__.Context.StoredGraph[tmp_cpID][tmp_contextSensitiveID];
                            __$__.Context.SnapshotContext.cpID = tmp_cpID;
                            __$__.Context.SnapshotContext.loopLabel = tmp_loopLabel;
                            __$__.Context.SnapshotContext.contextSensitiveID = tmp_contextSensitiveID;
                            showLightly = true;
                        } else {
                        }
                    }
                    __$__.StorePositions.setPositions(graph);
                } catch (e) {
                }


                if (!graph) {
                    delete __$__.Context.SnapshotContext.cpID;
                    delete __$__.Context.SnapshotContext.loopLabel;
                    delete __$__.Context.SnapshotContext.contextSensitiveID;
                }
            } catch (e) {
                delete __$__.Context.SnapshotContext.cpID;
                delete __$__.Context.SnapshotContext.loopLabel;
                delete __$__.Context.SnapshotContext.contextSensitiveID;
            }


            __$__.ObjectGraphNetwork.options.nodes.color = 'rgba(' + __$__.ObjectGraphNetwork.colorRGB.skyblue + ',' + ((showLightly) ? 0.5 : 1.0) + ')';
            __$__.ObjectGraphNetwork.options.edges.color.opacity = (showLightly) ? 0.5 : 1.0;
            __$__.ObjectGraphNetwork.network.setOptions(__$__.ObjectGraphNetwork.options);

            let isChanged;
            if (__$__.Layout.enabled && graph) {
                __$__.Layout.setLocation(graph);
                isChanged = Object.values(graph.nodes).some(node => {
                    let beforePos = __$__.StorePositions.oldNetwork.nodes[node.id];
                    return beforePos && (beforePos.x !== node.x || beforePos.y !== node.y);
                });
            }

            let visGraph = (graph) ? graph.generateVisjsGraph(true) : {nodes: [], edges: []};
            if (isChanged || e === 'changed' || e === 'redraw' || __$__.Update.isChange(visGraph, true)) {
                __$__.Animation.setData(visGraph);
                //console.log(visGraph);
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

                    // initialize
                    Object.values(beforeGraph.nodes).forEach(node => {
                        changeNodeId[node.id] = false;
                    });

                    Object.values(afterGraph.nodes).forEach(node => {
                        if (changeNodeId[node.id] === false)
                            delete changeNodeId[node.id];
                        else if (changeNodeId[node.id] === undefined) {
                            changeNodeId[node.id] = true;
                            addedNodeId[node.id] = true;
                        }
                    });



                    // this object checks whether each edge is added or removed or not
                    // if 'edge1' is added, changeEdgeData[edge1]: true.
                    // if 'edge2' is removed, changeEdgeData[edge2] : false.
                    // if there is 'edge3' in before graph and after graph, changeEdgeData[edge3]: undefined
                    let changeEdgeData = {};

                    beforeGraph.edges.forEach(edge => {
                        let edgeData = [edge.from, edge.to, edge.label].toString();
                        changeEdgeData[edgeData] = false;
                    });

                    afterGraph.edges.forEach(edge => {
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
    
            let graph = __$__.Context.LastGraph.duplicate();

            __$__.StorePositions.setPositions(graph);

            let isChanged;
            if (__$__.Layout.enabled) {
                __$__.Layout.setLocation(graph);
                isChanged = Object.values(graph.nodes).some(node => {
                    let beforePos = __$__.StorePositions.oldNetwork.nodes[node.id];
                    return beforePos && (beforePos.x !== node.x || beforePos.y !== node.y);
                });
            }

            let visGraph = graph.generateVisjsGraph(true);

            // change color of added node to orange in this part
            visGraph.nodes.forEach(node => {
                if (addedNodeId[node.id]) {
                    node.color = __$__.SummarizedViewColor.AddNode;
                    delete addedNodeId[node.id];
                }
            });
            // change color of added edge to orange in this part
            visGraph.edges.forEach(edge => {
                if (edge.from.slice(0, 11) === '__Variable-') edge.hidden = true;
    
                addedEdgeData.some((edgeData, index) => {
                    if (edgeData[0] === edge.from && edgeData[1] === edge.to && edgeData[2] === edge.label) {
                        edge.color = __$__.SummarizedViewColor.AddEdge;
                        delete addedEdgeData[index];
                        return true;
                    }
                });
            });

            // here might be not executed because the current implementation does not support GC.
            // Object.keys(addedNodeId).forEach(id => {
            //     if (id && id.slice(0, 11) !== '__Variable-') {
            //         let label = '';
            //
            //         Object.values(afterGraphs).forEach(graph => {
            //             graph.nodes.forEach(node => {
            //                 if (node.id === id) label = node.label;
            //             })
            //         });
            //
            //         if (id)
            //             visGraph.nodes.push({
            //                 fixed: false,
            //                 id: id,
            //                 label: label,
            //                 physics: false,
            //                 color: __$__.SummarizedViewColor.AddNode
            //             });
            //     }
            // });
    
            addedEdgeData.forEach(data => {
                if (data && data[0].slice(0, 11) !== '__Variable-')
                    visGraph.edges.push({
                        from: data[0],
                        to: data[1],
                        label: data[2],
                        color: __$__.SummarizedViewColor.AddEdge,
                        dashes: true
                    });
            });
    
            removedEdgeData.forEach(data => {
                if (data)
                    visGraph.edges.push({
                        from: data[0],
                        to: data[1],
                        label: data[2],
                        color: __$__.SummarizedViewColor.RemoveEdge,
                        dashes: true
                    });
            });
    
    
            if (isChanged || e === 'changed' || e === 'redraw' || __$__.Update.isChange(visGraph, true))
                __$__.Animation.setData(visGraph);
    
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
    
        Object.keys(__$__.Context.CheckPointTable).forEach(key => {
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
                if (!__$__.Error.hasError) {
                    __$__.Context.SpecifiedContextWhenExecutable[nearestLoopLabel] = __$__.Context.SpecifiedContext[nearestLoopLabel];
                }
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
    },


    /**
     * @param {Array} stackForCallTree
     * @constructor
     */
    RegisterCallRelationship(stackForCallTree) {
        let callLabel, sourceCSID;
        if (stackForCallTree[stackForCallTree.length - 2].constructor.name !== 'Instance') {
            callLabel = stackForCallTree[stackForCallTree.length - 2].label;
            sourceCSID = stackForCallTree[stackForCallTree.length - 2].getContextSensitiveID();
        }
        // for (let i = stackForCallTree.length-2; i >= 0; i--) {
        //     let node = stackForCallTree[i];
        //     if (node.constructor.name !== 'Instance') {
        //         callLabel = node.label;
        //         sourceCSID = node.getContextSensitiveID();
        //         break;
        //     }
        // }
        let targetCSID = stackForCallTree.last().getContextSensitiveID();
        if (callLabel && sourceCSID && targetCSID) {
            if (!__$__.Context.CallRelationship[sourceCSID])
                __$__.Context.CallRelationship[sourceCSID] = {};
            __$__.Context.CallRelationship[sourceCSID][targetCSID] = callLabel;
        }
    },
    // to add information to newly created objects.  For "new C(e...)"
    // in the source program, the code instrumetor generates
    //      __$__.Context.NewExpressionWrapprer(()=> new C(e...), ...vars...)
    // where the first argument is a thunk that performs the original new
    // expression.
    NewExpressionWrapprer(thunk, __newExpInfo, __loopLabels, __loopCount,
			  __stackForCallTree, label, class_name,
			  __newObjectIds, line, column, __objs) {
	__newExpInfo.push( line && {
            loopLabel: __loopLabels.last(),
            loopCount: __loopCount,
            pos: {
                line: line,
                column: column
            },
            contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
        });
        __stackForCallTree.push(new __$__.CallTree.Instance(label, __stackForCallTree, class_name));
        var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
        __newObjectIds.push(__newObjectId);
        var __temp = thunk();
        __$__.Context.ChangedGraph = true;
        __newExpInfo.pop();
        __stackForCallTree.pop();
	// the next if-statement cannot be replaced with a call
	// to setObjectID as the conditions are different.
	// Here, __newExpInfo.last() is false for array and
	// object literals.  At the same time, setObjectID is
	// called even when __newExpInfo.last() is false.  It
	// is possible because call to this method is inserted
	// not only to constructors, but also other methods
	// and functions.  Since JavaScript supports various
	// types of object constructions, we should be very
	// careful.
        if (!__temp.__id) {
            Object.setProperty(__temp, '__id', __newObjectIds.pop());
            __objs.push(__temp);
        }
        return __temp;

    },
    // set object ID if not set.  We set object ID either at
    // the beginning of a constructor, or just after returning
    // from a NEW expression.  Every constructor body is inserted
    // a call to this method.
    setObjectID(obj,__newExpInfo,__newObjectIds,__objs){
	if (__newExpInfo.last() && !obj.__id) {
	    Object.setProperty(obj, '__id', __newObjectIds.pop());
            __objs.push(obj);
        }
    }
};
