class Node {

    constructor(color, value, left, right, parent) {
        this.color = color;
        this.val = value;
        this.left = left;
        this.right = right;
        this.parent = parent;
    }

    remove(val){
        var node = this.search(val);
        
    }

    search(val){
        if(this.val == val) return this;
        else if(this.val > val){
            if(this.left == null) return;
            else return this.left.search(val);
        } else {
            if(this.right == null) return;
            else return this.right.search(val);
        }
    }
}

//ノードが赤かどうかチェックする
function isR(tree) {
    if (tree == null) return false;
    else return tree.color == "R";
}

//ノードが黒かどうかチェックする
function isB(tree) {
    if (tree == null) return false;
    else return tree.color == "B";
}

//木の左回転。回転した木を返す
function rotateL(tree) {
    var u = tree.right;
    u.parent = tree.parent;
    var v = u.left;
    tree.right = v;
    if (v != null) v.parent = tree;
    u.left = tree;
    tree.parent = u;
    return u;
}

//木の右回転。回転した木を返す
function rotateR(tree) {
    var u = tree.left;
    u.parent = tree.parent;
    var v = u.right;
    tree.left = v;
    if (v != null) v.parent = tree;
    u.right = tree;
    tree.parent = u;
    return u;
}

//二重回転（左回転→右回転）
function rotateLR(tree) {
    tree.left = rotateL(tree.left);
    return rotateR(tree);
}

//二重回転（右回転→左回転）
function rotateRL(tree) {
    tree.right = rotateR(tree.right);
    return rotateL(tree);
}

//挿入操作
function insert(tree, val) {
    if (tree == null) {
        var newtree = new Node("B", val, null, null, null);
        return newtree;
    } else if (val < tree.val) {
        if (tree.left == null) {
            var newtree = new Node("B", val, null, null, tree);     //ミス
            tree.left = newtree;
            return balance(tree);
        } else {
            tree.left = insert(tree.left, val);
            return balance(tree);
        }
    } else if (val > tree.val) {
        if (tree.right == null) {
            var newtree = new Node("R", val, null, null, tree);
            tree.right = newtree;
            return balance(tree);
        } else {
            tree.right = insert(tree.right, val);
            return balance(tree);
        }
    } else {
        return balance(tree);
    }
}

//エントリー挿入に伴う赤黒木の修正（パターンマッチ）
function balance(tree) {
    if (isR(tree) && tree.parent != null) {
        return tree;
    } else if (isR(tree.left) && isR(tree.left.left)) {
        var newtree = rotateR(tree);
        newtree.left.color = "B";
        return isRootBlack(newtree);
    } else if (isR(tree.right) && isR(tree.right.right)) {
        var newtree = rotateL(tree);
        newtree.right.color = "B";
        return isRootBlack(newtree);
    } else if (isR(tree.left) && isR(tree.left.right)) {
        var newtree = rotateLR(tree);
        newtree.left.color = "B";
        return isRootBlack(newtree);
    } else if (isR(tree.right) && isR(tree.right.left)) {
        var newtree = rotateRL(tree);
        newtree.right.color = "B";
        return isRootBlack(newtree);
    } else {
        return isRootBlack(tree);
    }
}

//根のノードが赤だった場合は問答無用で黒に変更する
function isRootBlack(tree) {
    if (tree.parent == null && tree.color == "R") {
        tree.color = "B";
        return tree;
    } else {
        return tree;
    }
}

//全てのノードのcolorフィールドにnullを代入する
function insertNullatAllNode(tree) {
    if(tree != null) {
        tree.color = null;
        insertNullatAllNode(tree.left);
        insertNullatAllNode(tree.right);
    }
}

var rbt = null;
for (var i = 1; i <= 31; i++) {
    rbt = insert(rbt, i);
}
insertNullatAllNode(rbt);
rbt.remove(12);