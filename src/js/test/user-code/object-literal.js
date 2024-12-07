/*
ast-transforms.js::CollectObjects() transforms expressions that
create objects.  For such an expression E, it generates a call like
__$__.Context.NewExpressionWrapprer(() => E, ...).

When E is an object literal { label1: exp1, ... }, the translated code
will have () => ({ label1: exp1, ... }) where the parentheses around
the brackets are crucial.

Hence the transformer must generate an AST of the lambda expression
so that its body is an expression, not a block.  In EMCAScript AST
API, it is specified by setting the body element's "expression" 
property to be true.

This test code checks if the transformed code still has a valid syntax.
*/
{ foo: 123,
  bar: 456 }
