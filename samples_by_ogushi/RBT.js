class RBT {
    constructor(){
        this.tree = null;
    }

    insert(val) {
        if(this.tree == null){
            this.tree = new Node("black", val, null, null, null);
        } else {
            this.tree = this.tree.add(val);
            if(isR(this.tree)) this.tree.color = "black";
        }
    }

    delete(val) {
        if(this.tree == null){
            return;
        } else {
            this.tree = this.tree.remove(val);
            deleteflag = false;
            if(isR(this.tree)) this.tree.color = "black";
        }
    }
}

class Node {
    constructor(color, value, left, right, parent){
        this.color = color;
        this.value = value;
        this.left = left;
        this.right = right;
        this.parent = parent;
    }

    max(){
        let current = this;
        let maxv = this.value;
        while(current.right != null){
            current = current.right;
            maxv = current.value;
        }
        return maxv;
    }

    add(val){
        if(this.value == val){
            return this;
        } else {
            if(this.value > val){
                if(this.left == null){
                    this.left = new Node("red", val, null, null, null);
                    this.left.parent = this;
                    return this;
                } else {
                    this.left = this.left.add(val);
                    return this.balance();
                }
            } else {
                if(this.right == null){
                    this.right = new Node("red", val, null, null, null);
                    this.right.parent = this;
                    return this;
                } else {
                    this.right = this.right.add(val);
                    return this.balance();
                }
            }
        }
    }

    balance(){
        if(isR(this.left) && isR(this.left.left)){
            let newtree = rotateR(this);
            newtree.left.color = "black";
            return newtree;
        } else if(isR(this.left) && isR(this.left.right)){
            let newtree = rotateLR(this);
            newtree.left.color = "black";
            return newtree;
        } else if(isR(this.right) && isR(this.right.right)){
            let newtree = rotateL(this);
            newtree.right.color = "black";
            return newtree;
        } else if(isR(this.right) && isR(this.right.left)){
            let newtree = rotateRL(this);
            newtree.right.color = "black";
            return newtree;
        } else return this;
    }

    remove(val){
        if(this.value == val){
            if(this.left == null){
                if(this.color == "black") deleteflag = true;
                this.parent = null;
                return this.right;
            } else {
                let lmax = this.left.max();
                this.left = this.left.removeMax();
                if(this.left != null) this.left.parent = this;
                this.value = lmax;
                return this.balanceL();
            }
        } else if(this.value > val){
            this.left = this.left.remove(val);
            if(this.left != null) this.left.parent = this;
            return this.balanceL();
        } else {
            this.right = this.right.remove(val);
            if(this.right != null) this.right.parent = this;
            return this.balanceR();
        }
    }

    removeMax(){
        if(this.right != null){
            this.right = this.right.removeMax();
            if(this.right != null) this.right.parent = this;
            return this.balanceR();
        } else {
            deleteflag = (this.color == "black");
            this.parent = null;
            return this.left;
        }
    }

    balanceL(){
        if(!deleteflag) return this;
        else {
            if(isB(this.right)){
                if(isR(this.right.left)){
                    let rb = this.color;
                    let newnode = rotateRL(this);
                    newnode.color = rb;
                    newnode.left.color = "black";
                    deleteflag = false;
                    return newnode;
                } else if(isR(this.right.right)){
                    let rb = this.color;
                    let newnode = rotateL(this);
                    newnode.color = rb;
                    newnode.left.color = "black";
                    newnode.right.color = "black";
                    deleteflag = false;
                    return newnode;
                } else {
                    let rb = this.color;
                    this.color = "black";
                    this.right.color = "red";
                    deleteflag = (rb == "black");
                    return this;
                }
            } else if(isR(this.right)){
                let newnode = rotateL(this);
                newnode.color = "black";
                newnode.left.color = "red";
                newnode.left = newnode.left.balanceL();
                deleteflag = false;
                return newnode;
            } else return this;
        }
    }

    balanceR(){
        if(!deleteflag) return this;
        else {
            if(isB(this.left)){
                if(isR(this.left.right)){
                    let rb = this.color;
                    let newnode = rotateLR(this);
                    newnode.color = rb;
                    newnode.right.color = "black";
                    deleteflag = false;
                    return newnode;
                } else if(isR(this.left.left)){
                    let rb = this.color;
                    let newnode = rotateR(this);
                    newnode.color = rb;
                    newnode.left.color = "black";
                    newnode.right.color = "black";
                    deleteflag = false;
                    return newnode;
                } else {
                    let rb = this.color;
                    this.color = "black";
                    this.left.color = "red";
                    deleteflag = (rb == "black");
                    return this;
                }
            } else if(isR(this.left)){
                let newnode = rotateR(this);
                newnode.color = "black";
                newnode.right.color = "red";
                newnode.right = newnode.right.balanceR();
                deleteflag = false;
                return newnode;
            } else return this;
        }
    }
}

let deleteflag = false;

function isR(tree){
    if(tree == null) return false;
    else return tree.color == "red";
}

function isB(tree){
    if(tree == null) return false;
    else return tree.color == "black";
}

function rotateL(tree){
    let u = tree.right;
    u.parent = tree.parent;
    let v = u.left;
    tree.right = v;
    if(v != null) v.parent = tree;
    u.left = tree;
    tree.parent = u;
    return u;
}

function rotateR(tree){
    let u = tree.left;
    u.parent = tree.parent;
    let v = u.right;
    tree.left = v;
    if(v != null) v.parent = tree;
    u.right = tree;
    tree.parent = u;
    return u;
}

function rotateLR(tree){
    tree.left = rotateL(tree.left);
    return rotateR(tree);
}

function rotateRL(tree){
    tree.right = rotateR(tree.right);
    return rotateL(tree);
}

// let node1 = new Node(null, 1, null, null, null);
// let node2 = new Node(null, 2, null, null, null);
// let node3 = new Node(null, 3, null, null, null);
// let node4 = new Node(null, 4, null, null, null);
// let node5 = new Node(null, 5, null, null, null);
// let node6 = new Node(null, 6, null, null, null);
// let node7 = new Node(null, 7, null, null, null);

// node1.parent = node2;
// node2.left = node1;
// node2.right = node6;
// node6.parent = node2;
// node6.left = node4;
// node6.right = node7;
// node4.parent = node6;
// node7.parent = node6;
// node4.left = node3;
// node3.parent = node4;
// node4.right = node5;
// node5.parent = node4;

// let node = rotateRL(node2);

let rbt = new RBT();

for(let i = 1; i <= 7; i++){
    rbt.insert(i);
}

rbt.delete(4);