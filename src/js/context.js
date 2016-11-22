__$__.Context = {};


__$__.Context.UseContext = true;
__$__.Context.LastGraph;
__$__.Context.StoredGraph = {};
__$__.Context.__loopContext = {"noLoop": 1};
// keys:   ID of check point
// values: {row, column}
__$__.Context.CheckPointTable = {};


/**
 * @param {Array} objects: this equals __objs in transformed code
 * @param {string} loopId
 * @param {int} count
 * @param {int} checkPointId
 * @param {Object} visualizeVariables
 *
 * this function is checkPoint is located at the head and the tail of each Statement.
 */
__$__.Context.CheckPoint = function(objects, loopId, count, checkPointId, visualizeVariables) {
    var storedGraph = __$__.Context.StoreGraph(objects, loopId, count, checkPointId, visualizeVariables);

    if (__$__.Context.UseContext) {

        if (!__$__.Trace.ClickElementContext.pos && __$__.Trace.ClickElement.node) {
            storedGraph.nodes.forEach(function (node) {
                if (node.id == __$__.Trace.ClickElement.node) 
                    __$__.Trace.ClickElementContext = {id: loopId, count: count, pos: __$__.Context.CheckPointTable[checkPointId]};
            });
        }

        if (!__$__.Trace.ClickElementContext.pos && __$__.Trace.ClickElement.edge) {
            storedGraph.edges.forEach(function (edge) {
                if (edge.from == __$__.Trace.ClickElement.edge.from &&
                    edge.to == __$__.Trace.ClickElement.edge.to &&
                    edge.label == __$__.Trace.ClickElement.edge.label)
                    __$__.Trace.ClickElementContext = {id: loopId, count: count, pos: __$__.Context.CheckPointTable[checkPointId]};
            })
        }
    } else {
        __$__.Context.LastGraph = storedGraph;
    }
};


__$__.Context.StoreGraph = function(objects, loopId, count, checkPointId, visualizeVariables) {
    var graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, visualizeVariables));

    if (!__$__.Context.StoredGraph[checkPointId]) __$__.Context.StoredGraph[checkPointId] = {};
    if (!__$__.Context.StoredGraph[checkPointId][loopId]) __$__.Context.StoredGraph[checkPointId][loopId] = {};
    __$__.Context.StoredGraph[checkPointId][loopId][count] = graph;

    return graph;
};


// Draw() method is executed after user code
__$__.Context.Draw = function() {
    if (__$__.Context.UseContext) {
        try {
            var checkPointId = __$__.Context.findId(__$__.editor.getCursorPosition());
            var loopId = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
            var count = __$__.Context.__loopContext[loopId];
            var graph = __$__.Context.StoredGraph[checkPointId.beforeId][loopId][count];

            if (!graph) graph = {nodes: [], edges: []};
        } catch (e) {
            var graph = {nodes: [], edges: []};
        }

        __$__.StorePositions.setPositions(graph);
        __$__.network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});
    } else {
        var checkPointId = __$__.Context.findId(__$__.editor.getCursorPosition());
        if (!checkPointId.afterId) checkPointId.afterId = checkPointId.beforeId;

        var beforeLoopId = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
        var afterLoopId  = Object.keys(__$__.Context.StoredGraph[checkPointId.afterId])[0];
        var beforeGraphs = __$__.Context.StoredGraph[checkPointId.beforeId][beforeLoopId];
        var afterGraphs  = __$__.Context.StoredGraph[checkPointId.afterId][afterLoopId];

        var changeNodeId = [], changeEdgeData = [];

        // If beforeLoopId same afterLoopId, calcurate the gap between before and after graph.
        if (beforeLoopId == afterLoopId) {
            var loopCount = [];
            var afterGraphsCount = Object.keys(afterGraphs);
            Object.keys(beforeGraphs).forEach(function(num) {
                if (afterGraphsCount.indexOf(num) != -1) loopCount.push(num);
            });

            for (var i = 0; i < loopCount.length; i++) {
                var beforeGraph = beforeGraphs[loopCount[i]], afterGraph = afterGraphs[loopCount[i]];
                var beforeNodeId = [], afterNodeId = [];

                beforeGraph.nodes.forEach(function(node) {
                    beforeNodeId.push(node.id);
                });
                afterGraph.nodes.forEach(function(node) {
                    afterNodeId.push(node.id);
                });

                afterNodeId.forEach(function(id) {
                    if (beforeNodeId.indexOf(id) == -1) changeNodeId.push(id);
                });

                // Array of Array ([[from, to, label], [from, to, label], ...])
                var beforeEdgeData = [], afterEdgeData = [];

                beforeGraph.edges.forEach(function(edge) {
                    beforeEdgeData.push([edge.from, edge.to, edge.label].toString());
                });
                afterGraph.edges.forEach(function(edge) {
                    afterEdgeData.push([edge.from, edge.to, edge.label].toString());
                });

                afterEdgeData.forEach(function(edge) {
                    if (beforeEdgeData.indexOf(edge) == -1) changeEdgeData.push(edge.split(','));
                });
            }
        }

        var graph = __$__.Context.LastGraph;
        __$__.StorePositions.setPositions(graph);
        graph.nodes.forEach(function(node) {
            if (changeNodeId.indexOf(node.id) >= 0) node.color = 'orange';
        });
        graph.edges.forEach(function(edge) {
            if (edge.from.slice(0, 11) == '__Variable-') edge.hidden = true;
            changeEdgeData.forEach(function(edgeData) {
                if (edgeData[0] == edge.from && edgeData[1] == edge.to && edgeData[2] == edge.label) edge.color = 'orange';
            });
        });

        __$__.network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});
    }
};


__$__.Context.findId = function(pos) {
    let before;
    let after;
    let res = {};
    Object.keys(__$__.Context.CheckPointTable).forEach(function(key) {
        let temp = __$__.Context.CheckPointTable[key];

        // the case that temp can become before
        if (temp.line < pos.row + 1 || temp.line == pos.row + 1 && temp.column <= pos.column) {
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


__$__.Context.ChangeContext = function(bool) {
    __$__.Context.UseContext = bool;
    var elem = document.getElementById('context');
    elem.textContent = (bool) ? 'Use Context' : 'No Context';
};
