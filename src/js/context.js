__$__.Context = {
    ArrayLabels: [],
    Arrays: [],
    ChangedGraph: true,
    CheckPointTable: {},
    CheckPointAroundCursor: {},
    InfLoop: '',
    LabelPos: {
        Arr: {},
        Call: {},
        Loop: {},
        Obj: {},
        New: {}
    },
    LastGraph: undefined,
    LoopContext: {'noLoop': 1},
    ParentAndChildrenLoop: {noLoop: {child: []}},
    ParentAndChildrenLoopStack: ['noLoop'],
    SensitiveContextForLoop: {},
    BeforeSensitiveContextForLoop: {},
    Snapshot: true,
    SnapshotContext: {},
    StackToCheckLoop: ['noLoop'],
    StoredGraph: {},
    StartEndInLoop: {},
    TableTimeCounter: [],
    __loopCounter: {},

    Initialize: () => {
        __$__.Context.ArrayLabels = [];
        __$__.Context.Arrays = [];
        __$__.Context.ChangedGraph = true;
        __$__.Context.CheckPointTable = {};
        __$__.Context.ParentAndChildrenLoop = {noLoop: {children: []}};
        __$__.Context.ParentAndChildrenLoopStack = ['noLoop'];
        __$__.Context.SensitiveContextForLoop = {};
        __$__.Context.StoredGraph = {};
        __$__.Context.StartEndInLoop = {};
        __$__.Context.StackToCheckLoop = ['noLoop'];
        __$__.Context.TableTimeCounter = [];
        __$__.Context.__loopCounter = {};
    },

    /**
     * @param {Array} objects: this equals __objs in transformed code
     * @param {string} loopLabel
     * @param {int} count
     * @param {int} timeCounter
     * @param {int} checkPointId
     * @param {Object} probe
     * @param {Object} newExpInfo
     *
     * this function is checkPoint is located at the head and the tail of each Statement.
     */
    CheckPoint: function(objects, loopLabel, count, timeCounter, checkPointId, probe, newExpInfo) {

        let storedGraph = __$__.Context.StoreGraph(objects, loopLabel, count, timeCounter, checkPointId, probe);
    
        __$__.Context.TableTimeCounter.push({loopLabel: loopLabel, loopCount: count});
    
    
        if (__$__.Context.ChangedGraph) {
            // the node of storedGraph is whether first appearing or not in this part
            storedGraph.nodes.forEach(node => {
                if (!__$__.JumpToConstruction.GraphData.nodes[node.id]) {
                    if (newExpInfo) {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: newExpInfo.loopLabel,
                            count: newExpInfo.loopCount,
                            pos: newExpInfo.pos
                        };
                    } else {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: loopLabel,
                            count: count,
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
                            pos: newExpInfo.pos
                        });
                    } else {
                        __$__.JumpToConstruction.GraphData.edges.push({
                            from: edge.from,
                            to: edge.to,
                            label: edge.label,
                            loopLabel: loopLabel,
                            count: count,
                            pos: __$__.Context.CheckPointTable[checkPointId]
                        });
                    }
                }
            });

            __$__.Context.ChangedGraph = false;
        }
    
        __$__.Context.LastGraph = storedGraph;
    },
    
    
    StoreGraph: function(objects, loopLabel, count, timeCounter, checkPointId, probe) {
        let graph = (__$__.Context.ChangedGraph)
            ? __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, probe))
            : __$__.Context.LastGraph;

        if (!__$__.Context.StoredGraph[checkPointId])
            __$__.Context.StoredGraph[checkPointId] = {};
    
        if (!__$__.Context.StoredGraph[checkPointId][loopLabel])
            __$__.Context.StoredGraph[checkPointId][loopLabel] = {};
    
        __$__.Context.StoredGraph[checkPointId][loopLabel][count] = graph;
    
    
        return graph;
    },
    
    
    // Draw() method is executed when user code is changed or the cursor position is moved
    Draw: function(e) {
        let cursorPos = __$__.editor.getCursorPosition();
        let checkPointId = __$__.Context.FindId(cursorPos);

        if (__$__.Context.Snapshot) {
            let loopLabel, count, cpID, graph;
            try {
                if (checkPointId.afterId &&
                    __$__.Context.CheckPointTable[checkPointId.afterId].column === cursorPos.column &&
                    __$__.Context.CheckPointTable[checkPointId.afterId].line === cursorPos.row + 1)
                    cpID = checkPointId.afterId;
                else
                    cpID = checkPointId.beforeId;

                try {
                    loopLabel = Object.keys(__$__.Context.StoredGraph[cpID])[0];
                    count = __$__.Context.LoopContext[loopLabel];
                    graph = __$__.Context.StoredGraph[cpID][loopLabel][count];
                } catch (e) {
                    // if (!__$__.Update.onlyMoveCursor) {
                    //     graph = __$__.Context.LastGraph;
                    // } else {
                        graph = {nodes: [], edges: []};
                    // }
                }

                __$__.Context.SnapshotContext['cpID'] = cpID;
                __$__.Context.SnapshotContext['loopLabel'] = loopLabel;
                __$__.Context.SnapshotContext['count'] = count;
    
                if (!graph) graph = {nodes: [], edges: []};
            } catch (e) {
                graph = {nodes: [], edges: []};
            }

            __$__.StorePositions.setPositions(graph);

            let isChanged = false;

            if (__$__.Layout.enabled) {
                isChanged = __$__.Layout.setLinkedList(graph);
                isChanged = isChanged || __$__.Layout.setBinaryTree(graph);
            }
    
            if (isChanged || e === 'changed' || e === 'redraw' || __$__.Update.isChange(graph, true)) {
                __$__.Animation.setData(graph);
                __$__.Context.Arrays.forEach(arr => {
                    __$__.Update.updateArray({nodes: [arr[0]]});
                });
                __$__.StorePositions.registerPositions();
            }
        } else {
            if (!checkPointId.afterId)
                checkPointId.afterId = checkPointId.beforeId;
    
            let beforeLoopLabel = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
            let afterLoopLabel  = Object.keys(__$__.Context.StoredGraph[checkPointId.afterId])[0];
    
            let addedNodeId = {}, addedEdgeData = [];
            let removedEdgeData = [];
            let beforeGraphs, afterGraphs;
            let loopCount;
    
            // If beforeLoopLabel same afterLoopLabel, calculate the difference between before and after graph.
            if (beforeLoopLabel === afterLoopLabel) {
                beforeGraphs = __$__.Context.StoredGraph[checkPointId.beforeId][beforeLoopLabel];
                afterGraphs  = __$__.Context.StoredGraph[checkPointId.afterId][afterLoopLabel];
    
                // take the number of common loop here
                loopCount = [];
                let afterGraphsCount = Object.keys(afterGraphs);
    
    
                Object.keys(beforeGraphs).forEach(num => {
                    if (afterGraphsCount.indexOf(num) !== -1)
                        loopCount.push(num);
                });
    
    
                // calculate the difference between before graph and after graph
                for (let i = 0; i < loopCount.length; i++) {
                    let beforeGraph = beforeGraphs[loopCount[i]];
                    let afterGraph = afterGraphs[loopCount[i]];
    
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
                        changeEdgeData[[edge.from, edge.to, edge.label].toString()] = false;
                    });
    
                    afterGraph.edges.forEach(edge => {
                        let data = [edge.from, edge.to, edge.label].toString();
    
                        if (changeEdgeData[data] === false)
                            delete changeEdgeData[data];
                        else if (changeEdgeData[data] === undefined)
                            changeEdgeData[data] = true;
                    });
    
                    Object.keys(changeEdgeData).forEach(data => {
                        if (changeEdgeData[data])
                            addedEdgeData.push(data.split(','));
                        else
                            removedEdgeData.push(data.split(','));
                    })
                }
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
                if (id && id.slice(0, 11) !== '__Variable-' && loopCount) {
                    let label = '';

                    let afterGraph = afterGraphs[loopCount[loopCount.length-1]];
                    afterGraph.nodes.forEach(node => {
                        if (node.id === id) label = node.label;
                    });

                    graph.nodes.push({
                        fixed: false,
                        id: id,
                        label: label,
                        physics: false,
                        color: __$__.SummarizedViewColor.AddNode
                        }
                    );
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
    
    
    FindId: function(pos) {
        let before;
        let after;
        let res = {};
    
        Object.keys(__$__.Context.CheckPointTable).forEach(function(key) {
            let temp = __$__.Context.CheckPointTable[key];
    
            // the case that temp can become before
            if (temp.line < pos.row + 1 || temp.line === pos.row + 1 && temp.column < pos.column) {
                if (!before || before.line < temp.line || before.line === temp.line && before.column <= temp.column) {
                    before = temp;
                    res.beforeId = key;
                }
            } else {
                if (!after || temp.line < after.line || after.line === temp.line && after.column >= temp.column) {
                    after = temp;
                    res.afterId = key;
                }
            }
        });
    
    
        return res;
    },
    
    
    SwitchViewMode: function(isSnapshot) {
        __$__.Context.Snapshot = isSnapshot;
        let elem = document.getElementById('viewmode');
    
        elem.textContent = (isSnapshot) ? 'View Mode: Snapshot' : 'View Mode: Summarized';
        if (isSnapshot)
            __$__.Context.SnapshotContext = {};
    },
    

    /**
     * @param {string} loopLabel
     *
     * This function is executed when a context is changed.
     * the argument is loop's label, and the loop's label is 'loopLabel' of the loop whose context is changed.
     *
     */
    ChangeInnerAndParentContext: function(loopLabel) {
        let new_loop_count = __$__.Context.LoopContext[loopLabel];
        let start_end = __$__.Context.StartEndInLoop[loopLabel][new_loop_count-1];
        let parentAndChildren = __$__.Context.ParentAndChildrenLoop[loopLabel];
        let checkLoops = [];
        let traverse = function(label, parent) {
            let comp = __$__.Update.ComparePosition;
            checkLoops.push(label);
            if (parent) {
                if (__$__.Context.ParentAndChildrenLoop[label].parent) {
                    traverse(__$__.Context.ParentAndChildrenLoop[label].parent, true);
                }
            } else {
                __$__.Context.ParentAndChildrenLoop[label].children.forEach(l => {
                    traverse(l, false);
                });
            }
        };
        traverse(parentAndChildren.parent, true);
        parentAndChildren.children.forEach(l => {
            traverse(l, false);
        });

        checkLoops.forEach(key => {
            if (loopLabel === key || key === 'noLoop')
                return;
    
            let current_loop_count = __$__.Context.LoopContext[key];
            let s_e = __$__.Context.StartEndInLoop[key][current_loop_count - 1];
            if (s_e && (s_e.start <= start_end.start && start_end.end <= s_e.end ||
                start_end.start <= s_e.start && s_e.end <= start_end.end))
                return;
    
            let correct_context = __$__.Context.StartEndInLoop[key].map(checked_s_e => {
                return checked_s_e.start <= start_end.start && start_end.end <= checked_s_e.end ||
                       start_end.start <= checked_s_e.start && checked_s_e.end <= start_end.end
            }).indexOf(true);
    
            if (correct_context === -1) {
                __$__.Context.setLoopContext(key, '=', null);
            } else {
                __$__.Context.setLoopContext(key, '=', correct_context + 1);
            }
    
        });
    },


    /**
     * If this function is called,
     * the context in a loop on the cursor position goes on the next/previous context.
     * @return {boolean}
     */
    MoveContextOnCursorPosition: function(moveTo) {
        let isChanged = false;

        // Find which loop should be changed.
        let nearestLoopLabelObj = __$__.Context.findNearestLoopLabel();
        let nearestLoopLabel = nearestLoopLabelObj.loop,
            nearestFuncLabel = nearestLoopLabelObj.func,
            nearestLoop = __$__.Context.StartEndInLoop[nearestLoopLabel],
            nearestFunc = __$__.Context.StartEndInLoop[nearestFuncLabel],
            nearestLoopContext = __$__.Context.LoopContext[nearestLoopLabel],
            nearestFuncContext = __$__.Context.LoopContext[nearestFuncLabel];

        let moveLoopContext = function() {
            if (nearestLoop[nearestLoopContext - 1 + moveTo]) {
                __$__.Context.setLoopContext(nearestLoopLabel, '+=', moveTo);
                __$__.Context.ChangeInnerAndParentContext(nearestLoopLabel);
                isChanged = true;
            }
        };

        if (nearestLoop === undefined)
            return isChanged;

        if (nearestLoopLabel !== 'noLoop') {
            if (nearestFuncLabel === 'noLoop') {
                moveLoopContext();
            } else if (nearestFuncLabel === nearestLoopLabel) {
                moveLoopContext();
            } else {
                if (nearestLoop[nearestLoopContext - 1 + moveTo]) {
                    let loopStartEndAfterMove = nearestLoop[nearestLoopContext - 1 + moveTo];
                    let funcStartEndBeforeMove = nearestFunc[nearestFuncContext - 1];

                    // the case that the context of outer function even if the context of this loop is changed
                    // The context of the nearest loop changes in this case
                    if (nearestLoopContext !== null && funcStartEndBeforeMove && funcStartEndBeforeMove.start <= loopStartEndAfterMove.start && loopStartEndAfterMove.end <= funcStartEndBeforeMove.end) {
                        moveLoopContext();
                    }
                }
            }
        }

        return isChanged;
    },
    

    getObjectID: function(obj) {
        return obj.__id;
    },

    setLoopContext: function(label, ope, n) {
        let prog = '__$__.Context.LoopContext[label] ' + ope + ' ' + n + ';';
        eval(prog);
        __$__.ShowContext.update(label);
    },

    findNearestLoopLabel: function() {
        let cursor = __$__.editor.getCursorPosition();
        cursor.line = cursor.row + 1;
        let compare = __$__.Update.ComparePosition;
        let nearestLoopLabels = {loop: 'noLoop', func: 'noLoop'};

        Object.keys(__$__.Context.LabelPos.Loop).forEach(loopLabel => {
            let checkProperty = ['loop'];
            if (loopLabel.slice(0, 3) !== 'For' && loopLabel.slice(0, 5) !== 'While')
                checkProperty.push('func');

            let loop = __$__.Context.LabelPos.Loop[loopLabel];

            if (compare(loop.start, "<", cursor) && compare(cursor, "<", loop.end)) {
                checkProperty.forEach(prop => {
                    // if nearestLoopLabel === 'noLoop' then nearestLoop is undefined.
                    let nearestLoop = __$__.Context.LabelPos.Loop[nearestLoopLabels[prop]];
                    if (nearestLoopLabels[prop] === 'noLoop'
                        || compare(nearestLoop.start, "<", loop.start) && compare(loop.end, "<", nearestLoop.end))
                        nearestLoopLabels[prop] = loopLabel;
                });
            }
        });

        return nearestLoopLabels;
    }
};
