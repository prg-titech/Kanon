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

    removeChild(val) {

    }
}

class Forest {
    constructor() {
        this.treelist = null;
    }

    mintree() {
        let tl = this.treelist;
        let array = [tl];
        let array2 = [tl.tree.val];
        while(true) {
            tl = tl.next;
            if(tl == this.treelist) break;
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
            this.treelist.addTree(min.tree.children[i]);
        }
        min.tree.children.length = 0;
        min.remove();
        let current = this.treelist;
        let array = [current];
        let array2 = [current.tree.children.length];
        while(true) {
            current = current.next;
            if(current == this.treelist) break;
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
                    current = this.treelist;
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

class TreeList {
    constructor(tree) {
        this.tree = tree;
        this.next = this;
        this.prev = this;
        this.parent = null;
    }

    addTree(tree) {
        var newnode = new TreeList(tree);
        var temp = this.prev;
        this.prev = newnode;
        newnode.next = this;
        newnode.prev = temp;
        temp.next = newnode;
    }

    remove() {
        let prev = this.prev;
        let next = this.next;
        if(this.parent != null) {
            this.parent.treelist = next;
            next.parent = this.parent;
            this.parent = null;
        }
        prev.next = next;
        next.prev = prev;
        this.next = this;
        this.prev = this;
    }
}

let forest = new Forest();
let treelist = new TreeList(new Tree(6));
forest.treelist = treelist;
treelist.parent = forest;
let two = new Tree(2);
two.addChild(new Tree(5));
treelist.addTree(two);
let one = new Tree(1);
one.addChild(new Tree(3));
one.addChild(new Tree(4));
one.addChild(new Tree(7));
one.children[2].addChild(new Tree(8));
one.children[2].children[0].addChild(new Tree(9));
treelist.addTree(one);

forest.removeMin();