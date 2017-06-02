__$__.CodeConversion = {
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
    TransformCode: function(code, isSnapshot = false) {
        try {
            let ast = esprima.parse(code, {loc: true});
            let visitors = [];
    
    
            if (isSnapshot) {
                visitors.push(__$__.ASTTransforms.InsertCheckPoint());
                __$__.walkAST(ast, null, visitors);
            }
    
    
            visitors = [];
    
            visitors.push(__$__.ASTTransforms.BlockedProgram());
            visitors.push(__$__.ASTTransforms.AddSomeCodeInHeadAndTail());
            visitors.push(__$__.ASTTransforms.Context());
            visitors.push(__$__.ASTTransforms.CallExpressionToFunction());
            visitors.push(__$__.ASTTransforms.CollectObjects());
    
    
            ['LoopLabelPosition', 'NewLabelPosition', 'CallLabelPosition', 'ArrayLabelPosition'].forEach(pos => {
                Object.keys(__$__.Context[pos]).forEach(label => {
                    __$__.Context[pos][label].useLabel = false;
                });
            });
    
    
            __$__.walkAST(ast, null, visitors);
    
    
            ['LoopLabelPosition', 'NewLabelPosition', 'CallLabelPosition', 'ArrayLabelPosition'].forEach(pos => {
                Object.keys(__$__.Context[pos]).forEach(label => {
                    if (!__$__.Context[pos][label].useLabel)
                        delete __$__.Context[pos][label];
                });
            });
    
    
            return escodegen.generate(ast);
        } catch (e) {
            let i;
        }
    }
};
