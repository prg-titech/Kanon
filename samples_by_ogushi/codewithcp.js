let __loopLabels = ['main'], __loopCount = 1, __loopCounterObject = {}, __time_counter = 0, __call_count = {}, __newObjectIds = [], __newExpInfo = [], __stackForCallTree = [__$__.CallTree.rootNode];
__objs = [];
try {
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 11, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    class Tomoki {
        constructor() {
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
            __stackForCallTree.push(new __$__.CallTree.Function(__loopLabel, __stackForCallTree, 'func-exp1', 'constructor', 'Tomoki'));
            if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
                __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
            __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
            if (__newExpInfo.last()) {
                Object.setProperty(this, '__id', __newObjectIds.pop());
                __objs.push(this);
            }
            __$__.Context.RegisterCallRelationship(__stackForCallTree);
            try {
                __$__.Context.ChangedGraph = true;
                __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 3, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                {
                    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 1, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                    this.val = 1;
                    __$__.Context.ChangedGraph = true;
                    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 2, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                }
                __$__.Context.ChangedGraph = true;
                __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 4, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
            } finally {
                __stackForCallTree.pop();
                __loopLabels.pop();
            }
        }
        addTomoki() {
            let __loopLabel = 'FunctionExpression2';
            __loopLabels.push(__loopLabel);
            if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
                __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
            let __loopCount = ++__loopCounterObject[__loopLabel] || (__loopCounterObject[__loopLabel] = 1);
            if (__loopCount > 10000) {
                __$__.Context.InfLoop = __loopLabel;
                throw 'Infinite Loop';
            }
            let __start = __time_counter;
            __stackForCallTree.push(new __$__.CallTree.Function(__loopLabel, __stackForCallTree, 'func-exp2', 'addTomoki', 'Tomoki'));
            if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
                __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
            __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
            if (__newExpInfo.last()) {
                Object.setProperty(this, '__id', __newObjectIds.pop());
                __objs.push(this);
            }
            __$__.Context.RegisterCallRelationship(__stackForCallTree);
            try {
                __$__.Context.ChangedGraph = true;
                __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 9, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                {
                    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 5, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                    let tomoki = (() => {
                        __newExpInfo.push({
                            loopLabel: __loopLabels.last(),
                            loopCount: __loopCount,
                            pos: {
                                line: 7,
                                column: 33
                            },
                            contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
                        });
                        __stackForCallTree.push(new __$__.CallTree.Instance('new1', __stackForCallTree, 'Tomoki'));
                        var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
                        __newObjectIds.push(__newObjectId);
                        var __temp = new Tomoki();
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
                        tomoki: typeof tomoki !== 'string' ? tomoki : undefined,
                        this: this
                    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                    {
                        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 7, {
                            tomoki: typeof tomoki !== 'string' ? tomoki : undefined,
                            this: this
                        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                        let __temp;
                        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 8, {
                            tomoki: typeof tomoki !== 'string' ? tomoki : undefined,
                            this: this
                        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
                        return __temp;
                    }
                }
                __$__.Context.ChangedGraph = true;
                __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 10, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
            } finally {
                __stackForCallTree.pop();
                __loopLabels.pop();
            }
        }
    }
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 12, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 13, { this: this }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    let ogushi = (() => {
        __newExpInfo.push({
            loopLabel: __loopLabels.last(),
            loopCount: __loopCount,
            pos: {
                line: 12,
                column: 25
            },
            contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
        });
        __stackForCallTree.push(new __$__.CallTree.Instance('new2', __stackForCallTree, 'Tomoki'));
        var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
        __newObjectIds.push(__newObjectId);
        var __temp = new Tomoki();
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
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 14, {
        ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 17, {
        ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    let ogushi2 = (() => {
        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 15, {
            ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
            this: this
        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
        var __temp_ogushi2 = 4;
        __$__.Context.ChangedGraph = true;
        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 16, {
            ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
            ogushi2: typeof __temp_ogushi2 !== 'string' ? __temp_ogushi2 : undefined,
            this: this
        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
        return __temp_ogushi2;
    })();
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 18, {
        ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
        ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 21, {
        ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
        ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
    (function (__obj, ...args) {
        if (__call_count['call1'])
            __call_count['call1']++;
        else
            __call_count['call1'] = 1;
        __stackForCallTree.push(new __$__.CallTree.FunctionCall('call1', __stackForCallTree, __call_count['call1']));
        __newExpInfo.push(false);
        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 19, {
            ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
            ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
            this: this
        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
        var __retObj, __hasTest, __errorOccurred, __context_sensitiveID = __stackForCallTree.last().getContextSensitiveID();
        try {
            __hasTest = __$__.Testize.hasTest('call1', __context_sensitiveID);
            if (__hasTest)
                __$__.Testize.checkPrecondGraph(__objs, {
                    ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
                    ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
                    this: this
                }, 'call1', __context_sensitiveID);
            __retObj = __obj.addTomoki(...args);
            __errorOccurred = false;
            __$__.Testize.storeActualGraph(__objs, {
                ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
                ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
                this: this
            }, 'call1', __context_sensitiveID);
        } catch (e) {
            __errorOccurred = true;
            __$__.Testize.storeActualGraph();
            if (!__hasTest)
                throw e;
        } finally {
            if (__hasTest) {
                let __classesObject = {};
                __$__.Testize.extractUsedClassNames('call1', __context_sensitiveID).forEach(className => {
                    try {
                        __classesObject[className] = eval(className);
                    } catch (e) {
                        __classesObject[className] = Object;
                    }
                });
                let __overrideInfo = __$__.Testize.testAndOverride(__objs, {
                    ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
                    ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
                    this: this
                }, __retObj, 'call1', __context_sensitiveID, __errorOccurred, __classesObject);
                Array.prototype.push.apply(__objs, __overrideInfo.newObjects);
                let __variableNames = Object.keys(__overrideInfo.variableReferences);
                for (let __i__ = 0; __i__ < __variableNames.length; __i__++) {
                    let __variableName = __variableNames[__i__];
                    let __object = __overrideInfo.variableReferences[__variableName];
                    eval(__variableName + ' = __object');
                }
            } else if (__errorOccurred) {
                __newExpInfo.pop();
                __stackForCallTree.pop();
            }
        }
        __$__.Context.ChangedGraph = true;
        __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 20, {
            ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
            ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
            this: this
        }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
        __newExpInfo.pop();
        __stackForCallTree.pop();
        return __retObj;
    }.call(this, ogushi));
    __$__.Context.ChangedGraph = true;
    __$__.Checkpoint.checkpoint(__objs, __loopLabels.last(), __loopCount, __time_counter++, 22, {
        ogushi: typeof ogushi !== 'string' ? ogushi : undefined,
        ogushi2: typeof ogushi2 !== 'string' ? ogushi2 : undefined,
        this: this
    }, __newExpInfo.last(), __stackForCallTree.last().getContextSensitiveID());
} finally {
}