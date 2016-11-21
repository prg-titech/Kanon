window.Context = {};


Context.UseContext = true;
Context.LastGraph;
Context.StoreGraph = {};
Context.__loopContext = {"noLoop": 1};
// keys:   ID of check point
// values: {row, column}
Context.CheckPointTable = {};


/**
 * @param {Array} objects: this equals __objs in transformed code
 * @param {string} loopId
 * @param {int} count
 * @param {int} checkPointId
 * @param {Object} visualizeVariables
 *
 * this function is checkPoint is located at the head and the tail of each Statement.
 */
Context.__checkPoint = function(objects, loopId, count, checkPointId, visualizeVariables) {
    var storedGraph = Context.__StoreGraph(objects, loopId, count, checkPointId, visualizeVariables);
    if (Context.UseContext) {

        if (!Trace.ClickElementContext.pos && Trace.ClickElement.node) {
            storedGraph.nodes.forEach(function (node) {
                if (node.id == Trace.ClickElement.node) Trace.ClickElementContext = {id: loopId, count: count, pos: Context.CheckPointTable[checkPointId]};
            });
        }

        if (!Trace.ClickElementContext.pos && Trace.ClickElement.edge) {
            storedGraph.edges.forEach(function (edge) {
                if (edge.from == Trace.ClickElement.edge.from &&
                    edge.to == Trace.ClickElement.edge.to &&
                    edge.label == Trace.ClickElement.edge.label) Trace.ClickElementContext = {id: loopId, count: count, pos: Context.CheckPointTable[checkPointId]};
            })
        }
    } else {
        Context.LastGraph = storedGraph;
    }
};


Context.__StoreGraph = function(objects, loopId, count, checkPointId, visualizeVariables) {
    var graph = translator(traverse(objects, visualizeVariables));

    if (!Context.StoreGraph[checkPointId]) Context.StoreGraph[checkPointId] = {};
    if (!Context.StoreGraph[checkPointId][loopId]) Context.StoreGraph[checkPointId][loopId] = {};
    Context.StoreGraph[checkPointId][loopId][count] = graph;

    return graph;
};


// __draw() method is executed after user code
Context.__draw = function() {
    if (Context.UseContext) {
        try {
            var checkPointId = Context.findId(editor.getCursorPosition());
            var loopId = Object.keys(Context.StoreGraph[checkPointId.beforeId])[0];
            var count = Context.__loopContext[loopId];
            var graph = Context.StoreGraph[checkPointId.beforeId][loopId][count];
            if (!graph) graph = {nodes: [], edges: []};
        } catch (e) {
            var graph = {nodes: [], edges: []};
        }

        StorePositions.setPositions(graph);
        network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});
    } else {
        var checkPointId = Context.findId(editor.getCursorPosition());
        if (!checkPointId.afterId) checkPointId.afterId = checkPointId.beforeId;

        var beforeLoopId = Object.keys(Context.StoreGraph[checkPointId.beforeId])[0];
        var afterLoopId  = Object.keys(Context.StoreGraph[checkPointId.afterId])[0];
        var beforeGraphs = Context.StoreGraph[checkPointId.beforeId][beforeLoopId];
        var afterGraphs  = Context.StoreGraph[checkPointId.afterId][afterLoopId];

        var changeNodeId = [], changeEdgeData = [];

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

        var graph = Context.LastGraph;
        StorePositions.setPositions(graph);
        graph.nodes.forEach(function(node) {
            if (changeNodeId.indexOf(node.id) >= 0) node.color = 'orange';
        });
        graph.edges.forEach(function(edge) {
            changeEdgeData.forEach(function(edgeData) {
                if (edgeData[0] == edge.from && edgeData[1] == edge.to && edgeData[2] == edge.label) edge.color = 'orange';
            });
        });

        network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});
    }
};


Context.findId = function(pos) {
    let before;
    let after;
    let res = {};
    Object.keys(Context.CheckPointTable).forEach(function(key) {
        let temp = Context.CheckPointTable[key];

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


Context.ChangeContext = function(bool) {
    Context.UseContext = bool;
    var elem = document.getElementById('context');
    elem.textContent = (bool) ? 'Use Context' : 'No Context';
};
