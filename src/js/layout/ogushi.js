__$__.Layout = {
    enabled: true,


    setLocation(graph) {
        console.log("----" + document.getElementById("SelectDrawMethod").value + "----");
        if(document.getElementById("SelectDrawMethod").value == "Ogushi"){

            //一度だけgraphに変更を加える（redrawしたときにはこの変更は加えられない）
            if(!graph.makeChanges){

                //配列用のノードを追加する
                for(let nodeID of Object.keys(graph.nodes)){
                    if(graph.nodes[nodeID].label == "Array"){
                        let arrayNode = graph.nodes[nodeID];    //配列を参照するノード
                        let fields = graph.getFields(nodeID);
                        let references = new Array(fields.length);
                        let refNum = fields.length - 1;
                        for(let i = graph.edges.length - 1; i >= 0; i--){
                            if(graph.edges[i].from == nodeID && graph.edges[i].label != "ref"){
                                let toID = graph.edges[i].to;
                                let newID = nodeID + "-array" + graph.edges[i].label;
                                let newNode = new __$__.StoredGraphFormat.Node(
                                    newID, 
                                    "Kanon-ArrayNode", 
                                    false, 
                                    "object"
                                );
                                graph.pushNode(newNode);
                                graph.setArrayNode(newID);
                                references[refNum] = newID;
                                let newEdge1 = new __$__.StoredGraphFormat.Edge(
                                    newID, 
                                    toID, 
                                    "ref"
                                );
                                graph.pushEdge(newEdge1);
                                if(refNum != fields.length - 1){
                                    let newEdge2 = new __$__.StoredGraphFormat.Edge(
                                        references[refNum], 
                                        references[refNum + 1], 
                                        "next"
                                    );
                                    graph.pushEdge(newEdge2);
                                }
                                if(refNum != 0){
                                    graph.edges.splice(i, 1);
                                } else {
                                    graph.edges[i].label = "ref";
                                    graph.edges[i].to = references[0];
                                }
                                refNum--;
                            }
                        }
                    }
                }

                //どこからも参照されていないノードは表示しないようにする


                let greenEdges = graph.variableEdges;
                let layoutNodeIDs = new Array();
                for(let i = 0; i < greenEdges.length; i++){     //変数参照されているノードを追加
                    if(layoutNodeIDs.indexOf(greenEdges[i].to) == -1) layoutNodeIDs.push(greenEdges[i].to);
                }
                let globalVar = graph.getGlobalVariables();
                for(let i = 0; i < globalVar; i++){
                    if(layoutNodeIDs.indexOf(globalVar[i]) == -1) layoutNodeIDs.push(globalVar[i]);
                }
                let i = 0;
                while(true){        //変数から辿れるノードを全て追加
                    if(layoutNodeIDs[i]){
                        let current = layoutNodeIDs[i];
                        let connectNodes = graph.getConnectNodes(current);
                        for(let j = 0; j < connectNodes.length; j++){
                            let next = connectNodes[j];
                            if(layoutNodeIDs.indexOf(next) == -1) layoutNodeIDs.push(next);
                        }
                    } else break;
                    i++;
                }
                let deleteIDs = new Array();    //削除するノードのID
                for(let nodeID of Object.keys(graph.nodes)){
                    if(layoutNodeIDs.indexOf(nodeID) == -1) deleteIDs.push(nodeID);
                }
                for(let i = 0; i < deleteIDs.length; i++){
                    delete graph.nodes[deleteIDs[i]];
                    delete graph.variableNodes[deleteIDs[i]];
                    for(let j = graph.edges.length - 1; j >= 0; j--){
                        if(graph.edges[j].from == deleteIDs[i]) graph.edges.splice(j, 1);
                    }
                }
                // console.log(layoutNodeIDs[0]);
                // console.log(graph.getConnectNodes(layoutNodeIDs[0]));
            }

            setGraphLocation(graph);    //TypeScriptで書いたコードが呼び出される

            if(!graph.makeChanges){
                for(let i = 0; i < graph.edges.length; i++){
                    let edge = graph.edges[i];
                    let fromID = edge.from;
                    let toID = edge.to;
                    if(graph.nodes[fromID].label == "Kanon-ArrayNode" && 
                    graph.nodes[toID].label == "Kanon-ArrayNode" && 
                    edge.label == "next") {
                        graph.setEdgeArrowOff(fromID, toID);
                    }
                    // else if(fromID.slice(fromID.length - 6, fromID.length - 1) == "array"){
                    //     graph.setEdgeLabel(fromID, toID, fromID.slice(fromID.length - 1, fromID.length));
                    // }
                }
                for(let nodeID of Object.keys(graph.nodes)) {
                    if(nodeID.slice(nodeID.length - 6, nodeID.length - 1) == "array") {
                        graph.setLabel(nodeID, "Array [" + nodeID.slice(nodeID.length - 1, nodeID.length) + "]");
                    }
                }
                graph.makeChanges = true;
            }

            console.log("graph =");
            console.log(graph);
            
        } else {

            let visGraph = graph.generateVisjsGraph(true);
            __$__.Layout.setLinkedList(visGraph);
            __$__.Layout.setBinaryTree(visGraph);
            for (let i = 0; i < visGraph.nodes.length; i++) {
                let node = visGraph.nodes[i];
                if (node.x !== undefined && node.y !== undefined) {
                    graph.setLocation(node.id, node.x, node.y);
                }
            }

            console.log("graph =");
            console.log(graph);

        }
        
    },


    /**
     * We assume that linked-list is already completed(this means that next edges are defined between nodes).
     */
    setLinkedList: function(graph, nodeLabel = "Node", nextLabel = 'next', valueLabel = 'val') {
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
            let fromNode = graph.nodes.find(node => {
                return node.id === edge.from;
            });
            let toNode = graph.nodes.find(node => {
                return node.id === edge.to;
            });
    
            if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
                fromNode.__next = toNode;
                toNode.__prev = fromNode;
            }
        });
    
        // This loop defines __val property to the nodes that have a property that represents valueLabel of the node.
        listEdgesOfValue.forEach(edge => {
            let fromNode = graph.nodes.find(node => {
                return node.id === edge.from;
            });
            let valNode = graph.nodes.find(node => {
                return node.id === edge.to
            });
    
            if (fromNode.label === nodeLabel)
                fromNode.__val = valNode;
        });
    
        /**
         * sort listNodes in following code
         * In order to support multiple linked-lists,
         * each list is a list that is a element of sortedListNode.
         * e.g.)
         * list1 : a -> b -> c
         * list2 : w -> x -> y -> z
         * then, sortedListNode is [[a, b, c], [w, x, y, z]]
         * (where a, b, etc. mean nodes.)
         */
        let sortedListNode = [];
        let sortedListNode_CenterPos = [];
    
        while (listNodes.length > 0) {
            let list = [listNodes.shift()];
            let pos = {
                x: list[0].x || 0,
                y: list[0].y || 0
            };
            list[0].__checked = true;
            while (list[0].__prev && !list[0].__prev.__checked) {
                let prev = list[0].__prev;
                pos.x += prev.x || 0;
                pos.y += prev.y || 0;
                prev.__checked = true;
                list.unshift(listNodes.splice(listNodes.indexOf(prev),1)[0]);
                delete list[1].__prev;
                delete prev.__next;
            }
            while (list[list.length-1].__next && !list[list.length-1].__next.__checked) {
                let next = list[list.length-1].__next;
                pos.x += next.x || 0;
                pos.y += next.y || 0;
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
        for (let i = 0; i < sortedListNode.length; i++) {
            let region = {x: {from: NaN, to: NaN}, y: {from: NaN, to: NaN}};
            for (let j = 0; j < sortedListNode[i].length; j++) {
                let node = sortedListNode[i][j];

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

                node.x = newPos.x;
                node.y = newPos.y;
    
                if (node.__val) {
                    if (!(node.x > region.x.from))
                        region.x.from = node.x;
                    if (!(region.x.to > node.x))
                        region.x.to = node.x;
                    if (!(node.y + 100 > region.y.from))
                        region.y.from = node.y + 100;
                    if (!(region.y.to > node.y + 100))
                        region.y.to = node.y + 100;

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
    },
    

    /**
     * We assume that binary tree is already completed(this means that left and right edges are defined between nodes).
     */
    setBinaryTree: function(graph, nodeLabel = "Node", leftLabel = 'left', rightLabel = 'right', valueLabel = 'val') {
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
         * ...
         * if height of a tree is n, then width = 2^n;
         */
        let heightBinaryTree = rootNode => {
            if (rootNode === undefined) {
                return -1;
            } else {
                return Math.max(heightBinaryTree(rootNode.__left), heightBinaryTree(rootNode.__right)) + 1;
            }
        };
    
        makeTree: while (listNodes.length > 0) {
            let node = listNodes[0];
            let centerPos = {x: 0, y: 0};
            let n = 0; // the number of the node of this tree
    
            let checked = [node];
            while (node.__parent) {
                if (checked.indexOf(node.__parent) === -1) {
                    if (listNodes.indexOf(node.__parent) >= 0) {
                        node = node.__parent;
                        checked.push(node);
                    } else {
                        delete node.__parent;
                        break;
                    }
                } else {
                    // Here is executed when node objects are not tree.
                    checked.forEach(checkedNode => {
                        if (checkedNode.__parent)
                            delete checkedNode.__parent;
                        if (checkedNode.__left)
                            delete checkedNode.__left;
                        if (checkedNode.__right)
                            delete checkedNode.__right;
                        listNodes.splice(listNodes.indexOf(checkedNode), 1);
                    });
                    continue makeTree;
                }
            }

            let tree = {
                root: node,
                height: heightBinaryTree(node)
            };
    
            let current = node;
            let isTree = false;
            while (current && (current.__left || current.__right || current.__parent) || isTree && current === tree.root) {
                if (current.__left && listNodes.indexOf(current.__left) >= 0) {
                    let left = current.__left;
                    current = left;
                } else if (current.__right && listNodes.indexOf(current.__right) >= 0) {
                    let right = current.__right;
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
            } else {
                listNodes.splice(0, 1);
            }
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
            let width_mid = Math.floor((width_from + width_to) / 2);
            
            let ret = 1;
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
        };
    
        // this array represents how distance the root node is moved.
        let mvRootPos = [];
        let count = 0;
        for (let i = 0; i < treeRoots.length; i++) {
            let root = treeRoots[i].root;
            oldCenterPos.push({x: 0, y: 0});
            let width = Math.pow(2, treeRoots[i].height);
    
            let nodeSize = setPosition(root, 0, count, count + width - 1, i);
            oldCenterPos[i].x /= nodeSize;
            oldCenterPos[i].y /= nodeSize;
    
            mvRootPos.push({
                x: tree_CenterPos[i].x - oldCenterPos[i].x,
                y: tree_CenterPos[i].y - oldCenterPos[i].y
            });
    
            count += width;
        }
    
        graph.nodes.forEach(node => {
            if (node.__tree_num !== undefined) {
                let beforePos = __$__.StorePositions.oldNetwork.nodes[node.id];
                let mvPos = mvRootPos[node.__tree_num];
                node.x += mvPos.x;
                node.y += mvPos.y;
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
    },

    switchEnabled: () => {
        if (__$__.Layout.enabled) {
            __$__.Layout.enabled = false;
            __$__.Update.updateValueOfArray = false;
        } else {
            __$__.Layout.enabled = true;
            __$__.Update.updateValueOfArray = true;
        }
        __$__.Update.updateArrayValuePosition();
        __$__.Update.ContextUpdate();
    }
};
