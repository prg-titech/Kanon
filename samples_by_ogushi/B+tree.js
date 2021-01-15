/*　B+木(オーダー3)　*/

class Leaf {
    constructor(val1){
        this.val1 = val1;
        this.val2 = null;
        this.val3 = null;
        this.next = null;
        this.prev = null;
        this.parent = null;
    }

    //リーフにvalを追加
    addVal(val){
        if(this.val3 != null){
            throw "leaf has 3 values!!";
        } else if(this.val2 != null){
            if(val < this.val1){
                var temp1 = this.val1;
                var temp2 = this.val2;
                this.val1 = val;
                this.val2 = temp1;
                this.val3 = temp2;
            } else if(this.val1 <= val && val < this.val2){
                var temp = this.val2;
                this.val2 = val;
                this.val3 = temp;
            } else if(this.val2 <= val){
                this.val3 = val;
            } else {
                throw "val is not a number!!";
            }
        } else {
            if(val < this.val1){
                var temp = this.val1;
                this.val1 = val;
                this.val2 = temp;
            } else if(this.val1 <= val){
                this.val2 = val;
            } else {
                throw "val is not a number!!";
            }
        }
        this.split();
    }

    //3つのvalを持っていたら分割し、中心のvalは親ノードに移動
    split(){
        if(this.val3 != null){
            var newLeaf = new Leaf(this.val1);
            var temp1 = this.val2;
            var temp2 = this.val3;
            this.val1 = temp1;
            this.val2 = temp2;
            this.val3 = null;
            if(this.prev != null){
                var prev = this.prev;
                prev.next = newLeaf;
                newLeaf.prev = prev;
            }
            newLeaf.next = this;
            this.prev = newLeaf;
            if(this.parent == null){
                this.parent = new Node(temp1, newLeaf, this);
            } else {
                this.parent.addValAndEdge(temp1, newLeaf);
            }
            newLeaf.parent = this.parent;
            this.parent.split();
        }
    }

    returnRoot(){
        if(this.parent == null){
            return this;
        } else {
            return this.parent.returnRoot();
        }
    }

    insertPrevNull(){
        this.prev = null;
        if(this.next == null){
            return;
        } else {
            this.next.insertPrevNull();
        }
    }
}

class Node {
    constructor(val1, node1, node2){
        this.val1 = val1;
        this.val2 = null;
        this.val3 = null;
        this.edge1 = node1;
        this.edge2 = node2;
        this.edge3 = null;
        this.edge4 = null;
        this.parent = null;
    }

    addSecondVal(val2){
        if(this.val1 < val2){
            this.val2 = val2;
        } else {
            var temp = this.val1;
            this.val1 = val2;
            this.val2 = temp;
        }
    }

    addValAndEdge(val, node){
        if(this.val3 != null){
            throw "node has 3 values!!";
        } else if(this.val2 != null){       //2つのvalを持っている場合
            if(val < this.val1){
                var temp1 = this.val1;
                var temp2 = this.val2;
                this.val1 = val;
                this.val2 = temp1;
                this.val3 = temp2;

                var temp3 = this.edge1;
                var temp4 = this.edge2;
                var temp5 = this.edge3;
                this.edge1 = node;
                this.edge2 = temp3;
                this.edge3 = temp4;
                this.edge4 = temp5;
            } else if(this.val1 <= val && val < this.val2){
                var temp = this.val2;
                this.val2 = val;
                this.val3 = temp;

                var temp2 = this.edge2;
                var temp3 = this.edge3
                this.edge2 = node;
                this.edge3 = temp2;
                this.edge4 = temp3;
            } else if(this.val2 <= val){
                this.val3 = val;
                
                var temp = this.edge3;
                this.edge3 = node;
                this.edge4 = temp;
            } else {
                throw "val is not a number!!";
            }
        } else {        //1つのvalを持っている場合
            if(val < this.val1){
                var temp = this.val1;
                this.val1 = val;
                this.val2 = temp;

                var temp2 = this.edge1;
                var temp3 = this.edge2;
                this.edge1 = node;
                this.edge2 = temp2;
                this.edge3 = temp3;
            } else if(this.val1 <= val){
                this.val2 = val;

                var temp = this.edge2;
                this.edge2 = node;
                this.edge3 = temp;
            } else {
                throw "val is not a number!!";
            }
        }
    }

    split(){
        if(this.val3 != null){
            var newNode = new Node(this.val1, this.edge1, this.edge2);
            var temp = this.val2;
            this.val1 = this.val3;
            this.val2 = null;
            this.val3 = null;
            this.edge1 = this.edge3;
            this.edge2 = this.edge4;
            this.edge3 = null;
            this.edge4 = null;
            if(this.parent == null){
                this.parent = new Node(temp, newNode, this);
            } else {
                this.parent.addValAndEdge(temp, newNode);
            }
            newNode.parent = this.parent;
            this.parent.split();
        }
    }

    returnRoot(){
        if(this.parent == null){
            return this;
        } else {
            return this.parent.returnRoot();
        }
    }

    returnLeftmostLeaf(){
        if(this.edge1 instanceof Leaf){
            return this.edge1;
        } else {
            return this.edge1.returnLeftmostLeaf();
        }
    }
}

function addValToBPlusTree(tree, val){
    if(tree == null){
        var leaf = new Leaf(val);
        return leaf;
    } else if(tree instanceof Leaf){
        tree.addVal(val);
        return tree.returnRoot();
    } else {
        if(val < tree.val1){
            addValToBPlusTree(tree.edge1, val);
        } else {
            if(tree.val2 != null){      //2つのvalがある場合
                if(val < tree.val2){
                    addValToBPlusTree(tree.edge2, val);
                } else {
                    addValToBPlusTree(tree.edge3, val);
                }
            } else {        //1つのvalがある場合
                addValToBPlusTree(tree.edge2, val);
            }
        }
        return tree.returnRoot();
    }
}

function insertParetnNull(tree){
    tree.parent = null;
    if(tree instanceof Leaf){
        return;
    } else {
        insertParetnNull(tree.edge1);
        insertParetnNull(tree.edge2);
        if(tree.val2 != null){
            insertParetnNull(tree.edge3);
        }
    }
}

function insertPrevNull(tree){
    tree.returnLeftmostLeaf().insertPrevNull();
}

function insertNull(tree){
    insertParetnNull(tree);
    insertPrevNull(tree);
}

var tree = null;
tree = addValToBPlusTree(tree, 5);
tree = addValToBPlusTree(tree, 10);
tree = addValToBPlusTree(tree, 3);
tree = addValToBPlusTree(tree, 2);
tree = addValToBPlusTree(tree, 8);
tree = addValToBPlusTree(tree, 4);
tree = addValToBPlusTree(tree, 1);
tree = addValToBPlusTree(tree, 6);
tree = addValToBPlusTree(tree, 7);
tree = addValToBPlusTree(tree, 9);

insertNull(tree);

console.log(tree);