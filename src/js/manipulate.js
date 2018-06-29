// manipulate.js

__$__.Manipulate = {
    /**
     * @param edgeData
     * @param callback
     */
    addEdge: function(edgeData, callback) {
        // TODO: should search simultaneously for efficiency
        // search candidates for reference of the node on the from side
        let from = __$__.Manipulate.DFSBasedOnNode(edgeData.from);
        // search candidates for reference of the node on the to side
        let to = __$__.Manipulate.DFSBasedOnNode(edgeData.to);

        let candidates = __$__.Manipulate.candidates(from, to);
        callback();
        // TODO: move the cursor position to a safe position.
        __$__.Manipulate.startAutoCompletion(candidates);
    },


    /**
     * @param edgeData
     * @param callback
     */
    editEdge: function(edgeData, callback) {
        if (__$__.edges._data[edgeData.id].from !== edgeData.from) {
            // In the case that the user edits the from-side of the edge
            // In current implementation, do nothing
            callback();
        } else {
            // In the case that the user edits the to-side of the edge

            // TODO: should search simultaneously for efficiency
            // search candidates for reference of the node on the from side
            let from = __$__.Manipulate.DFSBasedOnNode(edgeData.from);
            // search candidates for reference of the node on the to side
            let to = __$__.Manipulate.DFSBasedOnNode(edgeData.to);

            let candidates = __$__.Manipulate.candidates(from, to, edgeData.id);
            callback();
            // TODO: move the cursor position to a safe position.
            __$__.Manipulate.startAutoCompletion(candidates);
        }
    },


    /**
     * @param endNodeId{String}
     *
     * @return Object
     */
    DFSBasedOnNode: function(/*startNodeIds, */endNodeId) {
        // this variable is a table that represents which edges the node is pointed to.
        // {nodeId: [edgeId1, edgeId2, ...]}
        let edgesThatReferTo = new Object();
        Object.keys(__$__.edges._data).forEach(edgeId => {
            let edge = __$__.edges._data[edgeId];
            if (edgesThatReferTo[edge.to]) {
                edgesThatReferTo[edge.to].push(edge.id);
            } else {
                edgesThatReferTo[edge.to] = [edge.id];
            }
        });

        // this table is a memo for dynamic programming.
        let table = new Object();
        table[endNodeId] = [{label: []}];

        let rec = function(nodeId, acc) {
            if (acc.passedNodeIds[nodeId]) {
                return;
            }

            acc.passedNodeIds[nodeId] = true;
            if (!table[nodeId])
                table[nodeId] = [];
            table[nodeId].push({
                label: Object.assign([], acc.label)
            });

            if (edgesThatReferTo[nodeId])
                edgesThatReferTo[nodeId].forEach(eId => {
                    let edge = __$__.edges._data[eId];
                    acc.label.unshift(edge.label);

                    rec(edge.from, acc);

                    acc.label.shift();
                });

            delete acc.passedNodeIds[nodeId];
        };

        rec(endNodeId, {label: [], passedNodeIds: {}});
        return table;
    },


    /**
     * @param endNodeId{String}
     *
     * @return Object
     */
    DFSBasedOnEdge: function(/*startNodeIds, */endNodeId) {
        // this variable is a table that represents which edges the node is pointed to.
        // {nodeId: [edgeId1, edgeId2, ...]}
        let node2Edges = new Object();
        Object.keys(__$__.edges._data).forEach(edgeId => {
            let edge = __$__.edges._data[edgeId];
            if (node2Edges[edge.to]) {
                node2Edges[edge.to].push(edge.id);
            } else {
                node2Edges[edge.to] = [edge.id];
            }
        });

        // this table is a memo for dynamic programming.
        let table = new Object();
        table[endNodeId] = [{label: []}];

        let rec = function(edgeId, acc) {
            if (acc.passedEdgeIds[edgeId]) {
                return;
            }
            let edge = __$__.edges._data[edgeId];

            acc.label.unshift(edge.label);
            acc.passedEdgeIds[edgeId] = true;

            // register
            if (!table[edge.from]) {
                table[edge.from] = [];
            }
            table[edge.from].push({
                label: Object.assign([], acc.label)
            });

            if (node2Edges[edge.from])
                node2Edges[edge.from].forEach(eId => {
                    rec(eId, acc)
                });

            acc.label.shift();
            delete acc.passedEdgeIds[edgeId];
        };

        if (node2Edges[endNodeId])
            node2Edges[endNodeId].forEach(edgeId => {
                rec(edgeId, {label: [], passedEdgeIds: {}});
            });
        console.log(table);
        return table;
    },


    /**
     * @param from
     * @param to
     * @param prop
     * @returns [{}]
     */
    candidates(from, to, prop) {
        let candidates = [];
        Object.keys(from).forEach(nodeId1 => {
            if (nodeId1.slice(0, 11) === '__Variable-') {
                Object.keys(to).forEach(nodeId2 => {
                    if (nodeId2.slice(0, 11) === '__Variable-') {
                        from[nodeId1].forEach(labels_l => {
                            if (!labels_l.label.length && nodeId1 === '__Variable-this')
                                return;
                            let exp_l = labels_l.label.concat([((prop) ? __$__.edges._data[prop].label : '${0:prop}')]).join('.');
                            let score_l = labels_l.label.length;
                            if (labels_l.label[0] === 'this') score_l += 0.2;

                            to[nodeId2].forEach(labels_r => {
                                let exp_r = labels_r.label.join('.');
                                let score_r = labels_r.label.length;
                                if (labels_r.label[0] === 'this') score_r += 0.2;

                                let score = score_l + score_r;
                                candidates.push({
                                    // score_l: score_l,
                                    // score_r: score_r,
                                    prop: prop,
                                    score: -score,
                                    stmt: exp_l + ' = ' + exp_r + ';',
                                    exp_l: exp_l,
                                    exp_r: exp_r
                                });
                            });
                        });
                    }
                });
            }
        });
        return candidates;
    },


    /**
     * @param candidates
     */
    startAutoCompletion(candidates) {
        console.log(candidates);
        if (candidates.length === 0) {
            let staticWordCompleter = {
                getCompletions: function(editor, session, pos, prefix, callback) {
                    callback(null, [{
                        caption: 'impossible',
                        value: '',
                        meta: 'impossible'
                    }]);
                }
            };
            __$__.langTools.setCompleters([staticWordCompleter]);
            __$__.startAutocomplete(__$__.editor);
        } else if (candidates.length === 1) {
            let candidate = candidates[0];
            let statement = candidate.stmt.replace(/\$\{[\s\S]*\}/, "_prop_");
            let start = statement.indexOf('_prop_'),
                end = start + 6,
                cursor_position = __$__.editor.getCursorPosition();

            __$__.editor.insert(statement);
            if (!candidate.prop)
                __$__.editor.selection.setRange(new __$__.Range(cursor_position.row, cursor_position.column + start, cursor_position.row, cursor_position.column + end));
        } else {
            let staticWordCompleter = {
                getCompletions: function (editor, session, pos, prefix, callback) {
                    let cs = candidates;
                    callback(null, cs.map(function (candidate) {
                        if (candidate.prop)
                            return {
                                caption: candidate.stmt,
                                value: candidate.stmt,
                                score: candidate.score
                            };
                        else
                            return {
                                caption: candidate.stmt.replace(/\$\{[\s\S]*\}/, "[prop]"),
                                score: candidate.score,
                                snippet: candidate.stmt
                            };
                    }));
                }
            };
            __$__.langTools.setCompleters([staticWordCompleter]);
            __$__.startAutocomplete(__$__.editor);
        }
    }
};