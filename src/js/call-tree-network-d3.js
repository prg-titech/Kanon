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

        var g = __$__.CallTreeNetwork.svg.select('g');
        var node = g.selectAll('.node')
            .data(root.descendants(), d => d.data.contextSensitiveID);

        var nodeEnter = node
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => 'translate(' + source.y0 + ',' + source.x0 + ')')
            .on('click', d => {
                __$__.CallTreeNetwork.toggle(d);
                __$__.CallTreeNetwork.update(tree, __$__.CallTreeNetwork.root, d);
            })
            .on('dblclick', d => {
                console.log(d);
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

        var nodeUpdate = nodeEnter.merge(node);
        var duration = 500;

        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

        nodeUpdate.select("circle")
            .attr("r", 8)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff");

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        var link = g.selectAll(".link")
            .data(root.links(), d => d.target.data.contextSensitiveID);

        var linkEnter = link.enter().insert('path', "g")
            .attr('class', 'link')
            .attr('d', __$__.CallTreeNetwork.d3.linkHorizontal()
                .x(d => source.y0)
                .y(d => source.x0));

        var linkUpdate = linkEnter.merge(link);
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
            let data_temp = {};
            __$__.CallTreeNetwork.constructData(__$__.CallTree.rootNode, data_temp);
            let root = __$__.CallTreeNetwork.d3.hierarchy(data_temp);
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
        if (__$__.CallTreeNetwork.displayChildren[contextSensitiveID] === undefined) {
            __$__.CallTreeNetwork.displayChildren[contextSensitiveID] = true;
            let children = node.children;
            if (children) {
                children.forEach(childNode => {
                    __$__.CallTreeNetwork.traverseCallTree(childNode);
                });
            }
        } else if (__$__.CallTreeNetwork.displayChildren[contextSensitiveID] === true) {
            if (node._children) {
                node.children = node._children;
                node._children = null;
            }
            let children = node.children;
            if (children) {
                children.forEach(childNode => {
                    __$__.CallTreeNetwork.traverseCallTree(childNode);
                });
            }
        } else {
            if (node.children) {
                node._children = node.children;
                node.children = null;
            }
        }
    }
};


