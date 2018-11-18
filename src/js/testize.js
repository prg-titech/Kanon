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
                addNode: function (data, callback) {
                    document.getElementById('operation').innerHTML = "Add Node";
                    document.getElementById('node-label').value = data.label;
                    document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveData.bind(this, data, callback);
                    document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
                    document.getElementById('network-popUp').style.display = 'block';
                },
                addEdge: function (data, callback) {
                    document.getElementById('operation').innerHTML = "Add Edge";
                    document.getElementById('node-label').value = data.label;
                    document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveData.bind(this, data, callback);
                    document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.clearPopUp;
                    document.getElementById('network-popUp').style.display = 'block';
                },
                editNode: function (data, callback) {
                    document.getElementById('operation').innerHTML = "Edit Node";
                    document.getElementById('node-label').value = data.label;
                    document.getElementById('saveButtonForTestize').onclick = __$__.Testize.saveData.bind(this, data, callback);
                    document.getElementById('cancelButtonForTestize').onclick = __$__.Testize.cancelEdit.bind(this,callback);
                    document.getElementById('network-popUp').style.display = 'block';
                },
                editEdge: true,
                deleteNode: true,
                deleteEdge: true
            }
        }
    },


    initialize() {
        __$__.Testize.callParenthesisPos = {};
    },


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
        networkInfo.nodes = new vis.DataSet({});
        networkInfo.edges = new vis.DataSet({});
        networkInfo.data = {nodes: networkInfo.nodes, edges: networkInfo.edges};
        networkInfo.network = new vis.Network(networkInfo.container, networkInfo.data, networkInfo.options);
        Windows.addObserver({
            onResize: function (a, win) {
                networkInfo.network.redraw();
            }
        });
    },


    displayTooltip(div) {
        div.style.display = 'inline';
        if (div === __$__.Testize.popup_addTest) {
            __$__.Testize.popup_removeTest.style.display = 'none';
        } else {
            __$__.Testize.popup_addTest.style.display = 'none';
        }
    },


    divOfPopup(callLabel, context_sensitiveID) {
        if (!context_sensitiveID) {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel.start]).loop;
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
                        __$__.Testize.hoveringCallInfo.label = label;
                        __$__.Testize.hoveringCallInfo.div = newDiv;
                        __$__.Testize.displayTooltip(div);
                    } else {
                        __$__.Testize.hoveringCallInfo.label = undefined;
                        __$__.Testize.hoveringCallInfo.div = undefined;
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
                    __$__.Testize.hoveringCallInfo.label = label;
                    __$__.Testize.hoveringCallInfo.div = newDiv;
                    __$__.Testize.displayTooltip(newDiv);
                }
            }
        }
    },


    openWin() {
        let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        if (!__$__.win) {
            __$__.Testize.createWindow(split_pane_size.width/2, split_pane_size.height/2, '');
        } else {
            __$__.win.setSize(split_pane_size.width / 2, split_pane_size.height / 2);
        }

        // duplicate an object graph stored just before the focusing function call
        let graph;
        try {
            let callLabel = __$__.Testize.selectedCallInfo.label;
            let checkpointIDs = __$__.Context.CheckPointIDAroundFuncCall[callLabel];
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            __$__.Testize.selectedCallInfo = {
                label: callLabel,
                context_sensitiveID: context_sensitiveID
            };
            graph = __$__.Context.StoredGraph[checkpointIDs.before][context_sensitiveID];
            graph = __$__.Testize.duplicateGraph(graph);
        } catch (e) {
            graph = {nodes: [], edges: []};
        }

        __$__.Testize.network.network.setData({
            nodes: graph.nodes,
            edges: graph.edges
        });
        __$__.Testize.network.network.redraw();
        __$__.win.showCenter();
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
                if (__$__.Testize.storedTest[node.label] && __$__.Testize.storedTest[node.label].markerID) {
                    let markerID = __$__.Testize.storedTest[node.label].markerID;
                    let markerRange = __$__.Testize.storedTest[node.label].markerRange;
                    if (registerPos.start.line-1 === markerRange.start.row
                        && registerPos.start.column === markerRange.start.column
                        && registerPos.end.line-1 === markerRange.end.row
                        && registerPos.end.column === markerRange.end.column) {
                        // if the position of the marker is the same as the parenthesis position,
                        // do nothing
                    } else {
                        __$__.editor.session.removeMarker(markerID);
                        let newMarkerRange = new __$__.Range(
                            registerPos.start.line-1,
                            registerPos.start.column,
                            registerPos.end.line-1,
                            registerPos.end.column
                        );
                        let newMarkerID = __$__.editor.session.addMarker(newMarkerRange, 'testFailed', 'text');
                        __$__.Testize.storedTest[node.label].markerRange = newMarkerRange;
                        __$__.Testize.storedTest[node.label].markerID = newMarkerID;
                    }
                }
            }
        } catch (e) {
            console.log(node, e);
        }
    },


    removeTest(callLabel) {
        let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel.start]).loop;
        let context_sensitiveID = __$__.Context.SpecifiedContext[loopLabelAroundCall];
        let testInfo = __$__.Testize.storedTest[callLabel][context_sensitiveID];
        __$__.editor.session.removeMarker(__$__.Testize.storedTest[callLabel].markerID);
        delete __$__.Testize.storedTest[callLabel].markerID;
        delete __$__.Testize.storedTest[callLabel].markerRange;
        delete __$__.Testize.storedTest[callLabel][context_sensitiveID];
        __$__.Testize.hoveringCallInfo = {};
    },


    removeTooltip(div) {
        div.style.display = 'none';
    },


    saveData(data, callback) {
        data.label = document.getElementById('node-label').value;
        __$__.Testize.clearPopUp();
        callback(data);
    },


    setTest() {
        let expectedGraphData = __$__.Testize.network.network.body.data;
        let callLabel = __$__.Testize.selectedCallInfo.label;
        let context_sensitiveID = __$__.Testize.selectedCallInfo.context_sensitiveID;
        let callPos = __$__.Testize.callParenthesisPos[callLabel];
        let markerRange = new __$__.Range(
            callPos.start.line - 1,
            callPos.start.column,
            callPos.end.line - 1,
            callPos.end.column
        );
        let markerID = __$__.editor.session.addMarker(markerRange, 'testFailed', 'text');

        if (!__$__.Testize.storedTest[callLabel]) {
            __$__.Testize.storedTest[callLabel] = {};
        }

        __$__.Testize.storedTest[callLabel].markerID = markerID;
        __$__.Testize.storedTest[callLabel].markerRange = markerRange;
        __$__.Testize.storedTest[callLabel][context_sensitiveID] = {
            testData: expectedGraphData,
            passed: false
        };

    },


    updateMarker() {
        Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
            let loopLabelAroundCall = __$__.Context.findLoopLabel(__$__.Context.LabelPos.Call[callLabel].start).loop;
            let specifiedContext = __$__.Context.SpecifiedContext[loopLabelAroundCall];
            if (__$__.Testize.storedTest[callLabel].markerID && !__$__.Testize.storedTest[callLabel][specifiedContext]) {
                let markerID = __$__.Testize.storedTest[callLabel].markerID;
                __$__.editor.session.removeMarker(markerID);
                delete __$__.Testize.storedTest[callLabel].markerID;
                delete __$__.Testize.storedTest[callLabel].markerRange;
            } else if (!__$__.Testize.storedTest[callLabel].markerID && __$__.Testize.storedTest[callLabel][specifiedContext]) {
                let callPos = __$__.Testize.callParenthesisPos[callLabel];
                let markerRange = new __$__.Range(
                    callPos.start.line - 1,
                    callPos.start.column,
                    callPos.end.line - 1,
                    callPos.end.column
                );
                let markerID = __$__.editor.session.addMarker(markerRange, 'testFailed', 'text');
                __$__.Testize.storedTest[callLabel].markerID = markerID;
                __$__.Testize.storedTest[callLabel].markerRange = markerRange;
            }
        });
    },


    updateMarkerPosition(editEvent) {
        let start = {line: editEvent.start.row + 1, column: editEvent.start.column};
        let end = {line: editEvent.end.row + 1, column: editEvent.end.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;

        if (editEvent.action === 'insert') {
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerID = __$__.Testize.storedTest[callLabel].markerID;
                if (markerID) {
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
                        __$__.editor.session.removeMarker(markerID);
                        __$__.Testize.storedTest[callLabel].markerID = newMarkerID;
                        __$__.Testize.storedTest[callLabel].markerRange = newMarkerRange;w
                    }
                }
            });
        } else { // editEvent.action == 'remove'
            Object.keys(__$__.Testize.storedTest).forEach(callLabel => {
                let markerID = __$__.Testize.storedTest[callLabel].markerID;
                if (markerID) {
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
                            __$__.editor.session.removeMarker(markerID);
                            __$__.Testize.storedTest[callLabel].markerID = newMarkerID;
                            __$__.Testize.storedTest[callLabel].markerRange = newMarkerRange;
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