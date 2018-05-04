__$__.Update = {
    CodeWithCP: '',
    wait: false,
    updateValueOfArray: true,
    onlyMoveCursor: false,
    executable: true,
    
    // this function is called when ace editor is edited.
    PositionUpdate: function(__arg__) {
        window.localStorage["Kanon-Code"] = __$__.editor.getValue();
    
        if (__arg__) {
            __arg__.forEach(act => {
                __$__.Update.UpdateLabelPositions(act);
            });
        }
        __$__.Context.Initialize();
        __$__.JumpToConstruction.resetGraphData();
        __$__.editor.task.ContextUpdate = [];
    
        try {
            let __objs = [];
            let __transformed_code__;
            try {
                __transformed_code__ = __$__.CodeConversion.TransformCode(__$__.editor.getValue(), true);
            } catch (e) {
                document.getElementById('console').textContent = 'Error?';
                if (e.message.slice(0, 5) === 'Line ')
                    document.getElementById('console').textContent += ': ' + e.message;
                throw e;
            }
            try {
                (() => {eval(__transformed_code__)})();
                document.getElementById('console').textContent = '';
                __$__.Context.InfLoop = '';
            } catch (e) {
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                } else {
                    __$__.Context.InfLoop = '';
                    document.getElementById('console').textContent = 'Error?: ' + e.message;
                    // throw e;
                }
            }
            __$__.Context.Initialize();
            __$__.JumpToConstruction.resetGraphData();
            __$__.Update.CodeWithCP = __$__.CodeConversion.TransformCode(__$__.editor.getValue());

            // var __objs;
            __objs = [];
            try {
                (() => {eval(__$__.Update.CodeWithCP)})();
                __$__.Context.InfLoop = '';
                if (!__$__.Update.executable && __$__.Context.LoopContextWhenExecutable) {
                    __$__.Context.LoopContext = __$__.Context.LoopContextWhenExecutable;
                    __$__.Update.executable = true;
                }
                __$__.Context.LoopContextWhenExecutable = Object.assign({}, __$__.Context.LoopContext);
            } catch (e) {
                __$__.Update.executable = false;
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                } else {
                    __$__.Context.InfLoop = '';
                    document.getElementById('console').textContent = 'Error?: ' + e.message;
                    // throw e;
                }
            }

            Object.keys(__$__.Context.LoopContext).forEach(loopLabel => {
                if (loopLabel !== 'noLoop' && __$__.Context.StartEndInLoop[loopLabel] === undefined)
                    delete __$__.Context.LoopContext[loopLabel];
                else {
                    let beforeSensitiveContextForLoop = __$__.Context.BeforeSensitiveContextForLoop[loopLabel];
                    if (beforeSensitiveContextForLoop) {
                        let sensitiveContext = beforeSensitiveContextForLoop[__$__.Context.LoopContext[loopLabel]];
                        let newSensitiveContextForLoop = __$__.Context.SensitiveContextForLoop[loopLabel];
                        if (newSensitiveContextForLoop) {
                            Object.keys(newSensitiveContextForLoop).forEach(num => {
                                if (newSensitiveContextForLoop[num] === sensitiveContext) {
                                    __$__.Context.LoopContext[loopLabel] = parseInt(num);
                                }
                            });
                        }
                    }
                }
            });


            __$__.Context.BeforeSensitiveContextForLoop = __$__.Context.SensitiveContextForLoop;


            let graph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(__objs));

            __$__.ShowContext.makeDictionary();

            // check the context of all loops whether initial context of each loop is correct.
            let task = ['noLoop'];
            while (task.length) {
                let label = task.shift();
                let SE = __$__.Context.StartEndInLoop[label][__$__.Context.LoopContext[label]-1];
                let children = __$__.Context.ParentAndChildrenLoop[label].children;
                children.forEach(l => {
                    if (__$__.Context.StartEndInLoop[l]) {
                        for (let cntxt = __$__.Context.LoopContext[l]; cntxt > 0; cntxt--) {
                            let childSE = __$__.Context.StartEndInLoop[l][cntxt-1];
                            if (childSE && (SE.start <= childSE.start && childSE.end <= SE.end)) {
                                task.push(l);
                                __$__.Context.LoopContext[l] = cntxt;
                                return;
                            }
                        }
                        __$__.Context.LoopContext[l] = undefined;
                    }
                });
            }

            if (!__$__.Update.isChange(graph)) {
                __$__.Update.wait = false;
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
                    if (node.id.slice(0, 11) !== '--Variable-')
                        __$__.nodes.update({id: node.id, fixed: true});
                });
    
                if (__$__.Update.updateValueOfArray)
                    __$__.Update.updateArrayValuePosition();
    
                __$__.Update.wait = false;
                __$__.StorePositions.registerPositions(true);
                __$__.Update.ContextUpdate();
            };
    
            __$__.Context.Arrays.forEach(array => {
                if (array.length)
                    __$__.Update.updateArrayPosition({nodes: [array[0]]});
            });

            __$__.Update.wait = true;
            if (graph.nodes.length > 0 && graph.nodes.filter(node => node.x === undefined).length > 0)
                __$__.network.once('stabilized', stabilized);
            else
                stabilized();
    
        } catch (e) {
            if (e === 'Infinite Loop') {
                document.getElementById('console').textContent = 'infinite loop?';
            }
            __$__.Update.wait = true;
        }
        try {
            __$__.ShowContext.show();
        } catch (e) {}
    },
    

    /**
     * This function is called when the cursor position in ace editor is changed.
     * This update the network with the context at the cursor position.
     */
    ContextUpdate: function(e) {
        if (__$__.Update.wait === false
            // && (!__$__.network._callbacks.stabilized || !__$__.network._callbacks.stabilized.length)
            // && document.getElementById('console').textContent === ''
            || e === 'changed') {
            try {
                // check maximum of Context.LoopContext
                // if loop doesn't include now context, now context is changed at the max of loop count
                let labels = [];
                Object.keys(__$__.Context.__loopCounter).forEach(function(loopLabel) {
                    if (__$__.Context.LoopContext[loopLabel] > __$__.Context.__loopCounter[loopLabel])
                        __$__.Context.setLoopContext(loopLabel, '=', __$__.Context.__loopCounter[loopLabel]);
                    labels.push(loopLabel);
                });
                Object.keys(__$__.Context.LoopContext).forEach(loopLabel => {
                    if (labels.indexOf(loopLabel) === -1 && loopLabel !== 'noLoop')
                        delete __$__.Context.LoopContext[loopLabel]
                });
    
                __$__.Context.Draw(e);

            } catch (e) {
                if (e === 'Infinite Loop') {
                    document.getElementById('console').textContent = 'infinite loop?';
                }
            }
            try {
                __$__.ShowContext.show();
            } catch (e) {}
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
        let compare = __$__.Update.ComparePosition;
    
        let modify_by_insert = function(pos) {
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
        };
        let modify_by_remove = function(pos) {
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
            } else if (compare(start, '<', pos.start) && compare(pos.end, '<', end)) { // if removed code is the outer part of the loop
                return true;
            }
        };
    
        if (e.action === 'insert') {
            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    modify_by_insert(__$__.Context.LabelPos[kind][label]);
                });
            });
        } else { // e.action == 'remove'
            // update
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    let dlt = modify_by_remove(__$__.Context.LabelPos[kind][label]);
                    if (dlt)
                        delete __$__.Context.LabelPos[kind][label];
                });
            });
        }
    },


    /**
     * @param {Object} p1: {line, column}
     * @param {string} operator: '==', '<', '>', '<=', '>='
     * @param {Object} p2: {line, column}
     * @return {boolean}
     */
    ComparePosition: function(p1, operator, p2) {
        let ret = false;
    
    
        if (operator === '==' || operator === '<=' || operator === '>=') {
            ret = ret || (p1.line === p2.line && p1.column === p2.column);
        }
    
        if (operator === '<' || operator === '<=') {
            ret = ret || (p1.line === p2.line && p1.column < p2.column || p1.line < p2.line);
        }
    
        if (operator === '>' || operator === '>=') {
            ret = ret || (p1.line === p2.line && p1.column > p2.column || p1.line > p2.line);
        }
    
    
        return ret;
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
