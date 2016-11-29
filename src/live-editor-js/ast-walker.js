/**
 * Traverses an AST and calls visitor methods on each of the visitors.
 *
 * @param node: The root of the AST to walk.
 * @param path: An array containing all of the ancestors and the current node.
 *              Callers should pass in null.
 * @param visitors: One or more objects containing 'enter' and/or 'leave'
 *                  methods which accept a single AST node as an argument.
 */
__$__.walkAST = function(node, path, visitors) {
    if (path === null) {
        path = [node];
    } else {
        path.push(node);
    }
    let enterData = {};
    visitors.forEach(visitor => {
        if (visitor.enter) {
            // enterData.push(visitor.enter(node, path));
            var temp = visitor.enter(node, path);
            if (temp) enterData[temp[0]] = temp[1];
        }
    });
    for (let prop of Object.keys(node)) {
        if (node.hasOwnProperty(prop) && node[prop] instanceof Object) {
            if (Array.isArray(node[prop])) {
                let i = 0;
                while (i < node[prop].length) {
                    let child = node[prop][i];
                    // Skip over the number of replacements.  This is usually
                    // just 1, but in situations involving multiple variable
                    // declarations we end up replacing one statement with
                    // multiple statements and we need to step over all of them.
                    i += __$__.walkAST(child, path, visitors);
                }
            } else if (node[prop].type) { // don't walk metadata props like "loc"
                __$__.walkAST(node[prop], path, visitors);
            }
        }
    }
    let step = 1;
    visitors.forEach(visitor => {
        if (visitor.leave) {
            let replacement = visitor.leave(node, path, enterData);
            if (replacement) {
                if (replacement instanceof Array) {
                    let parent = path[path.length - 2];
                    if (parent.body) {
                        let index = parent.body.findIndex(child => child === node);
                        Array.prototype.splice.apply(parent.body, [index, 1].concat(replacement));
                        // Since we replaced one statement with multiple statements
                        // we'll want to skip over all of them so set 'step' to
                        // the number of replacements.
                        step = replacement.length;
                    }
                } else {
                    Object.keys(node).forEach(key => {
                        delete node[key];
                    });
                    Object.keys(replacement).forEach(key => {
                        node[key] = replacement[key];
                    });
                }
            }
        }
    });
    path.pop();
    return step;
};
