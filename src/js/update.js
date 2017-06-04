__$__.Update = {
    CodeWithCheckPoint: '',
    wait: false,
    
    // this function is called when ace editor is edited.
    PositionUpdate: function(e) {
        window.localStorage["Kanon-Code"] = __$__.editor.getValue();
    
        if (e)
            __$__.Update.UpdateLabelPositions(e);
        __$__.Context.Initialize();
        __$__.JumpToConstruction.GraphData = {nodes: [], edges: []};
    
        try {
            let checkInfiniteLoop = __$__.CodeConversion.TransformCode(__$__.editor.getValue(), true);
            eval(checkInfiniteLoop);
    
            __$__.Context.Initialize();
            __$__.JumpToConstruction.GraphData = {nodes: [], edges: []};
            __$__.Update.CodeWithCheckPoint = __$__.CodeConversion.TransformCode(__$__.editor.getValue());
            var __objs;
    
            eval(__$__.Update.CodeWithCheckPoint);
            document.getElementById('console').textContent = '';
    
            var graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(__objs));
            
    
            if (!__$__.Update.isChange(graph, false)) {
                __$__.Update.ContextUpdate();
                return;
            }
    
    
            __$__.options.nodes.physics = true;
            __$__.options.nodes.hidden = true;
            __$__.options.edges.hidden = true;
            __$__.StorePositions.setPositions(graph, true);
            __$__.network.setOptions(__$__.options);
            __$__.network.setData({
                nodes: new vis.DataSet(graph.nodes),
                edges: new vis.DataSet(graph.edges)
            });
            __$__.StorePositions.oldNetworkNodesData = __$__.network.body.data.nodes._data;
            __$__.StorePositions.oldNetworkEdgesData = __$__.network.body.data.edges._data;
    
            let updateArray = params => {
                if (params.nodes.length > 0) {
                    let id = params.nodes[0];
                    let indices = [-1, -1];
    
                    for (let i = 0; i < __$__.Context.Arrays.length; i++) {
                        let index = __$__.Context.Arrays[i].indexOf(id);
                        if (index >= 0) {
                            indices[0] = i;
                            indices[1] = index;
                            break;
                        }
                    }
    
                    if (indices[0] >= 0) {
                        let arrayIDs = __$__.Context.Arrays[indices[0]];
                        for (let i = 0; i < arrayIDs.length; i++) {
                            let pos = __$__.network.getPositions(id)[id];
                            __$__.network.moveNode(arrayIDs[i], pos.x + (i - indices[1]) * 20, pos.y);
                        }
                    }
                }
            }
            let stabilized = params => {
                __$__.options.nodes.physics = false;
                __$__.options.nodes.hidden = false;
                __$__.options.edges.hidden = false;
                __$__.network.setOptions(__$__.options);
    
                /*
                // align each value of the ArrayExpression if that is Literal
                Object.values(__$__.network.body.data.edges._data).forEach(edge => {
                    let indices = [-1, -1];
    
                    for (let i = 0; i < __$__.Context.Arrays.length; i++) {
                        let index = __$__.Context.Arrays[i].indexOf(edge.from);
                        if (index >= 0) {
                            indices[0] = i;
                            indices[1] = index;
                            break;
                        }
                    }
    
                    if (indices[0] >= 0) {
                        if (__$__.Context.Literals.indexOf(edge.to) >= 0) {
                            let pos = __$__.network.getPositions(edge.from)[edge.from];
                            __$__.network.moveNode(edge.to, pos.x, pos.y + 100);
                        }
                    }
                });
                */
    
                __$__.Update.wait = false;
                __$__.StorePositions.registerPositions();
                __$__.Update.ContextUpdate();
            }
    
            __$__.Context.Arrays.forEach(array => {
                updateArray({nodes: [array[0]]});
            });
    
            __$__.network.on('click', __$__.JumpToConstruction.ClickEventFunction);
            __$__.network.on('dragging', updateArray);
            __$__.network.on('dragEnd', updateArray);
            __$__.network.on("dragEnd", __$__.StorePositions.registerPositions);
            __$__.Update.wait = true;
            if (graph.nodes.length > 0 && graph.nodes.filter(node => node.x === undefined).length > 0)
                __$__.network.once('stabilized', stabilized);
            else
                stabilized();
    
        } catch (e) {
            if (e == 'Infinite Loop') {
                document.getElementById('console').textContent = 'infinite loop?';
            }
            __$__.Update.wait = true;
        }
    },
    
    
    /**
     * This function is called when the cursor position in ace editor is changed.
     * This update the network with the context at the cursor position.
     */
    ContextUpdate: function(e) {
        if (__$__.Update.wait === false && (!__$__.network._callbacks.stabilized || !__$__.network._callbacks.stabilized.length) && document.getElementById('console').textContent == '' || e === 'changed') {
            try {
                // check maximum of Context.LoopContext
                // if loop doesn't include now context, now context is changed at the max of loop count
                Object.keys(__$__.Context.__loopCounter).forEach(function(loopLabel) {
                    if (__$__.Context.LoopContext[loopLabel] > __$__.Context.__loopCounter[loopLabel])
                        __$__.Context.LoopContext[loopLabel] = __$__.Context.__loopCounter[loopLabel];
                });
    
                __$__.Context.Draw(e);
            } catch (e) {
                if (e == 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                }
            }
        }
    },
    
    
    /**
     * @param {Object} graph: graph has the property is nodes and edges
     *
     * This function compares old graph and new graph.
     * return true if new graph is different from old graph
     * return false otherwise
     */
    isChange: function(graph, snapshot = false) {
        var graphNodes = graph.nodes.map(node => {
            if (node.color && node.color !== 'white')
                return [node.id, node.label, node.color];
            else 
                return [node.id, node.label];
        });
        var graphEdges = graph.edges.map(edge => {
            if (edge.color && edge.color !== 'white')
                return [edge.from, edge.to, edge.label, edge.color];
            else
                return [edge.from, edge.to, edge.label];
        });
        var networkNodes = [];
        var temp = (snapshot) ? __$__.network.body.data.nodes._data : __$__.StorePositions.oldNetworkNodesData;
    
        Object.keys(temp).forEach(key => {
            if (snapshot && temp[key].color && temp[key].color !== 'white')
                networkNodes.push([temp[key].id, temp[key].label, temp[key].color]);
            else
                networkNodes.push([temp[key].id, temp[key].label]);
        });
        
    
        var networkEdges = [];
        temp = (snapshot) ? __$__.network.body.data.edges._data : __$__.StorePositions.oldNetworkEdgesData;
    
        Object.keys(temp).forEach(function(key){
            if (snapshot && temp[key].color && temp[key].color !== 'white')
                networkEdges.push([temp[key].from, temp[key].to, temp[key].label, temp[key].color]);
            else
                networkEdges.push([temp[key].from, temp[key].to, temp[key].label]);
        });
    
    
        return (!Boolean(networkNodes) ||
                !Boolean(networkEdges) ||
                JSON.stringify(graphNodes.sort()) != JSON.stringify(networkNodes.sort()) ||
                JSON.stringify(graphEdges.sort()) != JSON.stringify(networkEdges.sort()));
    },
    
    
    /**
     * @param {Object} e : the data of changed code
     *
     * In this function, update the positions of newLabel, loopLabel and callLabel.
     * If user code is edited, this function is executed.
     */
    UpdateLabelPositions: function(e) {
        var start = {line: e.start.row + 1, column: e.start.column};
        var end = {line: e.end.row + 1, column: e.end.column};
        var compare = __$__.Update.ComparePosition;
    
        var modify_by_insert = function(pos) {
            // if inserted code is the upper part of the loop
            if (compare(start, '<', pos.start)) {
                if (pos.start.line == start.line)
                    pos.start.column += e.lines[e.lines.length-1].length;
                if (pos.end.line   == start.line)
                    pos.end.column   += e.lines[e.lines.length-1].length;
    
                pos.start.line += e.lines.length - 1;
                pos.end.line   += e.lines.length - 1;
            } else if (compare(start, '<', pos.end)) { // if inserted code is the inner part of the loop
                if (pos.end.line   == start.line)
                    pos.end.column   += e.lines[e.lines.length-1].length;
    
                pos.end.line   += e.lines.length - 1;
            }
        };
        var modify_by_remove = function(pos) {
            // if removed code is the upper part of the loop
            if (compare(end, '<', pos.start)) {
                if (pos.start.line == end.line)
                    pos.start.column -= e.lines[e.lines.length-1].length;
                if (pos.end.line   == end.line)
                    pos.end.column   -= e.lines[e.lines.length-1].length;
    
                pos.start.line -= e.lines.length - 1;
                pos.end.line   -= e.lines.length - 1;
            } else if (compare(pos.start, '<', start) && compare(end, '<', pos.end)) { // if removed code is the inner part of the loop
                if (pos.end.line   == end.line)
                    pos.end.column   -= e.lines[e.lines.length-1].length;
    
                pos.end.line   -= e.lines.length - 1;
            } else if (compare(start, '<', pos.start) && compare(pos.end, '<', end)) { // if removed code is the outer part of the loop
                return true;
            }
        };
    
        if (e.action == 'insert') {
            // update
            ['LoopLabelPosition', 'NewLabelPosition', 'ArrayLabelPosition', 'CallLabelPosition'].forEach(pos => {
                Object.keys(__$__.Context[pos]).forEach(label => {
                    modify_by_insert(__$__.Context[pos][label]);
                });
            });
        } else { // e.action == 'remove'
            // update
            ['LoopLabelPosition', 'NewLabelPosition', 'ArrayLabelPosition', 'CallLabelPosition'].forEach(pos => {
                Object.keys(__$__.Context[pos]).forEach(label => {
                    var dlt = modify_by_remove(__$__.Context[pos][label]);
                    if (dlt)
                        delete __$__.Context[pos][label];
                });
            });
        }
    },
    
    
    /**
     * @param {Object} p1: {line, column}
     * @param {string} operator: '==', '<', '>', '<=', '>='
     * @param {Object} p2: {line, column}
     */
    ComparePosition: function(p1, operator, p2) {
        var ret = false;
    
    
        if (operator == '==' || operator == '<=' || operator == '>=') {
            ret = ret || (p1.line == p2.line && p1.column == p2.column);
        }
    
        if (operator == '<' || operator == '<=') {
            ret = ret || (p1.line == p2.line && p1.column < p2.column || p1.line < p2.line);
        }
    
        if (operator == '>' || operator == '>=') {
            ret = ret || (p1.line == p2.line && p1.column > p2.column || p1.line > p2.line);
        }
    
    
        return ret;
    }
};
