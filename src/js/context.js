__$__.Context = {
    Snapshot: true,
    LastGraph: undefined,
    StackToCheckLoop: ['noLoop'],
    StoredGraph: {},
    StartEndInLoop: {},
    NestLoop: {},
    TableTimeCounter: [],
    LoopContext: {'noLoop': 1},
    CheckPointTable: {},
    LoopLabelPosition: {},
    CallLabelPosition: {},
    NewLabelPosition: {}
};


__$__.Context.Initialize = function() {
    __$__.Context.StoredGraph = {};
    __$__.Context.StartEndInLoop = {};
    __$__.Context.TableTimeCounter = [];
    __$__.Context.NestLoop = {};
    __$__.Context.StackToCheckLoop = ['noLoop'];
    __$__.Context.CheckPointTable = {};
}


/**
 * @param {Array} objects: this equals __objs in transformed code
 * @param {string} loopLabel
 * @param {int} count
 * @param {int} timeCounter
 * @param {int} checkPointId
 * @param {Object} probe
 *
 * this function is checkPoint is located at the head and the tail of each Statement.
 */
__$__.Context.CheckPoint = function(objects, loopLabel, count, timeCounter, checkPointId, probe) {
    var storedGraph = __$__.Context.StoreGraph(objects, loopLabel, count, checkPointId, probe);

    __$__.Context.TableTimeCounter.push({loopLabel: loopLabel, loopCount: count});


    if (!__$__.Context.NestLoop[loopLabel]) __$__.Context.NestLoop[loopLabel] = {inner: [], parent: []};


    // make __$__.Context.NestLoop
    if (__$__.Context.StackToCheckLoop[__$__.Context.StackToCheckLoop.length - 1] != loopLabel) {
        var parent = __$__.Context.StackToCheckLoop[__$__.Context.StackToCheckLoop.length - 1];

        if (__$__.Context.StackToCheckLoop[__$__.Context.StackToCheckLoop.length - 2] == loopLabel) {
            __$__.Context.StackToCheckLoop.pop();
        } else {
            if (parent && __$__.Context.NestLoop[loopLabel].parent.indexOf(parent) == -1)
                __$__.Context.NestLoop[loopLabel].parent.push(parent);


            if (parent && __$__.Context.NestLoop[parent].inner.indexOf(loopLabel) == -1)
                __$__.Context.NestLoop[parent].inner.push(loopLabel);


            __$__.Context.StackToCheckLoop.push(loopLabel);
        }
    }

    // the node of storedGraph is whether first appearing or not in this part
    storedGraph.nodes.forEach(node => {
        var flag = false;


        __$__.JumpToConstruction.GraphData.nodes.forEach(nodeData => {
            flag = flag || (node.id == nodeData.id);
        });


        if (!flag) {
            __$__.JumpToConstruction.GraphData.nodes.push({
                id: node.id,
                loopLabel: loopLabel,
                count: count,
                pos: __$__.Context.CheckPointTable[checkPointId]
            });
        }
    });

    // the edge of storedGraph is whether first appearing or not in this part
    storedGraph.edges.forEach(edge => {
        var flag = false;


        __$__.JumpToConstruction.GraphData.edges.forEach(edgeData => {
            flag = flag || (edge.from == edgeData.from && edge.to == edgeData.to && edge.label == edgeData.label);
        });


        if (!flag) {
            __$__.JumpToConstruction.GraphData.edges.push({
                from: edge.from,
                to: edge.to,
                label: edge.label,
                loopLabel: loopLabel,
                count: count,
                pos: __$__.Context.CheckPointTable[checkPointId]
            });
        }
    });


    __$__.Context.LastGraph = storedGraph;
};


__$__.Context.StoreGraph = function(objects, loopLabel, count, checkPointId, probe) {
    var graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, probe));

    if (!__$__.Context.StoredGraph[checkPointId])
        __$__.Context.StoredGraph[checkPointId] = {};

    if (!__$__.Context.StoredGraph[checkPointId][loopLabel])
        __$__.Context.StoredGraph[checkPointId][loopLabel] = {};

    __$__.Context.StoredGraph[checkPointId][loopLabel][count] = graph;


    return graph;
};


// Draw() method is executed after user code
__$__.Context.Draw = function(e) {

    if (__$__.Context.Snapshot) {
        try {
            var checkPointId = __$__.Context.FindId(__$__.editor.getCursorPosition());
            var loopLabel, count, graph;
            if (checkPointId.afterId &&
                __$__.Context.CheckPointTable[checkPointId.afterId].column === __$__.editor.getCursorPosition().column &&
                __$__.Context.CheckPointTable[checkPointId.afterId].line === __$__.editor.getCursorPosition().row + 1) {
                loopLabel = Object.keys(__$__.Context.StoredGraph[checkPointId.afterId])[0];
                count = __$__.Context.LoopContext[loopLabel];
                graph = __$__.Context.StoredGraph[checkPointId.afterId][loopLabel][count];
            } else {
                loopLabel = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
                count = __$__.Context.LoopContext[loopLabel];
                graph = __$__.Context.StoredGraph[checkPointId.beforeId][loopLabel][count];
            }

            if (!graph) graph = {nodes: [], edges: []};
        } catch (e) {
            var graph = {nodes: [], edges: []};
        }

        __$__.StorePositions.setPositions(graph);

        if (e === 'changed' || __$__.Update.isChange(graph, true))
            __$__.network.setData({
                nodes: new vis.DataSet(graph.nodes),
                edges: new vis.DataSet(graph.edges)
            });

    } else {
        var checkPointId = __$__.Context.FindId(__$__.editor.getCursorPosition());
        if (!checkPointId.afterId)
            checkPointId.afterId = checkPointId.beforeId;

        var beforeLoopLabel = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
        var afterLoopLabel  = Object.keys(__$__.Context.StoredGraph[checkPointId.afterId])[0];

        var addedNodeId = [], addedEdgeData = [];
        var removedNodeId = [], removedEdgeData = [];

        // If beforeLoopLabel same afterLoopLabel, calcurate the gap between before and after graph.
        if (beforeLoopLabel == afterLoopLabel) {
            var beforeGraphs = __$__.Context.StoredGraph[checkPointId.beforeId][beforeLoopLabel];
            var afterGraphs  = __$__.Context.StoredGraph[checkPointId.afterId][afterLoopLabel];

            // take the number of common loop here
            var loopCount = [];
            var afterGraphsCount = Object.keys(afterGraphs);


            Object.keys(beforeGraphs).forEach(num => {
                if (afterGraphsCount.indexOf(num) != -1) loopCount.push(num);
            });


            // calculate the gap between before and after graph
            for (var i = 0; i < loopCount.length; i++) {
                var beforeGraph = beforeGraphs[loopCount[i]], afterGraph = afterGraphs[loopCount[i]];

                // this object checks whether each node is added or removed or not
                // if 'node1' is added, changeNodeId[node1]: true.
                // if 'node2' is removed, changeNodeId[node2] : false.
                // if there is 'node3' in before graph and after graph, changeNodeId[node3]: undefined
                var changeNodeId = {};

                beforeGraph.nodes.forEach(node => {
                    changeNodeId[node.id] = false;
                });

                afterGraph.nodes.forEach(node => {
                    if (changeNodeId[node.id] == false) delete changeNodeId[node.id];
                    else if (changeNodeId[node.id] == undefined) changeNodeId[node.id] = true;
                });


                Object.keys(changeNodeId).forEach(id => {
                    if (changeNodeId[id])
                        addedNodeId.push(id);
                    else
                        removedNodeId.push(id);
                });

                // this object checks whether each edge is added or removed or not
                // if 'edge1' is added, changeEdgeData[edge1]: true.
                // if 'edge2' is removed, changeEdgeData[edge2] : false.
                // if there is 'edge3' in before graph and after graph, changeEdgeData[edge3]: undefined
                var changeEdgeData = {};

                beforeGraph.edges.forEach(edge => {
                    changeEdgeData[[edge.from, edge.to, edge.label].toString()] = false;
                })

                afterGraph.edges.forEach(edge => {
                    var data = [edge.from, edge.to, edge.label].toString();

                    if (changeEdgeData[data] == false)
                        delete changeEdgeData[data];
                    else if (changeEdgeData[data] == undefined)
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

        var graph = __$__.Context.LastGraph;
        __$__.StorePositions.setPositions(graph);

        // change color of added node to orange in this part
        graph.nodes.forEach(node => {
            var index = addedNodeId.indexOf(node.id)

            if (index >= 0) {
                node.color = __$__.SummarizedViewColor.AddNode;
                delete addedNodeId[index];
            }
        });
        // change color of added edge to orange in this part
        graph.edges.forEach(edge => {
            if (edge.from.slice(0, 11) == '__Variable-') edge.hidden = true;

            addedEdgeData.forEach((edgeData, index) => {
                if (edgeData[0] == edge.from && edgeData[1] == edge.to && edgeData[2] == edge.label) {
                    edge.color = __$__.SummarizedViewColor.AddEdge;
                    delete addedEdgeData[index];
                }
            });
        });

        addedNodeId.forEach(id => {
            var label = '';

            afterGraph.nodes.forEach(node => {
                if (node.id == id) label = node.label;
            });

            if (id && id.slice(0, 11) != '__Variable-') graph.nodes.push({
                fixed: false,
                id: id,
                label: label,
                physics: false,
                color: __$__.SummarizedViewColor.AddNode
            });
        });

        addedEdgeData.forEach(data => {
            if (data && data[0].slice(0, 11) != '__Variable-') graph.edges.push({
                from: data[0],
                to: data[1],
                label: data[2],
                color: __$__.SummarizedViewColor.AddEdge,
                dashes: true
            });
        });

        removedEdgeData.forEach(data => {
            if (data) graph.edges.push({
                from: data[0],
                to: data[1],
                label: data[2],
                color: __$__.SummarizedViewColor.RemoveEdge,
                dashes: true
            });
        });

        if (e === 'changed' || __$__.Update.isChange(graph, true))
            __$__.network.setData({
                nodes: new vis.DataSet(graph.nodes),
                edges: new vis.DataSet(graph.edges)
            });
    }
};


__$__.Context.FindId = function(pos) {
    let before;
    let after;
    let res = {};

    Object.keys(__$__.Context.CheckPointTable).forEach(function(key) {
        let temp = __$__.Context.CheckPointTable[key];

        // the case that temp can become before
        if (temp.line < pos.row + 1 || temp.line == pos.row + 1 && temp.column < pos.column) {
            if (!before || before.line < temp.line || before.line == temp.line && before.column <= temp.column) {
                before = temp;
                res.beforeId = key;
            }
        } else {
            if (!after || temp.line < after.line || after.line == temp.line && after.column >= temp.column) {
                after = temp;
                res.afterId = key;
            }
        }
    });


    return res;
};


__$__.Context.SwitchViewMode = function(bool) {
    __$__.Context.Snapshot = bool;
    var elem = document.getElementById('viewmode');

    elem.textContent = (bool) ? 'View Mode: Snapshot' : 'View Mode: Summarized';
};


/**
 * @param {string} loopLabel
 *
 * This function is executed when a context is changed.
 * the argument is loop's label, and the loop's label is 'loopLabel' of the loop whose context is changed.
 *
 */
__$__.Context.ChangeInnerAndParentContext = function(loopLabel) {
    var new_loop_count = __$__.Context.LoopContext[loopLabel];
    var start_end = __$__.Context.StartEndInLoop[loopLabel][new_loop_count-1];


    var changeInnerContext = function(loopLabel) {
        var smallest_time;


        __$__.Context.StartEndInLoop[loopLabel].forEach(compared_s_e => {
            if (start_end.start < compared_s_e.start && compared_s_e.end < start_end.end) {
                if (!smallest_time || smallest_time > compared_s_e.start)
                    smallest_time = compared_s_e.start;
            }
        });

        // this is executed when the context of 'loopLabel' mast be changed
        if (smallest_time) {
            __$__.Context.LoopContext[loopLabel] = __$__.Context.TableTimeCounter[smallest_time].loopCount;

            __$__.Context.NestLoop[loopLabel].inner.forEach(label => {
                changeInnerContext(label);
            });
        }
    };

    var changeParentContext = function(loopLabel) {
        var count = __$__.Context.LoopContext[loopLabel];
        var start_end = __$__.Context.StartEndInLoop[loopLabel][count-1];


        __$__.Context.NestLoop[loopLabel].parent.forEach(label => {
            var now_count = __$__.Context.LoopContext[label];
            var s_e = __$__.Context.StartEndInLoop[label][now_count-1];


            // if the context of 'label' don't have to be changed
            if (start_end.start > s_e.start && s_e.end > start_end.end)
                return;
            else { // if the context of 'label' must to be changed
                __$__.Context.StartEndInLoop[label].forEach((compared_s_e, index) => {
                    if (start_end.start > compared_s_e.start && compared_s_e.end > start_end.end) {
                        __$__.Context.LoopContext[label] = index + 1;
                        changeParentContext(label);
                    }
                });
            }
        })
    }

    __$__.Context.NestLoop[loopLabel].inner.forEach(label => {
        changeInnerContext(label);
    });


    changeParentContext(loopLabel);
};
