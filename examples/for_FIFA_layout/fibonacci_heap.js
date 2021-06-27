class Tree {
    constructor(val) {
        this.val = val;
        this.children = [];
        //this.parent = null;
    }

    addChild(child) {
        this.children.push(child);
        //child.parent = this;
    }

    //parentValのノードの下に新しい子ノードを追加する
    addTreeVal(val, parentVal) {
        if(parentVal == this.val) this.addChild(new Tree(val));
        else if(this.children.length == 0) return;
        else {
            for(let i = 0; i < this.children.length; i++) {
                if(val < this.children[i].val) continue;
                else this.children[i].addTreeVal(val, parentVal);
            }
        }
    }

    removeChild(val) {

    }
}

class List {
    constructor(tree) {
        this.tree = tree;
        this.next = this;
        this.prev = this;
        this.parent = null;
    }

    addTree(tree) {
        var newnode = new List(tree);
        var temp = this.prev;
        this.prev = newnode;
        newnode.next = this;
        newnode.prev = temp;
        temp.next = newnode;
    }

    //parentValのノードの下に新しい子ノードを追加する
    addTreeVal(val, parentVal) {
        this.tree.addTreeVal(val, parentVal);
        if(this.next.parent == null) {
            this.next.addTreeVal(val, parentVal);
        }
    }

    remove() {
        let prev = this.prev;
        let next = this.next;
        if(this.parent != null) {
            this.parent.list = next;
            next.parent = this.parent;
            this.parent = null;
        }
        prev.next = next;
        next.prev = prev;
        this.next = this;
        this.prev = this;
        this.tree = null;
    }
}

class Forest {
    constructor() {
        this.list = null;
    }

    makeTree(val) {
        let tree = new Tree(val);
        if(this.list == null) {
            this.list = new List(tree);
            this.list.parent = this;
        }
        else this.list.addTree(tree);
    }

    addVal(val, parentVal) {
        this.list.addTreeVal(val, parentVal);
    }

    mintree() {
        let tl = this.list;
        let array = [tl];
        let array2 = [tl.tree.val];
        while(true) {
            tl = tl.next;
            if(tl == this.list) break;
            else {
                array.push(tl);
                array2.push(tl.tree.val);
            }
        }
        let min = Math.min.apply(null, array2);
        let mintree = array[array2.indexOf(min)];
        array.length = 0;
        return mintree;
    }

    removeMin() {
        let min = this.mintree();
        for(let i = 0; i < min.tree.children.length; i++) {
            this.list.addTree(min.tree.children[i]);
        }
        min.tree.children.length = 0;
        min.remove();
        let current = this.list;
        let array = [current];
        let array2 = [current.tree.children.length];
        while(true) {
            current = current.next;
            if(current == this.list) break;
            else {
                let length = current.tree.children.length;
                if(array2.indexOf(length) != -1) {
                    let another = array[array2.indexOf(length)];
                    let val1 = current.tree.val;
                    let val2 = another.tree.val;
                    if(val1 < val2) {
                        current.tree.addChild(another.tree);
                        another.remove();
                    } else {
                        another.tree.addChild(current.tree);
                        current.remove();
                    }
                    current = this.list;
                    array.length = 0;
                    array.push(current);
                    array2 = [current.tree.children.length];
                } else {
                    array.push(current);
                    array2.push(length);
                }
            }
        }
        array.length = 0;
    }
}

let forest = new Forest();
forest.makeTree(6);
forest.makeTree(2);
forest.addVal(5, 2);
forest.makeTree(1);
forest.addVal(3, 1);
forest.addVal(4, 1);
forest.addVal(7, 1);
forest.addVal(8, 7);
forest.addVal(9, 8);

forest.removeMin();