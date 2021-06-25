//サーキット
class Tree {
    constructor(left, right, parent, color, ID, rcd){
        this.left = left;
        this.right = right;
        this.parent = parent;
        this.color = color;
        this.ID = ID;
        this.rcd = rcd;
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
function insert(tree, ID, rcd) {
    if (tree == null) {
        var newtree = new Tree(null, null, null, "B", ID, rcd);
        return newtree;
    } else if (ID < tree.ID) {
        if (tree.left == null) {
            var newtree = new Tree();
            tree.left = newtree;
            return balance(tree);
        } else {
            tree.left = insert(tree.left, ID, rcd);
            return balance(tree);
        }
    } else if (ID > tree.ID) {
        if (tree.right == null) {
            var newtree = new Tree(null, null, tree, "R", ID, rcd);
            tree.right = newtree;
            return balance(tree);
        } else {
            tree.right = insert(tree.right, ID, rcd);
            return balance(tree);
        }
    } else if (rcd < tree.rcd) {
        if (tree.left == null) {
            var newtree = new Tree(null, null, tree, "R", ID, rcd);
            tree.left = newtree;
            return balance(tree);
        } else {
            tree.left = insert(tree.left, ID, rcd);
            return balance(tree);
        }
    } else {
        if (tree.right == null) {
            var newtree = new Tree(null, null, tree, "R", ID, rcd);
            tree.right = newtree;
            return balance(tree);
        } else {
            tree.right = insert(tree.right, ID, rcd);
            return balance(tree);
        }
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

//全てのノードのcolorフィールドとparentフィールドにnullを代入する
function insertNullatAllNode(tree) {
    if(tree != null) {
        tree.color = null;
        tree.parent = null;
        insertNullatAllNode(tree.left);
        insertNullatAllNode(tree.right);
    }
}

/**
 * 任意の桁で四捨五入する関数
 * @param {number} value 四捨五入する数値
 * @param {number} base どの桁で四捨五入するか（10→10の位、0.1→小数第１位）
 * @return {number} 四捨五入した値
 */
function orgRound(value, base) {
    return Math.round(value * base) / base;
}

//タイム記録
class List {
    constructor(time){
        this.next = null;
        this.time = time;
    }

    add(newtime){
        if(this.time < newtime){
            if(this.next == null){
                var newList = new List(newtime);
                this.next = newList;
                return this;
            } else if(this.next.time > newtime){
                var newList = new List(newtime);
                var temp = this.next;
                newList.next = temp;
                this.next = newList;
                return this;
            } else {
                this.next.add(newtime);
                return this;
            }
        } else if(this.time > newtime){
            var newList = new List(newtime);
            newList.next = this;
            return newList;
        } else {
            var newList = new List(newtime);
            var temp = this.next;
            newList.next = temp;
            this.next = newList;
            return this;
        }
    }
}

var TreeNumber = 7;
var MostListsNumber = 4;
var LeastListsNumber = 2;

var addTreeID;
var addTreeNumber = Math.floor(Math.random() * TreeNumber);

var Trees = null;
var NumberOfTreeHavingMostList = Math.floor(Math.random() * TreeNumber);
for(var i = 0; i < TreeNumber; i++){

    //レコードオブジェクトをいくつ作るのかを決める、一つだけ最大値になる
    var numberOfLists;
    if(i == NumberOfTreeHavingMostList){
        numberOfLists = MostListsNumber;
    } else {
        numberOfLists = LeastListsNumber + Math.floor(Math.random() * (MostListsNumber - LeastListsNumber));
    }

    //決めた数だけレコードオブジェクトを生成する
    var Lists = new List(parseFloat((120 + Math.floor(Math.random() * 6000) / 100 - 30).toFixed(2)));
    for(var j = 1; j < numberOfLists; j++){
         Lists = Lists.add(parseFloat((120 + Math.floor(Math.random() * 6000) / 100 - 30).toFixed(2)));
    }

    var randamID = Math.floor(Math.random() * 10) + 1000 + 10 * i;
    Trees = insert(Trees, randamID, Lists);
    if(i == addTreeNumber){
        addTreeID = randamID;
    }
}

//指定されたIDのサーキットにレコードタイムを追加する
function addList(tree, ID, time) {
    if(tree == null) {
        alert("ID is wrong!");
    } else if(tree.ID == ID) {
        tree.rcd = tree.rcd.add(time);
    } else if(tree.ID > ID) {
        addList(tree.left, ID, time);
    } else {
        addList(tree.right, ID, time);
    }
}

insertNullatAllNode(Trees);
addList(Trees, addTreeID, parseFloat((120 + Math.floor(Math.random() * 6000) / 100 - 30).toFixed(2)));

Trees.remove()