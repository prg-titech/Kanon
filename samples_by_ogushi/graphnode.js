/*　グラフのノードとエッジ　*/

class Node {
    constructor(name){
        this.name = name;
        this.edgelist = null;
    }

    addList(endNode){
        if(this.edgelist == null){
            var cons = new Edge(endNode);
            this.edgelist = cons;
        } else {
            this.edgelist.add(endNode);
        }
    }
}

class Edge {
    constructor(node){
        this.next = null;
        this.node = node;
    }

    add(node){
        if(this.next == null){
            var cons = new Edge(node);
            this.next = cons;
        } else {
            this.next.add(node);
        }
    }
}

/**
 * 新たなエッジをエッジリストに追加する関数
 * @param {string} startDot 始点ノードの名前
 * @param {string} endDot 終点ノードの名前
 * @param {string[]} edgelist エッジを加えるエッジリスト
 */
function addEdge(startDot, endDot, edgelist){
    edgelist.push(startDot);
    edgelist.push(endDot);
}

/**
 * エッジリストを受け取ってグラフオブジェクトを生成する関数
 * @param {string[]} edgelist エッジリスト
 * @return {Node[]} 生成されたノードオブジェクトの集合
 */
function makeGraphObject(edgelist){
    var makedNodes = new Array();
    var GraphObjects = new Array();

    for(var i = 0; i < edgelist.length / 2; i++){
        var startNode;
        var endNode;

        if(makedNodes.indexOf(edgelist[2*i]) == -1){
            makedNodes.push(edgelist[2*i]);
            startNode = new Node(edgelist[2*i]);
            GraphObjects.push(startNode);
        } else {
            startNode = GraphObjects[makedNodes.indexOf(edgelist[2*i])];
        }

        if(makedNodes.indexOf(edgelist[2*i+1]) == -1){
            makedNodes.push(edgelist[2*i+1]);
            endNode = new Node(edgelist[2*i+1]);
            GraphObjects.push(endNode);
        } else {
            endNode = GraphObjects[makedNodes.indexOf(edgelist[2*i+1])];
        }

        console.log("i = " + i);
        console.log("startNode = ");
        console.log(startNode);
        console.log("endNode = ");
        console.log(endNode);
        startNode.addList(endNode);
    }

    var re = GraphObjects[0];
    GraphObjects.length = 0;
    return re;
}

var EdgeList = new Array();
addEdge("A", "B", EdgeList);
addEdge("C", "A", EdgeList);
addEdge("B", "C", EdgeList);

var graphobject = makeGraphObject(EdgeList);
EdgeList.length = 0;