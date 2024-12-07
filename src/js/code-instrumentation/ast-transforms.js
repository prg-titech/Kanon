__$__.ASTTransforms = {
    checkPoint_idCounter: 1, // this is used to count id of each check point
    pairCPID: {}, // {int to int}
    stmtTypes: {
        ExpressionStatement: true,
        BlockStatement: true,
        DebuggerStatement: true,
        WithStatement: true,
        ReturnStatement: true,
        LabeledStatement: true,
        BreakStatement: true,
        ContinueStatement: true,
        IfStatement: true,
        SwitchStatement: true,
        TryStatement: true,
        WhileStatement: true,
        DoWhileStatement: true,
        ForStatement: true,
        ForInStatement: true,
        FunctionDeclaration: true,
        VariableDeclaration: true,
        ClassDeclaration: true
    },
    funcTypes: {
        FunctionDeclaration: true,
        FunctionExpression: true,
        ArrowFunctionExpression: true
    },
    loopTypes: {
        WhileStatement: true,
        DoWhileStatement: true,
        ForStatement: true,
        ForInStatement: true
    },
    varScopes: {
        FunctionDeclaration: true,
        FunctionExpression: true,
        ArrowFunctionExpression: true,
        BlockStatement: true,
        ForStatement: true,
        ForInStatement: true
    },
    Loop: {
        DoWhileStatement: 'do-while',
        WhileStatement: 'while',
        ForStatement: 'for',
        ForInStatement: 'for-in',
        FunctionExpression: 'func-exp',
        FunctionDeclaration: 'func-dec',
        ArrowFunctionExpression: 'arrow-func'
    },
    Labeled: {
        // loop
        DoWhileStatement: true,
        WhileStatement: true,
        ForStatement: true,
        ForInStatement: true,
        FunctionExpression: true,
        FunctionDeclaration: true,
        ArrowFunctionExpression: true,
        // object
        ObjectExpression: true,
        NewExpression: true,
        ArrayExpression: true,
        // call
        CallExpression: true
    },

    // predicates for AST nodes, which will be embedded into visitor objects
    ast_predicates: { 
	// to determine whether the given node is a statement that
	// calls a super; i.e., it matches
	// ... NAME(...){ [[super(...);]] ... } ...
	isSuperStatement(node) {
	    return node && node.type == "ExpressionStatement" &&
		node.expression.type == "CallExpression" &&
		node.expression.callee.type == "Super";
	},

	// to determine whether the given node is a statement that
	// calls a super constructor; i.e., it matches
	// ... constructor(...){ [[super(...);]] ... } ...
	isSuperConstructorStatement(node,path) {
	    let parent = path[path.length - 2];
	    return this.isSuperStatement(node) &&
		this.isConstructorBody(parent, path.slice(0,-1));
	},
	// to determine whether the given node is the body block
	// of a constructor; i.e., it matches
	// ... constructor(...)[[{ ... }]] ...
	isConstructorBody(node,path) {
	    let parent      = path[path.length - 2],
		grandParent = path[path.length - 3];
	    return node.type == "BlockStatement" &&
		parent.type == "FunctionExpression" &&
		grandParent.type == "MethodDefinition" &&
		grandParent.key.name == "constructor";
	},
	// to determine whether the given node is a function expression
	// of a constructor; i.e., it matches
	// ... constructor [[ (...){ ... } ]] ...
	isFunctionExpressionOfConstructor(node,path) {
	    let parent = path[path.length - 2];
	    return node.type == "FunctionExpression" &&
		parent.type == "MethodDefinition" &&
		parent.key.name == "constructor";
	}
    },

    /**
     * Add some code in the head of user code.
     *
     * let __loopLabels = ['main'],
     *     __loopCount = 1,
     *     __loopCounterObject = {},
     *     __time_counter = 0,
     *     __call_count = {},
     *     __newObjectIds = [],
     *     __newExpInfo = [],
     *     __stackForCallTree = [__$__.CallTree.rootNode];
     * __objs = [];
     *
     * ...
     *
     */
    AddSomeCodeInHead() {
        let b = __$__.ASTBuilder;
        return {
            leave(node, path) {
                if (node.type === 'Program') {
                    node.body.unshift(
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.Identifier('__objs'),
                                '=',
                                b.ArrayExpression([])
                            )
                        )
                    );

                    // this is VariableDeclaration at the head of user code
                    node.body.unshift(
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__loopLabels'),
                                b.ArrayExpression([b.Literal('main')])
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__loopCount'),
                                b.Literal(1)
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__loopCounterObject'),
                                b.ObjectExpression([])
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__time_counter'),
                                b.Literal(0)
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__call_count'),
                                b.ObjectExpression([])
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__newObjectIds'),
                                b.ArrayExpression([])
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__newExpInfo'),
                                b.ArrayExpression([])
                            ),
                            b.VariableDeclarator(
                                b.Identifier('__stackForCallTree'),
                                b.ArrayExpression([
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('CallTree')
                                        ),
                                        b.Identifier('rootNode')
                                    )
                                ])
                            )
                        ], 'let')
                    );
                }
            }
        };
    },


    /**
     * try {
     *     body; (program)
     * } finally {
     * }
     */
    BlockedProgram() {
        let b = __$__.ASTBuilder;
        return {
            leave(node, path) {
                if (node.type === 'Program') {
                    node.body = [
                        b.TryStatement(
                            b.BlockStatement(node.body),
                            undefined,
                            b.BlockStatement([])
                        )
                    ];
                }
            }
        };
    },


    /**
     * To give a unique Label to CallExpressions,
     * we convert CallExpression to the following example program.
     *
     * before:
     * func(arg1, arg2, ...)
     *
     * after:
     * (function (__callee, ...args) {
     *     if (__call_count['unique Label']) __call_count['unique Label']++;
     *     else __call_count['unique Label'] = 1;
     *
     *     __stackForCallTree.push(
     *         new __$__.CallTree.FunctionCall(
     *             'unique Label',
     *             __stackForCallTree,
     *             __call_count['unique Label']
     *         )
     *     );
     *     __newExpInfo.push(false);
     *     checkpoint;
     *     var __retObj, __hasTest, __errorOccurred, __context_sensitiveID = __stackForCallTree.last().getContextSensitiveID();
     *     try {
     *         __hasTest = __$__.Testize.hasTest('unique Label', __context_sensitiveID);
     *         if (__hasTest) __$__.Testize.checkPrecondGraph(__objs, probe, 'unique Label', __context_sensitiveID);
     *         __retObj = __callee(...args);
     *         __errorOccurred = false;
     *         __$__.Testize.storeActualGraph(__objs, probe, 'unique Label', __context_sensitiveID);
     *     } catch (e) {
     *         __errorOccurred = true;
     *         __$__.Testize.storeActualGraph();
     *         if (!__hasTest)
     *             throw e;
     *     } finally {
     *         if (__hasTest) {
     *             let __classesObject = {};
     *             __$__.Testize.extractUsedClassNames(...).forEach(className => {
     *                 try {
     *                     __classesObject[className] = eval(className);
     *                 } catch (e) {
     *                     __classesObject[className] = Object;
     *                 }
     *             })
     *             let __overrideInfo = __$__.Testize.testAndOverride(__objs, probe, __retObj, 'unique Label', __context_sensitiveID, __errorOccurred, __classesObject);
     *             Array.prototype.push.apply(__objs, __overrideInfo.newObjects);
     *             let __variableNames = Object.keys(__overrideInfo.variableReferences);
     *             // change variable references
     *             for (let __i__ = 0; __i__ < __variableNames.length; __i__++) {
     *                 let __variableName = __variableNames[__i__];
     *                 let __object = __overrideInfo.variableReferences[__variableName];
     *                 eval(__variableName + ' = __object');
     *             }
     *         } else if (__errorOccurred) {
     *             __newExpInfo.pop();
     *             __stackForCallTree.pop();
     *         }
     *     }
     *     changed;
     *     checkpoint;
     *     __newExpInfo.pop();
     *     __stackForCallTree.pop();
     *     return __retObj;
     * }).call(this, func, arg1, arg2, ...)
     *
     * exceptional case in which the callee node is 'MemberExpression'
     *
     * before:
     * obj.prop(arg1, arg2, ...)
     *
     * after:
     * (function (__obj, ...args) {
     *     if (__call_count['unique Label']) __call_count['unique Label']++;
     *     else __call_count['unique Label'] = 1;
     *
     *     __stackForCallTree.push(
     *         new __$__.CallTree.FunctionCall(
     *             'unique Label',
     *             __stackForCallTree,
     *             __call_count['unique Label']
     *         )
     *     );
     *     __newExpInfo.push(false);
     *     checkpoint;
     *     var __retObj, __hasTest, __errorOccurred, __context_sensitiveID = __stackForCallTree.last().getContextSensitiveID();
     *     try {
     *         __hasTest = __$__.Testize.hasTest('unique Label', __context_sensitiveID);
     *         if (__hasTest) __$__.Testize.checkPrecondGraph(__objs, probe, 'unique Label', __context_sensitiveID);
     *         __retObj = __obj.prop(...args);
     *         __errorOccurred = false;
     *         __$__.Testize.storeActualGraph(__objs, probe, 'unique Label', __context_sensitiveID);
     *     } catch (e) {
     *         __errorOccurred = true;
     *         __$__.Testize.storeActualGraph();
     *         if (!__hasTest)
     *             throw e;
     *     } finally {
     *         if (__hasTest) {
     *             let __classesObject = {};
     *             __$__.Testize.extractUsedClassNames(...).forEach(className => {
     *                 try {
     *                     __classesObject[className] = eval(className);
     *                 } catch (e) {
     *                     __classesObject[className] = Object;
     *                 }
     *             })
     *             let __overrideInfo = __$__.Testize.testAndOverride(__objs, probe, __retObj, 'unique Label', __context_sensitiveID, __errorOccurred, __classesObject);
     *             Array.prototype.push.apply(__objs, __overrideInfo.newObjects);
     *             let __variableNames = Object.keys(__overrideInfo.variableReferences);
     *             // change variable references
     *             for (let __i__ = 0; __i__ < __variableNames.length; __i__++) {
     *                 let __variableName = __variableNames[__i__];
     *                 let __object = __overrideInfo.variableReferences[__variableName];
     *                 eval(__variableName + ' = __object');
     *             }
     *         } else if (__errorOccurred) {
     *             __newExpInfo.pop();
     *             __stackForCallTree.pop();
     *         }
     *     }
     *     changed;
     *     checkpoint;
     *     __newExpInfo.pop();
     *     __stackForCallTree.pop();
     *     return __retObj;
     * }).call(this, obj, arg1, arg2, ...)
     */
    ConvertCallExpression() {
        let b = __$__.ASTBuilder;
        return {
            leave(node, path) {
                if (node.type === "CallExpression" &&
		    node.callee.type !== "Super" &&
		    node.loc) {
                    const counterName = "__call_count";
                    let label = node.label;

                    let info = {};
                    if (node.callee.type === 'MemberExpression') {
                        info.argName = '__obj';
                        info.arg = [node.callee.object, ...node.arguments];
                        info.callee = b.MemberExpression(
                            b.Identifier('__obj'),
                            node.callee.property
                        );
                    } else {
                        info.argName = '__callee';
                        info.arg = [node.callee, ...node.arguments];
                        info.callee = b.Identifier('__callee')
                    }
                    info.arg.unshift(b.Identifier('this'));
                    info.vars = __$__.ASTTransforms.varEnv.Variables();

                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;

                    __$__.Context.CheckPointIDAroundFuncCall[label] = {
                        before: __$__.ASTTransforms.checkPoint_idCounter,
                        after: __$__.ASTTransforms.checkPoint_idCounter + 1
                    };

                    return b.CallExpression(
                        b.MemberExpression(
                            b.FunctionExpression(
                                [
                                    b.Identifier(info.argName),
                                    b.Identifier('...args')
                                ],
                                b.BlockStatement([
                                    b.IfStatement(
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Literal(label),
                                            true
                                        ),
                                        b.ExpressionStatement(
                                            b.UpdateExpression(
                                                b.MemberExpression(
                                                    b.Identifier(counterName),
                                                    b.Literal(label),
                                                    true
                                                ),
                                                "++",
                                                false
                                            )
                                        ),
                                        b.ExpressionStatement(
                                            b.AssignmentExpression(
                                                b.MemberExpression(
                                                    b.Identifier(counterName),
                                                    b.Literal(label),
                                                    true
                                                ),
                                                "=",
                                                b.Literal(1)
                                            )
                                        )
                                    ),
                                    /**
                                     * __stackForCallTree.push(
                                     *     new __$__.CallTree.FunctionCall(
                                     *         'unique Label',
                                     *         __stackForCallTree,
                                     *         __call_count['unique Label']
                                     *     )
                                     * );
                                     */
                                    b.ExpressionStatement(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__stackForCallTree'),
                                                b.Identifier('push')
                                            ),
                                            [b.NewExpression(
                                                b.MemberExpression(
                                                    b.MemberExpression(
                                                        b.Identifier('__$__'),
                                                        b.Identifier('CallTree')
                                                    ),
                                                    b.Identifier('FunctionCall')
                                                ),
                                                [
                                                    b.Literal(label),
                                                    b.Identifier('__stackForCallTree'),
                                                    b.MemberExpression(
                                                        b.Identifier('__call_count'),
                                                        b.Literal(label),
                                                        true
                                                    )
                                                ]
                                            )]
                                        )
                                    ),
                                    b.ExpressionStatement(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__newExpInfo'),
                                                b.Identifier("push")
                                            ),
                                            [b.Literal(false)]
                                        )
                                    ),
                                    __$__.ASTTransforms.makeCheckpoint(node.loc.start, info.vars),
                                    /**
                                     * var __retObj, __hasTest, __errorOccurred, __context_sensitiveID = __stackForCallTree.last().getContextSensitiveID();
                                     */
                                    b.VariableDeclaration([
                                            b.VariableDeclarator(
                                                b.Identifier('__retObj')
                                            ),
                                            b.VariableDeclarator(
                                                b.Identifier('__hasTest')
                                            ),
                                            b.VariableDeclarator(
                                                b.Identifier('__errorOccurred')
                                            ),
                                            b.VariableDeclarator(
                                                b.Identifier('__context_sensitiveID'),
                                                b.CallExpression(
                                                    b.MemberExpression(
                                                        b.CallExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__stackForCallTree'),
                                                                b.Identifier('last')
                                                            ), []
                                                        ),
                                                        b.Identifier('getContextSensitiveID')
                                                    ), []
                                                )
                                            )],
                                        'var'
                                    ),
                                    /**
                                     *
                                     * try {
                                     *     __hasTest = __$__.Testize.hasTest(...);
                                     *     if (__hasTest) __$__.Testize.checkPrecondGraph(__objs, probe, 'unique Label', __context_sensitiveID);
                                     *     __retObj = func(...args);
                                     *     __errorOccurred = false;
                                     *     __$__.Testize.storeActualGraph(__objs, probe, 'unique Label', __context_sensitiveID);
                                     * } catch (e) {
                                     *    __errorOccurred = true;
                                     *     __$__.Testize.storeActualGraph();
                                     *     if (!__hasTest)
                                     *         throw e;
                                     * } finally {
                                     *     if (__hasTest) {
                                     *         let __classesObject = {};
                                     *         __$__.Testize.extractUsedClassNames(...).forEach(className => {
                                     *             try {
                                     *                 __classesObject[className] = eval(className);
                                     *             } catch (e) {
                                     *                 __classesObject[className] = Object;
                                     *             }
                                     *         })
                                     *         let __overrideInfo = __$__.Testize.testAndOverride(__objs, probe, __retObj, 'unique Label', __context_sensitiveID, __errorOccurred, __classesObject);
                                     *         Array.prototype.push.apply(__objs, __overrideInfo.newObjects);
                                     *         let __variableNames = Object.keys(__overrideInfo.variableReferences);
                                     *         let __variableNames = Object.keys(__overrideInfo);
                                     *         for (let __i__ = 0; __i__ < __variableNames.length; __i__++) {
                                     *             let __variableName = __variableNames[__i__];
                                     *             let __object = __overrideInfo[__variableName];
                                     *             eval(__variableName + ' = __object');
                                     *         }
                                     *     } else if (__errorOccurred) {
                                     *         __newExpInfo.pop();
                                     *         __stackForCallTree.pop();
                                     *     }
                                     * }
                                     */
                                    b.TryStatement(
                                        b.BlockStatement([
                                            b.ExpressionStatement(
                                                b.AssignmentExpression(
                                                    b.Identifier('__hasTest'),
                                                    '=',
                                                    b.CallExpression(
                                                        b.MemberExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__$__'),
                                                                b.Identifier('Testize')
                                                            ),
                                                            b.Identifier('hasTest')
                                                        ),
                                                        [
                                                            b.Literal(label),
                                                            b.Identifier('__context_sensitiveID')
                                                        ]
                                                    )
                                                )
                                            ),
                                            b.IfStatement(
                                                b.Identifier('__hasTest'),
                                                b.ExpressionStatement(
                                                    b.CallExpression(
                                                        b.MemberExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__$__'),
                                                                b.Identifier('Testize')
                                                            ),
                                                            b.Identifier('checkPrecondGraph')
                                                        ),
                                                        [
                                                            b.Identifier('__objs'),
                                                            b.ObjectExpression(
                                                                info.vars.map(function(val) {
                                                                    return b.Property(
                                                                        b.Identifier(val),
                                                                        b.ConditionalExpression(
                                                                            b.BinaryExpression(
                                                                                b.UnaryExpression(
                                                                                    'typeof',
                                                                                    b.Identifier(val),
                                                                                    true
                                                                                ),
                                                                                '!==',
                                                                                b.Literal('string')
                                                                            ),
                                                                            b.Identifier(val),
                                                                            b.Identifier("undefined")
                                                                        )
                                                                    );
                                                                }).concat([
                                                                    b.Property(
                                                                        b.Identifier('this'),
                                                                        b.Identifier('this')
                                                                    )
                                                                ])
                                                            ),
                                                            b.Literal(label),
                                                            b.Identifier('__context_sensitiveID'),
                                                        ]
                                                    )
                                                )
                                            ),
                                            b.ExpressionStatement(
                                                b.AssignmentExpression(
                                                    b.Identifier('__retObj'),
                                                    '=',
                                                    b.CallExpression(
                                                        info.callee,
                                                        //node.arguments
                                                        [b.Identifier('...args')]
                                                    )
                                                )
                                            ),
                                            b.ExpressionStatement(
                                                b.AssignmentExpression(
                                                    b.Identifier('__errorOccurred'),
                                                    '=',
                                                    b.Literal(false)
                                                )
                                            ),
                                            b.ExpressionStatement(
                                                b.CallExpression(
                                                    b.MemberExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('__$__'),
                                                            b.Identifier('Testize')
                                                        ),
                                                        b.Identifier('storeActualGraph')
                                                    ),
                                                    [
                                                        b.Identifier('__objs'),
                                                        b.ObjectExpression(
                                                            info.vars.map(function(val) {
                                                                return b.Property(
                                                                    b.Identifier(val),
                                                                    b.ConditionalExpression(
                                                                        b.BinaryExpression(
                                                                            b.UnaryExpression(
                                                                                'typeof',
                                                                                b.Identifier(val),
                                                                                true
                                                                            ),
                                                                            '!==',
                                                                            b.Literal('string')
                                                                        ),
                                                                        b.Identifier(val),
                                                                        b.Identifier("undefined")
                                                                    )
                                                                );
                                                            }).concat([
                                                                b.Property(
                                                                    b.Identifier('this'),
                                                                    b.Identifier('this')
                                                                )
                                                            ])
                                                        ),
                                                        b.Literal(label),
                                                        b.Identifier('__context_sensitiveID')
                                                    ]
                                                )
                                            )
                                        ]),
                                        b.CatchClause(
                                            b.Identifier('e'),
                                            b.BlockStatement([
                                                b.ExpressionStatement(
                                                    b.AssignmentExpression(
                                                        b.Identifier('__errorOccurred'),
                                                        '=',
                                                        b.Literal(true)
                                                    )
                                                ),
                                                b.ExpressionStatement(
                                                    b.CallExpression(
                                                        b.MemberExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__$__'),
                                                                b.Identifier('Testize')
                                                            ),
                                                            b.Identifier('storeActualGraph')
                                                        ), []
                                                    )
                                                ),
                                                b.IfStatement(
                                                    b.UnaryExpression(
                                                        '!',
                                                        b.Identifier('__hasTest'),
                                                        true
                                                    ),
                                                    b.ThrowStatement(
                                                        b.Identifier('e')
                                                    )
                                                )
                                            ])
                                        ),
                                        b.BlockStatement([
                                            b.IfStatement(
                                                b.Identifier('__hasTest'),
                                                b.BlockStatement([
                                                    b.VariableDeclaration([
                                                        b.VariableDeclarator(
                                                            b.Identifier('__classesObject'),
                                                            b.ObjectExpression([])
                                                        )
                                                    ], 'let'),
                                                    b.ExpressionStatement(
                                                        b.CallExpression(
                                                            b.MemberExpression(
                                                                b.CallExpression(
                                                                    b.MemberExpression(
                                                                        b.MemberExpression(
                                                                            b.Identifier('__$__'),
                                                                            b.Identifier('Testize')
                                                                        ),
                                                                        b.Identifier('extractUsedClassNames')
                                                                    ),
                                                                    [
                                                                        b.Literal(label),
                                                                        b.Identifier('__context_sensitiveID')
                                                                    ]
                                                                ),
                                                                b.Identifier('forEach')
                                                            ),
                                                            [b.ArrowFunctionExpression(
                                                                [b.Identifier('className')],
                                                                b.BlockStatement([
                                                                    b.TryStatement(
                                                                        b.BlockStatement([
                                                                            b.ExpressionStatement(
                                                                                b.AssignmentExpression(
                                                                                    b.MemberExpression(
                                                                                        b.Identifier('__classesObject'),
                                                                                        b.Identifier('className'),
                                                                                        true
                                                                                    ),
                                                                                    '=',
                                                                                    b.CallExpression(
                                                                                        b.Identifier('eval'),
                                                                                        [b.Identifier('className')]
                                                                                    )
                                                                                )
                                                                            )
                                                                        ]),
                                                                        b.CatchClause(
                                                                            b.Identifier('e'),
                                                                            b.BlockStatement([
                                                                                b.ExpressionStatement(
                                                                                    b.AssignmentExpression(
                                                                                        b.MemberExpression(
                                                                                            b.Identifier('__classesObject'),
                                                                                            b.Identifier('className'),
                                                                                            true
                                                                                        ),
                                                                                        '=',
                                                                                        b.Identifier('Object')
                                                                                    )
                                                                                )
                                                                            ])
                                                                        )
                                                                    )
                                                                ])
                                                            )]
                                                        )
                                                    ),
                                                    b.VariableDeclaration([
                                                        b.VariableDeclarator(
                                                            b.Identifier('__overrideInfo'),
                                                            b.CallExpression(
                                                                b.MemberExpression(
                                                                    b.MemberExpression(
                                                                        b.Identifier('__$__'),
                                                                        b.Identifier('Testize')
                                                                    ),
                                                                    b.Identifier('testAndOverride')
                                                                ),
                                                                [
                                                                    b.Identifier('__objs'),
                                                                    b.ObjectExpression(
                                                                        info.vars.map(function(val) {
                                                                            return b.Property(
                                                                                b.Identifier(val),
                                                                                b.ConditionalExpression(
                                                                                    b.BinaryExpression(
                                                                                        b.UnaryExpression(
                                                                                            'typeof',
                                                                                            b.Identifier(val),
                                                                                            true
                                                                                        ),
                                                                                        '!==',
                                                                                        b.Literal('string')
                                                                                    ),
                                                                                    b.Identifier(val),
                                                                                    b.Identifier("undefined")
                                                                                )
                                                                            );
                                                                        }).concat([
                                                                            b.Property(
                                                                                b.Identifier('this'),
                                                                                b.Identifier('this')
                                                                            )
                                                                        ])
                                                                    ),
                                                                    b.Identifier('__retObj'),
                                                                    b.Literal(label),
                                                                    b.Identifier('__context_sensitiveID'),
                                                                    b.Identifier('__errorOccurred'),
                                                                    b.Identifier('__classesObject')
                                                                ]
                                                            ),
                                                        )], 'let'
                                                    ),
                                                    b.ExpressionStatement(
                                                        b.CallExpression(
                                                            b.MemberExpression(
                                                                b.MemberExpression(
                                                                    b.MemberExpression(
                                                                        b.Identifier('Array'),
                                                                        b.Identifier('prototype')
                                                                    ),
                                                                    b.Identifier('push')
                                                                ),
                                                                b.Identifier('apply')
                                                            ),
                                                            [
                                                                b.Identifier('__objs'),
                                                                b.MemberExpression(
                                                                    b.Identifier('__overrideInfo'),
                                                                    b.Identifier('newObjects')
                                                                )
                                                            ]
                                                        )
                                                    ),
                                                    b.VariableDeclaration([
                                                        b.VariableDeclarator(
                                                            b.Identifier('__variableNames'),
                                                            b.CallExpression(
                                                                b.MemberExpression(
                                                                    b.Identifier('Object'),
                                                                    b.Identifier('keys')
                                                                ),
                                                                [
                                                                    b.MemberExpression(
                                                                        b.Identifier('__overrideInfo'),
                                                                        b.Identifier('variableReferences')
                                                                    )
                                                                ]
                                                            )
                                                        )
                                                    ], 'let'),
                                                    b.ForStatement(
                                                        b.VariableDeclaration([
                                                            b.VariableDeclarator(
                                                                b.Identifier('__i__'),
                                                                b.Literal(0)
                                                            )
                                                        ], 'let'),
                                                        b.BinaryExpression(
                                                            b.Identifier('__i__'),
                                                            '<',
                                                            b.MemberExpression(
                                                                b.Identifier('__variableNames'),
                                                                b.Identifier('length')
                                                            )
                                                        ),
                                                        b.UpdateExpression(
                                                            b.Identifier('__i__'),
                                                            '++',
                                                            false
                                                        ),
                                                        b.BlockStatement([
                                                            b.VariableDeclaration([
                                                                b.VariableDeclarator(
                                                                    b.Identifier('__variableName'),
                                                                    b.MemberExpression(
                                                                        b.Identifier('__variableNames'),
                                                                        b.Identifier('__i__'),
                                                                        true
                                                                    )
                                                                )
                                                            ], 'let'),
                                                            b.VariableDeclaration([
                                                                b.VariableDeclarator(
                                                                    b.Identifier('__object'),
                                                                    b.MemberExpression(
                                                                        b.MemberExpression(
                                                                            b.Identifier('__overrideInfo'),
                                                                            b.Identifier('variableReferences')
                                                                        ),
                                                                        b.Identifier('__variableName'),
                                                                        true
                                                                    )
                                                                )
                                                            ], 'let'),
                                                            b.ExpressionStatement(
                                                                b.CallExpression(
                                                                    b.Identifier('eval'),
                                                                    [b.BinaryExpression(
                                                                        b.Identifier('__variableName'),
                                                                        '+',
                                                                        b.Literal(' = __object')
                                                                    )]
                                                                )
                                                            )
                                                        ])
                                                    )
                                                ]),
                                                b.IfStatement(
                                                    b.Identifier('__errorOccurred'),
                                                    b.BlockStatement([
                                                        b.ExpressionStatement(
                                                            b.CallExpression(
                                                                b.MemberExpression(
                                                                    b.Identifier('__newExpInfo'),
                                                                    b.Identifier('pop')
                                                                ), []
                                                            )
                                                        ),
                                                        b.ExpressionStatement(
                                                            b.CallExpression(
                                                                b.MemberExpression(
                                                                    b.Identifier('__stackForCallTree'),
                                                                    b.Identifier('pop')
                                                                ), []
                                                            )
                                                        )
                                                    ])
                                                )
                                            )
                                        ])
                                    ),
                                    __$__.ASTTransforms.changedGraphStmt(),
                                    __$__.ASTTransforms.makeCheckpoint(node.loc.end, info.vars),
                                    b.ExpressionStatement(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__newExpInfo'),
                                                b.Identifier("pop")
                                            ), []
                                        )
                                    ),
                                    // __stackForCallTree.pop();
                                    b.ExpressionStatement(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__stackForCallTree'),
                                                b.Identifier("pop")
                                            ), []
                                        )
                                    ),
                                    b.ReturnStatement(
                                        b.Identifier('__retObj')
                                    )
                                ])
                            ),
                            b.Identifier('call')
                        ),
                        info.arg
                    );
                }
            }
        };
    },


    /**
     * In this visitor a program is converted as the follow example.
     * This visitor is executed when the traversing AST leaved a node whose type is NewExpression, ArrayExpression, or ObjectExpression.
     *
     * before: new Class(arg1, ...)
     *
     * after:  (() => {
     *             __newExpInfo.push({loopLabel, loopCount, pos, contextSensitiveID}});
     *             __stackForCallTree.push(
     *                 new __$__.CallTree.Instance(
     *                     'unique ID',
     *                     __stackForCallTree,
     *                     'Class'
     *                 )
     *             );
     *             var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
     *
     *             __newObjectIds.push(__newObjectId);
     *             var __temp = new Class(arg1, ...);
     *             __$__.Context.ChangedGraph = true;
     *             __newExpInfo.pop();
     *             __stackForCallTree.pop();
     *             if (!__temp.__id) {
     *                 Object.setProperty(__temp, '__id', __newObjectIds.pop());
     *                 __objs.push(__temp);
     *             }
     *             return __temp;
     *         })()
     *
     * Array Expression is also the same
     */
    CollectObjects() {
        let b = __$__.ASTBuilder;
        return {
            leave(node, path) {
                if (node.loc && ('NewExpression' === node.type || 'ArrayExpression' === node.type || 'ObjectExpression' === node.type)) {
                    const c = {};
		    let line = false, column = false;
                    if (node.type === 'NewExpression') {
                        c.callee = node.callee.name;
                        c.this_node = b.NewExpression(
                            node.callee,
                            node.arguments
                        );
			line = node.loc.end.line;
			column = node.loc.end.column;
                        // c.newExpInfo = b.ObjectExpression([
                        //     b.Property(
                        //         b.Identifier('loopLabel'),
                        //         b.CallExpression(
                        //             b.MemberExpression(
                        //                 b.Identifier('__loopLabels'),
                        //                 b.Identifier('last')
                        //             ),
                        //             []
                        //         )
                        //     ),
                        //     b.Property(
                        //         b.Identifier('loopCount'),
                        //         b.Identifier('__loopCount')
                        //     ),
                        //     b.Property(
                        //         b.Identifier('pos'),
                        //         b.ObjectExpression([
                        //             b.Property(
                        //                 b.Identifier('line'),
                        //                 b.Literal(node.loc.end.line)
                        //             ),
                        //             b.Property(
                        //                 b.Identifier('column'),
                        //                 b.Literal(node.loc.end.column)
                        //             )
                        //         ])
                        //     ),
                        //     // contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
                        //     b.Property(
                        //         b.Identifier('contextSensitiveID'),
                        //         b.CallExpression(
                        //             b.MemberExpression(
                        //                 b.CallExpression(
                        //                     b.MemberExpression(
                        //                         b.Identifier('__stackForCallTree'),
                        //                         b.Identifier('last')
                        //                     ),
                        //                     []
                        //                 ),
                        //                 b.Identifier('getContextSensitiveID')
                        //             ),
                        //             []
                        //         )
                        //     )
                        // ]);
                    } else if (node.type === 'ArrayExpression') {
                        c.callee = 'Array';
                        c.this_node = b.ArrayExpression(
                            node.elements
                        );
                        // c.newExpInfo = b.Literal(false);
                    } else {
                        c.callee = 'Object';
                        c.this_node = b.ObjectExpression(
                            node.properties
                        );
                        // c.newExpInfo = b.Literal(false);
                    }

                    let label = node.label;
		    return __$__.ASTTransforms.buildNewWrapperCall(
			label,c,line,column);
                    // return b.CallExpression(
                    //     b.ArrowFunctionExpression(
                    //         [],
                    //         b.BlockStatement([
                    //             b.ExpressionStatement(
                    //                 b.CallExpression(
                    //                     b.MemberExpression(
                    //                         b.Identifier('__newExpInfo'),
                    //                         b.Identifier('push')
                    //                     ), [
                    //                         c.newExpInfo
                    //                     ]
                    //                 )
                    //             ),
                    //             //  __stackForCallTree.push(
                    //             //     new __$__.CallTree.Instance(
                    //             //         'unique ID',
                    //             //         __stackForCallTree,
                    //             //         'Class'
                    //             //     )
                    //             // );
                    //             b.ExpressionStatement(
                    //                 b.CallExpression(
                    //                     b.MemberExpression(
                    //                         b.Identifier('__stackForCallTree'),
                    //                         b.Identifier('push')
                    //                     ),
                    //                     [b.NewExpression(
                    //                         b.MemberExpression(
                    //                             b.MemberExpression(
                    //                                 b.Identifier('__$__'),
                    //                                 b.Identifier('CallTree')
                    //                             ),
                    //                             b.Identifier('Instance')
                    //                         ),
                    //                         [
                    //                             b.Literal(label),
                    //                             b.Identifier('__stackForCallTree'),
                    //                             b.Literal(c.callee)
                    //                         ]
                    //                     )]
                    //                 )
                    //             ),
                    //             // var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
                    //             b.VariableDeclaration([
                    //                 b.VariableDeclarator(
                    //                     b.Identifier('__newObjectId'),
                    //                     b.CallExpression(
                    //                         b.MemberExpression(
                    //                             b.CallExpression(
                    //                                 b.MemberExpression(
                    //                                     b.Identifier('__stackForCallTree'),
                    //                                     b.Identifier('last')
                    //                                 ),
                    //                                 []
                    //                             ),
                    //                             b.Identifier('getContextSensitiveID')
                    //                         ),
                    //                         []
                    //                     )
                    //                 )
                    //             ], 'var'),
                    //             // __newObjectIds.push(__newObjectId);
                    //             b.ExpressionStatement(
                    //                 b.CallExpression(
                    //                     b.MemberExpression(
                    //                         b.Identifier('__newObjectIds'),
                    //                         b.Identifier('push')
                    //                     ), [
                    //                         b.Identifier('__newObjectId')
                    //                     ]
                    //                 )
                    //             ),
                    //             b.VariableDeclaration([
                    //                 b.VariableDeclarator(
                    //                     b.Identifier('__temp'),
                    //                     c.this_node
                    //                 )
                    //             ], 'var'),
                    //             __$__.ASTTransforms.changedGraphStmt(),
                    //             b.ExpressionStatement(
                    //                 b.CallExpression(
                    //                     b.MemberExpression(
                    //                         b.Identifier('__newExpInfo'),
                    //                         b.Identifier('pop')
                    //                     ), []
                    //                 )
                    //             ),
                    //             // __stackForCallTree.pop();
                    //             b.ExpressionStatement(
                    //                 b.CallExpression(
                    //                     b.MemberExpression(
                    //                         b.Identifier('__stackForCallTree'),
                    //                         b.Identifier('pop')
                    //                     ), []
                    //                 )
                    //             ),
                    //             /**
                    //              * if (!__temp.__id) {
                    //          *     Object.setProperty(__temp, '__id', __newObjectIds.pop());
                    //          *     __objs.push(__temp);
                    //          * }
                    //              */
                    //             b.IfStatement(
                    //                 b.UnaryExpression(
                    //                     '!',
                    //                     b.MemberExpression(
                    //                         b.Identifier('__temp'),
                    //                         b.Identifier('__id')
                    //                     ),
                    //                     true
                    //                 ),
                    //                 b.BlockStatement([
                    //                     b.ExpressionStatement(
                    //                         // Object.setProperty(__temp, "__id", __newObjectIds.pop())
                    //                         b.CallExpression(
                    //                             b.MemberExpression(
                    //                                 b.Identifier('Object'),
                    //                                 b.Identifier('setProperty')
                    //                             ), [
                    //                                 b.Identifier('__temp'),
                    //                                 b.Literal('__id'),
                    //                                 b.CallExpression(
                    //                                     b.MemberExpression(
                    //                                         b.Identifier('__newObjectIds'),
                    //                                         b.Identifier('pop')
                    //                                     ),
                    //                                     []
                    //                                 )
                    //                             ]
                    //                         )

                    //                     ),
                    //                     b.ExpressionStatement(
                    //                         // __objs.push(__temp)
                    //                         b.CallExpression(
                    //                             b.MemberExpression(
                    //                                 b.Identifier('__objs'),
                    //                                 b.Identifier('push')
                    //                             ),
                    //                             [b.Identifier('__temp')]
                    //                         )
                    //                     )
                    //                 ])
                    //             ),
                    //             b.ReturnStatement(
                    //                 b.Identifier("__temp")
                    //             )
                    //         ])
                    //     ),
                    //     []
                    // );
                }
            }
        };
    },
    // to generate an expression that wraps an object-creating
    // expression including new-expressions, array literals and object
    // literals.  
    buildNewWrapper(label, c, line, column) {
	let b = __$__.ASTBuilder;
	let newExpInfo = line ?
	    b.ObjectExpression([
                            b.Property(
                                b.Identifier('loopLabel'),
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__loopLabels'),
                                        b.Identifier('last')
                                    ),
                                    []
                                )
                            ),
                            b.Property(
                                b.Identifier('loopCount'),
                                b.Identifier('__loopCount')
                            ),
                            b.Property(
                                b.Identifier('pos'),
                                b.ObjectExpression([
                                    b.Property(
                                        b.Identifier('line'),
                                        //b.Literal(node.loc.end.line)
					b.Literal(line)
                                    ),
                                    b.Property(
                                        b.Identifier('column'),
                                        //b.Literal(node.loc.end.column)
					b.Literal(column)
                                    )
                                ])
                            ),
                            // contextSensitiveID: __stackForCallTree.last().getContextSensitiveID()
                            b.Property(
                                b.Identifier('contextSensitiveID'),
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__stackForCallTree'),
                                                b.Identifier('last')
                                            ),
                                            []
                                        ),
                                        b.Identifier('getContextSensitiveID')
                                    ),
                                    []
                                )
                            )
            ]) : b.Literal(false);
	return b.CallExpression(
            b.ArrowFunctionExpression(
                [],
                b.BlockStatement([
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__newExpInfo'),
                                b.Identifier('push')
                            ), [
                                // c.newExpInfo
				newExpInfo
                            ]
                        )
                    ),
                    //  __stackForCallTree.push(
                    //     new __$__.CallTree.Instance(
                    //         'unique ID',
                    //         __stackForCallTree,
                    //         'Class'
                    //     )
                    // );
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__stackForCallTree'),
                                b.Identifier('push')
                            ),
                            [b.NewExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__$__'),
                                        b.Identifier('CallTree')
                                    ),
                                    b.Identifier('Instance')
                                ),
                                [
                                    b.Literal(label),
                                    b.Identifier('__stackForCallTree'),
                                    b.Literal(c.callee)
                                ]
                            )]
                        )
                    ),
                    // var __newObjectId = __stackForCallTree.last().getContextSensitiveID();
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__newObjectId'),
                            b.CallExpression(
                                b.MemberExpression(
                                    b.CallExpression(
                                        b.MemberExpression(
                                            b.Identifier('__stackForCallTree'),
                                            b.Identifier('last')
                                        ),
                                        []
                                    ),
                                    b.Identifier('getContextSensitiveID')
                                ),
                                []
                            )
                        )
                    ], 'var'),
                    // __newObjectIds.push(__newObjectId);
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__newObjectIds'),
                                b.Identifier('push')
                            ), [
                                b.Identifier('__newObjectId')
                            ]
                        )
                    ),
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__temp'),
                            c.this_node
                        )
                    ], 'var'),
                    __$__.ASTTransforms.changedGraphStmt(),
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__newExpInfo'),
                                b.Identifier('pop')
                            ), []
                        )
                    ),
                    // __stackForCallTree.pop();
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__stackForCallTree'),
                                b.Identifier('pop')
                            ), []
                        )
                    ),
                    /**
                     * if (!__temp.__id) {
                     *     Object.setProperty(__temp, '__id', __newObjectIds.pop());
                     *     __objs.push(__temp);
                     * }
                     */
                    b.IfStatement(
                        b.UnaryExpression(
                            '!',
                            b.MemberExpression(
                                b.Identifier('__temp'),
                                b.Identifier('__id')
                            ),
                            true
                        ),
                        b.BlockStatement([
                            b.ExpressionStatement(
                                // Object.setProperty(__temp, "__id", __newObjectIds.pop())
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('Object'),
                                        b.Identifier('setProperty')
                                    ), [
                                        b.Identifier('__temp'),
                                        b.Literal('__id'),
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__newObjectIds'),
                                                b.Identifier('pop')
                                            ),
                                            []
                                        )
                                    ]
                                )

                            ),
                            b.ExpressionStatement(
                                // __objs.push(__temp)
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__objs'),
                                        b.Identifier('push')
                                    ),
                                    [b.Identifier('__temp')]
                                )
                            )
                        ])
                    ),
                    b.ReturnStatement(
                        b.Identifier("__temp")
                    )
                ])
            ),
            []
        );
    },
    // to generate a call expression
    //
    // __$__.Context.NewExpressionWrapprer(
    //   ()=> !!!c.this_node!!!, __newExpInfo, __loopLabels, __loopCount,
    //   __stackForCallTree, !!!label!!!, !!!class_name!!!,
    //   __newObjectIds, !!!line!!!, !!!column!!!)
    buildNewWrapperCall(label, c, line, column) {
	let b = __$__.ASTBuilder;
	return {
            "type": "CallExpression",
            "callee": {
		"type": "MemberExpression",
		"computed": false,
		"object": {
		    "type": "MemberExpression",
		    "computed": false,
		    "object": {
			"type": "Identifier",
			"name": "__$__"
		    },
		    "property": {
			"type": "Identifier",
			"name": "Context"
		    }
		},
		"property": {
		    "type": "Identifier",
		    "name": "NewExpressionWrapprer"
		}
            },
            "arguments": [
		{
		    "type": "ArrowFunctionExpression",
		    "id": null,
		    "params": [],
		    "body": c.this_node,
		    "generator": false,
		    "expression": true,
		    "async": false
		},
		{
		    "type": "Identifier",
		    "name": "__newExpInfo"
		},
		{
		    "type": "Identifier",
		    "name": "__loopLabels"
		},
		{
		    "type": "Identifier",
		    "name": "__loopCount"
		},
		{
		    "type": "Identifier",
		    "name": "__stackForCallTree"
		},
		{
		    "type": "Literal",
		    "value": label
		},
		{
		    "type": "Literal",
		    "value": c.callee
		},
		{
		    "type": "Identifier",
		    "name": "__newObjectIds"
		},
		{
		    "type": "Literal",
		    "value": line
		},
		{
		    "type": "Literal",
		    "value": column
		},
		{
		    "type": "Identifier",
		    "name": "__objs"
		}
            ]
	};
    },
    /** Insert the code to manage the context in loop.
     * loop includes
     * - DoWhileStatement
     * - WhileStatement
     * - ForStatement
     * - ForInStatement
     * - FunctionExpression
     * - FunctionDeclaration
     * - ArrowFunctionExpression
     *
     * This is code conversion example in FunctionExpression
     *
     * before:
     *   function(args) {
     *       ...
     *   }
     *
     * after:
     *   function(args) {
     *       let __loopLabel = 'loop' + label;
     *       __loopLabels.push(__loopLabel);
     *       if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
     *           __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
     *       let __loopCount = ++__loopCounterObject[__loopLabel] || (__loopCounterObject[__loopLabel] = 1);
     *       if (__loopCount > 100) {
     *           __$__.Context.InfLoop = __loopLabel;
     *           throw 'Infinite Loop';
     *       }
     *       let __start = __time_counter
     *       __stackForCallTree.push(
     *           new __$__.CallTree.Function(
     *               __loopLabel,
     *               __stackForCallTree,
     *               [simplifiedLabel],
     *               [function name],
     *               [className]
     *           )
     *       );
     *       if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
     *           __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
     *
     *       __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
     *
     *       // if this function is called as a constructor, assign a unique object ID to this.
     *       if (__newExpInfo.last()) {
     *           Object.setProperty(this, '__id', __newObjectIds.pop());
     *           __objs.push(this);
     *       }
     *       __$__.Context.RegisterCallRelationship(__stackForCallTree);
     *
     *       try {
     *           ... (body)
     *       } finally {
     *           __stackForCallTree.pop();
     *           __loopLabels.pop();
     *       }
     *   }
     *
     * __loopLabel is unique label
     *
     * This is code conversion example in WhileStatement
     * before:
     *   while(condition) {
     *       ...
     *   }
     *
     *
     * after:
     *     {
     *         let __loopLabel = 'loop' + label,
     *             __loopCounter = 0;
     *         __loopLabels.push(__loopLabel);
     *         if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
     *             __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
     *
     *         try {
     *             while (condition) {
     *                 __loopCounter++;
     *                 let __loopCount = ++__loopCounterObject[__loopLabel] || (__loopCounterObject[__loopLabel] = 1);
     *                 if (__loopCount > 100){
     *                     __$__.Context.InfLoop = __loopLabel;
     *                     throw 'Infinite Loop';
     *                 }
     *                 let __start = __time_counter
     *                 __stackForCallTree.push(
     *                     new __$__.CallTree.Loop(
     *                         __loopLabel,
     *                         __stackForCallTree,
     *                        [simplifiedLabel],
     *                         __loopCounter,
     *                         null
     *                     )
     *                 );
     *
     *                 if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
     *                     __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
     *
     *                 __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
     *
     *                 // there is following IfStatement in the case only of functions
     *                 // The body of this IfStatement is executed only in the case of functions
     *                 if (__newExpInfo.last()) {
     *                     Object.setProperty(this, '__id', __newObjectIds.pop());
     *                     __objs.push(this);
     *                 }
     *
     *                 try {
     *                     ... (body of the loop)
     *                 } finally {
     *                     __stackForCallTree.pop();
     *                 }
     *             }
     *         } finally {
     *             __loopLabels.pop();
     *         }
     *     }
     */
    Context() {
        let b = __$__.ASTBuilder;
        let id = 'context';
        const loopLabels = "__loopLabels",
            loopCount = "__loopCount",
            loopCounter = "__loopCounterObject";
        let labelCount = 0;
        return {
            enter(node, path) {
                if (__$__.ASTTransforms.Loop[node.type] && node.loc) {


                    let label = node.label;

                    if (node.body.type !== "BlockStatement") {
                        if (node.type === 'ArrowFunctionExpression') {
                            let retStmt = b.ReturnStatement(node.body);
                            retStmt.loc = node.body.loc;
                            node.body = b.BlockStatement([retStmt]);
                            node.expression = false;
                        } else
                            node.body = b.BlockStatement([node.body]);
                    }

                    return [id, {label: label}];
                }
            },
            leave(node, path) {
                if (__$__.ASTTransforms.Loop[node.type] && node.loc) {
                    let parent = path[path.length - 2];
                    let label = node.label,
                        isFunction = __$__.ASTTransforms.funcTypes[node.type];

                    // if (node.type is 'FunctionDeclaration' or 'FunctionExpression' or ...,
                    // then, node.params is the parameters of the function


                    let finallyBody = [
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__stackForCallTree'),
                                    b.Identifier('pop')
                                ),
                                []
                            )
                        )
                    ];

                    let newBlockStmt = b.BlockStatement([]);
		    this.insert_loop_initializers(
			isFunction,label,node,parent,path,b,
			newBlockStmt,finallyBody);

		    // if this is a function expression of a constructor,
		    // and the first statement of its body is a supercall,
		    // move that statement before the initializations
		    // of the loop counters.
		    if (this.isFunctionExpressionOfConstructor(node,path) &&
			this.isSuperStatement(node.body.body[0])) {
			newBlockStmt.body.unshift(
			    node.body.body.shift());
		    }

                    newBlockStmt.body.push(
			b.TryStatement(
                            Object.assign({}, node.body),
                            undefined,
                            b.BlockStatement(finallyBody)
			)
                    );

		    node.body = newBlockStmt;

                    if (!isFunction) {

                        let stmt;

                        if (parent.type === 'LabeledStatement') {
                            let label = parent.label;
                            parent.label = b.Identifier('______' + ++labelCount);
                            stmt = b.LabeledStatement(label, Object.assign({}, node));
                        } else {
                            stmt = Object.assign({}, node);
                        }

                        return b.BlockStatement([
                            b.VariableDeclaration([
                                b.VariableDeclarator(
                                    b.Identifier('__loopLabel'),
                                    b.Literal(label)
                                ),
                                b.VariableDeclarator(
                                    b.Identifier('__loopCounter'),
                                    b.Literal(0)
                                ),
                            ], 'let'),
                            b.ExpressionStatement(
                                b.Identifier('__loopLabels.push(__loopLabel)')
                            ),
                            /**
                             * if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
                             *     __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
                             */
                            b.IfStatement(
                                b.BinaryExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.Identifier('__$__'),
                                                b.Identifier('Context'),
                                            ),
                                            b.Identifier('CallTreeNodesOfEachLoop')
                                        ),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    '===',
                                    b.Identifier('undefined')
                                ),
                                b.ExpressionStatement(
                                    b.AssignmentExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.MemberExpression(
                                                    b.Identifier('__$__'),
                                                    b.Identifier('Context'),
                                                ),
                                                b.Identifier('CallTreeNodesOfEachLoop')
                                            ),
                                            b.Identifier('__loopLabel'),
                                            true
                                        ),
                                        '=',
                                        b.ArrayExpression([])
                                    )
                                )
                            ),
                            b.TryStatement(
                                b.BlockStatement([stmt]),
                                undefined,
                                b.BlockStatement([
                                    b.ExpressionStatement(
                                        b.Identifier('__loopLabels.pop()')
                                    )
                                ])
                            )
                        ]);
                    }
                }
            },
	    insert_loop_initializers(isFunction,label,node,parent,path,b,
				     newBlockStmt,finallyBody){
                if (isFunction) {
                    finallyBody.push(
                        b.ExpressionStatement(
                            b.Identifier('__loopLabels.pop()')
                        )
                    );

                    newBlockStmt.body.push(
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__loopLabel'),
                                b.Literal(label)
                            )
                        ], 'let')
                    );

                    newBlockStmt.body.push(
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__loopLabels'),
                                    b.Identifier('push')
                                ),
                                [b.Identifier('__loopLabel')]
                            )
                        )
                    );

                    /**
                     * if (__$__.Context.CallTreeNodesOfEachLoop[__loopLabel] === undefined)
                     *     __$__.Context.CallTreeNodesOfEachLoop[__loopLabel] = [];
                     */
                    newBlockStmt.body.push(
                        b.IfStatement(
                            b.BinaryExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context'),
                                        ),
                                        b.Identifier('CallTreeNodesOfEachLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                '===',
                                b.Identifier('undefined')
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.Identifier('__$__'),
                                                b.Identifier('Context'),
                                            ),
                                            b.Identifier('CallTreeNodesOfEachLoop')
                                        ),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    '=',
                                    b.ArrayExpression([])
                                )
                            )
                        )
                    )

                } else {
                    newBlockStmt.body.push(
                        b.ExpressionStatement(
                            b.UnaryExpression(
                                '++',
                                b.Identifier('__loopCounter'),
                                false
                            )
                        )
                    );
                }

                newBlockStmt.body.push(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier(loopCount),
                            b.BinaryExpression(
                                b.UnaryExpression(
                                    '++',
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    true
                                ),
                                '||',
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    '=',
                                    b.Literal(1)
                                )
                            )
                        )
                    ], 'let')
                );

                newBlockStmt.body.push(
                    b.IfStatement(
                        b.BinaryExpression(
                            b.Identifier(loopCount),
                            ">",
                            b.Literal(10000)
                        ),
                        b.BlockStatement([
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('InfLoop')
                                    ),
                                    '=',
                                    b.Identifier('__loopLabel')
                                )
                            ),
                            b.ThrowStatement(
                                b.Literal('Infinite Loop')
                            )
                        ])
                    )
                );

                newBlockStmt.body.push(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__start'),
                            b.Identifier('__time_counter')
                        )
                    ], 'let')
                );

                /**
                 * __stackForCallTree.push(
                 *     new __$__.CallTree.Function(
                 *         __loopLabel,
                 *         __stackForCallTree,
                 *         [simplifiedLabel],
                 *         [function name],
                 *         [className]
                 *     )
                 * );
                 * or
                 * __stackForCallTree.push(
                 *     new __$__.CallTree.Loop(
                 *         __loopLabel,
                 *         __stackForCallTree,
                 *         [simplifiedLabel],
                 *         __loopCounter,
                 *         null
                 *     )
                 * );
                 */
                let arg4, arg5;
                if (isFunction) {
                    if (node.id && node.id.name) {
                        arg4 = b.Literal(node.id.name);
                    } else if (parent.type === 'MethodDefinition' && parent.key && parent.key.name) {
                        arg4 = b.Literal(parent.key.name);
                        let classBody = path[path.length - 3]; // ClassBody
                        let classDeclaration = path[path.length - 4]; // ClassDeclaration
                        if (classBody && classBody.type === 'ClassBody' && classDeclaration && classDeclaration.type === 'ClassDeclaration') {
                            if (!__$__.CallTree.classOfMethod[parent.key.name])
                                __$__.CallTree.classOfMethod[parent.key.name] = [];
                            __$__.CallTree.classOfMethod[parent.key.name].push(classDeclaration.id.name);
                            arg5 = b.Literal(classDeclaration.id.name);
                        }
                    } else {
                        arg4 = b.Literal(null);
                    }
                } else {
                    arg4 = b.Identifier('__loopCounter');
                }
                newBlockStmt.body.push(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__stackForCallTree'),
                                b.Identifier('push')
                            ),
                            [b.NewExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__$__'),
                                        b.Identifier('CallTree')
                                    ),
                                    b.Identifier((isFunction) ? 'Function' : 'Loop')
                                ),
                                [
                                    b.Identifier('__loopLabel'),
                                    b.Identifier('__stackForCallTree'),
                                    b.Literal(label.replace(node.type, __$__.ASTTransforms.Loop[node.type])),
                                    arg4,
                                    arg5 || b.Literal(null)
                                ]
                            )]
                        )
                    )
                );

                /**
                 * if (__$__.Context.SpecifiedContext[__loopLabel] === undefined)
                 *     __$__.Context.SpecifiedContext[__loopLabel] = __stackForCallTree.last().getContextSensitiveID();
                 */
                newBlockStmt.body.push(
                    b.IfStatement(
                        b.BinaryExpression(
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__$__'),
                                        b.Identifier('Context')
                                    ),
                                    b.Identifier('SpecifiedContext')
                                ),
                                b.Identifier('__loopLabel'),
                                true
                            ),
                            '===',
                            b.Identifier('undefined')
                        ),
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('SpecifiedContext')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                '=',
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__stackForCallTree'),
                                                b.Identifier('last')
                                            ),
                                            []
                                        ),
                                        b.Identifier('getContextSensitiveID')
                                    ),
                                    []
                                )
                            )
                        )
                    )
                );



                /**
                 * __$__.Context.CallTreeNodesOfEachLoop[__loopLabel].push(__stackForCallTree.last());
                 */
                newBlockStmt.body.push(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('CallTreeNodesOfEachLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                b.Identifier('push')
                            ),
                            [b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__stackForCallTree'),
                                    b.Identifier('last')
                                ),
                                []
                            )]
                        )
                    )
                );

                /**
                 * if (__newExpInfo.last()) {
                 *     Object.setProperty(this, '__id', __newObjectIds.pop());
                 *     __objs.push(this);
                 * }
                 */
                newBlockStmt.body.push(
                    b.IfStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__newExpInfo'),
                                b.Identifier('last')
                            ), []
                        ),
                        b.BlockStatement([
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('Object'),
                                        b.Identifier('setProperty')
                                    ), [
                                        b.Identifier('this'),
                                        b.Literal('__id'),
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__newObjectIds'),
                                                b.Identifier('pop')
                                            ),
                                            []
                                        )
                                    ]
                                )
                            ),
                            b.ExpressionStatement(
                                // b.Identifier('__objs.push(this)')
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__objs'),
                                        b.Identifier('push')
                                    ),
                                    [b.Identifier('this')]
                                )
                            )
                        ])
                    )
                );


                if (isFunction)
                    /**
                     * __$__.Context.RegisterCallRelationship(__stackForCallTree);
                     */
                    newBlockStmt.body.push(
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__$__'),
                                        b.Identifier('Context')
                                    ),
                                    b.Identifier('RegisterCallRelationship')
                                ), [
                                    b.Identifier('__stackForCallTree')
                                ]
                            )
                        )
                    );

	
	    },
	    ...__$__.ASTTransforms.ast_predicates
        };
    },


    /**
     * insert check point before and after each statement (VariableDeclaration is exception).
     *
     * if statement type is 'return', 'break', 'continue'
     *   Statement -> {checkPoint; Statement} ... (1)
     *
     * otherwise
     *   Statement -> {checkPoint; Statement; checkPoint} ... (2)
     *
     *
     * But, if use (2) when Statement type is VariableDeclaration and node.kind is not 'var',
     * the scope of variables is changed. Additionally, if use (2) when node.parent.type is
     * 'ForStatement' or 'ForInStatement', transformed code cause run time error. For example,
     * 'var i = 0' in 'for (var i = 0; i < 10; i++) {...}' mustn't be transformed. So,
     *
     *
     * if Statement type is VariableDeclaration and node.kind is 'let' or 'const',
     *   Statement -> [checkPoint; Statement; checkPoint] ... (3)
     *
     * if Statement type is VariableDeclaration and node.kind is 'var',
     *   Statement -> {checkPoint; Statement; checkPoint} ... (2)
     *
     *
     * At the same time, implement variable visualization by using '$'.
     * the scope of variables is implemented by my environment whose style is stack.
     *
     * inserted check point is
     * '__$__.Checkpoint.checkpoint(__objs, __loopLabel, __loopCount, __time_counter, {})'
     * and, the last of arguments is object which means visualization of variables.
     * the argument is {v: typeof v === 'string' ? eval(v) : undefined} if variable 'v' should be visualized.
     *
     */

    InsertCheckPoint() {
        let b = __$__.ASTBuilder;
        let id = 'InsertCheckPoint';
        __$__.ASTTransforms.checkPoint_idCounter = 1;
        return {
            enter(node, path) {
                if (__$__.ASTTransforms.funcTypes[node.type]) {
                    __$__.ASTTransforms.varEnv.push(new __$__.Probe.FunctionFlame());

                    if (!node.expression) {
                        node.body.body.forEach(s => {
                            if (s.type === 'VariableDeclaration' && s.kind === 'var') {
                                s.declarations.forEach(declarator => {
                                    __$__.ASTTransforms.varEnv.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                                });
                            }
                        });
                    }

                    node.params.forEach(param => {
                        if(param instanceof Object) __$__.ASTTransforms.varEnv.addVariable(param.name, "var", true)
                    });
                }


                if (node.type === 'BlockStatement') {
                    __$__.ASTTransforms.varEnv.push(new __$__.Probe.BlockFlame());

                    node.body.forEach(s => {
                        if (s.type === 'VariableDeclaration' && s.kind !== 'var') {
                            s.declarations.forEach(declarator => {
                                __$__.ASTTransforms.varEnv.addVariable(declarator.id.name, s.kind, false);
                            });
                        }
                    });
                }

                if (__$__.ASTTransforms.Loop[node.type] && node.loc && node.body.type !== "BlockStatement") {
                    if (node.type === 'ArrowFunctionExpression') {
                        let retStmt = b.ReturnStatement(node.body);
                        retStmt.loc = node.body.loc;
                        node.body = b.BlockStatement([retStmt]);
                        node.expression = false;
                    } else
                        node.body = b.BlockStatement([node.body]);
                }


                if (node.type === 'ForStatement' || node.type === 'ForInStatement') {
                    __$__.ASTTransforms.varEnv.push(new __$__.Probe.BlockFlame());
                }
                return [id, __$__.ASTTransforms.varEnv.Variables()];
            },
            leave(node, path, enterData) {
                let data = enterData[id];

                if (node.type === 'VariableDeclarator') {
                    let parent = path[path.length - 2];
                    __$__.ASTTransforms.varEnv.addVariable(node.id.name, parent.kind, true);
                }

                if (__$__.ASTTransforms.varScopes[node.type]) {
                    __$__.ASTTransforms.varEnv.pop();
                }

                if (node.loc && __$__.ASTTransforms.stmtTypes[node.type] || node.type === 'VariableDeclarator') {
                    let start = node.loc.start;
                    let end = node.loc.end;
                    let parent = path[path.length - 2];
                    let variables = __$__.ASTTransforms.varEnv.Variables();



                    /**
                     * // before
                     * return ret;
                     *
                     * // after
                     * {
                     *     checkpoint;
                     *     let __temp = ret;
                     *     checkpoint;
                     *     return __temp;
                     * }
                     */
                    if (node.type === 'ReturnStatement') {
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
			// console.log("return statement");
                        return b.BlockStatement([
                            __$__.ASTTransforms.makeCheckpoint(start, variables),
                            b.VariableDeclaration([
                                b.VariableDeclarator(
                                    b.Identifier('__temp'),
                                    node.argument
                                )
                            ], 'let'),
                            __$__.ASTTransforms.makeCheckpoint(end, variables),
                            b.ReturnStatement(
                                b.Identifier('__temp')
                            )
                        ]);

                    }
                    /**
                     * // before
                     * continue label; (or break label;)
                     *
                     * // after
                     * {
                     *     checkpoint;
                     *     continue label; (or break label;)
                     *     checkpoint;
                     * }
                     */
                    else if (('ContinueStatement' === node.type || 'BreakStatement' === node.type) && node.label && node.label.name) {
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                        return b.BlockStatement([
                            __$__.ASTTransforms.makeCheckpoint(start, variables),
                            node,
                            __$__.ASTTransforms.makeCheckpoint(end, variables)
                        ]);

                    }
                    /**
                     * // before
                     * continue; (or break;)
                     *
                     * // after
                     * {
                     *     checkpoint;
                     *     continue; (or break;)
                     *     checkpoint;
                     * }
                     */
                    else if ('ContinueStatement' === node.type || 'BreakStatement' === node.type) {
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                        return b.BlockStatement([
                            __$__.ASTTransforms.makeCheckpoint(start, data),
                            node,
                            __$__.ASTTransforms.makeCheckpoint(end, variables)
                        ]);
                    } else if (node.type === 'VariableDeclaration' && node.kind !== 'var' && ('ForStatement' !== parent.type && 'ForInStatement' !== parent.type || parent.init !== node && parent.left !== node)
                        || node.type === 'ClassDeclaration') {
			// console.log("this is something:" + node.type);
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                        return [
                            __$__.ASTTransforms.makeCheckpoint(start, data),
                            node,
                            __$__.ASTTransforms.changedGraphStmt(),
                            __$__.ASTTransforms.makeCheckpoint(end, variables)
                        ];
                    } else if (node.type === 'VariableDeclarator') {
                        if (node.init && node.init.loc) {
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                            let expression = Object.assign({}, node.init);
                            let name = node.id.name;
			    // console.log("vardecl? : " + node.type);
                            node.init = b.CallExpression(
                                b.ArrowFunctionExpression(
                                    [],
                                    b.BlockStatement([
                                        __$__.ASTTransforms.makeCheckpoint(node.init.loc.start, data),
                                        b.VariableDeclaration([
                                            b.VariableDeclarator(
                                                b.Identifier('__temp_' + name),
                                                expression
                                            )
                                        ], 'var'),
                                        __$__.ASTTransforms.changedGraphStmt(),
                                        __$__.ASTTransforms.makeCheckpoint(node.init.loc.end, variables, name),
                                        b.ReturnStatement(
                                            b.Identifier('__temp_' + name)
                                        )
                                    ])
                                ),
                                []
                            );
                        }
                    } else if (node.type !== 'VariableDeclaration' || ('ForStatement' !== parent.type && 'ForInStatement' !== parent.type || parent.init !== node && parent.left !== node)) {
                        // So that the body of 'LabeledStatement' is not checkpoint(CallExpression).
                        if (!__$__.ASTTransforms.loopTypes[node.type] || parent.type !== 'LabeledStatement') {
                            let parent = path[path.length - 2];
                            if (parent && (parent.type === 'BlockStatement' || parent.type === 'Program')) {
                                if (node.type === 'BlockStatement') {
				    // console.log("top level block!? ");
                                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                                    return [
                                        __$__.ASTTransforms.changedGraphStmt(),
                                        __$__.ASTTransforms.makeCheckpoint(start, variables),
                                        node,
                                        __$__.ASTTransforms.changedGraphStmt(),
                                        __$__.ASTTransforms.makeCheckpoint(end, variables)
                                    ];
                                } else {
				    // console.log("some other cases"+ node.type);
				    // console.log("super?="+ this.isSuperConstructorStatement(node,path));
				    return this.transformOtherStatement(start,end,variables,b,node,path);
                                    // __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                                    // __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                                    // return [
                                    //     __$__.ASTTransforms.makeCheckpoint(start, variables),
                                    //     node,
                                    //     __$__.ASTTransforms.changedGraphStmt(),
                                    //     __$__.ASTTransforms.makeCheckpoint(end, variables)
                                    // ];
                                }
                            }

                            if (node.type === 'BlockStatement') {
				return this.transformBlockStatement(start,end,variables,b,node,path);
                            } else {
				// console.log("here!");
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                                return b.BlockStatement([
                                    __$__.ASTTransforms.makeCheckpoint(start, variables),
                                    node,
                                    __$__.ASTTransforms.changedGraphStmt(),
                                    __$__.ASTTransforms.makeCheckpoint(end, variables)
                                ]);
                            }
                        }
                    }
                }
            },
	    // transform all (other) block statement
	    transformBlockStatement(start,end,variables,b,node,path){
		start.column += 1;
                end.column -= 1;
		// when this is in a constructor and the first statement of
		// a super call, insert a chepoint AFTER the super call
		let beforeCP = ( (this.isConstructorBody(node,path)
				  && node.body.length > 0
				  && this.isSuperStatement(node.body[0])) 
				 ? [node.body.shift()] : [] );
		if (node.body.length === 0) {
		    // if the constructor is empty or has only a super
		    // call, just return the original node.
		    node.body.unshift(...beforeCP);
		    return node;
		} else {
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                    return b.BlockStatement(
			beforeCP.concat(
			    [__$__.ASTTransforms.changedGraphStmt(),
			     __$__.ASTTransforms.makeCheckpoint(start, variables),
			     node,
			     __$__.ASTTransforms.changedGraphStmt(),
			     __$__.ASTTransforms.makeCheckpoint(end, variables)
			    ]));
		}
	    },
	    // transform all other kinds of statements, including
	    // super call statements
	    transformOtherStatement(start,end,variables,b,node,path){
		if(this.isSuperConstructorStatement(node,path)) {
		    // throw new Error("transforming super statement in a constructor:" + JSON.stringify(node));
		    return [node];
		} else {
                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                return [
                    __$__.ASTTransforms.makeCheckpoint(start, variables),
                    node,
                    __$__.ASTTransforms.changedGraphStmt(),
                    __$__.ASTTransforms.makeCheckpoint(end, variables)
                ];
		}
	    },
	    ...__$__.ASTTransforms.ast_predicates
        };
    },

    /**
     * labeling
     */
    Labeling() {
        return {
            enter(node, path) {
                if (node.loc && __$__.ASTTransforms.Labeled[node.type]) {
                    const c = {
                        parent: path[path.length - 2]
                    };
                    switch (node.type) {
                        case 'CallExpression':
                            c.LabelPos = __$__.Context.LabelPos.Call;
                            c.label_header = 'call';
                            c.isLoop = false;
                            break;
                        case 'NewExpression':
                            c.LabelPos = __$__.Context.LabelPos.New;
                            c.label_header = 'new';
                            c.isLoop = false;
                            break;
                        case 'ArrayExpression':
                            c.LabelPos = __$__.Context.LabelPos.Arr;
                            c.label_header = 'arr';
                            c.isLoop = false;
                            break;
                        case 'ObjectExpression':
                            c.LabelPos = __$__.Context.LabelPos.Obj;
                            c.label_header = 'obj';
                            c.isLoop = false;
                            break;
                        default:
                            c.LabelPos = __$__.Context.LabelPos.Loop;
                            c.label_header = node.type;
                            c.isLoop = true;
                            break;
                    }


                    let label;
                    let startObj = __$__.UpdateLabelPos.table.get(node.loc.start.line, node.loc.start.column);
                    let endObj = __$__.UpdateLabelPos.table.get(node.loc.end.line, node.loc.end.column);
                    Object.keys(startObj).forEach(lbl => {
                        if (endObj[lbl]) {
                            label = lbl;
                            let pos = c.LabelPos[label];
                            pos.useLabel = true;
                            pos.closed = !c.isLoop || node.body.type === 'BlockStatement';
                            __$__.UpdateLabelPos.table.delete(node.loc.start.line, node.loc.start.column, label);
                            __$__.UpdateLabelPos.table.delete(node.loc.end.line, node.loc.end.column, label);
                        }
                    });

                    if (!label) {
                        if (Object.keys(startObj).length > 0 || Object.keys(endObj).length > 0){
                            // the case that either start position or end position matches the registered position.
                            __$__.UpdateLabelPos.unlabeledNodes.push({
                                node: node,
                                startObj: startObj,
                                endObj: endObj,
                                c: c
                            });
                        } else {
                            // the case that no position matches the registered positions.
                            label = __$__.UpdateLabelPos.assignLabel(node, c);
                        }
                    }


                    if (c.isLoop) {
                        if (node.body.type !== "BlockStatement") {
                            __$__.CallTree.positionToStartLoopBody[label] = {
                                line: node.body.loc.start.line,
                                column: node.body.loc.start.column
                            };
                        } else {
                            __$__.CallTree.positionToStartLoopBody[label] = {
                                line: node.body.loc.start.line,
                                column: node.body.loc.start.column+1
                            };
                        }
                    }

                    node.label = label;
                    if (node.type === 'CallExpression' && label) {
                        __$__.Testize.registerParenthesisPos(node);
                    }
                }
            }
        }
    },

    makeCheckpoint(loc, variables, temp_var) {
        let b = __$__.ASTBuilder;
        __$__.Context.CheckPointTable[__$__.ASTTransforms.checkPoint_idCounter] = loc;
        return b.ExpressionStatement(
            b.CallExpression(
                b.Identifier('__$__.Checkpoint.checkpoint'),
                [
                    b.Identifier('__objs'),
                    b.CallExpression(
                        b.MemberExpression(
                            b.Identifier('__loopLabels'),
                            b.Identifier('last')
                        ),
                        []
                    ),
                    b.Identifier('__loopCount'),
                    b.Identifier('__time_counter++'),
                    b.Identifier(__$__.ASTTransforms.checkPoint_idCounter++),
                    b.ObjectExpression(
                        variables.map(function(val) {
                            let new_val = (val === temp_var) ? '__temp_' + val : val;
                            return b.Property(
                                b.Identifier(val),
                                b.ConditionalExpression(
                                    b.BinaryExpression(
                                        b.UnaryExpression(
                                            'typeof',
                                            b.Identifier(new_val),
                                            true
                                        ),
                                        '!==',
                                        b.Literal('string')
                                    ),
                                    b.Identifier(new_val),
                                    b.Identifier("undefined")
                                )
                            );
                        }).concat([
                            b.Property(
                                b.Identifier('this'),
                                b.Identifier('this')
                            )
                        ])
                    ),
                    b.CallExpression(
                        b.MemberExpression(
                            b.Identifier('__newExpInfo'),
                            b.Identifier('last')
                        ), []
                    ),
                    // __stackForCallTree.last().getContextSensitiveID();
                    b.CallExpression(
                        b.MemberExpression(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__stackForCallTree'),
                                    b.Identifier('last')
                                ),
                                []
                            ),
                            b.Identifier('getContextSensitiveID')
                        ),
                        []
                    )
                ]
            )
        )
    },

    changedGraphStmt() {
        let b = __$__.ASTBuilder;
        return b.ExpressionStatement(
            b.AssignmentExpression(
                b.MemberExpression(
                    b.MemberExpression(
                        b.Identifier('__$__'),
                        b.Identifier('Context')
                    ),
                    b.Identifier('ChangedGraph')
                ),
                '=',
                b.Literal(true)
            )
        )
    }
};
