__$__.ASTTransforms = {
    checkPoint_idCounter: 1 // this is used to count id of each check point
};

let b = __$__.ASTBuilder;

/** 
 * before: new Hoge()
 *
 * after:  (() => {
 *             var __temp = new Hoge(), __objectID = '';
 *             __call_stack.forEach(label => {
 *                 __objectID += label + '-' + __call_count[label] + '-';
 *             });
 *             __objectID += 'unique ID';
 *
 *             if (__newLabelCounter[__objectID]) __newLabelCounter[__objectID]++;
 *             else __newLabelCounter[__objectID] = 1;
 *
 *             __temp.__id = __objectID + '-' + __newLabelCounter[__objectID];
 *             __objs.push(__temp);
 *             return __temp;
 *         })()
 *
 */
__$__.ASTTransforms.NewExpressionToFunction = function() {
    return {
        leave(node, path) {
            if (node.type === "NewExpression") {
                const counterName = "__newLabelCounter";

                // In this part, register the position of this NewExpression.
                // If already registered, use the Label
                let label;
                Object.keys(__$__.Context.NewLabelPosition).forEach(newLabel => {
                    var pos = __$__.Context.NewLabelPosition[newLabel];
                    if (pos.start.line == node.loc.start.line &&
                            pos.start.column == node.loc.start.column &&
                            pos.end.line == node.loc.end.line &&
                            pos.end.column == node.loc.end.column) {
                        label = newLabel;
                        pos.useLabel = true;
                    }
                });
                // the case of not registered yet.
                if (!label) {
                    let i = 1;
                    while (!label) {
                        let newLabel = 'new' + i;
                        if (Object.keys(__$__.Context.NewLabelPosition).indexOf(newLabel) == -1) label = newLabel;
                        i++;
                    }
                    __$__.Context.NewLabelPosition[label] = node.loc;
                    __$__.Context.NewLabelPosition[label].useLabel = true;
                }

                return b.CallExpression(
                    b.ArrowFunctionExpression(
                        [],
                        b.BlockStatement([
                            b.VariableDeclaration(
                                [b.VariableDeclarator(
                                    b.Identifier("__temp"),
                                    b.NewExpression(
                                        node.callee,
                                        node.arguments
                                    )
                                ), b.VariableDeclarator(
                                    b.Identifier('__objectID'),
                                    b.Literal('')
                                )],
                                "var"
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier('__call_stack'),
                                        b.Identifier('forEach')
                                    ),
                                    [b.ArrowFunctionExpression(
                                        [b.Identifier('label')],
                                        b.BlockStatement(
                                            [b.ExpressionStatement(
                                                b.AssignmentExpression(
                                                    b.Identifier('__objectID'),
                                                    "+=",
                                                    b.BinaryExpression(
                                                        b.BinaryExpression(
                                                            b.BinaryExpression(
                                                                b.Identifier('label'),
                                                                "+",
                                                                b.Literal('-')
                                                            ),
                                                            "+",
                                                            b.MemberExpression(
                                                                b.Identifier('__call_count'),
                                                                b.Identifier('label'),
                                                                true
                                                            )
                                                        ),
                                                        "+",
                                                        b.Literal('-')
                                                    )
                                                )
                                            )]
                                        )
                                    )]
                                )
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.Identifier('__objectID'),
                                    "+=",
                                    b.Literal(label)
                                )
                            ),
                            b.IfStatement(
                                b.MemberExpression(
                                    b.Identifier(counterName),
                                    b.Identifier('__objectID'),
                                    true
                                ),
                                b.ExpressionStatement(
                                    b.UpdateExpression(
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Identifier('__objectID'),
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
                                            b.Identifier('__objectID'),
                                            true
                                        ),
                                        "=",
                                        b.Literal(1)
                                    )
                                )
                            ),
                            b.ExpressionStatement(
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.Identifier("__temp"),
                                        b.Identifier("__id")
                                    ),
                                    "=",
                                    b.BinaryExpression(
                                        b.BinaryExpression(
                                            b.Identifier('__objectID'),
                                            "+",
                                            b.Literal("-")
                                        ),
                                        "+",
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Identifier('__objectID'),
                                            true
                                        )
                                    )
                                )
                            ),
                            b.ExpressionStatement(
                                b.CallExpression(
                                    b.MemberExpression(
                                        b.Identifier("__objs"),
                                        b.Identifier("push")
                                    ),
                                    [b.Identifier("__temp")]
                                )
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
 * we convert CallExprssion to the following example program.
 *
 * before:
 * func(arg1, arg2, ...)
 *
 * after:
 * (() => {
 *     if (__call_count['unique Label']) __call_count['unique Label']++;
 *     else __call_count['unique Label'] = 1;
 *     __call_stack.push('unique Label');
 *     var __temp = func(arg1, arg2, ...);
 *     __call_stack.pop();
 *     return __temp;
 * })()
 */
__$__.ASTTransforms.CallExpressionToFunction = function() {
    return {
        leave(node, path) {
            if (node.type === "CallExpression" && node.loc) {
                const counterName = "__call_count";
                const stackName = "__call_stack";

                // In this part, register the position of this CallExpression.
                // If already registered, use the Label
                let label;
                Object.keys(__$__.Context.CallLabelPosition).forEach(callLabel => {
                    var pos = __$__.Context.CallLabelPosition[callLabel];
                    if (pos.start.line == node.loc.start.line &&
                            pos.start.column == node.loc.start.column &&
                            pos.end.line == node.loc.end.line &&
                            pos.end.column == node.loc.end.column) {
                        label = callLabel;
                        pos.useLabel = true;
                    }
                });
                // the case of not registered yet.
                if (!label) {
                    let i = 1;
                    while (!label) {
                        let callLabel = 'call' + i;
                        if (Object.keys(__$__.Context.CallLabelPosition).indexOf(callLabel) == -1) label = callLabel;
                        i++;
                    }
                    __$__.Context.CallLabelPosition[label] = node.loc;
                    __$__.Context.CallLabelPosition[label].useLabel = true;
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
                                        b.Identifier(stackName),
                                        b.Identifier("push")
                                    ),
                                    [b.Literal(label)]
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
                                        b.Identifier(stackName),
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
 * var __loopCounter = {},
 *     __loopLabels = ['noLoop'],
 *     __loopCount = 1,
 *     __newLabelCounter = {},
 *     __objs = [],
 *     __time_counter = 0,
 *     __time_counter_stack = [],
 *     __call_count = {},
 *     __call_stack = [];
 * __$__.Context.StartEndInLoop['noLoop'] = [{start: 0}];
 * ...
 * __$__.Context.StartEndInLoop['noLoop'][0].end = __time_counter;
 */
__$__.ASTTransforms.AddSomeCodeInHeadAndTail = function() {
    return {
        leave(node, path) {
            if (node.type === 'Program') {
                // this is VariableDeclaration at the head of user code
                node.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__loopCounter'),
                            b.ObjectExpression([])
                        ),
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
                            b.Identifier('__objs'),
                            b.ArrayExpression([])
                        ),
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
                            b.Identifier('__call_stack'),
                            b.ArrayExpression([])
                        )
                    ], 'var')
                );

                // __$__.Context.StartEndInLoop['noLoop'] = [{start: 0}];
                node.body.unshift(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop["noLoop"] = [{start: 0}]')
                    )
                );

                // __$__.Context.StartEndInLoop['noLoop'][0].end = __time_counter;
                node.body.push(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop["noLoop"][0].end = __time_counter')
                    )
                );
            }
        }
    };
};


__$__.ASTTransforms.BlockedProgram = function() {
    return {
        leave(node, path) {
            if (node.type === 'Program') {
                node.body = [b.BlockStatement(node.body)];
            }
        }
    };
};


__$__.ASTTransforms.Loop = ["DoWhileStatement", "WhileStatement", "ForStatement", "ForInStatement", "FunctionExpression", "FunctionDeclaration", "ArrowFunctionExpression"];

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
 * after:
 *   while(condition) {
 *     let __loopLabel = 'loop' + label;
 *     __loopLabels.push(__loopLabel);
 *     if (!__$__.Context.LoopContext[__loopLabel]) __$__.Context.LoopContext[__loopLabel] = 1;
 *     let __loopCount =
 *         (__loopCounter[__loopLabel])
 *         ? ++__loopCounter[__loopLabel]
 *         : __loopCounter[__loopLabel] = 1;
 *     if (__loopCount > 10000) throw 'Infinite Loop';
 *     let __start = __time_counter;
 *     __time_counter_stack.push({start: __time_counter});
 *
 *     ...
 *
 *     if (!__$__.Context.StartEndInLoop[__loopLabel])
 *         __$__.Context.StartEndInLoop[__loopLabel] = [];
 *     __time_counter_stack[__time_counter_stack.length - 1].end = __time_counter-1;
 *     __$__.Context.StartEndInLoop[__loopLabel].push(__time_counter_stack.pop());
 *     __loopLabels.pop();
 *   }
 *
 * __loopLabel is unique label
 */
__$__.ASTTransforms.Context = function () {
    return {
        enter(node, path) {
            const loopLabels = "__loopLabels", loopCount = "__loopCount", loopCounter = "__loopCounter", loopContext = "LoopContext";

            if (__$__.ASTTransforms.Loop.indexOf(node.type) != -1 && node.loc) {
                // In this part, register the position of this loop.
                // If already registered, use the label
                let label;
                Object.keys(__$__.Context.LoopLabelPosition).forEach(loopLabel => {
                    var pos = __$__.Context.LoopLabelPosition[loopLabel];
                    if (pos.start.line == node.loc.start.line &&
                            pos.start.column == node.loc.start.column &&
                            pos.end.line == node.loc.end.line &&
                            pos.end.column == node.loc.end.column) {
                        label = loopLabel;
                        pos.useLabel = true;
                    }
                });
                // the case that the Label have not been registered yet.
                if (!label) {
                    let i = 1;
                    let arr_label = Object.keys(__$__.Context.LoopLabelPosition);
                    next: while(!label) {
                        let loopLabel = node.type + i;
                        for (var j = 0; j < arr_label.length; j++) {
                            if (arr_label[j].indexOf(loopLabel) !== -1) {
                                i++;
                                continue next;
                            }
                        }
                        label = loopLabel
                        if (path[path.length - 2].type === 'LabeledStatement')
                            label += '-' + path[path.length - 2].label.name;
                    }
                    __$__.Context.LoopLabelPosition[label] = node.loc;
                    __$__.Context.LoopLabelPosition[label].useLabel = true;
                }

                if (node.body.type != "BlockStatement") {
                    node.body = b.BlockStatement([node.body]);
                }
                // if (!__$__.Context.StartEndInLoop[__loopLabel]) __$__.Context.StartEndInLoop[__loopLabel] = [];
                node.body.body.push(
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
                                        b.Identifier('StartEndInLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                "=",
                                b.ArrayExpression([])
                            )
                        )
                    )
                ),
                // __time_counter_stack[__time_counter_stack.length - 1].end = __time_counter-1;
                node.body.body.push(
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
                    )
                )
                // __$__.Context.StartEndInLoop[__loopLabel].push(__time_counter_stack.pop());
                node.body.body.push(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('StartEndInLoop')
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                b.Identifier('push')
                            ),
                            [b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.Identifier('pop')
                                ),
                                []
                            )]
                        )
                    )
                ),
                // __loopLabels.pop();
                node.body.body.push(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier(loopLabels),
                                b.Identifier('pop')
                            ),
                            []
                        )
                    )
                ),
                // __time_counter_stack.push({start: __time_counter});
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__time_counter_stack'),
                                b.Identifier('push')
                            ),
                            [b.ObjectExpression(
                                [b.Property(
                                    b.Identifier('start'),
                                    b.Identifier('__time_counter')
                                )]
                            )]
                        )
                    )
                ),
                // let __start = __time_counter;
                node.body.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__start'),
                            b.Identifier('__time_counter')
                        )
                    ], 'let')
                ),
                // if (__loopCount > 10000) throw 'Infinite Loop';
                node.body.body.unshift(
                    b.IfStatement(
                        b.BinaryExpression(
                            b.Identifier(loopCount),
                            ">",
                            b.Literal(10000)
                        ),
                        b.ThrowStatement(
                            b.Literal('Infinite Loop')
                        )
                    )
                ),
                // let __loopCount = (__loopCounter[__loopLabel]) ? ++__loopCounter[__loopLabel] : __loopCounter[__loopLabel] = 1;
                node.body.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier(loopCount),
                            b.ConditionalExpression(
                                b.MemberExpression(
                                    b.Identifier(loopCounter),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                b.UpdateExpression(
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    "++",
                                    true
                                ),
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier('__loopLabel'),
                                        true
                                    ),
                                    "=",
                                    b.Literal(1)
                                )
                            )
                        )
                    ], "let")
                );
                // if (!__$__.Context.LoopContext[__loopLabel]) __$__.Context.LoopContext[__loopLabel] = ;
                node.body.body.unshift(
                    b.IfStatement(
                        b.UnaryExpression(
                            "!",
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.Identifier('__$__'),
                                        b.Identifier('Context')
                                    ),
                                    b.Identifier(loopContext)
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
                                        b.Identifier("__$__.Context"),
                                        b.Identifier(loopContext)
                                    ),
                                    b.Identifier('__loopLabel'),
                                    true
                                ),
                                "=",
                                b.Literal(1)
                            )
                        )
                    )
                );
                // __loopLabels.push(__loopLabel);
                node.body.body.unshift(
                    b.ExpressionStatement(
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier(loopLabels),
                                b.Identifier('push'),
                                false
                            ),
                            [b.Identifier('__loopLabel')]
                        )
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
    var id = 'InsertCheckPoint'
    __$__.ASTTransforms.checkPoint_idCounter = 1;
    var statementTypes = ['ExpressionStatement', 'BlockStatement', 'DebuggerStatement', 'WithStatement', 'ReturnStatement', 'LabeledStatement', 'BreakStatement', 'ContinueStatement', 'IfStatement', 'SwitchStatement', 'TryStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'FunctionDeclaration', 'VariableDeclaration'];
    var env = new __$__.Probe.StackEnv();

    return {
        enter(node, path) {
            if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].indexOf(node.type) >= 0) {
                env.push(new __$__.Probe.FunctionFlame());

                node.body.body.forEach(s => {
                    if (s.type == 'VariableDeclaration' && s.kind == 'var') {
                        s.declarations.forEach(declarator => {
                            env.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                        });
                    }
                });
            }

            if (node.type == 'BlockStatement') {
                env.push(new __$__.Probe.BlockFlame());

                node.body.forEach(s => {
                    if (s.type == 'VariableDeclaration' && s.kind != 'var') {
                        s.declarations.forEach(declarator => {
                            env.addVariable(declarator.id.name, s.kind, false);
                        });
                    }
                });
            }
            return [id, env.Variables()];
        },
        leave(node, path, enterData) {
            var data = enterData[id];

            if (node.type == 'VariableDeclarator') {
                let parent = path[path.length - 2];
                env.addVariable(node.id.name, parent.kind, true);
            }

            if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'BlockStatement'].indexOf(node.type) >= 0) {
                env.pop();
            }

            if (statementTypes.indexOf(node.type) >= 0 || node.type == 'VariableDeclarator') {
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
                                b.MemberExpression(
                                    b.Identifier('__loopLabels'),
                                    b.BinaryExpression(
                                        b.MemberExpression(
                                            b.Identifier('__loopLabels'),
                                            b.Identifier('length')
                                        ),
                                        '-',
                                        b.Literal(1)
                                    ),
                                    true
                                ),
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
                                                b.CallExpression(
                                                    b.Identifier('eval'),
                                                    [b.Identifier(val)]
                                                ),
                                                b.Identifier("undefined")
                                            )
                                        );
                                    })
                                )
                            ]
                        )
                    )
                };

                /**
                 * {
                 *     if (!__$__.Context.StartEndInLoop[__loopLabels[__loopLabels.length - 1]])
                 *         __$__.Context.StartEndInLoop[__loopLabels[__loopLabels.length - 1]] = [];
                 *     __time_counter_stack[__time_counter_stack.length - 1].end = __time_counter-1;
                 *     __$__.Context.StartEndInLoop[__loopLabels[__loopLabels.length - 1]].push(__time_counter_stack.pop());
                 * }
                 */
                let out_loop = () => b.BlockStatement([
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
                                b.MemberExpression(
                                    b.Identifier('__loopLabels'),
                                    b.BinaryExpression(
                                        b.MemberExpression(
                                            b.Identifier('__loopLabels'),
                                            b.Identifier('length')
                                        ),
                                        '-',
                                        b.Literal(1)
                                    ),
                                    true
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
                                    b.MemberExpression(
                                        b.Identifier('__loopLabels'),
                                        b.BinaryExpression(
                                            b.MemberExpression(
                                                b.Identifier('__loopLabels'),
                                                b.Identifier('length')
                                            ),
                                            '-',
                                            b.Literal(1)
                                        ),
                                        true
                                    ),
                                    true
                                ),
                                '=',
                                b.ArrayExpression([])
                            )
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
                                b.MemberExpression(
                                    b.MemberExpression(
                                        b.MemberExpression(
                                            b.Identifier('__$__'),
                                            b.Identifier('Context')
                                        ),
                                        b.Identifier('StartEndInLoop')
                                    ),
                                    b.MemberExpression(
                                        b.Identifier('__loopLabels'),
                                        b.BinaryExpression(
                                            b.MemberExpression(
                                                b.Identifier('__loopLabels'),
                                                b.Identifier('length')
                                            ),
                                            '-',
                                            b.Literal(1)
                                        ),
                                        true
                                    ),
                                    true
                                ),
                                b.Identifier('push')
                            ),
                            [b.CallExpression(
                                b.MemberExpression(
                                    b.Identifier('__time_counter_stack'),
                                    b.Identifier('pop')
                                ),
                                []
                            )]
                        )
                    )
                ]);
                /**
                 * // before
                 * return hoge;
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     let __temp = hoge;
                 *     do {
                 *         out_loop
                 *     } while (__loopLabels.pop().indexOf('Statement') >= 0)
                 *     return __temp;
                 * }
                 */
                if (node.type === 'ReturnStatement') {
                    return b.BlockStatement([
                        checkPoint(start, data),
                        b.VariableDeclaration([
                            b.VariableDeclarator(
                                b.Identifier('__temp'),
                                node.argument
                            )
                        ], 'let'),
                        b.DoWhileStatement(
                            out_loop(),
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
                            )
                        ),
                        b.ReturnStatement(
                            b.Identifier('__temp')
                        )
                    ]);
                /**
                 * // before
                 * continue label; (or break label;)
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     do {
                 *         out_loop
                 *     } while (__loopLabels.pop().indexOf(label) === 0)
                 *     continue label; (or break label;)
                 * }
                 */
                } else if (['ContinueStatement', 'BreakStatement'].indexOf(node.type) >= 0 && node.label.name) {
                    return b.BlockStatement([
                        checkPoint(start, data),
                        b.DoWhileStatement(
                            out_loop(),
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
                                    [b.Literal('-' + node.label.name)]
                                ),
                                '===',
                                b.UnaryExpression(
                                    '-',
                                    b.Literal(1),
                                    true
                                )
                            )
                        ),
                        Object.assign({}, node)
                    ]);
                /**
                 * // before
                 * continue; (or break;)
                 *
                 * // after
                 * {
                 *     checkpoint;
                 *     out_loop;
                 *     __loopLabels.pop()
                 *     continue; (or break;)
                 * }
                 */
                } else if (['ContinueStatement', 'BreakStatement'].indexOf(node.type) >= 0) {
                    return b.BlockStatement([
                        checkPoint(start, data),
                        out_loop(),
                        b.CallExpression(
                            b.MemberExpression(
                                b.Identifier('__loopLabels'),
                                b.Identifier('pop')
                            ),
                            []
                        ),
                        Object.assign({}, node)
                    ]);
                } else if (node.type == 'VariableDeclaration' && node.kind != 'var' && (['ForStatement', 'ForInStatement'].indexOf(parent.type) == -1 || parent.init != node && parent.left != node)) {
                    return [
                        checkPoint(start, data),
                        Object.assign({}, node),
                        checkPoint(end, variables)
                    ];
                } else if (node.type == 'VariableDeclarator') {
                    if (node.init) {
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
                                    checkPoint(node.init.loc.end, variables),
                                    b.ReturnStatement(
                                        b.Identifier(name)
                                    )
                                ])
                            ),
                            []
                        );
                    }
                } else if (node.type != 'VariableDeclaration' || (['ForStatement', 'ForInStatement'].indexOf(parent.type) == -1 || parent.init != node && parent.left != node)) {
                    // So that the body of 'LabeledStatement' is not checkpoint(CallExpression).
                    if (['WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement'].indexOf(node.type) === -1 || parent.type !== 'LabeledStatement') {
                        return b.BlockStatement([
                            checkPoint(start, data),
                            Object.assign({}, node),
                            checkPoint(end, variables)
                        ]);
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
            if (node.type == 'VariableDeclarator') {
                if (node.id.name[0] == '$' && node.id.name.length > 1) {
                    node.id.name = node.id.name.slice(1, node.id.name.length);
                }
            }
        }
    };
};
