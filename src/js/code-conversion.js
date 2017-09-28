__$__.CodeConversion = {
    /**
     * memo: code(string) -> ast -> new ast -> code(string)
     *
     * @param {string} code
     * @param {Boolean} checkInfiniteLoop
     *
     * First, user code is converted into AST using esprima parser.
     * Second, we define visitors to use walkAST(),
     * and executes walkAST() using the visitors.
     * Finally, AST is converted into code whose type is string using escodegen.
     * (walkAST() is executed twice if 'isSnapshot' is true.)
     */
    TransformCode: function(code, checkInfLoop = false) {
        let ast = esprima.parse(code, {loc: true});
        let tf = __$__.ASTTransforms;
        let visitors = [];
    
    
        if (checkInfLoop) {
            visitors.push(tf.Context(true));
            visitors.push(tf.AddSomeCodeInHeadAndTail());
            __$__.walkAST(ast, null, visitors);

        } else {
            visitors.push(tf.InsertCheckPoint());
            __$__.walkAST(ast, null, visitors);
    
            visitors = [];
    
            visitors.push(tf.BlockedProgram());
            visitors.push(tf.AddSomeCodeInHeadAndTail());
            visitors.push(tf.Context());
            visitors.push(tf.CallExpressionToFunction());
            visitors.push(tf.CollectObjects());
    
    
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    __$__.Context.LabelPos[kind][label].useLabel = false;
                });
            });
    
    
            __$__.walkAST(ast, null, visitors);
    
    
            Object.keys(__$__.Context.LabelPos).forEach(kind => {
                Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                    if (!__$__.Context.LabelPos[kind][label].useLabel)
                        delete __$__.Context.LabelPos[kind][label];
                });
            });
        }
    
        return escodegen.generate(ast);
    }
};
