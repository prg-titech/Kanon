// check if Kanon sets __id fields to all objects
class C {constructor(x) {this.y = x;}}
class D extends C {
    constructor(v) {
	super(v);
	this.x = v;
    }
}
function is_in_Kanon() {
    return 'undefined' !== typeof __objs;
}
function in_Kanon_assert(value, message){
    if(is_in_Kanon() && !value)
	throw new Error("assertion failed:" + message);
}
let c0 = new C(0);		in_Kanon_assert(c0.__id, "__id set in c0");
let c1 = new C(new C(1));	in_Kanon_assert(c1.__id, "__id set in c1");
let d0 = new D(0);		in_Kanon_assert(d0.__id, "__id set in d0");
let d1 = new D(new D(1));	in_Kanon_assert(d1.__id, "__id set in d1");
// if(c0.__id && c1.__id && d0.__id && ! d1.__id)
//     throw new Error("no __id set in D");
/*

let __loopLabels = ['main'], __loopCount = 1, __loopCounterObject = {}, __time_counter = 0, __call_count = {}, __newObjectIds = [], __newExpInfo = [], __stackForCallTree = [__$__.CallTree.rootNode];
__objs = [];
try {
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 1, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    class C {
    }
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 2, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 3, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    class D extends C {
        constructor(v) {
            super();
            let __loopLabel = 'FunctionExpression1';
            __loopLabels.push(__loopLabel);
            if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
                __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
            let __loopCount = ++__loopCounterObject[__loopLabel] || (__loopCounterObject[__loopLabel] = 1);
            if (__loopCount > 10000) {
                __$__.Context.InfLoop = __loopLabel;
                throw 'Infinite Loop';
            }
            let __start = __time_counter;
            __stackForCallTree.push(new __$__.CallTree.Function(__loopLabel, __stackForCallTree, 'func-exp1', 'constructor', 'D'));
            if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
                __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
            __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
            if (__newExpInfo.last()) {
                Object.setProperty(this, '__id', __newObjectIds.pop());
                __objs.push(this);
            }
            __$__.Context.RegisterCallRelationship(__stackForCallTree);
            try {
            } finally {
                __stackForCallTree.pop();
                __loopLabels.pop();
            }
        }
    }
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 4, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 5, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    let d = (() => {
        __newExpInfo.push({
            loopLabel: __loopLabels.last(),
            loopCount: __loopCount,
            pos: {
                line: 7,
                column: 23
            },
            contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
        });
        __stackForCallTree.push(new __$__.CallTree.Instance('new1', __stackForCallTree, 'D'));
        var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
        __newObjectIds.push(__newObjectId);
        var __temp = new D((() => {
            __newExpInfo.push({
                loopLabel: __loopLabels.last(),
                loopCount: __loopCount,
                pos: {
                    line: 7,
                    column: 22
                },
                contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
            });
            __stackForCallTree.push(new __$__.CallTree.Instance('new2', __stackForCallTree, 'D'));
            var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
            __newObjectIds.push(__newObjectId);
            var __temp = new D(1);
            __$__.Context.ChangedGraph = true;
            __newExpInfo.pop();
            __stackForCallTree.pop();
            if (!__temp.__id) {
                Object.setProperty(__temp, '__id', __newObjectIds.pop());
                __objs.push(__temp);
            }
            return __temp;
        })());
        __$__.Context.ChangedGraph = true;
        __newExpInfo.pop();
        __stackForCallTree.pop();
        if (!__temp.__id) {
            Object.setProperty(__temp, '__id', __newObjectIds.pop());
            __objs.push(__temp);
        }
        return __temp;
    })();
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 6, {
        d: typeof d !== 'string' ? d : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
} finally {
}

//////////////////////////////////////////////////////////////////////

let __loopLabels = ['main'], __loopCount = 1, __loopCounterObject = {}, __time_counter = 0, __call_count = {}, __newObjectIds = [], __newExpInfo = [], __stackForCallTree = [__$__.CallTree.rootNode];
__objs = [];
try {
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 1, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    class C {
    }
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 2, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 3, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    class D {
        constructor(v) {
            let __loopLabel = 'FunctionExpression1';
            __loopLabels.push(__loopLabel);
            if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
                __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
            let __loopCount = ++__loopCounterObject[__loopLabel] || (__loopCounterObject[__loopLabel] = 1);
            if (__loopCount > 10000) {
                __$__.Context.InfLoop = __loopLabel;
                throw 'Infinite Loop';
            }
            let __start = __time_counter;
            __stackForCallTree.push(new __$__.CallTree.Function(__loopLabel, __stackForCallTree, 'func-exp1', 'constructor', 'D'));
            if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
                __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
            __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
            if (__newExpInfo.last()) {
                Object.setProperty(this, '__id', __newObjectIds.pop());
                __objs.push(this);
            }
            __$__.Context.RegisterCallRelationship(__stackForCallTree);
            try {
            } finally {
                __stackForCallTree.pop();
                __loopLabels.pop();
            }
        }
    }
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 4, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 5, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    let d = (() => {
        __newExpInfo.push({
            loopLabel: __loopLabels.last(),
            loopCount: __loopCount,
            pos: {
                line: 9,
                column: 23
            },
            contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
        });
        __stackForCallTree.push(new __$__.CallTree.Instance('new1', __stackForCallTree, 'D'));
        var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
        __newObjectIds.push(__newObjectId);
        var __temp = new D((() => {
            __newExpInfo.push({
                loopLabel: __loopLabels.last(),
                loopCount: __loopCount,
                pos: {
                    line: 9,
                    column: 22
                },
                contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
            });
            __stackForCallTree.push(new __$__.CallTree.Instance('new2', __stackForCallTree, 'D'));
            var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
            __newObjectIds.push(__newObjectId);
            var __temp = new D(1);
            __$__.Context.ChangedGraph = true;
            __newExpInfo.pop();
            __stackForCallTree.pop();
            if (!__temp.__id) {
                Object.setProperty(__temp, '__id', __newObjectIds.pop());
                __objs.push(__temp);
            }
            return __temp;
        })());
        __$__.Context.ChangedGraph = true;
        __newExpInfo.pop();
        __stackForCallTree.pop();
        if (!__temp.__id) {
            Object.setProperty(__temp, '__id', __newObjectIds.pop());
            __objs.push(__temp);
        }
        return __temp;
    })();
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 6, {
        d: typeof d !== 'string' ? d : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
} finally {
}

*/
