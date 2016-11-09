window.CodeConversion = {};


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
CodeConversion.transformCode = function(code, isContext = false) {
    try {
        let ast = esprima.parse(code, {loc: true});
    
        let visitors = [];
        if (isContext) {
            visitors.push(ASTTransforms.InsertCheckPoint());
            walkAST(ast, null, visitors);
            visitors = [];
        }
        visitors.push(ASTTransforms.Context());
        visitors.push(ASTTransforms.AddLoopCounter());
        visitors.push(ASTTransforms.AddLoopId_and_LoopCount());
        visitors.push(ASTTransforms.NewExpressionToFunction());
        visitors.push(ASTTransforms.AddCounter());
        visitors.push(ASTTransforms.Add__objsCode());

        walkAST(ast, null, visitors);

        return escodegen.generate(ast);
    } catch (e) {
    }
};
