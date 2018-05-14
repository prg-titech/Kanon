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
        DoWhileStatement: true,
        WhileStatement: true,
        ForStatement: true,
        ForInStatement: true,
        FunctionExpression: true,
        FunctionDeclaration: true,
        ArrowFunctionExpression: true
    }
};

/**
 * before: new Hoge(arg1, ...)
 *
 * after:  (() => {
 *             var __newObjectId = '';
 *             __stackForSensitiveContext.forEach(frame => {
 *                 if (frame.type === 'Loop') {
 *                     __newObjectId += frame.label + '-' + frame.count + '-';
 *                 } else if (frame.type === 'FunctionCall' || frame.type === 'newExp') {
 *                     __newObjectId += frame.label + '-';
 *                 }
 *             });
 *             __newObjectId += 'unique ID';
 *
 *             if (__newLabelCounter[__newObjectId]) __newLabelCounter[__newObjectId]++;
 *             else __newLabelCounter[__newObjectId] = 1;
 *
 *             __newObjectId += '-' + newLabelCounter[__newObjectId];
 *             __newObjectIds.push(__newObjectId);
 *             __newExpInfo.push({loopLabel , loopCount, pos}});
 *             __stackForSensitiveContext.push({
 *                 type: 'newExp',
 *                 label: 'unique Id'
 *             });
 *             var __temp = new Hoge(arg1, ...);
 *             __stackForSensitiveContext.pop();
 *             __newExpInfo.pop();
 *             if (!__temp.__id) {
 *                 Object.setProperty(__temp, '__id', __newObjectIds.pop());
 *                 __objs.push(__temp);
 *             }
 *             return __temp;
 *         })()
 *
 * Array Expression is also the same
 */
__$__.ASTTransforms.CollectObjects = function() {
    let b = __$__.ASTBuilder;
    return {
        leave(node, path) {
            if (node.loc && ('NewExpression' === node.type || 'ArrayExpression' === node.type || 'ObjectExpression' === node.type)) {
                const c = {};
                if (node.type === 'NewExpression') {
                    c.counterName = '__newLabelCounter';
                    c.LabelPos = __$__.Context.LabelPos.New;
                    c.label_header = 'new';
                    c.this_node = b.NewExpression(
                        node.callee,
                        node.arguments
                    );
                    c.newExpInfo = b.ObjectExpression([
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
                                    b.Literal(node.loc.end.line)
                                ),
                                b.Property(
                                    b.Identifier('column'),
                                    b.Literal(node.loc.end.column)
                                )
                            ])
                        )
                    ]);
                } else if (node.type === 'ArrayExpression') {
                    c.counterName = '__arrLabelCounter';
                    c.LabelPos = __$__.Context.LabelPos.Arr;
                    c.label_header = 'arr';
                    c.this_node = b.ArrayExpression(
                        node.elements
                    );
                    c.newExpInfo = b.Literal(false);
                } else {
                    c.counterName = '__objLabelCounter';
                    c.LabelPos = __$__.Context.LabelPos.Obj;
                    c.label_header = 'obj';
                    c.this_node = b.ObjectExpression(
                        node.properties
                    );
                    c.newExpInfo = b.Literal(false);
                }


                // In this part, register the position of this NewExpression.
                // If already registered, use the Label
                let label;
                Object.keys(c.LabelPos).forEach(labelName => {
                    let pos = c.LabelPos[labelName];
                    if (pos.start.line === node.loc.start.line &&
                            pos.start.column === node.loc.start.column &&
                            pos.end.line === node.loc.end.line &&
                            pos.end.column === node.loc.end.column) {
                        label = labelName;
                        pos.useLabel = true;
                        pos.closed = true;
                    }
                });
                // the case of not registered yet.
                if (!label) {
                    let i = 1;
                    while (!label) {
                        let newLabel = c.label_header + i;
                        if (!c.LabelPos[newLabel])
                            label = newLabel;
                        i++;
                    }
                    c.LabelPos[label] = node.loc;
                    c.LabelPos[label].useLabel = true;
                    c.LabelPos[label].closed = true;
                }

                return b.CallExpression(
                    b.ArrowFunctionExpression(
                        [],
                        b.BlockStatement([
                            b.VariableDeclaration([
                                b.VariableDeclarator(
                                    b.Identifier('__newObjectId'),
                                    b.Literal('')
                                )
                            ], 'var'),

                            // __stackForSensitiveContext.forEach(frame => {
                            //     if (frame.type === 'Loop') {
                            //         __newObjectId += frame.label + '-' + frame.count + '-';
                            //     } else if (frame.type === 'FunctionCall' || frame.type === 'newExp') {
                            //         __newObjectId += frame.label + '-';
                            //     }
                            // });
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__stackForSensitiveContext'),
                                        b.Identifier('forEach')
                                    ),
                                    [b.ArrowFunctionExpression(
                                        [b.Identifier('frame')],
                                        b.BlockStatement(
                                            [b.IfStatement(
                                                b.BinaryExpression(
                                                    b.MemberExpression(
                                                        b.Identifier('frame'),
                                                        b.Identifier('type')
                                                    ),
                                                    '===',
                                                    b.Literal('Loop')
                                                ),
                                                b.ExpressionStatement(
                                                    b.AssignmentExpression(
                                                        b.Identifier('__newObjectId'),
                                                        '+=',
                                                        b.BinaryExpression(
                                                            b.BinaryExpression(
                                                                b.BinaryExpression(
                                                                    b.MemberExpression(
                                                                        b.Identifier('frame'),
                                                                        b.Identifier('label')
                                                                    ),
                                                                    '+',
                                                                    b.Literal('-')
                                                                ),
                                                                '+',
                                                                b.MemberExpression(
                                                                    b.Identifier('frame'),
                                                                    b.Identifier('count')
                                                                )
                                                            ),
                                                            '+',
                                                            b.Literal('-')
                                                        )
                                                    )
                                                ),
                                                b.IfStatement(
                                                    b.BinaryExpression(
                                                        b.BinaryExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('frame'),
                                                                b.Identifier('type')
                                                            ),
                                                            '===',
                                                            b.Literal('FunctionCall')
                                                        ),
                                                        '||',
                                                        b.BinaryExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('frame'),
                                                                b.Identifier('type')
                                                            ),
                                                            '===',
                                                            b.Literal('newExp')
                                                        )
                                                    ),
                                                    b.ExpressionStatement(
                                                        b.AssignmentExpression(
                                                            b.Identifier('__newObjectId'),
                                                            '+=',
                                                            b.BinaryExpression(
                                                                b.MemberExpression(
                                                                    b.Identifier('frame'),
                                                                    b.Identifier('label')
                                                                ),
                                                                '+',
                                                                b.Literal('-')
                                                            )
                                                        )
                                                    )
                                                )
                                            )]
                                        )
                                    )]
                                )
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.Identifier('__newObjectId'),
                                    "+=",
                                    b.Literal(label)
                                )
                            ),
                            b.IfStatement(
                                b.MemberExpression(
                                    b.Identifier(c.counterName),
                                    b.Identifier('__newObjectId'),
                                    true
                                ),
                                b.ExpressionStatement(
                                    b.UpdateExpression(
                                        b.MemberExpression(
                                            b.Identifier(c.counterName),
                                            b.Identifier('__newObjectId'),
                                            true
                                        ),
                                        "++",
                                        false
                                    )
                                ),
                                b.ExpressionStatement(
                                    b.AssignmentExpression(
                                        b.MemberExpression(
                                            b.Identifier(c.counterName),
                                            b.Identifier('__newObjectId'),
                                            true
                                        ),
                                        "=",
                                        b.Literal(1)
                                    )
                                )
                            ),
                            b.ExpressionStatement(
                                b.Identifier('__newObjectId += "-" + ' + c.counterName +'[__newObjectId]')
                            ),
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
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__newExpInfo'),
                                        b.Identifier('push')
                                    ), [
                                        c.newExpInfo
                                    ]
                                )
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__stackForSensitiveContext'),
                                        b.Identifier("push")
                                    ),
                                    [b.ObjectExpression([
                                        b.Property(
                                            b.Identifier('type'),
                                            b.Literal('newExp')
                                        ),
                                        b.Property(
                                            b.Identifier('label'),
                                            b.Literal(label)
                                        )
                                    ])]
                                )
                            ),
                            b.VariableDeclaration([
                                b.VariableDeclarator(
                                    b.Identifier('__temp'),
                                    c.this_node
                                )
                            ], 'var'),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__stackForSensitiveContext'),
                                        b.Identifier('pop')
                                    ), []
                                )
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__newExpInfo'),
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
                                    )
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
            }
        }
    };
};


/**
 * To give CallExpression a unique Label,
 * we convert CallExpression to the following example program.
 *
 * before:
 * func(arg1, arg2, ...)
 *
 * after:
 * (() => {
 *     if (__call_count['unique Label']) __call_count['unique Label']++;
 *     else __call_count['unique Label'] = 1;
 *
 *     // __stackForSensitiveContext.reduce((loopCounter, frame) => loopCounter[frame.label], __loopCountForSensitiveContext)['unique Label'] = {};
 *     __stackForSensitiveContext.push({
 *         type: 'FunctionCall',
 *         label: 'unique Label'
 *     });
 *     __newExpInfo.push(false);
 *     var __temp = func(arg1, arg2, ...);
 *     __newExpInfo.pop();
 *     __stackForSensitiveContext.pop();
 *     return __temp;
 * })()
 */
__$__.ASTTransforms.CallExpressionToFunction = function() {
    let b = __$__.ASTBuilder;
    return {
        leave(node, path) {
            if (node.type === "CallExpression" && node.loc) {
                const counterName = "__call_count";

                // In this part, register the position of this CallExpression.
                // If already registered, use the Label
                let label;
                Object.keys(__$__.Context.LabelPos.Call).forEach(callLabel => {
                    let pos = __$__.Context.LabelPos.Call[callLabel];
                    if (pos.start.line === node.loc.start.line &&
                            pos.start.column === node.loc.start.column &&
                            pos.end.line === node.loc.end.line &&
                            pos.end.column === node.loc.end.column) {
                        label = callLabel;
                        pos.useLabel = true;
                        pos.closed = true;
                    }
                });
                // the case of not registered yet.
                if (!label) {
                    let i = 1;
                    while (!label) {
                        let callLabel = 'call' + i;
                        if (!__$__.Context.LabelPos.Call[callLabel]) label = callLabel;
                        i++;
                    }
                    __$__.Context.LabelPos.Call[label] = node.loc;
                    __$__.Context.LabelPos.Call[label].useLabel = true;
                    __$__.Context.LabelPos.Call[label].closed = true;
                }

                return b.CallExpression(
                    b.ArrowFunctionExpression(
                        [],
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
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__stackForSensitiveContext'),
                                        b.Identifier("push")
                                    ),
                                    [b.ObjectExpression([
                                        b.Property(
                                            b.Identifier('type'),
                                            b.Literal('FunctionCall')
                                        ),
                                        b.Property(
                                            b.Identifier('label'),
                                            b.Literal(label)
                                        )
                                    ])]
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
                            b.VariableDeclaration([
                                b.VariableDeclarator(
                                    b.Identifier('__temp'),
                                    b.CallExpression(
                                        node.callee,
                                        node.arguments
                                    )
                                )],
                                'var'
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__newExpInfo'),
                                        b.Identifier("pop")
                                    ), []
                                )
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__stackForSensitiveContext'),
                                        b.Identifier("pop")
                                    ),
                                    []
                                )
                            ),
                            b.ReturnStatement(
                                b.Identifier('__temp')
                            )
                        ])
                    ),
                    []
                );
            }
        }
    };
};

/**
 * Add some code in the head and the tail of user code.
 *
 * let  __loopLabels = ['noLoop'],
 *     __loopCount = 1,
 *     __newLabelCounter = {},
 *     __arrLabelCounter = {},
 *     __objLabelCounter = {},
 *     __time_counter = 0,
 *     __time_counter_stack = [],
 *     __call_count = {},
 *     __stackForSensitiveContext = [],
 *     __newObjectIds = [],
 *     __newExpInfo = [];
 * __objs = [];
 * __$__.Context.StartEndInLoop['noLoop'] = [{start: 0}];
 * ...
 * __$__.Context.StartEndInLoop['noLoop'][0].end = __time_counter-1;
 */
__$__.ASTTransforms.AddSomeCodeInHeadAndTail = function() {
    let b = __$__.ASTBuilder;
    return {
        leave(node, path) {
            if (node.type === 'Program') {
                // __$__.Context.StartEndInLoop['noLoop'] = [{start: 0}];
                node.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop["noLoop"] = [{start: 0}]')
                    )
                );

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
                            b.ArrayExpression([b.Literal('noLoop')])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__loopCount'),
                            b.Literal(1)
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__newLabelCounter'),
                            b.ObjectExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__arrLabelCounter'),
                            b.ObjectExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__objLabelCounter'),
                            b.ObjectExpression([])
                        ),
                        // b.VariableDeclarator(
                        //     b.Identifier('__objs'),
                        //     b.ArrayExpression([])
                        // ),
                        b.VariableDeclarator(
                            b.Identifier('__time_counter'),
                            b.Literal(0)
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__time_counter_stack'),
                            b.ArrayExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__call_count'),
                            b.ObjectExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__stackForSensitiveContext'),
                            b.ArrayExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__newObjectIds'),
                            b.ArrayExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__newExpInfo'),
                            b.ArrayExpression([])
                        )
                    ], 'let')
                );

                // __$__.Context.StartEndInLoop['noLoop'][0].end = __time_counter;
                node.body.push(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop["noLoop"][0].end = __time_counter - 1')
                    )
                );
            }
        }
    };
};


/**
 * try {
 *     body;
 * } catch (__e__) {
 *     if (__e__ === 'Infinite Loop')
 *         __loopLabels.pop();
 *     while (__time_counter_stack.length) {
 *         __time_counter_stack.last().end = __time_counter - 1;
 *         if (!__$__.Context.StartEndInLoop[__loopLabels.last()])
 *             __$__.Context.StartEndInLoop[__loopLabels.last()] = [];
 *         __time_counter_stack.pop();
 *         __loopLabels.pop();
 *     }
 *     __$__.Context.StartEndInLoop['noLoop'][0].end = __time_counter - 1;
 *     throw __e__;
 * }
 */
__$__.ASTTransforms.BlockedProgram = function() {
    let b = __$__.ASTBuilder;
    return {
        leave(node, path) {
            if (node.type === 'Program') {
                node.body = [
                    b.TryStatement(
                        b.BlockStatement(node.body),
                        b.CatchClause(
                            b.Identifier('__e__'),
                            b.BlockStatement([
                                b.IfStatement(
                                    b.BinaryExpression(
                                        b.Identifier('__e__'),
                                        '===',
                                        b.Literal('Infinite Loop')
                                    ),
                                    b.ExpressionStatement(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__loopLabels'),
                                                b.Identifier('pop')
                                            ), []
                                        )
                                    )
                                ),
                                b.WhileStatement(
                                    b.MemberExpression(
                                        b.Identifier('__time_counter_stack'),
                                        b.Identifier('length')
                                    ),
                                    b.BlockStatement([
                                        b.ExpressionStatement(
                                            b.AssignmentExpression(
                                                b.MemberExpression(
                                                    b.CallExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('__time_counter_stack'),
                                                            b.Identifier('last')
                                                        ),
                                                        []
                                                    ),
                                                    b.Identifier('end')
                                                ),
                                                '=',
                                                b.BinaryExpression(
                                                    b.Identifier('__time_counter'),
                                                    '-',
                                                    b.Literal(1)
                                                )
                                            )
                                        ),
                                        b.IfStatement(
                                            b.UnaryExpression(
                                                '!',
                                                b.MemberExpression(
                                                    b.MemberExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('__$__'),
                                                            b.Identifier('Context')
                                                        ),
                                                        b.Identifier('StartEndInLoop')
                                                    ),
                                                    b.CallExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('__loopLabels'),
                                                            b.Identifier('last')
                                                        ),
                                                        []
                                                    ),
                                                    true
                                                ),
                                                true
                                            ),
                                            b.ExpressionStatement(
                                                b.AssignmentExpression(
                                                    b.MemberExpression(
                                                        b.MemberExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__$__'),
                                                                b.Identifier('Context')
                                                            ),
                                                            b.Identifier('StartEndInLoop')
                                                        ),
                                                        b.CallExpression(
                                                            b.MemberExpression(
                                                                b.Identifier('__loopLabels'),
                                                                b.Identifier('last')
                                                            ),
                                                            []
                                                        ),
                                                        true
                                                    ),
                                                    '=',
                                                    b.ArrayExpression([])
                                                )
                                            )
                                        ),
                                        b.ExpressionStatement(
                                            b.CallExpression(
                                                b.MemberExpression(
                                                    b.Identifier('__time_counter_stack'),
                                                    b.Identifier('pop')
                                                ),
                                                []
                                            )
                                        ),
                                        b.ExpressionStatement(
                                            b.CallExpression(
                                                b.MemberExpression(
                                                    b.Identifier('__loopLabels'),
                                                    b.Identifier('pop')
                                                ),
                                                []
                                            )
                                        )
                                    ])
                                ),
                                b.ExpressionStatement(
                                    b.AssignmentExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.MemberExpression(
                                                    b.MemberExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('__$__'),
                                                            b.Identifier('Context')
                                                        ),
                                                        b.Identifier('StartEndInLoop')
                                                    ),
                                                    b.Literal('noLoop'),
                                                    true
                                                ),
                                                b.Literal(0),
                                                true
                                            ),
                                            b.Identifier('end')
                                        ),
                                        '=',
                                        b.BinaryExpression(
                                            b.Identifier('__time_counter'),
                                            '-',
                                            b.Literal(1)
                                        )
                                    )
                                ),
                                b.ThrowStatement(
                                    b.Identifier('__e__')
                                )
                            ])
                        )
                    )
                ];
            }
        }
    };
};



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
 * This is code conversion example in WhileStatement
 * before:
 *   while(condition) {
 *     ...
 *   }
 *
 *
 * after:
 *   {
 *       let __loopLabel = 'loop' + label;
 *       __loopLabels.push(__loopLabel);
 *       if (__$__.Context.LoopContext[__loopLabel] === undefined)
 *           __$__.Context.LoopContext[__loopLabel] = 1;
 *       __stackForSensitiveContext.push({
 *           type: 'Loop',
 *           label: __loopLabel,
 *           count: 0
 *       });
 *       if (!__$__.Context.SensitiveContextForLoop[__loopLabel])
 *           __$__.Context.SensitiveContextForLoop[__loopLabel] = {};
 *       while(condition) {
 *           let __loopCount = ++__loopCounter[__loopLabel] || (__loopCounter[__loopLabel] = 1);
 *           if (__loopCount > 100){
 *               __$__.Context.InfLoop = __loopLabel;
 *               throw 'Infinite Loop';
 *           }
 *           let __start = __time_counter;
 *           let __startEndObject__ = {start: __time_counter};
 *           __time_counter_stack.push(__startEndObject__);
 *
 *           __stackForSensitiveContext.last().count++;
 *           __$__.Context.SensitiveContextForLoop[__loopLabel][__loopCount] = __stackForSensitiveContext.reduce((context, frame) => {
 *               if (frame.type === 'Loop') {
 *                   return context + frame.label + '-' + frame.count + '-';
 *               } else if (frame.type === 'FunctionCall' || frame.type === 'newExp') {
 *                   return context + frame.label + '-';
 *               } else {
 *                   return context;
 *               }
 *           }, '');
 *
 *           if (!__$__.Context.StartEndInLoop[__loopLabel])
 *               __$__.Context.StartEndInLoop[__loopLabel] = [];
 *           __$__.Context.StartEndInLoop[__loopLabel].push(__startEndObject__);
 *
 *           // there is following IfStatement in the case only of functions
 *           if (__newExpInfo.last()) {
 *               Object.setProperty(this, '__id', __newObjectIds.pop());
 *               __objs.push(this);
 *           }
 *
 *           ...
 *
 *         __startEndObject__.end = __time_counter-1;
 *         __time_counter_stack.pop();
 *       }
 *       __stackForSensitiveContext.pop();
 *       __loopLabels.pop();
 *   }
 *
 * __loopLabel is unique label
 *
 * // TODO: use try-catch-finally to manage loops
 * after:
 *     {
 *         let __loopLabel = 'loop' + label;
 *         __loopLabels.push(__loopLabel);
 *         if (__$__.Context.LoopContext[__loopLabel] === undefined)
 *             __$__.Context.LoopContext[__loopLabel] = 1;
 *         __stackForSensitiveContext.push({
 *             type: 'Loop',
 *             label: __loopLabel,
 *             count: 0
 *         });
 *         if (!__$__.Context.SensitiveContextForLoop[__loopLabel])
 *             __$__.Context.SensitiveContextForLoop[__loopLabel] = {};
 *
 *         try {
 *             while (condition) {
 *                 let __loopCount = ++__loopCounter[__loopLabel] || (__loopCounter[__loopLabel] = 1);
 *                 if (__loopCount > 100){
 *                     __$__.Context.InfLoop = __loopLabel;
 *                     throw 'Infinite Loop';
 *                 }
 *                 let __start = __time_counter;
 *                 let __startEndObject__ = {start: __time_counter};
 *                 __time_counter_stack.push(__startEndObject__);
 *
 *                 __stackForSensitiveContext.last().count++;
 *                 __$__.Context.SensitiveContextForLoop[__loopLabel][__loopCount] = __stackForSensitiveContext.reduce((context, frame) => {
 *                     if (frame.type === 'Loop') {
 *                         return context + frame.label + '-' + frame.count + '-';
 *                     } else if (frame.type === 'FunctionCall' || frame.type === 'newExp') {
 *                         return context + frame.label + '-';
 *                     } else {
 *                         return context;
 *                     }
 *                 }, '');
 *
 *                 if (!__$__.Context.StartEndInLoop[__loopLabel])
 *                     __$__.Context.StartEndInLoop[__loopLabel] = [];
 *                 __$__.Context.StartEndInLoop[__loopLabel].push(__startEndObject__);
 *
 *                 // there is following IfStatement in the case only of functions
 *                 if (__newExpInfo.last()) {
 *                 Object.setProperty(this, '__id', __newObjectIds.pop());
 *                 __objs.push(this);
 *
 *                 try {
 *                     ....
 *                 } catch (e) {
 *                     throw e;
 *                 } finally {
 *                     __startEndObject__.end = __time_counter-1;
 *                     __time_counter_stack.pop();
 *                 }
 *             }
 *         } catch (e) {
 *             throw e;
 *         } finally {
 *             __stackForSensitiveContext.pop();
 *             __loopLabels.pop();
 *         }
 *     }
 */
__$__.ASTTransforms.Context = function (checkInfLoop) {
    let b = __$__.ASTBuilder;
    let id = 'context';
    const loopLabels = "__loopLabels",
          loopCount = "__loopCount",
          loopCounter = "__$__.Context.__loopCounter",
          loopContext = "LoopContext";
    let labelCount = 0;
    return {
        enter(node, path) {
            if (__$__.ASTTransforms.Loop[node.type] && node.loc) {


                // If already registered, use the label
                let label;
                Object.keys(__$__.Context.LabelPos.Loop).forEach(loopLabel => {
                    let pos = __$__.Context.LabelPos.Loop[loopLabel];
                    if (pos.start.line === node.loc.start.line &&
                            pos.start.column === node.loc.start.column &&
                            pos.end.line === node.loc.end.line &&
                            pos.end.column === node.loc.end.column) {
                        label = loopLabel;
                        pos.useLabel = true;
                        if (checkInfLoop)
                            pos.closed = node.body.type === 'BlockStatement';
                    }
                });
                // the case that the Label have not been registered yet.
                if (!label) {
                    let i = 1;
                    let loopLabel;
                    while (!label) {
                        loopLabel = node.type + i;
                        if (!__$__.Context.LabelPos.Loop[loopLabel])
                            break;
                        i++;
                    }
                    label = loopLabel;
                    if (path[path.length - 2].type === 'LabeledStatement')
                        label += '-' + path[path.length - 2].label.name;
                    __$__.Context.LabelPos.Loop[label] = node.loc;
                    __$__.Context.LabelPos.Loop[label].useLabel = true;
                    if (checkInfLoop)
                        __$__.Context.LabelPos.Loop[label].closed = node.body.type === 'BlockStatement';
                }

                if (node.body.type !== "BlockStatement") {
                    if (node.type === 'ArrowFunctionExpression') {
                        let retStmt = b.ReturnStatement(node.body);
                        retStmt.loc = node.body.loc;
                        node.body = b.BlockStatement([retStmt]);
                        node.expression = false;
                    } else
                        node.body = b.BlockStatement([node.body]);
                }

                __$__.Context.ParentAndChildrenLoop[label] = {parent: __$__.Context.ParentAndChildrenLoopStack.last(), children: []};
                __$__.Context.ParentAndChildrenLoop[__$__.Context.ParentAndChildrenLoopStack.last()].children.push(label);
                __$__.Context.ParentAndChildrenLoopStack.push(label);

                return [id, {label: label, checkInfLoop: checkInfLoop}];
            }
        },
        leave(node, path, enterData) {
            if (__$__.ASTTransforms.Loop[node.type] && node.loc) {
                let parent = path[path.length - 2];
                let data = enterData[id],
                    label = data.label,
                    checkInfLoop = data.checkInfLoop,
                    notFunction = __$__.ASTTransforms.loopTypes[node.type];

                __$__.Context.ParentAndChildrenLoopStack.pop();


                // __startEndObject__.end = __time_counter-1;
                node.body.body.push(
                    b.ExpressionStatement(
                        b.Identifier('__startEndObject__.end = __time_counter-1')
                    )
                );

                // __time_counter_stack.pop();
                node.body.body.push(
                    b.ExpressionStatement(
                        b.Identifier('__time_counter_stack.pop()')
                    )
                );

                // __loopLabels.pop();
                if (!notFunction)
                    node.body.body.push(
                        b.ExpressionStatement(
                            b.Identifier('__loopLabels.pop()')
                        )
                    );

                /*
                 * // there if following IfStatement only in functions
                 * if (__newExpInfo.last()) {
                 *   Object.setProperty(this, '__id', __newObjectIds.pop());
                 *   __objs.push(this);
                 * }
                 */
                if (!checkInfLoop && __$__.ASTTransforms.funcTypes[node.type])
                    node.body.body.unshift(
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

                // __$__.Context.StartEndInLoop[__loopLabel].push(__startEndObject__);
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop[__loopLabel].push(__startEndObject__)')
                    )
                );

                // if (!__$__.Context.StartEndInLoop[__loopLabel]) __$__.Context.StartEndInLoop[__loopLabel] = [];
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('if (!__$__.Context.StartEndInLoop[__loopLabel]) __$__.Context.StartEndInLoop[__loopLabel] = []')
                    )
                );

                // __$__.Context.SensitiveContextForLoop[__loopLabel][__loopCount] = __stackForSensitiveContext.reduce((context, frame) => {
                //     if (frame.type === 'Loop') {
                //         return context + frame.label + '-' + frame.count + '-';
                //     } else if (frame.type === 'FunctionCall' || frame.type === 'newExp') {
                //         return context + frame.label + '-';
                //     } else {
                //         return context;
                //     }
                // }, '');
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.AssignmentExpression(
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('SensitiveContextForLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                b.Identifier('__loopCount'),
                                true
                            ),
                            '=',
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__stackForSensitiveContext'),
                                    b.Identifier('reduce')
                                ),
                                [b.ArrowFunctionExpression(
                                    [
                                        b.Identifier('context'),
                                        b.Identifier('frame')
                                    ],
                                    b.BlockStatement([
                                        b.IfStatement(
                                            b.BinaryExpression(
                                                b.MemberExpression(
                                                    b.Identifier('frame'),
                                                    b.Identifier('type')
                                                ),
                                                '===',
                                                b.Literal('Loop')
                                            ),
                                            b.ReturnStatement(
                                                b.BinaryExpression(
                                                    b.BinaryExpression(
                                                        b.BinaryExpression(
                                                            b.BinaryExpression(
                                                                b.Identifier('context'),
                                                                '+',
                                                                b.MemberExpression(
                                                                    b.Identifier('frame'),
                                                                    b.Identifier('label')
                                                                )
                                                            ),
                                                            '+',
                                                            b.Literal('-')
                                                        ),
                                                        '+',
                                                        b.MemberExpression(
                                                            b.Identifier('frame'),
                                                            b.Identifier('count')
                                                        )
                                                    ),
                                                    '+',
                                                    b.Literal('-')
                                                )
                                            ),
                                            b.IfStatement(
                                                b.BinaryExpression(
                                                    b.BinaryExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('frame'),
                                                            b.Identifier('type')
                                                        ),
                                                        '===',
                                                        b.Literal('FunctionCall')
                                                    ),
                                                    '||',
                                                    b.BinaryExpression(
                                                        b.MemberExpression(
                                                            b.Identifier('frame'),
                                                            b.Identifier('type')
                                                        ),
                                                        '===',
                                                        b.Literal('newExp')
                                                    )
                                                ),
                                                b.ReturnStatement(
                                                    b.BinaryExpression(
                                                        b.BinaryExpression(
                                                            b.Identifier('context'),
                                                            '+',
                                                            b.MemberExpression(
                                                                b.Identifier('frame'),
                                                                b.Identifier('label')
                                                            )
                                                        ),
                                                        '+',
                                                        b.Literal('-')
                                                    )
                                                ),
                                                b.ReturnStatement(
                                                    b.Identifier('context')
                                                )
                                            )
                                        )
                                    ])
                                ), b.Literal('')]
                            )
                        )
                    )
                );


                if (notFunction) {
                    // __stackForSensitiveContext.last().count++;
                    node.body.body.unshift(
                        b.ExpressionStatement(
                            b.UnaryExpression(
                                '++',
                                b.MemberExpression(
                                    b.CallExpression(
                                        b.MemberExpression(
                                            b.Identifier('__stackForSensitiveContext'),
                                            b.Identifier('last')
                                        ),
                                        []
                                    ),
                                    b.Identifier('count')
                                ),
                                false
                            )
                        )
                    );
                }

                // __time_counter_stack.push(__startEndObject__);
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('__time_counter_stack.push(__startEndObject__)')
                    )
                );

                // let __startEndObject__ = {start: __time_counter};
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('let __startEndObject__ = {start: __time_counter}')
                    )
                );

                // let __start = __time_counter;
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('let __start = __time_counter')
                    )
                );

                /**
                 *  if (__loopCount > 100) {
                 *      __$__.Context.InfLoop = __loopLabel;
                 *      throw 'Infinite Loop';
                 *  }
                 */
                node.body.body.unshift(
                    b.IfStatement(
                        b.BinaryExpression(
                            b.Identifier(loopCount),
                            ">",
                            b.Literal(100)
                        ),
                        b.BlockStatement([
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.Identifier('__$__.Context.InfLoop'),
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

                // let __loopCount = ++__$__.Context.__loopCounter[__loopLabel] || (__$__.Context.__loopCounter[__loopLabel] = 1);
                node.body.body.unshift(
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

                if (!notFunction) {
                    // if (!__$__.Context.SensitiveContextForLoop[__loopLabel])
                    //     __$__.Context.SensitiveContextForLoop[__loopLabel] = {};
                    node.body.body.unshift(
                        b.IfStatement(
                            b.UnaryExpression(
                                '!',
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('SensitiveContextForLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                true
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.Identifier('__$__'),
                                                b.Identifier('Context')
                                            ),
                                            b.Identifier('SensitiveContextForLoop')
                                        ),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    '=',
                                    b.ObjectExpression([])
                                )
                            )
                        )
                    );

                    // if (__$__.Context.LoopContext[__loopLabel] === undefined)
                    //     __$__.Context.LoopContext[__loopLabel] = 1;
                    node.body.body.unshift(
                        b.ExpressionStatement(
                            b.Identifier('if (__$__.Context.LoopContext[__loopLabel] === undefined) __$__.Context.LoopContext[__loopLabel] = 1')
                        )
                    );

                    // __loopLabels.push(__loopLabel);
                    node.body.body.unshift(
                        b.ExpressionStatement(
                            b.Identifier('__loopLabels.push(__loopLabel)')
                        )
                    );

                    // let __loopLabel = 'loop' + label;
                    node.body.body.unshift(
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__loopLabel'),
                                b.Literal(label)
                            )
                        ], 'let')
                    );

                } else {
                    let labelCounter;
                    if (parent.type === 'LabeledStatement') {
                        let label = parent.label;
                        parent.label = b.Identifier('______' + ++labelCount);
                        labelCounter = b.LabeledStatement(label, Object.assign({}, node));
                    } else {
                        labelCounter = Object.assign({}, node);
                    }
                    return b.BlockStatement([
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__loopLabel'),
                                b.Literal(label)
                            )
                        ], 'let'),
                        b.ExpressionStatement(
                            b.Identifier('__loopLabels.push(__loopLabel)')
                        ),
                        b.ExpressionStatement(
                            b.Identifier('if (__$__.Context.LoopContext[__loopLabel] === undefined) __$__.Context.LoopContext[__loopLabel] = 1')
                        ),
                        // if (!__$__.Context.SensitiveContextForLoop[__loopLabel])
                        //     __$__.Context.SensitiveContextForLoop[__loopLabel] = {};
                        b.IfStatement(
                            b.UnaryExpression(
                                '!',
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('SensitiveContextForLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                true
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.Identifier('__$__'),
                                                b.Identifier('Context')
                                            ),
                                            b.Identifier('SensitiveContextForLoop')
                                        ),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    '=',
                                    b.ObjectExpression([])
                                )
                            )
                        ),
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__stackForSensitiveContext'),
                                    b.Identifier('push')
                                ),
                                [b.ObjectExpression([
                                    b.Property(
                                        b.Identifier('type'),
                                        b.Literal('Loop')
                                    ),
                                    b.Property(
                                        b.Identifier('label'),
                                        b.Identifier('__loopLabel')
                                    ),
                                    b.Property(
                                        b.Identifier('count'),
                                        b.Literal(0)
                                    )
                                ])]
                            )
                        ),
                        labelCounter,
                        b.ExpressionStatement(
                            b.Identifier('__stackForSensitiveContext.pop()')
                        ),
                        b.ExpressionStatement(
                            b.Identifier('__loopLabels.pop()')
                        )
                    ]);
                }
            }
        }
    };
};


/**
 * insert check point before and after each statement(VariableDeclaration is exception).
 *
 * if statement type is 'return', 'break', 'continue', 
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
 * '__$__.Context.ChechPoint(__objs, __loopLabel, __loopCount, __time_counter, {})'
 * and, the last of arguments is object which means visualization of variables.
 * the argument is {v: typeof v === 'string' ? eval(v) : undefined} if variable 'v' should be visualized.
 *
 */
__$__.ASTTransforms.InsertCheckPoint = function() {
    let b = __$__.ASTBuilder;
    let id = 'InsertCheckPoint';
    __$__.ASTTransforms.checkPoint_idCounter = 1;
    let env = new __$__.Probe.StackEnv();

    return {
        enter(node, path) {
            if (__$__.ASTTransforms.funcTypes[node.type]) {
                env.push(new __$__.Probe.FunctionFlame());

                if (!node.expression) {
                    node.body.body.forEach(s => {
                        if (s.type === 'VariableDeclaration' && s.kind === 'var') {
                            s.declarations.forEach(declarator => {
                                env.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                            });
                        }
                    });
                }
            }

            if (node.type === 'BlockStatement') {
                env.push(new __$__.Probe.BlockFlame());

                node.body.forEach(s => {
                    if (s.type === 'VariableDeclaration' && s.kind !== 'var') {
                        s.declarations.forEach(declarator => {
                            env.addVariable(declarator.id.name, s.kind, false);
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
                env.push(new __$__.Probe.BlockFlame());
            }
            return [id, env.Variables()];
        },
        leave(node, path, enterData) {
            let data = enterData[id];

            if (node.type === 'VariableDeclarator') {
                let parent = path[path.length - 2];
                env.addVariable(node.id.name, parent.kind, true);
            }

            if (__$__.ASTTransforms.varScopes[node.type]) {
                env.pop();
            }

            if (node.loc && __$__.ASTTransforms.stmtTypes[node.type] || node.type === 'VariableDeclarator') {
                let start = node.loc.start;
                let end = node.loc.end;
                let parent = path[path.length - 2];
                let variables = env.Variables();

                let checkPoint = function(loc, variables) {
                    __$__.Context.CheckPointTable[__$__.ASTTransforms.checkPoint_idCounter] = loc;
                    return b.ExpressionStatement(
                        b.CallExpression(
                            b.Identifier('__$__.Context.CheckPoint'),
                            [
                                b.Identifier('__objs'),
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__loopLabels'),
                                        b.Identifier('last')
                                    ),
                                    []
                                ),
                                // b.MemberExpression(
                                //     b.Identifier('__loopLabels'),
                                //     b.BinaryExpression(
                                //         b.MemberExpression(
                                //             b.Identifier('__loopLabels'),
                                //             b.Identifier('length')
                                //         ),
                                //         '-',
                                //         b.Literal(1)
                                //     ),
                                //     true
                                // ),
                                b.Identifier('__loopCount'),
                                b.Identifier('__time_counter++'),
                                b.Identifier(__$__.ASTTransforms.checkPoint_idCounter++),
                                b.ObjectExpression(
                                    variables.map(function(val) {
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
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__newExpInfo'),
                                        b.Identifier('last')
                                    ), []
                                )
                            ]
                        )
                    )
                };

                /**
                 * {
                 *    __time_counter_stack.last().end = __time_counter-1;
                 *    __time_counter_stack.pop();
                 *    __stackForSensitiveContext.pop();
                 * }
                 */
                let out_loop = () => b.BlockStatement([
                    b.ExpressionStatement(
                        b.AssignmentExpression(
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.BinaryExpression(
                                        b.MemberExpression(
                                            b.Identifier('__time_counter_stack'),
                                            b.Identifier('length')
                                        ),
                                        '-',
                                        b.Literal(1)
                                    ),
                                    true
                                ),
                                b.Identifier('end')
                            ),
                            '=',
                            b.BinaryExpression(
                                b.Identifier('__time_counter'),
                                '-',
                                b.Literal(1)
                            )
                        )
                    ),
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__time_counter_stack'),
                                b.Identifier('pop')
                            ),
                            []
                        )
                    ),
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__stackForSensitiveContext'),
                                b.Identifier('pop')
                            ),
                            []
                        )
                    )
                ]);

                let changedGraphStmt = () => b.ExpressionStatement(
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
                );
                

                /**
                 * // before
                 * return hoge;
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     let __temp = hoge;
                 *     __time_counter_stack.last().end = __time_counter-1;
                 *     __time_counter_stack.pop();
                 *     while (__loopLabels.pop().indexOf('Statement') >= 0) {
                 *         out_loop
                 *     }
                 *     __$__.Context.ChangedGraph = true;
                 *     return __temp;
                 *     checkpoint;
                 * }
                 */
                if (node.type === 'ReturnStatement') {
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                    return b.BlockStatement([
                        checkPoint(start, data),
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__temp'),
                                node.argument
                            )
                        ], 'let'),
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__time_counter_stack'),
                                        b.BinaryExpression(
                                            b.MemberExpression(
                                                b.Identifier('__time_counter_stack'),
                                                b.Identifier('length')
                                            ),
                                            '-',
                                            b.Literal(1)
                                        ),
                                        true
                                    ),
                                    b.Identifier('end')
                                ),
                                '=',
                                b.BinaryExpression(
                                    b.Identifier('__time_counter'),
                                    '-',
                                    b.Literal(1)
                                )
                            )
                        ),
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.Identifier('pop')
                                ),
                                []
                            )
                        ),
                        b.WhileStatement(
                            b.BinaryExpression(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__loopLabels'),
                                                b.Identifier('pop')
                                            ),
                                            []
                                        ),
                                        b.Identifier('indexOf')
                                    ),
                                    [b.Literal('Statement')]
                                ),
                                '>=',
                                b.Literal(0)
                            ),
                            out_loop()
                        ),
                        changedGraphStmt(),
                        b.ReturnStatement(
                            b.Identifier('__temp')
                        ),
                        checkPoint(end, data)
                    ]);
                /**
                 * // before
                 * continue label; (or break label;)
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     __time_counter_stack.last().end = __time_counter-1;
                 *     __time_counter_stack.pop();
                 *     // while (__loopLabels.pop().indexOf(label) === -1) {
                 *     while (__loopLabels.last().indexOf(label) === -1) {
                 *     // while (__loopLabels.length >= 2 && __loopLabels[__loopLabels.length - 2].indexOf(label) === 0) {
                 *         __loopLabels.pop();
                 *         out_loop
                 *     }
                 *     __$__.Context.ChangedGraph = true;
                 *     continue label; (or break label;)
                 *     checkpoint;
                 * }
                 */
                } else if (('ContinueStatement' === node.type || 'BreakStatement' === node.type) && node.label && node.label.name) {
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                    return b.BlockStatement([
                        checkPoint(start, data),
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__time_counter_stack'),
                                        b.BinaryExpression(
                                            b.MemberExpression(
                                                b.Identifier('__time_counter_stack'),
                                                b.Identifier('length')
                                            ),
                                            '-',
                                            b.Literal(1)
                                        ),
                                        true
                                    ),
                                    b.Identifier('end')
                                ),
                                '=',
                                b.BinaryExpression(
                                    b.Identifier('__time_counter'),
                                    '-',
                                    b.Literal(1)
                                )
                            )
                        ),
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.Identifier('pop')
                                ),
                                []
                            )
                        ),
                        b.WhileStatement(
                            b.BinaryExpression(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.CallExpression(
                                            b.MemberExpression(
                                                b.Identifier('__loopLabels'),
                                                b.Identifier('last')
                                            ),
                                            []
                                        ),
                                        b.Identifier('indexOf')
                                    ),
                                    [b.Literal('-' + node.label.name)]
                                ),
                                '===',
                                b.UnaryExpression(
                                    '-',
                                    b.Literal(1),
                                    true
                                )
                            ),
                            b.BlockStatement([
                                b.ExpressionStatement(
                                    b.CallExpression(
                                        b.MemberExpression(
                                            b.Identifier('__loopLabels'),
                                            b.Identifier('pop')
                                        ),
                                        []
                                    )
                                ),
                                b.ExpressionStatement(
                                    b.AssignmentExpression(
                                        b.MemberExpression(
                                            b.MemberExpression(
                                                b.Identifier('__time_counter_stack'),
                                                b.BinaryExpression(
                                                    b.MemberExpression(
                                                        b.Identifier('__time_counter_stack'),
                                                        b.Identifier('length')
                                                    ),
                                                    '-',
                                                    b.Literal(1)
                                                ),
                                                true
                                            ),
                                            b.Identifier('end')
                                        ),
                                        '=',
                                        b.BinaryExpression(
                                            b.Identifier('__time_counter'),
                                            '-',
                                            b.Literal(1)
                                        )
                                    )
                                ),
                                b.ExpressionStatement(
                                    b.CallExpression(
                                        b.MemberExpression(
                                            b.Identifier('__time_counter_stack'),
                                            b.Identifier('pop')
                                        ),
                                        []
                                    )
                                ),
                                b.ExpressionStatement(
                                    b.CallExpression(
                                        b.MemberExpression(
                                            b.Identifier('__stackForSensitiveContext'),
                                            b.Identifier('pop')
                                        ),
                                        []
                                    )
                                )
                            ])
                        ),
                        changedGraphStmt(),
                        Object.assign({}, node),
                        checkPoint(end, variables)
                    ]);
                /**
                 * // before
                 * continue; (or break;)
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     __time_counter_stack.last().end = __time_counter-1;
                 *     __time_counter_stack.pop();
                 *     __$__.Context.ChangedGraph = true;
                 *     continue; (or break;)
                 *     checkpoint;
                 * }
                 */
                } else if ('ContinueStatement' === node.type || 'BreakStatement' === node.type) {
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                    return b.BlockStatement([
                        checkPoint(start, data),
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__time_counter_stack'),
                                        b.BinaryExpression(
                                            b.MemberExpression(
                                                b.Identifier('__time_counter_stack'),
                                                b.Identifier('length')
                                            ),
                                            '-',
                                            b.Literal(1)
                                        ),
                                        true
                                    ),
                                    b.Identifier('end')
                                ),
                                '=',
                                b.BinaryExpression(
                                    b.Identifier('__time_counter'),
                                    '-',
                                    b.Literal(1)
                                )
                            )
                        ),
                        b.ExpressionStatement(
                            b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.Identifier('pop')
                                ),
                                []
                            )
                        ),
                        changedGraphStmt(),
                        Object.assign({}, node),
                        checkPoint(end, variables)
                    ]);
                } else if (node.type === 'VariableDeclaration' && node.kind !== 'var' && ('ForStatement' !== parent.type && 'ForInStatement' !== parent.type || parent.init !== node && parent.left !== node)
                           || node.type === 'ClassDeclaration') {
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                    __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                    return [
                        checkPoint(start, data),
                        Object.assign({}, node),
                        changedGraphStmt(),
                        checkPoint(end, variables)
                    ];
                } else if (node.type === 'VariableDeclarator') {
                    if (node.init) {
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                        __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                        let expression = Object.assign({}, node.init);
                        let name = node.id.name;

                        node.init = b.CallExpression(
                            b.ArrowFunctionExpression(
                                [],
                                b.BlockStatement([
                                    checkPoint(node.init.loc.start, data),
                                    b.VariableDeclaration([
                                        b.VariableDeclarator(
                                            b.Identifier(name),
                                            expression
                                        )
                                    ], 'var'),
                                    changedGraphStmt(),
                                    checkPoint(node.init.loc.end, variables),
                                    b.ReturnStatement(
                                        b.Identifier(name)
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
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                                return [
                                    changedGraphStmt(),
                                    checkPoint(start, data),
                                    Object.assign({}, node),
                                    changedGraphStmt(),
                                    checkPoint(end, variables)
                                ];
                            } else {
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                                __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                                return [
                                    checkPoint(start, data),
                                    Object.assign({}, node),
                                    changedGraphStmt(),
                                    checkPoint(end, variables)
                                ];
                            }
                        }

                        if (node.type === 'BlockStatement') {
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                            return b.BlockStatement([
                                changedGraphStmt(),
                                checkPoint(start, data),
                                Object.assign({}, node),
                                changedGraphStmt(),
                                checkPoint(end, variables)
                            ]);
                        } else {
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter] = __$__.ASTTransforms.checkPoint_idCounter + 1;
                            __$__.ASTTransforms.pairCPID[__$__.ASTTransforms.checkPoint_idCounter + 1] = __$__.ASTTransforms.checkPoint_idCounter;
                            return b.BlockStatement([
                                checkPoint(start, data),
                                Object.assign({}, node),
                                changedGraphStmt(),
                                checkPoint(end, variables)
                            ]);
                        }
                    }
                }
            }
        }
    };
};


/**
 * In this function, if the head of the name in VariableDeclarator have '$',
 * remove '$'
 */
__$__.ASTTransforms.RemoveProbe = function() {
    return {
        leave(node, path) {
            if (node.type === 'VariableDeclarator') {
                if (node.id.name[0] === '$' && node.id.name.length > 1) {
                    node.id.name = node.id.name.slice(1, node.id.name.length);
                }
            }
        }
    };
};
