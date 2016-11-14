window.VisualizeVariable = {};


VisualizeVariable.FunctionFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {};
};


VisualizeVariable.BlockFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {}
};


VisualizeVariable.StackEnv = function() {
    this.head = new VisualizeVariable.FunctionFlame();
    this.tail = new VisualizeVariable.BlockFlame();
    this.head.next = this.tail;
    this.tail.prev = this.head;
};


VisualizeVariable.StackEnv.prototype.extendEnv = function(flame) {
    this.tail.next = flame;
    flame.prev = this.tail;
    this.tail = flame;
};


VisualizeVariable.StackEnv.prototype.pop = function() {
    var ret = this.tail;

    ret.prev.next = null;
    this.tail = ret.prev;
    ret.prev = null;

    return ret;
}


VisualizeVariable.StackEnv.prototype.addVariable = function(variable, kind, visualize) {
    var current = this.tail;
    if (kind == 'var') {
        while (!(current instanceof VisualizeVariable.FunctionFlame)) {
            current = current.prev;
        }
        current.env[variable] = visualize;
    } else {
        while (!(current instanceof VisualizeVariable.BlockFlame)) {
            current = current.prev;
        }
        current.env[variable] = visualize;
    }
};

VisualizeVariable.StackEnv.prototype.visualizeVariable = function() {
    var retObj = {};
    var current = this.tail;

    while (current) {
        Object.keys(current.env).forEach(function(varName) {
            if (!retObj[varName]) retObj[varName] = current.env[varName];
        });
        current = current.prev;
    }

    var ret = [];
    Object.keys(retObj).forEach(function(varName) {
        if (retObj[varName]) ret.push(varName);
    });

    return ret;
}
