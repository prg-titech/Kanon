__$__.CodeConversion = {};


/**
 * memo: code(string) -> ast -> new ast -> code(string)
 *
 * @param {string} code
 * @param {boolean} isContext
 *
 * First, user code is converted into AST using esprima parser.
 * Second, we define visitors to use walkAST(),
 * and executes walkAST() using the visitors.
 * Finally, AST is converted into code whose type is string using escodegen.
 * (walkAST() is executed twice if 'isContext' is true.)
 */
__$__.CodeConversion.TransformCode = function(code, isContext = false) {
    try {
        let ast = esprima.parse(code, {loc: true});
    
        let visitors = [];

        if (isContext) {
            visitors.push(__$__.ASTTransforms.InsertCheckPoint());
        } else {
            visitors.push(__$__.ASTTransforms.RemoveVisualizeVariable());
        }
        __$__.walkAST(ast, null, visitors);
        visitors = [];

        visitors.push(__$__.ASTTransforms.BlockedProgram());
        visitors.push(__$__.ASTTransforms.AddLoopCounter());
        visitors.push(__$__.ASTTransforms.AddLoopId_and_LoopCount());
        visitors.push(__$__.ASTTransforms.AddCounter());
        visitors.push(__$__.ASTTransforms.Add__objsCode());
        visitors.push(__$__.ASTTransforms.AddTimeCounter());
        visitors.push(__$__.ASTTransforms.Context());
        visitors.push(__$__.ASTTransforms.NewExpressionToFunction());

        __$__.walkAST(ast, null, visitors);

        return escodegen.generate(ast);
    } catch (e) {
        console.log(e)
    }
};
