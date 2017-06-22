__$__.Animation = {
    nowAnimationID: 0,


    /**
     * @param: id{String or int} id of the node you want to move by using animation
     * @param: to{Object {x: int, y: int}} the destination position of the node
     * @param: timeID{int}
     * @param: ms{int}
     *
     * This function enables node to move by using animation.
     */
    moveWithAnimation: function(id, to, animationID, ms = 1000) {
        const startTime = (new Date).getTime();
    
        let pos = __$__.network.getPositions()[id];
        let delta = {
            x: to.x - pos.x,
            y: to.y - pos.y
        };
        if (delta.x === 0 && delta.y === 0)
            return;
    
        let interval = setInterval(() => {
            let currentTime = (new Date).getTime();
            if (currentTime - startTime >= ms || animationID !== __$__.Animation.nowAnimationID) {
                clearInterval(interval);
                return;
            }
            
            __$__.network.moveNode(id, pos.x + Math.floor(delta.x * (currentTime - startTime) / ms), pos.y + Math.floor(delta.y * (currentTime - startTime) / ms))
            __$__.Update.updateArray({nodes: [id]});
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
        let nextPos = [];
        let pos = __$__.network.getPositions();
        graph.nodes.forEach(node => {
            if (pos[node.id]) {
                nextPos.push({
                    id: node.id,
                    x: node.x,
                    y: node.y
                });
                node.x = pos[node.id].x;
                node.y = pos[node.id].y;
            }
        });
        __$__.nodes = new vis.DataSet(graph.nodes);
        __$__.edges = new vis.DataSet(graph.edges);
        __$__.network.setData({
            nodes: __$__.nodes,
            edges: __$__.edges
        });
        graph.nodes.forEach(node => {__$__.Update.updateArray({nodes: [node.id]});});
        if (nextPos.length > 0) {
            __$__.Animation.nowAnimationID++;
            nextPos.forEach(pos => {
                __$__.Animation.moveWithAnimation(pos.id, pos, __$__.Animation.nowAnimationID, 500);
            });
            // __$__.network.fit({
            //     animation: {
            //         easingFuncion: 'linear'
            //     }
            // });
        }
    }
}
