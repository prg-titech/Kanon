/**
 * ノード
 */
class Node {
    constructor(id) {
        this.edgesTo      = [];
        this.edgesCost    = [];
        this.done         = false;
        this.cost         = -1;
        this.id           = id;
        this.previousNode = null;
    }

    addNode(node, cost) {
        this.edgesTo.push(node);
        this.edgesCost.push(cost);
    }
}

function createNodes() {
    var node1 = new Node(1); // start
    var node2 = new Node(2); // top
    var node3 = new Node(3); // center
    var node4 = new Node(4); // bottom-left
    var node5 = new Node(5); // bottom-right
    var node6 = new Node(6); // goal

    node1.addNode(node2, 5);
    node1.addNode(node3, 4);
    node1.addNode(node4, 2);

    node2.addNode(node1, 5);
    node2.addNode(node6, 6);
    node2.addNode(node3, 2);

    node3.addNode(node2, 2);
    node3.addNode(node1, 4);
    node3.addNode(node4, 3);
    node3.addNode(node5, 2);

    node4.addNode(node1, 2);
    node4.addNode(node3, 3);
    node4.addNode(node5, 6);

    node5.addNode(node4, 6);
    node5.addNode(node3, 2);
    node5.addNode(node6, 4);

    node6.addNode(node2, 6);
    node6.addNode(node5, 4);

    return [
        node1, node2, node3, node4, node5, node6
    ];
}


function main() {

    var nodes = createNodes();

    // start node is first node
    nodes[0].cost = 0;

    while (true) {
        var processNode = null;

        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];

            // 訪問済み or まだコストが未設定
            if (node.done || node.cost < 0) {
                continue;
            }

            if (!processNode) {
                processNode = node;
                continue;
            }

            // 一番小さいコストのノードを探す
            if (node.cost < processNode.cost) {
                processNode = node;
            }
        }

        if (!processNode) {
            break;
        }

        processNode.done = true;

        for (var i = 0; i < processNode.edgesTo.length; i++) {
            var node = processNode.edgesTo[i];
            var cost = processNode.cost + processNode.edgesCost[i];

            // コストが未設定 or コストの少ない経路がある場合はアップデート
            var needsUpdate = (node.cost < 0) || (node.cost > cost);
            if (needsUpdate) {
                node.cost = cost;
                node.previousNode = processNode;
            }
        }
    }

    console.log('Has been done to search path.');
    console.log(nodes);

    var goalNode = nodes[5];
    console.log('Shoten cost is ' + goalNode.cost);

    console.log('Shoten path');

    console.log('=====================');
    var path = 'Goal -> ';
    var currentNode = goalNode;
    while(true) {
        var nextNode = currentNode.previousNode;
        if (!nextNode) {
            path += ' Start';
            break;
        }
        path += nextNode.id + ' -> ';
        currentNode = nextNode;
    }

    console.log(path);
    console.log('=====================');
}

// Start this program.
main();