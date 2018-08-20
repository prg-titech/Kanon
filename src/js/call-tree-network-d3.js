__$__.CallTreeNetwork = {
    d3: d3,

    windowSize: {
        width: 600,
        height: 600
    },

    svg: d3.select('#callTree')
        .append('svg')
        .attr('width', 600)
        .attr('height', 600),

    enable: true,

    displayChildren: {
        'main': true
    },

    root: undefined,
    circle: undefined,

    switchEnabled() {
        this.enable = !this.enable;
        document.getElementById('callTreeDiagram').style.display = (this.enable) ? '' : 'none';
    },

    toggle(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
            __$__.CallTreeNetwork.displayChildren[d.data.contextSensitiveID] = false;
        } else {
            d.children = d._children;
            d._children = null;
            __$__.CallTreeNetwork.displayChildren[d.data.contextSensitiveID] = true;
        }
    },

    update(tree, root, source) {
        __$__.CallTreeNetwork.traverseCallTree(root);
        tree(root);

        let g = __$__.CallTreeNetwork.svg.select('g');
        let node = g.selectAll('.node')
            .data(root.descendants(), d => d.data.contextSensitiveID);

        let cc = __$__.CallTreeNetwork.clickCancel();
        let nodeEnter = node
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => 'translate(' + source.y0 + ',' + source.x0 + ')')
            .call(cc);

        cc.on('click', d => {
            let loopLabel = d.data.loopLabel;
            __$__.Context.SpecifiedContext[loopLabel] = d.data.contextSensitiveID;
            if (__$__.Update.executable)
                __$__.Context.SpecifiedContextWhenExecutable[loopLabel] = d.data.contextSensitiveID;

            __$__.Context.SwitchViewMode(true);
            __$__.Context.Draw();
            __$__.CallTreeNetwork.updateHighlightCircles();
        });
        cc.on('dblclick', d => {
            __$__.CallTreeNetwork.toggle(d);
            __$__.CallTreeNetwork.update(tree, __$__.CallTreeNetwork.root, d);
        });


        nodeEnter.append('circle')
            .attr('r', 5)
            .style('fill', d => d._children ? 'lightsteelblue' : '#fff');

        nodeEnter.append('text')
            .attr('x', d => d.children || d._children ? -13 : 13)
            .attr('dy', '3')
            .attr("font-size", "75%")
            .attr("text-anchor", d => d.children || d._children ? "end" : "start")
            .text(d => d.data.name)
            .style("fill-opacity", 1e-6);

        let nodeUpdate = nodeEnter.merge(node);
        let duration = 500;

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

        __$__.CallTreeNetwork.circle = nodeUpdate.select("circle")
            .attr("r", 8)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff");

        __$__.CallTreeNetwork.updateHighlightCircles();

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        let nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        let link = g.selectAll(".link")
            .data(root.links(), d => d.target.data.contextSensitiveID);

        let linkEnter = link.enter().insert('path', "g")
            .attr('class', 'link')
            .attr('d', __$__.CallTreeNetwork.d3.linkHorizontal()
                .x(d => source.y0)
                .y(d => source.x0));

        let linkUpdate = linkEnter.merge(link);
        linkUpdate.transition()
            .duration(duration)
            .attr('d', __$__.CallTreeNetwork.d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        link.exit()
            .transition()
            .duration(duration)
            .attr("d", __$__.CallTreeNetwork.d3.linkHorizontal()
                .x(d => source.y)
                .y(d => source.x))
            .remove();

        node.each(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    },

    draw: (() => {
        let firstTime = true;
        return function draw() {
            let data = {};
            __$__.CallTreeNetwork.constructData(__$__.CallTree.rootNode, data);
            let root = __$__.CallTreeNetwork.d3.hierarchy(data);
            root.x0 = __$__.CallTreeNetwork.windowSize.height / 2;
            root.y0 = 0;
            __$__.CallTreeNetwork.root = root;
            let tree = __$__.CallTreeNetwork.d3.tree()
                .size([__$__.CallTreeNetwork.windowSize.height, __$__.CallTreeNetwork.windowSize.width - 100]);

            if (firstTime) {
                __$__.CallTreeNetwork.g = __$__.CallTreeNetwork.svg.append('g')
                    .attr("transform", 'translate(50, 0)');
                firstTime = false;
            }

            __$__.CallTreeNetwork.update(tree, root, root);
        }
    })(),

    constructData(node, data) {
        data.name = node.getDisplayedLabel();
        data.contextSensitiveID = node.getContextSensitiveID();
        data.loopLabel = node.label;
        if (node.children.length > 0) data.children = [];
        let children = [].concat(node.children);
        while (children.length > 0) {
            let child = children.shift();
            if (child.constructor.name === 'FunctionCall' || child.constructor.name === 'Instance') {
                children.unshift(...child.children);
                continue;
            }
            let childData = {};
            data.children.push(childData);
            __$__.CallTreeNetwork.constructData(child, childData);
        }
    },

    traverseCallTree(node) {
        let contextSensitiveID = node.data.contextSensitiveID;
        if (__$__.CallTreeNetwork.displayChildren[contextSensitiveID] === false) {
            if (node.children) {
                node._children = node.children;
                node.children = null;
            }
        } else {
            if (__$__.CallTreeNetwork.displayChildren[contextSensitiveID] === true && node._children) {
                node.children = node._children;
                node._children = null;
            }
            let children = node.children;
            if (children) {
                children.forEach(childNode => {
                    __$__.CallTreeNetwork.traverseCallTree(childNode);
                });
            }
        }
    },

    clickCancel() {
        // we want to a distinguish single/double click
        // details http://bl.ocks.org/couchand/6394506
        let dispatcher = d3.dispatch('click', 'dblclick');
        function cc(selection) {
            let down, tolerance = 5, last, wait = null, args;
            // euclidean distance
            function dist(a, b) {
                return Math.sqrt(Math.pow(a[0] - b[0], 2), Math.pow(a[1] - b[1], 2));
            }
            selection.on('mousedown', function() {
                down = d3.mouse(document.body);
                last = +new Date();
                args = arguments;
            });
            selection.on('mouseup', function() {
                if (dist(down, d3.mouse(document.body)) > tolerance) {
                    return;
                } else {
                    if (wait) {
                        window.clearTimeout(wait);
                        wait = null;
                        dispatcher.apply("dblclick", this, args);
                    } else {
                        wait = window.setTimeout((function() {
                            return function() {
                                dispatcher.apply("click", this, args);
                                wait = null;
                            };
                        })(), 300);
                    }
                }
            });
        }
        // Copies a variable number of methods from source to target.
        let d3rebind = function(target, source) {
            let i = 1, n = arguments.length, method;
            while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
            return target;
        };

        // Method is assumed to be a standard D3 getter-setter:
        // If passed with no arguments, gets the value.
        // If passed with arguments, sets the value and returns the target.
        function d3_rebind(target, source, method) {
            return function() {
                let value = method.apply(source, arguments);
                return value === source ? target : value;
            };
        }
        return d3rebind(cc, dispatcher, 'on');
    },

    /**
     * this function is defined by referencing to the following web site.
     * accessed August 2018
     * - http://bl.ocks.org/ropeladder/83915942ac42f17c087a82001418f2ee
     */
    updateHighlightCircles() {
        let nodeUpdate = __$__.CallTreeNetwork.circle;
        let selectedContext = {};
        Object.values(__$__.Context.SpecifiedContext).forEach(contextSensitiveID => {
            selectedContext[contextSensitiveID] = true;
        });

        nodeUpdate
            .style('stroke', d => {
                let contextSensitiveID = d.data.contextSensitiveID;
                if (selectedContext[contextSensitiveID]) {
                    return 'black';
                } else {
                    return 'gray';
                }
            })
            .style('stroke-width', d => {
                let contextSensitiveID = d.data.contextSensitiveID;
                if (selectedContext[contextSensitiveID]) {
                    return 3;
                } else {
                    return 1;
                }
            });
    }
};


