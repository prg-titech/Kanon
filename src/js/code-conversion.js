__$__.CodeConversion = {};


/**
 * memo: code(string) -> ast -> new ast -> code(string)
 *
 * @param {string} code
 * @param {boolean} isSnapshot
 *
 * First, user code is converted into AST using esprima parser.
 * Second, we define visitors to use walkAST(),
 * and executes walkAST() using the visitors.
 * Finally, AST is converted into code whose type is string using escodegen.
 * (walkAST() is executed twice if 'isSnapshot' is true.)
 */
__$__.CodeConversion.TransformCode = function(code, isSnapshot = false) {
    try {
        let ast = esprima.parse(code, {loc: true});
        let visitors = [];


        if (isSnapshot) {
            visitors.push(__$__.ASTTransforms.InsertCheckPoint());
        } else {
            visitors.push(__$__.ASTTransforms.RemoveProbe());
        }

        __$__.walkAST(ast, null, visitors);


        visitors = [];

        visitors.push(__$__.ASTTransforms.BlockedProgram());
        visitors.push(__$__.ASTTransforms.AddSomeCodeInHeadAndTail());
        visitors.push(__$__.ASTTransforms.Context());
        visitors.push(__$__.ASTTransforms.NewExpressionToFunction());


        Object.keys(__$__.Context.LoopIdPositions).forEach(id => {
            __$__.Context.LoopIdPositions[id].useID = false;
        });

        Object.keys(__$__.Context.NewIdPositions).forEach(id => {
            __$__.Context.NewIdPositions[id].useID = false;
        });


        __$__.walkAST(ast, null, visitors);


        Object.keys(__$__.Context.LoopIdPositions).forEach(id => {
            if (!__$__.Context.LoopIdPositions[id].useID) delete __$__.Context.LoopIdPositions[id];
        });

        Object.keys(__$__.Context.NewIdPositions).forEach(id => {
            if (!__$__.Context.NewIdPositions[id].useID) delete __$__.Context.NewIdPositions[id];
        });


        return escodegen.generate(ast);
    } catch (e) {
    }
};
