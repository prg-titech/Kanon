__$__.Animation = {
    nowAnimationID: 0,


    /**
     * @param: node_id {String or int} id of the node you want to move by using animation
     * @param: to {Object {x: int, y: int}} the destination position of the node
     * @param: animationID {int} this argument represents an identifier for animation.
     * @param: ms {int}
     *
     * This function enables node to move by using animation.
     */
    moveWithAnimation: function(node_id, to, animationID, ms = 1000) {
        const start_time = (new Date).getTime();
    
        let node_pos = __$__.ObjectGraphNetwork.network.getPositions()[node_id];
        let delta = {
            x: to.x - node_pos.x,
            y: to.y - node_pos.y
        };
        if (delta.x === 0 && delta.y === 0)
            return;
    
        let interval = setInterval(() => {
            let current_time = (new Date).getTime();
            if (current_time - start_time >= ms) {
                __$__.ObjectGraphNetwork.network.moveNode(node_id, to.x, to.y);
                __$__.Update.updateArrayPosition({nodes: [node_id]});
                __$__.StorePositions.registerPositions();
                clearInterval(interval);
                return;
            }
            if (current_time - start_time >= ms || animationID !== __$__.Animation.nowAnimationID) {
                clearInterval(interval);
                return;
            }
            
            __$__.ObjectGraphNetwork.network.moveNode(node_id, node_pos.x + Math.floor(delta.x * (current_time - start_time) / ms), node_pos.y + Math.floor(delta.y * (current_time - start_time) / ms));
            __$__.Update.updateArrayPosition({nodes: [node_id]});
            __$__.StorePositions.registerPositions();
        }, 1);
    },


    /**
     * @param: graph {Object {nodes: Array, edges: Array}}
     *
     * this function can set graph to network with animation.
     * we assume that some nodes of the graph that is a argument of this function
     * have already x property and y property.
     * If the node have x and y property and the node ID already exist in the network,
     * we use animation to move the node.
     */
    setData: function(graph) {
        let next_position = [];
        let node_positions = __$__.ObjectGraphNetwork.network.getPositions();
        graph.nodes.forEach(node => {
            if (node_positions[node.id] && node.x) {
                next_position.push({
                    id: node.id,
                    x: node.x,
                    y: node.y
                });
                node.x = node_positions[node.id].x;
                node.y = node_positions[node.id].y;
            }
        });
        __$__.ObjectGraphNetwork.nodes = new vis.DataSet(graph.nodes);
        __$__.ObjectGraphNetwork.edges = new vis.DataSet(graph.edges);
        __$__.ObjectGraphNetwork.network.setData({
            nodes: __$__.ObjectGraphNetwork.nodes,
            edges: __$__.ObjectGraphNetwork.edges
        });
        __$__.ObjectGraphNetwork.network.once('stabilized', param => {
            __$__.ObjectGraphNetwork.nodes.forEach(node => {
                if (node.id.slice(0, 11) !== '__Variable-')
                    __$__.ObjectGraphNetwork.nodes.update({id: node.id, fixed: true});
            });
        });
        Object.keys(__$__.ObjectGraphNetwork.nodes._data).forEach(label => {
            if (node_positions[label])
                __$__.ObjectGraphNetwork.network.moveNode(label, node_positions[label].x, node_positions[label].y);
        });
        if (__$__.Update.useBoxToVisualizeArray)
            __$__.Context.Arrays.forEach(arr => {__$__.Update.updateArrayPosition({nodes: [arr[0]]})});

        if (next_position.length) {
            __$__.Animation.nowAnimationID++;
            next_position.forEach(pos => {
                __$__.Animation.moveWithAnimation(pos.id, pos, __$__.Animation.nowAnimationID, 500);
            });
        }
    }
};
