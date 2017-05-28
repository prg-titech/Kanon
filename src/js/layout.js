__$__.Layout = {};


/**
 * We assume that linked-list is already completed(this means that next edges are defined between nodes).
 */
__$__.Layout.LinkedList = function(graph, nodeLabel = "Node", nextLabel = 'next', valueLabel = 'val') {
    let isChanged = false;
    // collect nodes whose label are nodeLabel
    let listNodes = [];
    graph.nodes.forEach(node => {
        node.__checked = false;
        if (node.label === nodeLabel) {
            listNodes.push(node);
        }
    });

    // collect edges whose label are nextLabel
    let listEdgesOfNext = [];
    // collect edges whose label are valueLabel
    let listEdgesOfValue = [];
    graph.edges.forEach(edge => {
        if (edge.label === nextLabel) {
            listEdgesOfNext.push(edge);
        } else if (edge.label === valueLabel) {
            listEdgesOfValue.push(edge);
        }
    });

    // This loop defines __next and __prev property to the nodes whose label are nodeLabel.
    listEdgesOfNext.forEach(edge => {
        let fromNode = graph.nodes.filter(node => {
            return node.id === edge.from;
        })[0];
        let toNode = graph.nodes.filter(node => {
            return node.id === edge.to;
        })[0];

        if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
            fromNode.__next = toNode;
            toNode.__prev = fromNode;
        }
    });

    // This loop defines __val property to the nodes that have a property that represents valueLabel of the node.
    listEdgesOfValue.forEach(edge => {
        let fromNode = graph.nodes.filter(node => {
            return node.id === edge.from;
        })[0];
        let valNode = graph.nodes.filter(node => {
            return node.id === edge.to
        })[0];

        if (fromNode.label === nodeLabel)
            fromNode.__val = valNode;
    });

    /**
     * sort listNodes in following code
     * In order to support some linked-list,
     * each list is a list that is a element of sortedListNode.
     * e.g.)
     * list1 : a -> b -> c
     * list2 : w -> x -> y -> z
     * then, sortedListNode is [[a, b, c], [w, x, y, z]]
     * (where a, b, etc. represent nodes.)
     */
    let sortedListNode = [];

    while (listNodes.length > 0) {
        let list = [listNodes.shift()];
        list[0].__checked = true;
        while (list[0].__prev && !list[0].__prev.__checked) {
            let prev = list[0].__prev;
            prev.__checked = true;
            list.unshift(listNodes.splice(listNodes.indexOf(prev),1)[0]);
            delete list[1].__prev;
            delete prev.__next;
        }
        while (list[list.length-1].__next && !list[list.length-1].__next.__checked) {
            let next = list[list.length-1].__next;
            next.__checked = true;
            delete list[list.length-1].__next;
            list.push(listNodes.splice(listNodes.indexOf(next),1)[0]);
            delete next.__prev;
        }

        if (list.length > 1)
            sortedListNode.push(list);
    }

    // register nodes position and the valueLabel nodes
    for (var i = 0; i < sortedListNode.length; i++) {
        for (var j = 0; j < sortedListNode[i].length; j++) {
            let node = sortedListNode[i][j];
            let pos = __$__.StorePositions.oldNetworkNodesData[node.id];
            if (j === 0) {
                node.x = pos.x;
                node.y = pos.y;
            } else {
                let prevNode = sortedListNode[i][j-1];
                if (!isChanged && (pos.x !== prevNode.x + 100 || pos.y !== prevNode.y))
                    isChanged = true;
                node.x = prevNode.x + 100;
                node.y = prevNode.y;
            }

            if (node.__val) {
                let valPos = __$__.StorePositions.oldNetworkNodesData[node.__val.id];
                if (!isChanged && (valPos.x !== node.x || valPos.y !== node.y + 100))
                    isChanged = true;
                node.__val.x = node.x;
                node.__val.y = node.y + 100;
                delete node.__val;
            }
        }
    }

    graph.nodes.forEach(node => {
        if (node.__next !== undefined)
            delete node.__next;
        if (node.__prev !== undefined)
            delete node.__prev;
        if (node.__val !== undefined)
            delete node.__val;
    });

    return isChanged;
};


__$__.Layout.RedrawLinkedList = function() {
    let graph = __$__.Context.LastGraph;

    __$__.StorePositions.setPositions(graph);
    let isChanged = __$__.Layout.LinkedList(graph);
    if (isChanged) {
        __$__.network.setData({
            nodes: new vis.DataSet(graph.nodes),
            edges: new vis.DataSet(graph.edges)
        });
        __$__.StorePositions.registerPositions();
        __$__.Context.Draw('redraw');
    }
};


/**
 * We assume that binary tree is already completed(this means that left and right edges are defined between nodes).
 */
__$__.Layout.BinaryTree = function(graph, nodeLabel = "Node", leftLabel = 'left', rightLabel = 'right', valueLabel = 'val') {
    let isChanged = false;

    // collect nodes whose label are nodeLabel
    let listNodes = [];
    graph.nodes.forEach(node => {
        if (node.label === nodeLabel) {
            listNodes.push(node);
        }
    });

    // collect edges whose label are leftLabel or rightLabel
    let listEdgesOfLeft = [];
    let listEdgesOfRight = [];
    // collect edges whose label are valueLabel
    let listEdgesOfValue = [];
    graph.edges.forEach(edge => {
        if (edge.label === leftLabel) {
            listEdgesOfLeft.push(edge);
        } else if (edge.label === rightLabel) {
            listEdgesOfRight.push(edge);
        } else if (edge.label === valueLabel) {
            listEdgesOfValue.push(edge);
        }
    });

    // This loop defines __left and __parent property to the nodes whose label are nodeLabel.
    listEdgesOfLeft.forEach(edge => {
        let fromNode = graph.nodes.filter(node => {
            return node.id === edge.from;
        })[0];
        let toNode = graph.nodes.filter(node => {
            return node.id === edge.to;
        })[0];

        if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
            fromNode.__left = toNode;
            toNode.__parent = fromNode;
        }
    });

    // This loop defines __right and __parent property to the nodes whose label are nodeLabel.
    listEdgesOfRight.forEach(edge => {
        let fromNode = graph.nodes.filter(node => {
            return node.id === edge.from;
        })[0];
        let toNode = graph.nodes.filter(node => {
            return node.id === edge.to;
        })[0];

        if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
            fromNode.__right = toNode;
            toNode.__parent = fromNode;
        }
    });

    // This loop defines __val property to the nodes that have a property that represents valueLabel of the node.
    listEdgesOfValue.forEach(edge => {
        let fromNode = graph.nodes.filter(node => {
            return node.id === edge.from;
        })[0];
        let valNode = graph.nodes.filter(node => {
            return node.id === edge.to
        })[0];

        if (fromNode.label === nodeLabel)
            fromNode.__val = valNode;
    });

    // these types are Array because a graph might have some trees.
    let treeRoots = [];
    /**
     * if height of a tree is 0, then width = 1;
     * if height of a tree is 1, then width = 2;
     * if height of a tree is 2, then width = 4;
     * if height of a tree is 3, then width = 8;
     */
    let heightBinaryTree = function(rootNode) {
        if (rootNode === undefined) {
            return -1;
        } else {
            return Math.max(heightBinaryTree(rootNode.__left), heightBinaryTree(rootNode.__right)) + 1;
        }
    };

    while (listNodes.length > 0) {
        let node = listNodes[0];

        while (node.__parent) {
            node = node.__parent;
        }
        let tree = {
            root: node,
            height: heightBinaryTree(node)
        };

        let current = node;
        let isTree = false;
        while (current && (current.__left || current.__right || current.__parent)) {
            if (current.__left && listNodes.indexOf(current.__left) > 0) {
                let left = current.__left;
                // delete current.__left;
                current = left;
            } else if (current.__right && listNodes.indexOf(current.__right) > 0) {
                let right = current.__right;
                // delete current.__right;
                current = right;
            } else {
                let parent = current.__parent;
                delete current.__parent;
                listNodes.splice(listNodes.indexOf(current), 1);
                current = parent;
            }
            isTree = true;
        }

        if (isTree)
            treeRoots.push(tree);
        else
            break;
    }

    let count = 0;
    let setPosition = function(node, depth, width_from, width_to, tree_num) {
        let next_x = (width_to === 0) ? 0 : ((width_from + width_to) / 2) * 100;
        let next_y = depth * 100;

        // register node's position.
        node.x = next_x;
        node.y = next_y;
        node.__tree_num = tree_num;

        if (node.__val) {
            node.__val.x = node.x;
            node.__val.y = node.y + 75;
            node.__val.__tree_num = tree_num;
            delete node.__val;
        }

        // define the middle between width_from and width_to.
        let width_mid = Math.floor((width_from + width_to) / 2)
        
        if (node.__left) {
            // recursive call if node.__left is defined.
            setPosition(node.__left, depth+1, width_from, width_mid, tree_num);
            delete node.__left;
        }

        if (node.__right) {
            // recursive call if node.__right is defined.
            setPosition(node.__right, depth+1, width_mid + 1, width_to, tree_num);
            delete node.__right;
        }
    }

    // this array represents how distance the root node is moved.
    let mvRootPos = [];
    for (var i = 0; i < treeRoots.length; i++) {
        let root = treeRoots[i].root;
        let width = Math.pow(2, treeRoots[i].height);

        setPosition(root, 0, count, count + width - 1, i);

        mvRootPos.push({
            x: __$__.StorePositions.oldNetworkNodesData[root.id].x - root.x,
            y: __$__.StorePositions.oldNetworkNodesData[root.id].y - root.y
        });

        count += width;
    }

    graph.nodes.forEach(node => {
        if (node.__tree_num !== undefined) {
            let beforePos = __$__.StorePositions.oldNetworkNodesData[node.id];
            let mvPos = mvRootPos[node.__tree_num];
            node.x += mvPos.x;
            node.y += mvPos.y;
            if (!isChanged && (beforePos.x !== node.x || beforePos.y !== node.y))
                isChanged = true;
            delete node.__tree_num;
        }
        if (node.__left !== undefined)
            delete node.__left;
        if (node.__right !== undefined)
            delete node.__right;
        if (node.__parent !== undefined)
            delete node.__parent;
        if (node.__val !== undefined)
            delete node.__val;
    });

    return isChanged;
};


__$__.Layout.RedrawBinaryTree = function() {
    let graph = __$__.Context.LastGraph;

    __$__.StorePositions.setPositions(graph);
    let isChanged = __$__.Layout.BinaryTree(graph);
    if (isChanged) {
        __$__.network.setData({
            nodes: new vis.DataSet(graph.nodes),
            edges: new vis.DataSet(graph.edges)
        });
        __$__.StorePositions.registerPositions();
        __$__.Context.Draw('redraw');
    }
};
