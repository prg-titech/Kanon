__$__.Update = {
    CodeWithCheckPoint: ''
};


// this function is called when ace editor is edited.
__$__.Update.PositionUpdate = function(e) {
    window.localStorage["Kanon-Code"] = __$__.editor.getValue();

    if (e)
        __$__.Update.UpdateIdPositions(e);

    let transformed_code = __$__.CodeConversion.TransformCode(__$__.editor.getValue());
    var __objs;

    try {
        eval(transformed_code);
        document.getElementById('console').textContent = '';

        var graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(__objs));
        

        if (!__$__.Update.isChange(graph, false)) {
            __$__.Update.ContextUpdate();
            return;
        }


        __$__.options.nodes.physics = true;
        __$__.StorePositions.setPositions(graph, true);
        __$__.network = new vis.Network(__$__.container, {nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)}, __$__.options);
        __$__.StorePositions.oldNetworkNodesData = __$__.network.body.data.nodes._data;
        __$__.StorePositions.oldNetworkEdgesData = __$__.network.body.data.edges._data;

        __$__.network.on("dragEnd", __$__.StorePositions.registerPositions);
        __$__.network.on('click', __$__.JumpToConstruction.ClickEventFunction);
        __$__.network.once("stabilized", function(params) {
            __$__.options.nodes.physics = false;
            __$__.network.setOptions(__$__.options);

            __$__.StorePositions.registerPositions();
            __$__.StorePositions.setPositions(graph);
            __$__.network.setData({nodes: new vis.DataSet(graph.nodes), edges: new vis.DataSet(graph.edges)});


            __$__.Update.ContextUpdate();
        });
    } catch (e) {
        if (e == 'Infinite Loop') {
            document.getElementById('console').textContent = 'infinite loop?';
        }
    }
};


/**
 * This function is called when the cursor position in ace editor is changed.
 * This update the network with the context at the cursor position.
 */
__$__.Update.ContextUpdate = function(e) {
    __$__.network.redraw();
    if ((!__$__.network._callbacks.stabilized || !__$__.network._callbacks.stabilized.length) && document.getElementById('console').textContent == '' || e === 'changed') {
        // initialize some data
        __$__.Context.Initialize();
        __$__.JumpToConstruction.GraphData = {nodes: [], edges: []};

        __$__.Update.CodeWithCheckPoint = __$__.CodeConversion.TransformCode(__$__.editor.getValue(), true);

        try {
            eval(__$__.Update.CodeWithCheckPoint);

            // check maximum of Context.LoopContext
            // if loop doesn't include now context, now context is changed at the max of loop count
            Object.keys(__loopCounter).forEach(function(loopId) {
                if (__$__.Context.LoopContext[loopId] > __loopCounter[loopId]) __$__.Context.LoopContext[loopId] = __loopCounter[loopId];
            });

            __$__.Context.Draw(e);
        } catch (e) {
            if (e == 'Infinite Loop') {
                document.getElementById('console').textContent = 'infinite loop?';
            }
        }
    }
};


/**
 * @param {Object} graph: graph has the property is nodes and edges
 *
 * This function compares old graph and new graph.
 * return true if new graph is different from old graph
 * return false otherwise
 */
__$__.Update.isChange = function(graph, context = false) {
    var graphNodes = graph.nodes.map(function(node) {
        if (node.color && node.color !== 'white')
            return [node.id, node.label, node.color];
        else 
            return [node.id, node.label];
    });
    var graphEdges = graph.edges.map(function(edge) {
        if (edge.color && edge.color !== 'white')
            return [edge.from, edge.to, edge.label, edge.color];
        else
            return [edge.from, edge.to, edge.label];
    });
    var networkNodes = [];
    var temp = (context) ? __$__.network.body.data.nodes._data : __$__.StorePositions.oldNetworkNodesData;

    Object.keys(temp).forEach(function(key){
        if (context && temp[key].color && temp[key].color !== 'white')
            networkNodes.push([temp[key].id, temp[key].label, temp[key].color]);
        else
            networkNodes.push([temp[key].id, temp[key].label]);
    });
    

    var networkEdges = [];
    temp = (context) ? __$__.network.body.data.edges._data : __$__.StorePositions.oldNetworkEdgesData;

    Object.keys(temp).forEach(function(key){
        if (context && temp[key].color && temp[key].color !== 'white')
            networkEdges.push([temp[key].from, temp[key].to, temp[key].label, temp[key].color]);
        else
            networkEdges.push([temp[key].from, temp[key].to, temp[key].label]);
    });


    return (!Boolean(networkNodes) || !Boolean(networkEdges) ||
            JSON.stringify(graphNodes.sort()) != JSON.stringify(networkNodes.sort()) ||
            JSON.stringify(graphEdges.sort()) != JSON.stringify(networkEdges.sort()));
};


/**
 * @param {Object} e : the data of changed code
 *
 * In this function, update the positions of newID and loopID.
 * If user code is edited, this function is executed.
 */
__$__.Update.UpdateIdPositions = function(e) {
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
        // update LoopIdPositions
        Object.keys(__$__.Context.LoopIdPositions).forEach(id => {
            modify_by_insert(__$__.Context.LoopIdPositions[id]);
        });

        // update NewIdPositions
        Object.keys(__$__.Context.NewIdPositions).forEach(id => {
            modify_by_insert(__$__.Context.NewIdPositions[id]);
        });

        // update CallIdPositions
        Object.keys(__$__.Context.CallIdPositions).forEach(id => {
            modify_by_insert(__$__.Context.CallIdPositions[id]);
        });
    } else { // e.action == 'remove'
        Object.keys(__$__.Context.LoopIdPositions).forEach(id => {
            var dlt = modify_by_remove(__$__.Context.LoopIdPositions[id]);
            if (dlt)
                delete __$__.Context.LoopIdPositions[id];
        });

        // update NewIdPositions
        Object.keys(__$__.Context.NewIdPositions).forEach(id => {
            var dlt = modify_by_remove(__$__.Context.NewIdPositions[id]);
            if (dlt)
                delete __$__.Context.NewIdPositions[id];
        });

        // update CallIdPositions
        Object.keys(__$__.Context.CallIdPositions).forEach(id => {
            var dlt = modify_by_remove(__$__.Context.CallIdPositions[id]);
            if (dlt)
                delete __$__.Context.CallIdPositions[id];
        });
    }
};


/**
 * @param {Object} p1: {line, column}
 * @param {string} operator: '==', '<', '>', '<=', '>='
 * @param {Object} p2: {line, column}
 */
__$__.Update.ComparePosition = function(p1, operator, p2) {
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
};
