__$__.ASTTransforms = {
    checkPoint_idCounter: 1 // this is used to count id of each check point
};

let b = __$__.ASTBuilder;

/** 
 * before: new Hoge()
 * after:  (() => {
 *             var __temp = new Hoge();
 *
 *             if (__newIdCounter[id]) __newIdCounter[id]++;
 *             else __newIdCounter[id] = 1;
 *
 *             __temp.__id = id + "-" + __newIdCounter[id];
 *             __objs.push(__temp);
 *             return __temp;
 *         })()
 *
 * "id" is unique number of this function
 * "__newIdCounter[id]" is the number of times this is called
 *
 */
__$__.ASTTransforms.NewExpressionToFunction = function() {
    return {
        leave(node, path) {
            if (node.type === "NewExpression") {
                const counterName = "__newIdCounter";

                // In this part, register the position of this NewExpression.
                // If already registered, use the loopId
                let id;
                Object.keys(__$__.Context.NewIdPositions).forEach(newId => {
                    var pos = __$__.Context.NewIdPositions[newId];
                    if (pos.start.line == node.loc.start.line &&
                            pos.start.column == node.loc.start.column &&
                            pos.end.line == node.loc.end.line &&
                            pos.end.column == node.loc.end.column) {
                        id = newId;
                        pos.useID = true;
                    }
                });
                // the case of not registered yet.
                if (!id) {
                    let i = 1;
                    while (!id) {
                        let newId = 'new' + i;
                        if (Object.keys(__$__.Context.NewIdPositions).indexOf(newId) == -1) id = newId;
                        i++;
                    }
                    __$__.Context.NewIdPositions[id] = node.loc;
                    __$__.Context.NewIdPositions[id].useID = true;
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
                                )],
                                "var"
                            ),
                            b.IfStatement(
                                b.MemberExpression(
                                    b.Identifier(counterName),
                                    b.Literal(id),
                                    true
                                ),
                                b.ExpressionStatement(
                                    b.UpdateExpression(
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Literal(id),
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
                                            b.Literal(id),
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
                                            b.Literal(id),
                                            "+",
                                            b.Literal("-")
                                        ),
                                        "+",
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Literal(id),
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

// Add some code in the head and tail of user code.
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
                            b.Identifier('__loopId'),
                            b.Literal('noLoop')
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__loopCount'),
                            b.Literal(1)
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__newIdCounter'),
                            b.ObjectExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__objs'),
                            b.ArrayExpression([])
                        ),
                        b.VariableDeclarator(
                            b.Identifier('__time_counter'),
                            b.Literal(0)
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

/** Insert the code can manage the context in loop.
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
 *     let __loopId = "loop" + id;
 *     if (!__$__.Context.LoopContext[__loopId]) __$__.Context.LoopContext[__loopId] = 1;
 *     let __loopCount = (__loopCounter[__loopId]) ? ++__loopCounter[__loopId] : __loopCounter[__loopId] = 1;
 *     if (__loopCount > 10000) throw 'Infinite Loop';
 *     let __start = __time_counter;
 *     ...
 *     if (!__$__.Context.StartEndInLoop[__loopId]) __$__.Context.StartEndInLoop[__loopId] = [];
 *     __$__.Context.StartEndInLoop[__loopId].push({start: __start, end: __time_counter-1});
 *   }
 *
 * __loopId is unique ID
 */
__$__.ASTTransforms.Context = function () {
    return {
        enter(node, path) {
            const loopId = "__loopId", loopCount = "__loopCount", loopCounter = "__loopCounter", loopContext = "LoopContext";

            if (__$__.ASTTransforms.Loop.indexOf(node.type) != -1 && node.loc) {
                // In this part, register the position of this loop.
                // If already registered, use the loopId
                let id;
                Object.keys(__$__.Context.LoopIdPositions).forEach(loopId => {
                    var pos = __$__.Context.LoopIdPositions[loopId];
                    if (pos.start.line == node.loc.start.line &&
                            pos.start.column == node.loc.start.column &&
                            pos.end.line == node.loc.end.line &&
                            pos.end.column == node.loc.end.column) {
                        id = loopId;
                        pos.useID = true;
                    }
                });
                // the case of not registered yet
                if (!id) {
                    let i = 1;
                    while(!id) {
                        let loopId = 'loop' + i;
                        if (Object.keys(__$__.Context.LoopIdPositions).indexOf(loopId) == -1) id = loopId;
                        i++;
                    }
                    __$__.Context.LoopIdPositions[id] = node.loc;
                    __$__.Context.LoopIdPositions[id].useID = true;
                }

                if (node.body.type != "BlockStatement") {
                    node.body = b.BlockStatement([node.body]);
                }
                node.body.body.push(
                    b.IfStatement(
                        b.Identifier('!__$__.Context.StartEndInLoop[__loopId]'),
                        b.ExpressionStatement(
                            b.AssignmentExpression(
                                b.Identifier('__$__.Context.StartEndInLoop[__loopId]'),
                                "=",
                                b.ArrayExpression([])
                            )
                        )
                    )
                ),
                node.body.body.push(
                    b.ExpressionStatement(
                        b.Identifier('__$__.Context.StartEndInLoop[__loopId].push({start: __start, end: __time_counter - 1})')
                    )
                ),
                node.body.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier('__start'),
                            b.Identifier('__time_counter')
                        )
                    ], 'let')
                ),
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
                node.body.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier(loopCount),
                            b.ConditionalExpression(
                                b.MemberExpression(
                                    b.Identifier(loopCounter),
                                    b.Identifier(loopId),
                                    true
                                ),
                                b.UpdateExpression(
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier(loopId),
                                        true
                                    ),
                                    "++",
                                    true
                                ),
                                b.AssignmentExpression(
                                    b.MemberExpression(
                                        b.Identifier(loopCounter),
                                        b.Identifier(loopId),
                                        true
                                    ),
                                    "=",
                                    b.Literal(1)
                                )
                            )
                        )
                    ], "let")
                );
                node.body.body.unshift(
                    b.IfStatement(
                        b.UnaryExpression(
                            "!",
                            b.MemberExpression(
                                b.MemberExpression(
                                    b.Identifier("__$__.Context"),
                                    b.Identifier(loopContext)
                                ),
                                b.Identifier(loopId),
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
                                    b.Identifier(loopId),
                                    true
                                ),
                                "=",
                                b.Literal(1)
                            )
                        )
                    )
                );
                node.body.body.unshift(
                    b.VariableDeclaration(
                        [b.VariableDeclarator(
                            b.Identifier(loopId),
                            b.Literal(id)
                        )],
                        "let"
                    )
                );
            }
        }
    };
};


/**
 * insert check point before and after statement(VariableDeclaration is exception).
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
 * '__$__.Context.ChechPoint(__objs, __loopId, __loopCount, __time_counter, {})'
 * and, the last of arguments is object which means visualization of variables.
 * the argument is {v: eval(v)} if variable 'v' should be visualized.
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
                            if (declarator.id.name[0] === '$' && declarator.id.name.length > 1)
                                env.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                            else
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
                if (node.id.name[0] == '$' && node.id.name.length > 1) {
                    node.id.name = node.id.name.slice(1, node.id.name.length);
                    env.addVariable(node.id.name, parent.kind, true);
                } else {
                    env.addVariable(node.id.name, parent.kind, false);
                }
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
                                b.Identifier('__loopId'),
                                b.Identifier('__loopCount'),
                                b.Identifier('__time_counter++'),
                                b.Identifier(__$__.ASTTransforms.checkPoint_idCounter++),
                                b.ObjectExpression(
                                    variables.map(function(val) {
                                        return b.Property(
                                            b.Identifier(val),
                                            b.CallExpression(
                                                b.Identifier('eval'),
                                                [b.Identifier(val)]
                                            )
                                        );
                                    })
                                )
                            ]
                        )
                    )
                };

                if (['ReturnStatement', 'BreakStatement', 'ContinueStatement'].indexOf(node.type) != -1) {
                    return b.BlockStatement([
                        checkPoint(start, data),
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
                    return b.BlockStatement([
                        checkPoint(start, data),
                        Object.assign({}, node),
                        checkPoint(end, variables)
                    ]);
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
