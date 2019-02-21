__$__.Checkpoint = {
    /**
     * @param {Array} objects: this equals __objs in transformed code
     * @param {string} loopLabel
     * @param {int} count
     * @param {int} timeCounter
     * @param {int} checkPointId
     * @param {Object} probe
     * @param {Object} newExpInfo
     * @param {string} contextSensitiveID
     *
     * this function is checkPoint is located at the head and the tail of each Statement.
     */
    checkpoint(objects, loopLabel, count, timeCounter, checkPointId, probe, newExpInfo, contextSensitiveID) {
        __$__.Context.LastInfo = {
            CPID: checkPointId,
            loopLabel: loopLabel,
            loopCount: count,
            contextSensitiveID: contextSensitiveID
        };

        let storedGraph = __$__.Checkpoint.StoreGraph(objects, loopLabel, timeCounter, checkPointId, probe, contextSensitiveID);
        let visjsGraph = storedGraph.generateVisjsGraph();

        __$__.Context.TableTimeCounter.push({loopLabel: loopLabel, loopCount: count});
        __$__.Context.CheckPointID2LoopLabel[checkPointId] = loopLabel;


        if (__$__.Context.ChangedGraph) {
            // the node of storedGraph is whether first appearing or not in this part
            visjsGraph.nodes.forEach(node => {
                if (!__$__.JumpToConstruction.GraphData.nodes[node.id]) {
                    if (newExpInfo) {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: newExpInfo.loopLabel,
                            count: newExpInfo.loopCount,
                            contextSensitiveID: newExpInfo.contextSensitiveID,
                            pos: newExpInfo.pos
                        };
                    } else {
                        __$__.JumpToConstruction.GraphData.nodes[node.id] = {
                            id: node.id,
                            loopLabel: loopLabel,
                            count: count,
                            contextSensitiveID: contextSensitiveID,
                            pos: __$__.Context.CheckPointTable[checkPointId]
                        };
                    }
                }
            });

            // the edge of storedGraph is whether first appearing or not in this part
            visjsGraph.edges.forEach(edge => {
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
                            contextSensitiveID: contextSensitiveID,
                            pos: newExpInfo.pos
                        });
                    } else {
                        __$__.JumpToConstruction.GraphData.edges.push({
                            from: edge.from,
                            to: edge.to,
                            label: edge.label,
                            loopLabel: loopLabel,
                            count: count,
                            contextSensitiveID: contextSensitiveID,
                            pos: __$__.Context.CheckPointTable[checkPointId]
                        });
                    }
                }
            });

            __$__.Context.ChangedGraph = false;
        }

        __$__.Context.LastGraph = storedGraph;
    },


    StoreGraph: function(objects, loopLabel, timeCounter, checkPointId, probe, contextSensitiveID) {
        let graph = (__$__.Context.ChangedGraph)
            ? __$__.Traverse.traverse(objects, probe)
            : __$__.Context.LastGraph;


        if (!__$__.Context.StoredGraph[checkPointId])
            __$__.Context.StoredGraph[checkPointId] = {};

        __$__.Context.StoredGraph[checkPointId][contextSensitiveID] = graph;


        return graph;
    }
}