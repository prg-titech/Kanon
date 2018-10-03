__$__.CallTree = {};

__$__.CallTree.Initialize = function() {
    __$__.CallTree.rootNode = new __$__.CallTree.Main('main', []);
    __$__.CallTree.classOfMethod = {
        constructor: [],
        'anon.': []
    };
    __$__.CallTree.positionToStartLoopBody = {};
};


/**
 * @type {__$__.CallTree.Node}
 */
__$__.CallTree.Node = class Node {
    /**
     * @param {String} label
     * @param {Array of __$__.CallTree.Node} callPath
     */
    constructor (label, callPath) {
        this.label = label;
        this.callPath = callPath.concat(this);
        this.children = [];
        this.shape = 'box';
        if (callPath.length >= 1) {
            let parent = callPath[callPath.length - 1];
            parent.children.push(this);
        }
    }

    /**
     * @return {String} the context-sensitive ID of this
     */
    getContextSensitiveID() {
        if (this.contextSensitiveID === undefined) {
            this.contextSensitiveID = this.callPath.map(node => {
                return node.getLabelForContextSensitiveID();
            }).join('-');
        }
        return this.contextSensitiveID;
    }

    /**
     * @return {String|*}
     */
    getLabelForContextSensitiveID() {
        return this.label;
    }

    getDisplayedLabel() {
        return this.label;
    }
};


__$__.CallTree.Main = class Main extends __$__.CallTree.Node {
    constructor (label, callPath) {
        super(label, callPath);
    }
};


__$__.CallTree.FunctionCall = class FunctionCall extends __$__.CallTree.Node {
    constructor (label, callPath) {
        super(label, callPath);
    }

    getContextSensitiveID() {
        return this.callPath[this.callPath.length - 2].getContextSensitiveID();
    }
};


__$__.CallTree.Function = class Function extends __$__.CallTree.Node {
    constructor (label, callPath, simplifiedLabel, functionName, className = nul) {
        super(label, callPath);
        this.simplifiedLabel = simplifiedLabel;
        this.functionName = (functionName) ? functionName : 'anon.';
        this.className = className;
    }

    getDisplayedLabel() {
        let parent = this.callPath[this.callPath.length - 2];
        if (parent && parent.constructor.name === 'Instance') {
            return parent.getDisplayedLabel();
        } else if (this.className && __$__.CallTree.classOfMethod[this.functionName].length > 1) {
            return this.className + '.' + this.functionName;
        } else {
            return this.functionName;
        }
    }
};


__$__.CallTree.Loop = class Loop extends __$__.CallTree.Node {
    constructor (label, callPath, simplifiedLabel, count) {
        super(label, callPath);
        this.simplifiedLabel = simplifiedLabel;
        this.count = count;
    }

    getLabelForContextSensitiveID() {
        return super.getLabelForContextSensitiveID() + '-' + this.count;
    }

    getDisplayedLabel() {
        return this.simplifiedLabel;
    }
};


__$__.CallTree.Instance = class Instance extends __$__.CallTree.Node {
    constructor (label, callPath, callee) {
        super(label, callPath);
        this.callee = callee;
    }

    getDisplayedLabel() {
        return 'new ' + this.callee;
    }
};
