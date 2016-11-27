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
            var checkPointId = __$__.Context.FindId(__$__.editor.getCursorPosition());
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
        var checkPointId = __$__.Context.FindId(__$__.editor.getCursorPosition());
        if (!checkPointId.afterId) checkPointId.afterId = checkPointId.beforeId;

        var beforeLoopId = Object.keys(__$__.Context.StoredGraph[checkPointId.beforeId])[0];
        var afterLoopId  = Object.keys(__$__.Context.StoredGraph[checkPointId.afterId])[0];

        var addedNodeId = [], addedEdgeData = [];
        var removedNodeId = [], removedEdgeData = [];

        // If beforeLoopId same afterLoopId, calcurate the gap between before and after graph.
        if (beforeLoopId == afterLoopId) {
            var beforeGraphs = __$__.Context.StoredGraph[checkPointId.beforeId][beforeLoopId];
            var afterGraphs  = __$__.Context.StoredGraph[checkPointId.afterId][afterLoopId];

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
                    if (changeNodeId[id]) addedNodeId.push(id);
                    else removedNodeId.push(id);
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
                    if (changeEdgeData[data] == false) delete changeEdgeData[data];
                    else if (changeEdgeData[data] == undefined) changeEdgeData[data] = true;
                });

                Object.keys(changeEdgeData).forEach(data => {
                    if (changeEdgeData[data]) addedEdgeData.push(data.split(','));
                    else removedEdgeData.push(data.split(','));
                })
            }
        }

        var graph = __$__.Context.LastGraph;
        __$__.StorePositions.setPositions(graph);

        graph.nodes.forEach(node => {
            var index = addedNodeId.indexOf(node.id)
            if (index >= 0) {
                node.color = 'orange';
                delete addedNodeId[index];
            }
        });
        graph.edges.forEach(edge => {
            if (edge.from.slice(0, 11) == '__Variable-') edge.hidden = true;
            addedEdgeData.forEach((edgeData, index) => {
                if (edgeData[0] == edge.from && edgeData[1] == edge.to && edgeData[2] == edge.label) {
                    edge.color = 'orange';
                    delete addedEdgeData[index];
                }
            });
        });

        addedNodeId.forEach(id => {
            var label = '';
            afterGraph.nodes.forEach(node => {
                if (node.id == id) label = node.label;
            })
            if (id) graph.nodes.push({
                fixed: false,
                id: id,
                label: label,
                physics: false,
                color: 'orange'
            });
        });
        addedEdgeData.forEach(data => {
            if (data) graph.edges.push({
                from: data[0],
                to: data[1],
                label: data[2],
                color: 'orange',
                dashes: true
            })
        });
        removedEdgeData.forEach(data => {
            if (data) graph.edges.push({
                from: data[0],
                to: data[1],
                label: data[2],
                color: 'green',
                dashes: true
            })
        });

        __$__.network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});
    }
};


__$__.Context.FindId = function(pos) {
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


__$__.Context.SwitchContext = function(bool) {
    __$__.Context.UseContext = bool;
    var elem = document.getElementById('context');
    elem.textContent = (bool) ? 'Use Context' : 'No Context';
};


__$__.Context.AdvanceContext = function() {
    var pos = __$__.editor.getCursorPosition();
};
