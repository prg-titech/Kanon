__$__.UpdateLabelPos = {
    TableClass: class Table {
        constructor () {

        }

        add(line, column, elem) {
            if (!this[line])
                this[line] = {};
            if (!this[line][column])
                this[line][column] = {};
            this[line][column] = elem;
        }

        has(line, column, elem) {
            return this[line] && this[line][column] && this[line][column] === elem;
        }

        get(line, column) {
            if (!this[line]) {
                this[line] = {};
                this[line][column] = {};
            } else if (!this[line][column]) {
                this[line][column] = {};
            }
            return this[line][column];
        }

        delete(line, column, elem) {
            if (this[line] && this[line][column]) {
                delete this[line][column][elem];
            }
        }
    },


    Initialize() {
        __$__.UpdateLabelPos.table = new __$__.UpdateLabelPos.TableClass();
    },



    /**
     * @param {Object} p1: {line, column}
     * @param {string} operator: '==', '<', '>', '<=', '>='
     * @param {Object} p2: {line, column}
     * @return {boolean}
     */
    ComparePosition(p1, operator, p2) {
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


    labelingUnlabeledNodes() {
        __$__.UpdateLabelPos.unlabeledNodes.forEach(nodeInfo => {
            let entries = Object.entries(nodeInfo.startObj).concat(Object.entries(nodeInfo.endObj))[0];
            let node = nodeInfo.node;
            if (entries && entries[0].indexOf(nodeInfo.c.label_header) !== -1) {
                let label = entries[0];
                let posInfo = entries[1];

                let pairObj = __$__.UpdateLabelPos.table.get(posInfo.pairPos.line, posInfo.pairPos.column);
                let matchedPos = pairObj[label].pairPos;

                __$__.UpdateLabelPos.table.delete(posInfo.pairPos.line, posInfo.pairPos.column, label);
                __$__.UpdateLabelPos.table.delete(matchedPos.line, matchedPos.column, label);

                node.label = label;
                node.loc.useLabel = true;
                node.loc.closed = !__$__.ASTTransforms.Loop[node.type] || node.body.type === 'BlockStatement';
                __$__.Context.LabelPos[posInfo.kind][label] = node.loc;
                __$__.Testize.registerParenthesisPos(node);
            } else {
                node.label = __$__.UpdateLabelPos.assignLabel(nodeInfo.node, nodeInfo.c);
            }
        });
    },


    assignLabel(node, c) {
        let i = 1;
        let label;
        while (!label) {
            let loopLabel = c.label_header + i;
            if (!c.LabelPos[loopLabel])
                label = loopLabel;
            i++;
        }
        if (c.isLoop && c.parent.type === 'LabeledStatement')
            label += '-' + c.parent.label.name;
        c.LabelPos[label] = node.loc;
        c.LabelPos[label].useLabel = true;
        c.LabelPos[label].closed = !c.isLoop || node.body.type === 'BlockStatement' && node.body.loc !== undefined;
        return label;
    }
};
