__$__.Layout = {
    /**
     * We assume that linked-list is already completed(this means that next edges are defined between nodes).
     */
    setLinkedList: function(graph, nodeLabel = "Node", nextLabel = 'next', valueLabel = 'val') {
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
        let sortedListNode_CenterPos = [];
    
        while (listNodes.length > 0) {
            let list = [listNodes.shift()];
            let pos = {x: list[0].x, y: list[0].y};
            list[0].__checked = true;
            while (list[0].__prev && !list[0].__prev.__checked) {
                let prev = list[0].__prev;
                pos.x += prev.x;
                pos.y += prev.y;
                prev.__checked = true;
                list.unshift(listNodes.splice(listNodes.indexOf(prev),1)[0]);
                delete list[1].__prev;
                delete prev.__next;
            }
            while (list[list.length-1].__next && !list[list.length-1].__next.__checked) {
                let next = list[list.length-1].__next;
                pos.x += next.x;
                pos.y += next.y;
                next.__checked = true;
                delete list[list.length-1].__next;
                list.push(listNodes.splice(listNodes.indexOf(next),1)[0]);
                delete next.__prev;
            }
    
            if (list.length > 1) {
                pos.x /= list.length;
                pos.y /= list.length;

                sortedListNode.push(list);
                sortedListNode_CenterPos.push(pos);
            } else {
                list[0].__checked = false;
            }
        }
    
        let listRegion = [];
        // register nodes position and the valueLabel nodes
        for (var i = 0; i < sortedListNode.length; i++) {
            let region = {x: {from: NaN, to: NaN}, y: {from: NaN, to: NaN}};
            for (var j = 0; j < sortedListNode[i].length; j++) {
                let node = sortedListNode[i][j];
                let pos = __$__.StorePositions.oldNetworkNodesData[node.id];
                // if (j === 0) {
                //     node.x = pos.x;
                //     node.y = pos.y;
                // } else {
                //     let prevNode = sortedListNode[i][j-1];
                //     if (!isChanged && (pos.x !== prevNode.x + 100 || pos.y !== prevNode.y))
                //         isChanged = true;
                //     node.x = prevNode.x + 100;
                //     node.y = prevNode.y;
                // }

                let newPos = {
                    x: sortedListNode_CenterPos[i].x + 100 * (j - (sortedListNode[i].length - 1) / 2),
                    y: sortedListNode_CenterPos[i].y
                };

                if (!(newPos.x > region.x.from))
                    region.x.from = newPos.x;
                if (!(region.x.to > newPos.x))
                    region.x.to = newPos.x;
                if (!(newPos.y > region.y.from))
                    region.y.from = newPos.y;
                if (!(region.y.to > newPos.y))
                    region.y.to = newPos.y;

                if (!isChanged && pos.x !== newPos.x || pos.y !== newPos.y)
                    isChanged = true;
                node.x = newPos.x;
                node.y = newPos.y;
    
                if (node.__val) {
                    let valPos = __$__.StorePositions.oldNetworkNodesData[node.__val.id];

                    if (!(node.x > region.x.from))
                        region.x.from = node.x;
                    if (!(region.x.to > node.x))
                        region.x.to = node.x;
                    if (!(node.y + 100 > region.y.from))
                        region.y.from = node.y + 100;
                    if (!(region.y.to > node.y + 100))
                        region.y.to = node.y + 100;

                    if (!isChanged && (valPos.x !== node.x || valPos.y !== node.y + 100))
                        isChanged = true;
                    node.__val.x = node.x;
                    node.__val.y = node.y + 100;
                    node.__val.__checked = true;
                }
            }
            region.x.from -= 10;
            region.x.to += 10;
            region.y.from -= 10;
            region.y.to += 10;
            listRegion.push(region);
        }
    
        graph.nodes.forEach(node => {
            if (node.__checked) {
                delete node.__checked;
            } else {
                listRegion.forEach(region => {
                    if (region.x.from <= node.x && node.x <= region.x.to
                        && region.y.from <= node.y && node.y <= region.y.to) {
                        node.y = region.y.to + 50;
                        if (node.__val) {
                            node.__val.x = node.x;
                            node.__val.y = node.y + 100;
                        }
                    }
                });
            }
            if (node.__next !== undefined)
                delete node.__next;
            if (node.__prev !== undefined)
                delete node.__prev;
            if (node.__val !== undefined)
                delete node.__val;
        });
    
        return isChanged;
    },
    
    RedrawLinkedList: function(graph = __$__.Context.LastGraph) {
        __$__.StorePositions.setPositions(graph);
        let isChanged = __$__.Layout.setLinkedList(graph);
        if (isChanged) {
            __$__.Animation.SetData(graph);
            __$__.StorePositions.registerPositions();
            __$__.Context.Draw('redraw');
        }
    },
    
    /**
     * We assume that binary tree is already completed(this means that left and right edges are defined between nodes).
     */
    setBinaryTree: function(graph, nodeLabel = "Node", leftLabel = 'left', rightLabel = 'right', valueLabel = 'val') {
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
        let tree_CenterPos = [];
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
            let centerPos = {x: 0, y: 0};
            let n = 1; // the number of the node of this tree
    
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
                    centerPos.x += current.x;
                    centerPos.y += current.y;
                    current = parent;
                    n++;
                }
                isTree = true;
            }
    
            if (isTree) {
                centerPos.x /= n;
                centerPos.y /= n;
                treeRoots.push(tree);
                tree_CenterPos.push(centerPos);
            } else
                break;
        }
    
        let oldCenterPos = [];
        let setPosition = function(node, depth, width_from, width_to, tree_num) {
            let next_x = (width_to === 0) ? 0 : ((width_from + width_to) / 2) * 100;
            let next_y = depth * 100;
    
            // register node's position.
            node.x = next_x;
            node.y = next_y;
            oldCenterPos[tree_num].x += node.x;
            oldCenterPos[tree_num].y += node.y;
            node.__tree_num = tree_num;
    
            if (node.__val) {
                node.__val.x = node.x;
                node.__val.y = node.y + 75;
                node.__val.__tree_num = tree_num;
                delete node.__val;
            }
    
            // define the middle between width_from and width_to.
            let width_mid = Math.floor((width_from + width_to) / 2)
            
            var ret = 1;
            if (node.__left) {
                // recursive call if node.__left is defined.
                ret += setPosition(node.__left, depth+1, width_from, width_mid, tree_num);
                delete node.__left;
            }
    
            if (node.__right) {
                // recursive call if node.__right is defined.
                ret += setPosition(node.__right, depth+1, width_mid + 1, width_to, tree_num);
                delete node.__right;
            }
            return ret;
        }
    
        // this array represents how distance the root node is moved.
        let mvRootPos = [];
        let count = 0;
        for (var i = 0; i < treeRoots.length; i++) {
            let root = treeRoots[i].root;
            oldCenterPos.push({x: 0, y: 0});
            let width = Math.pow(2, treeRoots[i].height);
    
            let nodeSize = setPosition(root, 0, count, count + width - 1, i);
            oldCenterPos[i].x /= nodeSize;
            oldCenterPos[i].y /= nodeSize;
    
            // mvRootPos.push({
            //     x: __$__.StorePositions.oldNetworkNodesData[root.id].x - root.x,
            //     y: __$__.StorePositions.oldNetworkNodesData[root.id].y - root.y
            // });
            mvRootPos.push({
                x: tree_CenterPos[i].x - oldCenterPos[i].x,
                y: tree_CenterPos[i].y - oldCenterPos[i].y
            })
    
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
    },
    
    RedrawBinaryTree: function(graph = __$__.Context.LastGraph) {
        __$__.StorePositions.setPositions(graph);
        let isChanged = __$__.Layout.setBinaryTree(graph);
        if (isChanged) {
            __$__.Animation.SetData(graph);
            __$__.StorePositions.registerPositions();
            __$__.Context.Draw('redraw');
        }
    }
};
