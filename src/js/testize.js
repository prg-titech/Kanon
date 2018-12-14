__$__.Testize = {
    callParenthesisPos: {},
    hoveringCallInfo: {
        label: undefined,
        div: undefined
    },
    selectedCallInfo: {
        label: undefined,
        context_sensitiveID: undefined
    },
    setSelectedCallInfo(label) {
        try {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[label].start).loop;
            let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            __$__.Testize.selectedCallInfo = {
                label: label,
                context_sensitiveID: context_sensitiveID
            };
        } catch (e) {}
    },
    focusedTestOperations: undefined, // Array of mouse operation
    testNodeCounter: 0,
    enable: false,
    storedTest: {
    },
    network: {
        options: {
            autoResize: false,
            nodes: {
                color: 'skyblue'
            },
            edges: {
                arrows: 'to',
                color: {
                    color: 'skyblue',
                    opacity: 1.0,
                    highlight: 'skyblue',
                    hover: 'skyblue'
                },
                width: 3,
                smooth: {
                    enabled: true,
                    forceDirection: 'none',
                    roundness: 1.0
                }
            },
            physics: {
                enabled: true
            },
            interaction: {
                hover: true
                // zoomView: false
            },
            manipulation: {
                enabled: true,
                addNode: function(data, callback) {
                    let editType = 'addNode';
                    document.getElementById('operation').innerHTML = "Add Node";
                    document.getElementById('node-label').value = "";
                    document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, null);
                    document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                    document.getElementById('isLiteral').style.display = 'inline';
                    document.getElementById('network-popUp').style.display = 'block';
                    document.getElementById('node-label').focus();
                },
                addEdge: function(data, callback) {
                    if (__$__.Testize.network.network.body.data.nodes.get(data.from).type || data.to === '__RectForVariable__') {
                        callback(null);
                    } else if (data.from === '__RectForVariable__') {
                        let editType = 'addVariable';
                        document.getElementById('operation').innerHTML = "Add Variable";
                        document.getElementById('node-label').value = "";
                        document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, true);
                        document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                        document.getElementById('isLiteral').style.display = 'none';
                        document.getElementById('network-popUp').style.display = 'block';
                        document.getElementById('node-label').focus();
                    } else {
                        let editType = 'addEdge';
                        document.getElementById('operation').innerHTML = "Add Edge";
                        document.getElementById('node-label').value = "";
                        document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithCallback.bind(this, data, callback, editType, null);
                        document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this, callback);
                        document.getElementById('isLiteral').style.display = 'none';
                        document.getElementById('network-popUp').style.display = 'block';
                        document.getElementById('node-label').focus();
                    }
                },
                editEdge: function(data, callback) {
                    let origEdge = __$__.Testize.network.network.body.data.edges.get(data.id);
                    if (origEdge.from !== data.from || origEdge.from.slice(0, 11) === '__Variable-' && data.from.slice(0, 11) !== '__Variable-' || data.from === '__RectForVariable__' || data.to === '__RectForVariable__') {
                        callback(null);
                    } else {
                        if (data.from.slice(0, 11) === '__Variable-') {
                            let editType = 'editVariableReference';
                            __$__.Testize.saveMouseOperation(editType, {
                                oldTo: origEdge.to,
                                newTo: data.to,
                                label: data.label || __$__.Testize.network.network.body.data.edges.get(data.id).label
                            });
                        } else {
                            let editType = 'editEdgeReference';
                            __$__.Testize.saveMouseOperation(editType, {
                                from: data.from,
                                oldTo: origEdge.to,
                                newTo: data.to,
                                label: data.label || __$__.Testize.network.network.body.data.edges.get(data.id).label
                            });
                        }
                        callback(data);
                    }
                },
                deleteNode: function(data, callback) {
                    let editType = 'deleteNode';
                    if (data.nodes.indexOf('__RectForVariable__') >= 0) {
                        callback(null);
                    } else {
                        __$__.Testize.saveMouseOperation(editType, {
                            editType: editType,
                            id: data.nodes[0]
                        });
                        callback(data);
                    }
                },
                deleteEdge: function(data, callback) {
                    let edgeInfo = __$__.Testize.network.network.body.data.edges.get(data.edges[0]);
                    if (edgeInfo) {
                        if (edgeInfo.from.slice(0, 11) === '__Variable-') {
                            let editType = 'deleteVariable';
                            __$__.Testize.saveMouseOperation(editType, {
                                label: edgeInfo.label,
                                to: edgeInfo.to
                            });
                            callback(data);
                            __$__.Testize.network.network.body.data.nodes.remove(edgeInfo.from);
                        } else {
                            let editType = 'deleteEdge';
                            __$__.Testize.saveMouseOperation(editType, {
                                label: edgeInfo.label,
                                from: edgeInfo.from,
                                to: edgeInfo.to
                            });
                            callback(data);
                        }
                    } else {
                        callback(null);
                    }
                }
            }
        }
    },


    makeLiteralColor() {
        return {
            border: 'white',
            background: 'white',
            highlight: {
                border: 'white',
                background: 'white'
            },
            hover: {
                border: 'white',
                background: 'white'
            }
        }
    },


    initialize() {
        __$__.Testize.callParenthesisPos = {};
    },


    // ==================================================================================
    // ============== start: manipulation callback for constructing a test ==============
    // ==================================================================================


    clickEvent(param) {
        // click node
        if (param.nodes.length) {/* do nothing */}

        // click edge
        else if (param.edges.length) {
        }

        // click blank
        else {
            // __$__.Testize.network.network.disableEditMode();
        }
    },


    doubleClickEvent(param) {
        // double click node
        if (param.nodes.length) {
            // edit label of the node
            let nodeID = param.nodes[0];
            let node = __$__.Testize.network.network.body.data.nodes.get(nodeID);
            let editType = 'editNode';

            document.getElementById('operation').innerHTML = "Edit Node";
            document.getElementById('node-label').value = node.label;
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.nodes, editType, param, nodeID);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'inline';
            document.getElementById('checkboxForLiteral').checked = (node.color && node.color.border === 'white');
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }

        // double click edge
        else if (param.edges.length) {
            // edit label of the edge
            let edgeID = param.edges[0];
            let edge = __$__.Testize.network.network.body.data.edges.get(edgeID);
            let editType = (edge.from.slice(0, 11) === '__Variable-') ? 'editVariableLabel' : 'editEdgeLabel';

            document.getElementById('operation').innerHTML = "Edit Edge";
            document.getElementById('node-label').value = edge.label || "";
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.edges, editType, param, edgeID);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'none';
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }

        // double click blank
        else {
            // add a node
            let editType = 'addNode';

            console.log(param);
            document.getElementById('operation').innerHTML = "Add Node";
            document.getElementById('node-label').value = '';
            document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveDataWithoutCallback.bind(this, __$__.Testize.network.network.body.data.nodes, editType, param, null);
            document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
            document.getElementById('isLiteral').style.display = 'inline';
            document.getElementById('checkboxForLiteral').checked = false;
            document.getElementById('network-popUp').style.display = 'block';
            document.getElementById('node-label').focus();
        }
    },


    holdingEvent(param) {
        if (param.nodes.length) {
            // add an edge
            __$__.Testize.network.network.addEdgeMode();
        }

        else if (param.edges.length) {
            // edit edge
            __$__.Testize.network.network.editEdgeMode();
        }

        else {/* do nothing */}
    },


    saveDataWithoutCallback(dataSet, editType, param, id = null) {
        let color = null, type = null;
        if (editType === 'addNode' || editType === 'editNode') {
            // the case of node
            let nodeID = id || '__temp' + ++__$__.Testize.testNodeCounter;
            let label = document.getElementById('node-label').value;
            let isLiteral = document.getElementById('checkboxForLiteral').checked;
            if (isLiteral) {
                color = __$__.Testize.makeLiteralColor();
                type = 'string';
            }

            if (editType === 'addNode') {
                let pos = {x: param.pointer.canvas.x, y: param.pointer.canvas.y};
                dataSet.update({
                    id: nodeID,
                    label: label,
                    color: color,
                    type: type,
                    fixed: true,
                    isLiteral: isLiteral,
                    x: pos.x,
                    y: pos.y
                });
            } else {
                dataSet.update({
                    id: nodeID,
                    label: label,
                    color: color,
                    type: type,
                    fixed: true,
                    isLiteral: isLiteral
                });
            }

            __$__.Testize.saveMouseOperation(editType, {
                editType: editType,
                id: nodeID,
                label: label,
                isLiteral: isLiteral,
                type: type
            });
        } else {
            // the case of edge
            let edgeID = id;
            let edgeInfo = dataSet.get(edgeID);
            let label = document.getElementById('node-label').value;
            color = null;

            if (editType === 'editVariableLabel') {
                // edit variable name
                let origVariableNodeID = edgeInfo.from;
                let nodeDataSet = __$__.Testize.network.network.body.data.nodes;
                let node = nodeDataSet.get(edgeInfo.from);
                let newNodeID = '__Variable-' + label;
                color = (label === 'return') ? 'black' : 'seagreen';

                if (origVariableNodeID !== newNodeID) {
                    __$__.Testize.saveMouseOperation(editType, {
                        to: edgeInfo.to,
                        oldLabel: edgeInfo.label,
                        newLabel: label
                    });
                    nodeDataSet.update({
                        id: newNodeID,
                        label: label,
                        hidden: true
                    });
                    dataSet.update({
                        id: edgeID,
                        label: label,
                        color: color,
                        from: newNodeID
                    });
                    nodeDataSet.remove(origVariableNodeID);
                }
            } else {
                // edit edge label
                __$__.Testize.saveMouseOperation(editType, {
                    from: edgeInfo.from,
                    to: edgeInfo.to,
                    oldLabel: edgeInfo.label,
                    newLabel: label
                });
                dataSet.update({
                    id: edgeID,
                    label: label,
                    color: color
                });
            }
        }
        __$__.Testize.clearPopUp();
    },


    /**
     * @param {Object} data
     * @param {Function} callback
     * @param {string} editType
     */
    saveDataWithCallback(data, callback, editType) {
        let saveOperationData;
        data.label = document.getElementById('node-label').value;
        switch (editType) {
            case 'addNode': {
                data.id = '__temp' + ++__$__.Testize.testNodeCounter;
                data.isLiteral = document.getElementById('checkboxForLiteral').checked;
                data.fixed = true;
                if (data.isLiteral) {
                    data.color = __$__.Testize.makeLiteralColor();
                    data.type = 'string';
                }
                saveOperationData = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                break;
            }
            case 'editNode': {
                break;
            }
            case 'deleteNode': {
                break;
            }
            case 'addEdge': {
                let sameEdge = Object.values(__$__.Testize.network.network.body.data.edges._data).find(edge => edge.from === data.from && edge.label === data.label);
                if (sameEdge) {
                    __$__.Testize.network.network.body.data.edges.remove(sameEdge.id);
                    __$__.Testize.network.network.body.data.edges.add({
                        label: data.label,
                        from: data.from,
                        to: data.to
                    });
                    __$__.Testize.clearPopUp();
                    __$__.Testize.saveMouseOperation('editEdgeReference', {
                        editType: editType,
                        label: data.label,
                        from: data.from,
                        oldTo: sameEdge.to,
                        newTo: data.to
                    });
                    callback(null);
                    return;
                } else {
                    saveOperationData = {
                        editType: editType,
                        label: data.label,
                        from: data.from,
                        to: data.to
                    };
                }
                break;
            }
            case 'editEdgeReference': {
                break;
            }
            case 'editEdgeLabel': {
                break;
            }
            case 'deleteEdge': {
                break;
            }
            case 'addVariable': {
                // if a variable edge is added or edited
                let variableName = document.getElementById('node-label').value;
                let invisibleNodeID = '__Variable-' + variableName;

                // if the variable is already defined and already refers to an object
                if (__$__.Testize.network.network.body.data.nodes.get(invisibleNodeID)) {
                    let variableEdge = Object.values(__$__.Testize.network.network.body.data.edges._data).find(edge => edge.from === invisibleNodeID);
                    // this operation type is 'editVariableReference'
                    __$__.Testize.saveMouseOperation('editVariableReference', {
                        oldTo: variableEdge.to,
                        newTo: data.to,
                        label: variableName
                    });

                    __$__.Testize.network.network.body.data.edges.update({
                        id: variableEdge.id,
                        to: data.to
                    });
                } else {
                    __$__.Testize.network.network.body.data.nodes.add({
                        id: invisibleNodeID,
                        label: variableName,
                        hidden: true
                    });
                    __$__.Testize.network.network.body.data.edges.add({
                        from: invisibleNodeID,
                        to: data.to,
                        color: (variableName === 'return') ? 'black' : 'seagreen',
                        label: variableName,
                        length: 30
                    });

                    __$__.Testize.saveMouseOperation(editType, {
                        to: data.to,
                        label: variableName
                    });
                }
                __$__.Testize.clearPopUp();
                callback(null);
                return;
            }
            case 'editVariableReference': {
                break;
            }
            case 'editVariableLabel': {
                break;
            }
            case 'deleteVariable': {
                break;
            }
        }
        __$__.Testize.clearPopUp();
        __$__.Testize.saveMouseOperation(editType, saveOperationData);
        callback(data);
    },


    /**
     * @param {string} editType
     * @param {Object} data
     *
     * // information to be store
     * - add    Node       : id, label, isLiteral, (optional) type
     * - edit   Node(Label): id, label, isLiteral, (optional) type
     * - delete Node       : id
     * - add    Edge       : from, to, label
     * - edit   Edge(Refer): from, oldTo, newTo, label
     * - edit   Edge(Label): from, to, oldLabel, newLabel
     * - delete Edge       : from, to, label
     * - add    Variable       : to, label
     * - edit   Variable(Refer): oldTo, newTo, label
     * - edit   Variable(Label): to, oldLabel, newLabel
     * - delete Variable       : to, label
     */
    saveMouseOperation(editType, data) {
        let ope;
        switch (editType) {
            case 'addNode': {
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editNode': {
                ope = {
                    editType: editType,
                    id: data.id,
                    label: data.label,
                    isLiteral: data.isLiteral,
                    type: data.type
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteNode': {
                ope = {
                    editType: editType,
                    id: data.id
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'addEdge': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editEdgeReference': {
                ope = {
                    editType: editType,
                    from: data.from,
                    // to: data.to,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editEdgeLabel': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteEdge': {
                ope = {
                    editType: editType,
                    from: data.from,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'addVariable': {
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editVariableReference': {
                ope = {
                    editType: editType,
                    oldTo: data.oldTo,
                    newTo: data.newTo,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'editVariableLabel': {
                ope = {
                    editType: editType,
                    to: data.to,
                    oldLabel: data.oldLabel,
                    newLabel: data.newLabel
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
            case 'deleteVariable': {
                ope = {
                    editType: editType,
                    to: data.to,
                    label: data.label
                };
                __$__.Testize.focusedTestOperations.push(ope);
                break;
            }
        }
        // console.log(...__$__.Testize.focusedTestOperations);
    },


    // ==================================================================================
    // ====================================== end =======================================
    // ==================================================================================
    // ================== start: invoked by __$__.Update.CodeWithCP =====================
    // ==================================================================================


    matching(actualGraph, expectedGraph, returnObjectID = undefined) {
        let objectDuplication_actual = __$__.Testize.constructObjectForTraverse(actualGraph.nodes, actualGraph.edges, returnObjectID);

        let objectDuplication_expected = __$__.Testize.constructObjectForTraverse(expectedGraph.nodes, expectedGraph.edges);

        let referencedObjects_runtime = Object.keys(objectDuplication_actual);

        return referencedObjects_runtime.length !== 0 && referencedObjects_runtime.every(function (variableName, idx, arr) {
            let obj_actual   = objectDuplication_actual[variableName];
            let obj_expected = objectDuplication_expected[variableName];

            if (obj_expected) {
                let result = __$__.Testize.traverseSimultaneously(obj_actual, obj_expected);

                if (!result) return false;

                delete objectDuplication_actual[variableName];
                delete objectDuplication_expected[variableName];
            } else {
                return false;
            }

            return idx !== arr.length - 1 || Object.keys(objectDuplication_expected).length === 0;
        });
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     *
     * @return {boolean} result
     */
    checkActualGraph(objects, probe, retObj, callLabel, context_sensitiveID) {
        if (!__$__.Testize.hasTest(callLabel, context_sensitiveID))
            return true;


        let actualGraph = __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, probe));
        let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
        let expectedGraph = {
            nodes: Object.values(testInfo.testData.nodes._data),
            edges: Object.values(testInfo.testData.edges._data)
        };
        let returnObjectID = (retObj && typeof retObj === 'object' && retObj.__id) ? retObj.__id : undefined;

        let result = __$__.Testize.matching(actualGraph, expectedGraph, returnObjectID);

        __$__.Testize.storedTest[callLabel][context_sensitiveID].passed = result;
        return result;
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     * @param {Array} classes
     *
     * @return {Object} result
     */
    override(objects, probe, retObj, callLabel, context_sensitiveID, classes) {
        let variableReferences = {};
        let newObjects = [];
        let testData = __$__.Testize.storedTest[callLabel][context_sensitiveID].testData;

        // make edge information
        let edgeDir = {};
        let varInfo = {};
        Object.values(testData.edges._data).forEach(edge => {
            let from = edge.from;
            if (from.slice(0, 11) === '__Variable-') {
                let variableName = edge.label;
                varInfo[variableName] = {
                    to: edge.to,
                    label: edge.label // variable name
                };
            } else {
                if (!edgeDir[from]) edgeDir[from] = [];
                edgeDir[from].push({
                    to: edge.to,
                    label: edge.label
                });
            }
        });


        // to grasp all objects which are constructed at runtime.
        //   key: object id
        // value: runtime object
        let runtimeObjects = {};
        // here, collect runtimeObjects and delete all properties of all objects
        objects.concat(Object.values(probe)).forEach(obj => {
            if (runtimeObjects[obj.__id] || obj === null || obj === undefined)
                return;

            __$__.Testize.traverse(obj, runtimeObjects);
        });


        // remove objects which this test does not include from __objs.
        let i = 0;
        while (i < objects.length) {
            let obj = objects[i];
            if (testData.nodes._data[obj.__id]) {
                i++;
            } else {
                objects.splice(i, 1);
            }
        }


        let queueForSetProp = Object.values(runtimeObjects);
        while (queueForSetProp.length > 0) {
            let obj = queueForSetProp.shift();
            let objectID = obj.__id;

            if (edgeDir[objectID]) {
                edgeDir[objectID].forEach(edge => {
                    let nextObject;
                    if (!runtimeObjects[edge.to]) {
                        let newlyConstructedNode = testData.nodes.get(edge.to);
                        if (!newlyConstructedNode.isLiteral) {
                            nextObject = Object.create(classes[newlyConstructedNode.label].prototype);
                            if (edge.to.slice(0, 6) !== '__temp') {
                                // update the test
                                let newID, i = 1;
                                while (!newID) {
                                    let candidate = '__temp' + i;
                                    if (!testData.nodes.get(candidate)) newID = candidate;
                                    i++;
                                }
                                let nodeInfo = testData.nodes.get(newlyConstructedNode.id);
                                nodeInfo.id = newID;
                                testData.nodes.add(nodeInfo);
                                testData.nodes.remove(newlyConstructedNode.id);
                                Object.values(testData.edges._data).forEach(edge => {
                                    if (edge.from === newlyConstructedNode.id)
                                        testData.edges.update({
                                            id: edge.id,
                                            from: newID
                                        });
                                    if (edge.to === newlyConstructedNode.id)
                                        testData.edges.update({
                                            id: edge.id,
                                            to: newID
                                        });
                                });
                                newlyConstructedNode = nodeInfo;
                            }
                            Object.setProperty(nextObject, '__id', newlyConstructedNode.id);
                            Object.setProperty(nextObject, '__ClassName__', newlyConstructedNode.label);
                            queueForSetProp.push(nextObject);
                            runtimeObjects[nextObject.__id] = nextObject;
                            newObjects.push(nextObject);
                        } else {
                            // case of literal
                            let literalNode = testData.nodes.get(edge.to);
                            if (literalNode.type === 'number') {
                                nextObject = Number(literalNode.label);
                            } else {
                                nextObject = literalNode.label;
                            }
                        }
                    } else {
                        nextObject = runtimeObjects[edge.to];

                        if (!nextObject) {
                            // case of literal
                            let literalNode = testData.nodes.get(edge.to);
                            if (literalNode.type === 'number') {
                                nextObject = Number(literalNode.label);
                            } else {
                                nextObject = literalNode.label;
                            }
                        }
                    }
                    obj[edge.label] = nextObject;
                });
            }
        }


        // use varInfo to make return object which is used to change the variable references
        Object.keys(probe).forEach(v => {
            if (v === 'this') return;
            let object = probe[v];
            if (object.__id === varInfo[v].to) {
                // do nothing
            } else {
                variableReferences[v] = runtimeObjects[varInfo[v].to];
            }
        });


        Object.keys(varInfo).forEach(v => {
            if (v === 'this') return;
            else if (v === 'return') {
                variableReferences.__retObj = runtimeObjects[varInfo[v].to];
            } else if (!variableReferences[v]) {
                variableReferences[v] = runtimeObjects[varInfo[v].to];
            }
        });

        // if there is no "return" arrow in the test graph
        if (!variableReferences.__retObj) {
            // if the function inserted this test returns an object at runtime
            if (typeof retObj !== "function" && retObj !== null && retObj !== undefined && !__$__.Traverse.literals[typeof retObj]) {
                variableReferences.__retObj = undefined;
            }
        }

        return {
            newObjects: newObjects,
            variableReferences: variableReferences
        };
    },


    traverse: function(obj, referableObjects, literals) {
        if (obj.__id && !referableObjects[obj.__id]) {
            referableObjects[obj.__id] = obj;
        } else {
            return;
        }

        Object.keys(obj).forEach(prop => {
            // Don't search if the head of property name is "__"
            if (prop.slice(0, 2) === '__')
                return;

            // "to" is destination of edge
            let to = obj[prop];

            if (typeof to !== "function" && to !== null && to !== undefined) {
                if (!__$__.Traverse.literals[typeof to]) { // if "to" is object
                    __$__.Testize.traverse(to, referableObjects);
                }
            }

            delete obj[prop];
        });
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {Object} retObj
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     * @param {boolean} errorOccurred
     * @param {Array} classes
     *
     * @return {Object}
     *
     * This function checks whether the runtime structure matches the test structure
     * and overrides the runtime objects if the test failed
     * This function returns Object {variableName: Object} which represents variable reference information we want to override.
     * If the test passed, this function returns an empty object.
     */
    testAndOverride(objects, probe, retObj, callLabel, context_sensitiveID, errorOccurred, classes) {
        let passed = !errorOccurred && __$__.Testize.checkActualGraph(objects, probe, retObj, callLabel, context_sensitiveID);

        __$__.Testize.storedTest[callLabel][context_sensitiveID].passed = passed;

        if (passed) {
            // if passed
            return {
                newObjects: [],
                variableReferences: {}
            };
        } else {
            // if failed
            return __$__.Testize.override(objects, probe, retObj, callLabel, context_sensitiveID, classes);
        }
    },


    traverseSimultaneously(obj_actual, obj_expected) {
        let info_actual = obj_actual.__info;
        let info_expected = obj_expected.__info;

        if (info_expected.id.slice(0, 6) === '__temp') info_expected.id = info_actual.id;
        let isMatching = (info_actual.prop.length === info_expected.prop.length)
                      && (info_actual.id          === info_expected.id)
                      && (info_actual.label       === info_expected.label)
                      && (!info_actual.literal    === !info_expected.literal);

        if (isMatching) {
            // check recursively
            if (!info_actual.checked) {
                info_actual.checked = true;
                info_expected.checked = true;

                let result = info_actual.prop.every(prop => {
                    let nextObj_actual   = obj_actual[prop];
                    let nextObj_expected = obj_expected[prop];
                    if (!nextObj_expected) return false;

                    let result = __$__.Testize.traverseSimultaneously(nextObj_actual, nextObj_expected);

                    return result;
                });
                if (!result) return false;
            }

            return true;
        } else {
            return false;
        }
    },


    constructObjectForTraverse(nodes, edges, returnObjectID = null) {
        let variables = {};
        let objects = {};
        nodes.forEach(node => {
            objects[node.id] = {
                __info: {
                    id: node.id,
                    label: node.label,
                    literal: node.color && node.color.background === 'white',
                    prop: [],
                    propObj: {}
                }
            };
            if (node.id === returnObjectID) {
                variables.return = objects[node.id];
            }
        });
        edges.forEach(edge => {
            if (edge.from.slice(0, 11) === '__Variable-') {
                variables[edge.label] = objects[edge.to];
            } else {
                let prop = edge.label;
                objects[edge.from][prop] = objects[edge.to];
                objects[edge.from].__info.propObj[prop] = objects[edge.from].__info.prop.length;
                objects[edge.from].__info.prop.push(prop);
            }
        });

        return variables;
    },


    hasTest(callLabel, context_sensitiveID) {
        return __$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID];
    },


    extractUsedClassNames(callLabel, context_sensitiveID) {
        let testData = __$__.Testize.storedTest[callLabel][context_sensitiveID].testData;
        let retObj = {};
        Object.values(testData.nodes._data).forEach(node => {
            let id = node.id;
            let label = node.label;
            if (id.slice(0, 11) === '__Variable-') {
                return;
            } else if (id === '__RectForVariable__') {
                return;
            } else {
                if (id.slice(0, 6) === '__temp' && !node.isLiteral) {
                    retObj[label] = true;
                }
            }
        });
        return Object.keys(retObj);
    },


    /**
     * @param {Array} objects
     * @param {Object} probe
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     *
     * This function is called before executing a function call which has a test.
     * First, check whether the runtime graph matches the stored precondition graph.
     * Second, if doesn't match, execute the following two steps.
     *   - update the precondition graph of this function call
     *   - reconstruct the test of this function call by using operations when the test is constructed by mouse operation
     */
    checkPrecondGraph(objects, probe, callLabel, context_sensitiveID) {
        if (__$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID]) {
            let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
            let newPrecond = __$__.ToVisjs.Translator(__$__.Traverse.traverse(objects, probe));
            if (testInfo.precond) {
                if (!__$__.Testize.matching(newPrecond, testInfo.precond)) {
                    testInfo.precond = newPrecond;
                    let newTestGraph = __$__.Testize.tryReconstructingTest(newPrecond, callLabel, context_sensitiveID);
                    if (newTestGraph) {
                        testInfo.testData = {
                            nodes: new vis.DataSet(newTestGraph.nodes),
                            edges: new vis.DataSet(newTestGraph.edges)
                        };
                        testInfo.testReconstructionFailed = false;
                    } else {
                        testInfo.testReconstructionFailed = true;
                    }
                }
            } else {
                testInfo.precond = newPrecond;
            }
        }
    },


    /**
     * @param {Object} precond (graph formatted to vis.js)
     * @param {string} callLabel
     * @param {string} context_sensitiveID
     */
    tryReconstructingTest(precond, callLabel, context_sensitiveID) {
        let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
        let testGraph = jQuery.extend(true, {}, precond);
        let operations = testInfo.operations;
        try {
            for (let i = 0; i < operations.length; i++) {
                __$__.Testize.applyOperation(testGraph, operations[i]);
            }
        } catch (e) {
            return;
        }
        return testGraph;
    },


    /**
     * @param {Object} graph
     * @param {Object} ope
     */
    applyOperation(graph, ope) {
        switch (ope.editType) {
            case 'addNode': {
                // id, label, isLiteral (optional) type
                let newNode = {
                    id: ope.id,
                    label: ope.label,
                    isLiteral: ope.isLiteral,
                    type: ope.type,
                    fixed: true,
                    color: ope.isLiteral ? null : __$__.Testize.makeLiteralColor()
                };
                if (!graph.nodes.find(node => node.id === ope.id)) {
                    graph.nodes.push(newNode);
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editNode': {
                // id, label, isLiteral (optional) type
                let nodeToEdit = graph.nodes.find(node => node.id === ope.id);
                if (nodeToEdit) {
                    nodeToEdit.label = ope.label;
                    nodeToEdit.isLiteral = ope.isLiteral;
                    nodeToEdit.type = ope.type;
                    nodeToEdit.color = ope.isLiteral ? null : __$__.Testize.makeLiteralColor();
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteNode': {
                // id
                let i = 0;
                while (i < graph.nodes.length) {
                    let node = graph.nodes[i];
                    if (node.id === ope.id) {
                        graph.nodes.splice(i, 1);
                        i = -1;
                        break;
                    } else {
                        i++;
                    }
                }
                if (i === -1) {
                    i = 0;
                    while (i < graph.edges.length) {
                        let edge = graph.edges[i];

                        if (edge.from === ope.id || edge.to === ope.id) graph.edges.splice(i, 1);
                        else i++;
                    }
                }

                break;
            }
            case 'addEdge': {
                // from, to, label
                // memo: How should Kanon do when the from-node already has the property?
                let checked = {from: false, to: false};
                graph.nodes.forEach(node => {
                    checked.from = checked.from || node.id === ope.from;
                    checked.to = checked.to || node.id === ope.to;
                });
                if (checked.from && checked.to) {
                    graph.edges.push({
                        from: ope.from,
                        to: ope.to,
                        label: ope.label
                    });
                } else {
                    // error(?)
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editEdgeReference': {
                // from, oldTo, newTo, label
                let edgeToEdit = graph.edges.find(edge => edge.from === ope.from && edge.to === ope.oldTo && edge.label === ope.label);
                if (edgeToEdit) {
                    edgeToEdit.to = ope.newTo;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editEdgeLabel': {
                // from, to, oldLabel, newLabel
                let edgeToEdit = graph.edges.find(edge => edge.from === ope.from && edge.to === ope.to && edge.label === ope.oldLabel);
                if (edgeToEdit) {
                    edgeToEdit.label = ope.newLabel;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteEdge': {
                // from, to, label
                let i = 0;
                while (i < graph.edges.length) {
                    let edge = graph.edges[i];
                    if (edge.from === ope.from && edge.to === ope.to && edge.label === ope.label) {
                        graph.edges.splice(i, 1);
                        break;
                    } else {
                        i++;
                    }
                }
                break;
            }
            case 'addVariable': {
                // to, label
                // memo: How should Kanon do when the from-node already has the property?
                let hiddenNodeID = '__Variable-' + ope.label;
                let referredNode = graph.nodes.find(node => node.id === ope.id);
                let variableEdge = graph.edges.find(edge => edge.from === hiddenNodeID);
                if (referredNode) {
                    if (variableEdge) {
                        variableEdge.to = ope.to;
                    } else {
                        graph.nodes.push({
                            id: hiddenNodeID,
                            label: ope.label,
                            hidden: true
                        });
                        graph.edges.push({
                            from: hiddenNodeID,
                            to: ope.to,
                            label: ope.label,
                            color: (ope.label === 'return') ? 'black' : 'seagreen'
                        });
                    }
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editVariableReference': {
                // oldTo, newTo, label
                let variableNodeID = '__Variable-' + ope.label;
                let edgeToEdit = graph.edges.find(edge => edge.from === variableNodeID);
                if (edgeToEdit) {
                    edgeToEdit.to = ope.newTo;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'editVariableLabel': {
                // to, oldLabel, newLabel
                let variableNodeID = '__Variable-' + ope.oldLabel;
                let edgeToEdit = graph.edges.find(edge => edge.from === variableNodeID && edge.to === ope.to && edge.label === ope.oldLabel);
                if (edgeToEdit) {
                    edgeToEdit.label = ope.newLabel;
                    let variableNode = graph.nodes.find(node => node.id === variableNodeID);
                    variableNode.label = ope.newLabel;
                    variableNode.id = '__Variable-' + ope.newLabel;
                } else {
                    // error
                    throw new Error('Cannot reconstruct');
                }
                break;
            }
            case 'deleteVariable': {
                // to, label
                let variableNodeID = '__Variable-' + ope.label;
                let i = 0;
                while (i < graph.nodes.length) {
                    let node = graph.nodes[i];
                    if (node.id === variableNodeID) {
                        graph.nodes.splice(i, 1);
                        i = -1;
                        break;
                    }
                    else i++;
                }
                if (i === -1) {
                    i = 0;
                    while (i < graph.edges.length) {
                        let edge = graph.edges[i];
                        if (edge.from === variableNodeID && edge.label === ope.label) {
                            graph.edges.splice(i, 1);
                            i === -1;
                            break;
                        }
                        else i++;
                    }
                }
                break;
            }
        }
    },


    // ==================================================================================
    // ====================================== end =======================================
    // ==================================================================================


    cancelEdit(callback) {
        __$__.Testize.clearPopUp();
        callback(null);
    },


    clearPopUp() {
        document.getElementById('saveButtonForTestize').onclick = null;
        document.getElementById('cancelButtonForTestize').onclick = null;
        document.getElementById('network-popUp').style.display = 'none';
    },


    createWindow(width, height, title) {
        __$__.win = new Window({className: 'mac_os_x', width: width, height: height, zIndex: 300, title: title});
        __$__.win.getContent().update('<div id="window-for-manipulation"></div>');
        let windowSelection = __$__.d3.select('#window-for-manipulation');

        windowSelection.append('div')
            .attr('id', 'window-header')
            .append('text')
            .attr('id', 'acceptButton')
            .text('accept')
            .on('click', function (e) {
                // this function is invoked when this button is clicked.
                __$__.Testize.setTest();
                __$__.win.close();
                __$__.Update.PositionUpdate([{
                    start: {row: 0, column: 0},
                    end: {row: 0, column: 0},
                    lines: [""],
                    action: 'insert'
                }]);
            })
            .on('mouseover', function (e) {
                this.style.cursor = 'pointer';
            })
            .on('mouseout', function (e) {
                this.style.cursor = 'default';
            });

        windowSelection.append('div')
            .attr('id', 'window-body');

        jQuery('#network-popUp').appendTo('#window-for-manipulation');

        let networkInfo = __$__.Testize.network;
        networkInfo.container = document.getElementById('window-body');
        networkInfo.network = new vis.Network(
            networkInfo.container,
            {nodes: new vis.DataSet({}), edges: new vis.DataSet({})},
            networkInfo.options
        );

        // set event handlers
        (() => {
            let holding = false;
            let clicked = false;
            networkInfo.network.on('hold', function(param) {
                holding = true;
                // holding event
                __$__.Testize.holdingEvent(param);
            });
            networkInfo.network.on('release', function(param) {
                if (holding) {
                    holding = false;
                    clicked = false;
                } else {
                    if (clicked) {
                        // double click event
                        __$__.Testize.doubleClickEvent(param);
                        clicked = false;
                        return
                    }

                    clicked = true;
                    setTimeout(function click() {
                        // single click event
                        if (clicked) {
                            __$__.Testize.clickEvent(param);
                        }
                        clicked = false;
                    }, 300);
                }
            });
            networkInfo.network.on('dragStart', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    networkInfo.network.body.data.nodes.update({id: nodeId, fixed: false});
                }
            });
            networkInfo.network.on('dragEnd', params => {
                if (params.nodes.length > 0) {
                    let nodeId = params.nodes[0];
                    networkInfo.network.body.data.nodes.update({id: nodeId, fixed: true});
                }
            });
        })();
        Windows.addObserver({
            onResize() {
                networkInfo.network.redraw();
            },
            onClose() {
                __$__.Testize.focusedTestOperations = undefined;
            }
        });
    },


    displayTooltip(div, label) {
        div.style.display = 'inline';
        if (div === __$__.Testize.popup_addTest) {
            __$__.Testize.popup_removeTest.style.display = 'none';
        } else {
            __$__.Testize.popup_addTest.style.display = 'none';
        }
        __$__.Testize.hoveringCallInfo.label = label;
        __$__.Testize.hoveringCallInfo.div = div;
    },


    divOfPopup(callLabel, context_sensitiveID) {
        if (!context_sensitiveID) {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
        }
        if (__$__.Testize.storedTest[callLabel] && __$__.Testize.storedTest[callLabel][context_sensitiveID]) {
            return __$__.Testize.popup_removeTest;
        } else {
            return __$__.Testize.popup_addTest;
        }
    },


    duplicateGraph(graph) {
        let duplicatedGraph = {};
        jQuery.extend(true, duplicatedGraph, graph);
        duplicatedGraph.nodes.forEach(node => {
            delete node.fixed;
        });
        return duplicatedGraph;
    },


    /**
     * @param e
     *
     * this function is callback when the mouse moves over the editor.
     */
    mousemove(e) {
        let position = e.getDocumentPosition();
        let cursorPos = {line: position.row + 1, column: position.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;
        if (cursorPos) {
            let label = Object.keys(__$__.Testize.callParenthesisPos).reduceNative((accLabel, currentLabel) => {
                let callPos = __$__.Testize.callParenthesisPos[currentLabel];
                if (compare(callPos.start, '<=', cursorPos) && compare(cursorPos, '<=', callPos.end)) {
                    if (!currentLabel || compare(__$__.Testize.callParenthesisPos[currentLabel].start, '<=', callPos.start)) {
                        return currentLabel;
                    }
                }
                return accLabel;
            }, undefined);

            // if the popup is already displayed.
            if (__$__.Testize.hoveringCallInfo.label) {
                // check whether Kanon should remove the popup
                let div = __$__.Testize.hoveringCallInfo.div;
                let divRect = div.getBoundingClientRect();
                let pixelPosition = __$__.editor.renderer.textToScreenCoordinates({
                    row: __$__.Testize.callParenthesisPos[__$__.Testize.hoveringCallInfo.label].start.line - 1,
                    column: __$__.Testize.callParenthesisPos[__$__.Testize.hoveringCallInfo.label].start.column
                });
                let lineHeight = __$__.editor.renderer.lineHeight;

                // if Kanon should continue to display the same popup
                if (Math.abs((__$__.mouse.pageX - pixelPosition.pageX) * 2) <= divRect.width
                    && pixelPosition.pageY - divRect.height - lineHeight/2 <= __$__.mouse.pageY
                    && __$__.mouse.pageY <= pixelPosition.pageY + lineHeight) {
                    // do nothing
                } else { // if Kanon should display newly popup
                    if (label) {
                        let newDiv = __$__.Testize.divOfPopup(label);
                        __$__.Testize.updateTooltipPos(__$__.editor.renderer.textToScreenCoordinates({
                            row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                            column: __$__.Testize.callParenthesisPos[label].start.column
                        }), newDiv);
                        __$__.Testize.displayTooltip(newDiv, label);
                    } else {
                        __$__.Testize.removeTooltip(div);
                    }
                }
            } else { // any popups aren't displayed
                // if Kanon should display newly popup
                if (label) {
                    let newDiv = __$__.Testize.divOfPopup(label);
                    __$__.Testize.updateTooltipPos(__$__.editor.renderer.textToScreenCoordinates({
                        row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                        column: __$__.Testize.callParenthesisPos[label].start.column
                    }), newDiv);
                    __$__.Testize.displayTooltip(newDiv, label);
                }
            }
        }
    },


    openWin(modified = false) {
        let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        if (!__$__.win) {
            __$__.Testize.createWindow(split_pane_size.width/1.5, split_pane_size.height/1.5, '');
        } else {
            __$__.win.setSize(split_pane_size.width / 1.5, split_pane_size.height / 1.5);
        }

        // duplicate an object graph stored just before the focusing function call
        let graph;
        try {
            let callLabel = __$__.Testize.selectedCallInfo.label;
            let checkpointIDs = __$__.Context.CheckPointIDAroundFuncCall[callLabel];
            let context_sensitiveID = __$__.Testize.selectedCallInfo.context_sensitiveID;
            if (modified) {
                let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
                let testData = testInfo.testData;
                __$__.Testize.focusedTestOperations = testInfo.operations;
                graph = {
                    // nodes: testData.nodes,
                    // edges: testData.edges
                    nodes: new vis.DataSet(Object.values(testData.nodes._data).map(node => jQuery.extend(true, {}, node))),
                    edges: new vis.DataSet(Object.values(testData.edges._data).map(edge => jQuery.extend(true, {}, edge)))
                };
            } else {
                graph = __$__.Context.StoredGraph[checkpointIDs.before][context_sensitiveID];
                graph = __$__.Testize.duplicateGraph(graph);
                // push a special node so that the user can add green arrows which represent variable references.
                graph.nodes.push({
                    id: '__RectForVariable__',
                    label: 'def var',
                    color: {
                        border: 'lightsalmon',
                        background: 'lightsalmon',
                        highlight: {
                            border: 'lightsalmon',
                            background: 'lightsalmon'
                        },
                        hover: {
                            border: 'lightsalmon',
                            background: 'lightsalmon'
                        }
                    },
                    shape: 'box',
                    physics: false
                });
                __$__.Testize.focusedTestOperations = [];
            }
        } catch (e) {
            graph = {nodes: [], edges: []};
        }

        __$__.Testize.network.network.setData(graph);
        __$__.Testize.network.network.redraw();
        __$__.win.showCenter();
        __$__.Testize.network.network.once('stabilized', param => {
            Object.values(__$__.Testize.network.network.body.data.nodes._data).forEach(node => {
                if (node.id.slice(0, 11) !== '__Variable-' && node.id !== '__RectForVariable__')
                    __$__.Testize.network.network.body.data.nodes.update({id: node.id, fixed: true});
            });
        });
    },


    /**
     * @param node: this has 'label' property and this node's type is CallExpression
     *
     * If the function call which the node represents is written by the following style,
     * f ( a )
     *
     * the registered position is as follows.
     * start => {line: 1, column: 1}
     * end   => {line: 1, column: 7}
     */
    registerParenthesisPos(node) {
        try {
            if (node.label) {
                let arrayOfTextContainsParenthesis = __$__.editor.session.getTextRange(new __$__.Range(
                    node.callee.loc.end.line-1,
                    node.callee.loc.end.column,
                    node.loc.end.line-1,
                    node.loc.end.column
                )).split('\n');

                let registerPos = {
                    start: {
                        line: node.callee.loc.end.line,
                        column: node.callee.loc.end.column
                    },
                    end: {
                        line: node.loc.end.line,
                        column: node.loc.end.column
                    }
                };

                // find first open parenthesis
                for (let i = 0; i < arrayOfTextContainsParenthesis.length; i++) {
                    let text = arrayOfTextContainsParenthesis[i];
                    let idx = text.indexOf('(');
                    if (idx === -1) {
                        registerPos.start.line += 1;
                        registerPos.start.column = 0;
                    } else {
                        registerPos.start.column += idx;
                        break;
                    }
                }

                // find last close parenthesis
                for (let i = arrayOfTextContainsParenthesis.length-1; i >= 0; i--) {
                    let text = arrayOfTextContainsParenthesis[i];
                    let idx = text.lastIndexOf(')');
                    if (idx === -1) {
                        registerPos.end.line -= 1;
                        registerPos.end.column = arrayOfTextContainsParenthesis[i-1].length;
                    } else {
                        registerPos.end.column -= text.length-idx-1;
                        break;
                    }
                }

                __$__.Testize.callParenthesisPos[node.label] = registerPos;
                if (__$__.Testize.storedTest[node.label] && __$__.Testize.storedTest[node.label].markerInfo) {
                    let markerRange = __$__.Testize.storedTest[node.label].markerInfo.range;
                    let markerClazz = __$__.Testize.storedTest[node.label].markerInfo.clazz;
                    if (registerPos.start.line-1 === markerRange.start.row
                        && registerPos.start.column === markerRange.start.column
                        && registerPos.end.line-1 === markerRange.end.row
                        && registerPos.end.column === markerRange.end.column) {
                        // if the position of the marker is the same as the parenthesis position,
                        // do nothing
                    } else {
                        let newMarkerRange = new __$__.Range(
                            registerPos.start.line-1,
                            registerPos.start.column,
                            registerPos.end.line-1,
                            registerPos.end.column
                        );
                        let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, markerClazz, 'text');
                        __$__.Testize.removeMarker(__$__.Testize.storedTest[node.label], newMarkerID, newMarkerRange, markerClazz);
                    }
                }
            }
        } catch (e) {
            console.log(node, e);
        }
    },


    removeMarker(testInfo, newMarkerID, newMarkerRange, clazz) {
        if (testInfo.markerInfo)
            __$__.editor.session.removeMarker(testInfo.markerInfo.ID);

        testInfo.markerInfo = (newMarkerID) ? {
                ID: newMarkerID,
                range: newMarkerRange,
                clazz: clazz
            } : undefined;
    },


    removeTest(callLabel) {
        let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
        let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel]);
        delete __$__.Testize.storedTest[callLabel][context_sensitiveID];
        __$__.Testize.hoveringCallInfo = {};
    },


    removeTooltip(div) {
        div.style.display = 'none';
        __$__.Testize.hoveringCallInfo.label = undefined;
        __$__.Testize.hoveringCallInfo.div = undefined;
    },


    setTest() {
        let expectedGraphData = {};
        jQuery.extend(true, expectedGraphData, __$__.Testize.network.network.body.data);
        let callLabel = __$__.Testize.selectedCallInfo.label;
        let context_sensitiveID = __$__.Testize.selectedCallInfo.context_sensitiveID;
        let callPos = __$__.Testize.callParenthesisPos[callLabel];
        let markerRange = new __$__.Range(
            callPos.start.line - 1,
            callPos.start.column,
            callPos.end.line - 1,
            callPos.end.column
        );
        let clazz = 'testFailed';
        let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');

        if (!__$__.Testize.storedTest[callLabel]) {
            __$__.Testize.storedTest[callLabel] = {};
        }

        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], markerID, markerRange, clazz);

        __$__.Testize.storedTest[callLabel][context_sensitiveID] = {
            testData: expectedGraphData,
            passed: false,
            operations: __$__.Testize.focusedTestOperations
        };

        __$__.Testize.focusedTestOperations = undefined;
        __$__.Testize.selectedCallInfo = {label: undefined, context_sensitiveID: undefined};
    },


    updateMarker() {
        Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            let specifiedContext = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            if (__$__.Testize.storedTest[callLabel].markerInfo && !__$__.Testize.storedTest[callLabel][specifiedContext]) {
                __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel]);
            } else if (__$__.Testize.storedTest[callLabel][specifiedContext]) {
                let callPos = __$__.Testize.callParenthesisPos[callLabel];
                let markerRange = new __$__.Range(
                    callPos.start.line - 1,
                    callPos.start.column,
                    callPos.end.line - 1,
                    callPos.end.column
                );
                let clazz = (__$__.Testize.storedTest[callLabel][specifiedContext].testReconstructionFailed)
                    ? 'testWarning'
                    : (__$__.Testize.storedTest[callLabel][specifiedContext].passed)
                        ? 'testPassed'
                        : 'testFailed';

                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;

                if (!markerInfo) {
                    let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');
                    __$__.Testize.storedTest[callLabel].markerInfo = {
                        ID: markerID,
                        range: markerRange,
                        clazz: clazz
                    };
                } else if (!(markerInfo.clazz === clazz
                        && markerRange.start.row === callPos.start.row
                        && markerRange.start.column === callPos.start.column
                        && markerRange.end.row === callPos.end.row
                        && markerRange.end.column === callPos.end.column)) {
                    let markerID = __$__.editor.session.addMarker(markerRange, clazz, 'text');
                    __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], markerID, markerRange, clazz);
                }
            }
        });
    },


    updateMarkerPosition(editEvent) {
        let start = {line: editEvent.start.row + 1, column: editEvent.start.column};
        let end = {line: editEvent.end.row + 1, column: editEvent.end.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;

        if (editEvent.action === 'insert') {
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;
                if (markerInfo) {
                    let markerID = markerInfo.ID;
                    let marker = __$__.editor.session.getMarkers()[markerID];
                    let markerRange = markerInfo.range;
                    let pos = {
                        start: {
                            line: markerRange.start.row + 1,
                            column: markerRange.start.column
                        },
                        end: {
                            line: markerRange.end.row + 1,
                            column: markerRange.end.column
                        }
                    };

                    // update
                    let changed = __$__.UpdateLabelPos.modify_by_insert(editEvent, pos);
                    if (changed) {
                        let newMarkerRange = new __$__.Range(
                            pos.start.line-1,
                            pos.start.column,
                            pos.end.line-1,
                            pos.end.column
                        );
                        let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, marker.clazz, marker.type);
                        __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], newMarkerID, newMarkerRange, marker.clazz);
                    }
                }
            });
        } else { // editEvent.action == 'remove'
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerInfo = __$__.Testize.storedTest[callLabel].markerInfo;
                if (markerInfo) {
                    let markerID = markerInfo.ID;
                    let marker = __$__.editor.session.getMarkers()[markerID];
                    let pos = {
                        start: {
                            line: marker.range.start.row + 1,
                            column: marker.range.start.column
                        },
                        end: {
                            line: marker.range.end.row + 1,
                            column: marker.range.end.column
                        }
                    };

                    if (compare(start, '<=', pos.start) && compare(pos.end, '<=', end)) {
                        __$__.editor.session.removeMarker(markerID);
                        delete __$__.Testize.storedTest[callLabel];
                    } else {
                        let changed = __$__.UpdateLabelPos.modify_by_remove(editEvent, pos);
                        if (changed) {
                            let newMarkerRange = new __$__.Range(
                                pos.start.line-1,
                                pos.start.column,
                                pos.end.line-1,
                                pos.end.column
                            );
                            let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, marker.clazz, marker.type);
                            __$__.Testize.removeMarker(__$__.Testize.storedTest[callLabel], newMarkerID, newMarkerRange, marker.clazz);
                        }
                    }
                }
            });
        }
    },


    updateTooltipPos(position, div) {
        if (div) {
            div.style.left = position.pageX + 'px';
            div.style.top = position.pageY + 'px';
        }
    }
};
