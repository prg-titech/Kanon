__$__.Probe = {};


__$__.Probe.FunctionFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {};
};


__$__.Probe.BlockFlame = function() {
    this.next = null;
    this.prev = null;
    this.env = {}
};


__$__.Probe.StackEnv = function() {
    this.head = new __$__.Probe.FunctionFlame();
    this.tail = new __$__.Probe.BlockFlame();
    this.head.next = this.tail;
    this.tail.prev = this.head;
};


__$__.Probe.StackEnv.prototype.push = function(flame) {
    this.tail.next = flame;
    flame.prev = this.tail;
    this.tail = flame;
};


__$__.Probe.StackEnv.prototype.pop = function() {
    let ret = this.tail;

    ret.prev.next = null;
    this.tail = ret.prev;
    ret.prev = null;

    return ret;
};


__$__.Probe.StackEnv.prototype.addVariable = function(variable, kind, visualize) {
    let current = this.tail;

    if (kind === 'var') {
        while (!(current instanceof __$__.Probe.FunctionFlame)) {
            current = current.prev;
        }

        current.env[variable] = visualize;
    } else {
        while (!(current instanceof __$__.Probe.BlockFlame)) {
            current = current.prev;
        }

        current.env[variable] = visualize;
    }
};

__$__.Probe.StackEnv.prototype.Variables = function() {
    let retObj = {};
    let current = this.tail;

    while (current) {
        Object.keys(current.env).forEach(function(varName) {
            if (typeof(retObj[varName]) === 'undefined')
                retObj[varName] = current.env[varName];
        });

        current = current.prev;
    }

    let ret = [];

    Object.keys(retObj).forEach(function(varName) {
        if (retObj[varName])
            ret.push(varName);
    });


    return ret;
};
