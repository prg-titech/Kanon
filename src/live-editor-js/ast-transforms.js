__$__.ASTTransforms = {};

let b = __$__.ASTBuilder;

/** 
 * before: new Hoge()
 * after:  function() {
 *             var temp = new Hoge();
 *
 *             if (__newIdCounter[id]) __newIdCounter[id]++;
 *             else __newIdCounter[id] = 1;
 *
 *             temp.__id = id + "-" + __newIdCounter[id];
 *             __objs.push(temp);
 *             return temp;
 *         }()
 *
 * "id" is unique number of this function
 * "__newIdCounter[id]" is the number of times this is called
 */
__$__.ASTTransforms.NewExpressionToFunction = function() {
    var id = 0;
    return {
        leave(node, path) {
            if (node.type === "NewExpression") {
                const counterName = "__newIdCounter";
                id++;

                return b.CallExpression(
                    b.FunctionExpression(
                        null,
                        [],
                        b.BlockStatement([
                            b.VariableDeclaration(
                                [b.VariableDeclarator(
                                    b.Identifier("temp"),
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
                                    b.Literal("" + id),
                                    true
                                ),
                                b.ExpressionStatement(
                                    b.UpdateExpression(
                                        b.MemberExpression(
                                            b.Identifier(counterName),
                                            b.Literal("" + id),
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
                                            b.Literal("" + id),
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
                                        b.Identifier("temp"),
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
                                    [b.Identifier("temp")]
                                )
                            ),
                            b.ReturnStatement(
                                b.Identifier("temp")
                            )
                        ])
                    ),
                    []
                );
            }
        }
    };
};

// Add "var __objs = [];" at the head of the code
__$__.ASTTransforms.Add__objsCode = function() {
    return {
        leave(node, path) {
            const objectsName = "__objs";

            if (node.type === "Program") {
                node.body.unshift(
                    b.VariableDeclaration(
                        [b.VariableDeclarator(
                            b.Identifier(objectsName),
                            b.ArrayExpression([])
                        )],
                        "var"
                    )
                );
            }
        }
    };
};

// Add "var __newIdCounter = {};" at the head of the code
__$__.ASTTransforms.AddCounter = function() {
    return {
        leave(node, path) {
            const counterName = "__newIdCounter";

            if (node.type === "Program") {
                node.body.unshift(
                    b.VariableDeclaration(
                        [b.VariableDeclarator(
                            b.Identifier(counterName),
                            b.ObjectExpression([])
                        )],
                        "var"
                    )
                );
            }
        }
    };
};

// Add "var __loopCounter = {};" at the head of the code
__$__.ASTTransforms.AddLoopCounter = function () {
    return {
        leave(node, path) {
            const counterName = "__loopCounter";

            if (node.type === "Program") {
                node.body.unshift(
                    b.VariableDeclaration(
                        [b.VariableDeclarator(
                            b.Identifier(counterName),
                            b.ObjectExpression([])
                        )],
                        "var"
                    )
                );
            }
        }
    };
};

// Add "var __loopId = 'noLoop', __loopCount = 1;" at the head of the code 
__$__.ASTTransforms.AddLoopId_and_LoopCount = function() {
    return {
        leave(node, path) {
            if (node.type === "Program") {
                node.body.unshift(
                    b.VariableDeclaration([
                        b.VariableDeclarator(
                            b.Identifier("__loopId"),
                            b.Literal("noLoop")
                        ),
                        b.VariableDeclarator(
                            b.Identifier("__loopCount"),
                            b.Literal(1)
                        )
                    ], "var")
                );
            }
        }
    };
};


/**
 * @param {string} variables
 *
 * In this function, add variable declaration at the head of the code.
 * the declared variable is the element of variables
 */
__$__.ASTTransforms.AddVisualizeVariablesDeclaration = function(variables) {
    return {
        leave(node, path) {
            if (node.type === 'Program') {
                node.body.unshift(
                    b.VariableDeclaration(
                        variables.map(function(variable) {
                            return b.VariableDeclarator(
                                b.Identifier(variable)
                            )
                        })
                    , 'var')
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


__$__.ASTTransforms.Loop = ["DoWhileStatement", "WhileStatement", "ForStatement", "FunctionExpression", "FunctionDeclaration", "ArrowFunctionExpression"];

/** Insert the code can manage the context in loop.
 * loop includes
 * - DoWhileStatement
 * - WhileStatement
 * - ForStatement
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
 *     let __loopId = "loop" + idCounter;
 *     if (!Context.__loopContext[__loopId]) Context.__loopContext[__loopId] = 1;
 *     let __loopCount = (__loopCounter[__loopId]) ? ++__loopCounter[__loopId] : __loopCounter[__loopId] = 1;
 *     if (__loopCount > 1000) throw 'Infinite Loop';
 *     ...
 *   }
 *
 * __loopId is unique ID
 */
__$__.ASTTransforms.Context = function () {
    var idCounter = 1;
    return {
        leave(node, path) {
            const loopId = "__loopId", loopCount = "__loopCount", loopCounter = "__loopCounter", loopContext = "__loopContext";

            if (__$__.ASTTransforms.Loop.indexOf(node.type) != -1) {
                if (node.body.type != "BlockStatement") {
                    node.body = b.BlockStatement([node.body]);
                }
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
                            b.BinaryExpression(
                                b.Literal("loop"),
                                "+",
                                b.Identifier(idCounter++)
                            )
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
 */
__$__.ASTTransforms.InsertCheckPoint = function() {
    var idCounter = 1;
    var statementTypes = ['ExpressionStatement', 'BlockStatement', 'DebuggerStatement', 'WithStatement', 'ReturnStatement', 'LabeledStatement', 'BreakStatement', 'ContinueStatement', 'IfStatement', 'SwitchStatement', 'TryStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'FunctionDeclaration', 'VariableDeclaration'];
    var env = new __$__.VisualizeVariable.StackEnv();

    return {
        enter(node, path) {
            if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].indexOf(node.type) >= 0) {
                env.extendEnv(new __$__.VisualizeVariable.FunctionFlame());

                node.body.body.forEach(s => {
                    if (s.type == 'VariableDeclaration' && s.kind == 'var') {
                        s.declarations.forEach(declarator => {
                            env.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                        });
                    }
                });
            }

            if (node.type == 'BlockStatement') {
                env.extendEnv(new __$__.VisualizeVariable.BlockFlame());

                node.body.forEach(s => {
                    if (s.type == 'VariableDeclaration' && s.kind != 'var') {
                        s.declarations.forEach(declarator => {
                            env.addVariable(declarator.id.name.slice(1, declarator.id.name.length), s.kind, false);
                        });
                    }
                });
            }
            return env.visualizeVariable();
        },
        leave(node, path, enterData) {
            if (node.type == 'VariableDeclaration') {
                node.declarations.forEach(declarator => {
                    if (declarator.id.name[0] == '$') {
                        declarator.id.name = declarator.id.name.slice(1, declarator.id.name.length);
                        env.addVariable(declarator.id.name, node.kind, true);
                    } else {
                        env.addVariable(declarator.id.name, node.kind, false);
                    }
                });
            }

            if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'BlockStatement'].indexOf(node.type) >= 0) {
                env.pop();
            }

            if (statementTypes.indexOf(node.type) >= 0) {
                let start = node.loc.start;
                let end = node.loc.end;
                let parent = path[path.length - 2];
                let visualizeVariable = env.visualizeVariable();

                let checkPoint = function(loc, variables) {
                    __$__.Context.CheckPointTable[idCounter] = loc;
                    return b.ExpressionStatement(
                        b.CallExpression(
                            b.Identifier('__$__.Context.CheckPoint'),
                            [
                                b.Identifier('__objs'),
                                b.Identifier('__loopId'),
                                b.Identifier('__loopCount'),
                                b.Identifier(idCounter++),
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
                        checkPoint(start, enterData[0]),
                        Object.assign({}, node)
                    ]);
                } else if (node.type == 'VariableDeclaration' && node.kind != 'var' && (['ForStatement', 'ForInStatement'].indexOf(parent.type) == -1 || parent.init != node && parent.left != node)) {
                    return [
                        checkPoint(start, enterData[0]),
                        Object.assign({}, node),
                        checkPoint(end, visualizeVariable)
                    ];
                } else if (node.type != 'VariableDeclaration' || (['ForStatement', 'ForInStatement'].indexOf(parent.type) == -1 || parent.init != node && parent.left != node)) {
                    return b.BlockStatement([
                        checkPoint(start, enterData[0]),
                        Object.assign({}, node),
                        checkPoint(end, visualizeVariable)
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
__$__.ASTTransforms.RemoveVisualizeVariable = function() {
    return {
        leave(node, path) {
            if (node.type == 'VariableDeclarator') {
                if (node.id.name[0] == '$') {
                    node.id.name = node.id.name.slice(1, node.id.name.length);
                }
            }
        }
    };
};
