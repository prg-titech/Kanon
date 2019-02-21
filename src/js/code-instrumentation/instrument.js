__$__.CodeInstrumentation = {
    /**
     * memo: code(string) -> ast -> new ast -> code(string)
     *
     * @param {string} code
     * @param {Boolean} checkInfLoop
     *
     * First, user code is converted into AST using esprima which is parser for JavaScript.
     * Second, we define visitors to use walkAST(),
     * and execute walkAST() using the visitors.
     * Finally, AST is converted into code whose type is string using escodegen.
     * (walkAST() is executed twice if 'isSnapshot' is true.)
     */
    instrument: function(code) {
        let ast = esprima.parse(code, {loc: true});
        let tf = __$__.ASTTransforms;
        let visitors = [];
    
    
        __$__.ASTTransforms.pairCPID = {};
        __$__.ASTTransforms.varEnv = new __$__.Probe.StackEnv();
        visitors.push(tf.Labeling());

        Object.keys(__$__.Context.LabelPos).forEach(kind => {
            Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                __$__.Context.LabelPos[kind][label].useLabel = false;
            });
        });

        __$__.UpdateLabelPos.unlabeledNodes = [];

        __$__.walkAST(ast, null, visitors);

        __$__.UpdateLabelPos.labelingUnlabeledNodes();

        Object.keys(__$__.Context.LabelPos).forEach(kind => {
            Object.keys(__$__.Context.LabelPos[kind]).forEach(label => {
                if (!__$__.Context.LabelPos[kind][label].useLabel)
                    delete __$__.Context.LabelPos[kind][label];
            });
        });

        visitors = [];

        visitors.push(tf.InsertCheckPoint());
        visitors.push(tf.ConvertCallExpression());
        visitors.push(tf.BlockedProgram());
        visitors.push(tf.AddSomeCodeInHead());
        visitors.push(tf.Context());
        // visitors.push(tf.ConvertCallExpression());
        visitors.push(tf.CollectObjects());

    
        __$__.walkAST(ast, null, visitors);
    
        return escodegen.generate(ast);
    }
};
