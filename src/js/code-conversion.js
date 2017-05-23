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
            __$__.walkAST(ast, null, visitors);
        }


        visitors = [];

        visitors.push(__$__.ASTTransforms.BlockedProgram());
        visitors.push(__$__.ASTTransforms.AddSomeCodeInHeadAndTail());
        visitors.push(__$__.ASTTransforms.Context());
        visitors.push(__$__.ASTTransforms.CallExpressionToFunction());
        visitors.push(__$__.ASTTransforms.NewExpressionToFunction());


        Object.keys(__$__.Context.LoopLabelPosition).forEach(label => {
            __$__.Context.LoopLabelPosition[label].useLabel = false;
        });
        Object.keys(__$__.Context.NewLabelPosition).forEach(label => {
            __$__.Context.NewLabelPosition[label].useLabel = false;
        });
        Object.keys(__$__.Context.CallLabelPosition).forEach(label => {
            __$__.Context.CallLabelPosition[label].useLabel = false;
        });


        __$__.walkAST(ast, null, visitors);


        Object.keys(__$__.Context.LoopLabelPosition).forEach(label => {
            if (!__$__.Context.LoopLabelPosition[label].useLabel) delete __$__.Context.LoopLabelPosition[label];
        });
        Object.keys(__$__.Context.NewLabelPosition).forEach(label => {
            if (!__$__.Context.NewLabelPosition[label].useLabel) delete __$__.Context.NewLabelPosition[label];
        });
        Object.keys(__$__.Context.CallLabelPosition).forEach(label => {
            if (!__$__.Context.CallLabelPosition[label].useLabel) delete __$__.Context.CallLabelPosition[label];
        });


        return escodegen.generate(ast);
    } catch (e) {
        let i;
    }
};
