__$__.VisualizeVariable = {};


__$__.VisualizeVariable.FunctionFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {};
};


__$__.VisualizeVariable.BlockFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {}
};


__$__.VisualizeVariable.StackEnv = function() {
    this.head = new __$__.VisualizeVariable.FunctionFlame();
    this.tail = new __$__.VisualizeVariable.BlockFlame();
    this.head.next = this.tail;
    this.tail.prev = this.head;
};


__$__.VisualizeVariable.StackEnv.prototype.push = function(flame) {
    this.tail.next = flame;
    flame.prev = this.tail;
    this.tail = flame;
};


__$__.VisualizeVariable.StackEnv.prototype.pop = function() {
    var ret = this.tail;

    ret.prev.next = null;
    this.tail = ret.prev;
    ret.prev = null;

    return ret;
};


__$__.VisualizeVariable.StackEnv.prototype.addVariable = function(variable, kind, visualize) {
    var current = this.tail;

    if (kind == 'var') {
        while (!(current instanceof __$__.VisualizeVariable.FunctionFlame)) {
            current = current.prev;
        }

        current.env[variable] = visualize;
    } else {
        while (!(current instanceof __$__.VisualizeVariable.BlockFlame)) {
            current = current.prev;
        }

        current.env[variable] = visualize;
    }
};

__$__.VisualizeVariable.StackEnv.prototype.visualizeVariable = function() {
    var retObj = {};
    var current = this.tail;

    while (current) {
        Object.keys(current.env).forEach(function(varName) {
            if (typeof(retObj[varName]) === 'undefined') retObj[varName] = current.env[varName];
        });

        current = current.prev;
    }

    var ret = [];

    Object.keys(retObj).forEach(function(varName) {
        if (retObj[varName]) ret.push(varName);
    });


    return ret;
}
