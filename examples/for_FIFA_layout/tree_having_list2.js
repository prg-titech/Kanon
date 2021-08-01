class Tree {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.list = null;
    }

    add(val, num) {
        if(val < this.val) {
            if(this.left == null) {
                let tree = new Tree(val);
                tree.makeList(num);
                this.left = tree;
                tree.parent = this;
            } else {
                this.left.add(val, num);
            }
        } else if(this.val < val) {
            if(this.right == null) {
                let tree = new Tree(val);
                tree.makeList(num);
                this.right = tree;
                tree.parent = this;
            } else {
                this.right.add(val, num);
            }
        }
    }

    makeList(num) {
        if(num >= 1) {
            let number = Math.floor(num);
            this.list = new List(this.val + Math.floor(Math.random() * 10) / 10);
            for(let i = 0; i < number - 1; i++) {
                this.list.add(this.val + Math.floor(Math.random() * 10) / 10);
            }
        }
    }

    search(val) {
        if(this.val == val) return this;
        else if(val < this.val && this.left != null) return this.left.search(val);
        else if(this.val < val && this.right != null) return this.right.search(val);
    }

    remove(val) {
        let node = this.search(val);

    }
}

class List {
    constructor(val) {
        this.val = val;
        this.next = null;
        this.prev = null;
    }

    add(val) {
        if(this.next == null) {
            let list = new List(val);
            this.next = list;
            list.prev = this;
        } else {
            this.next.add(val);
        }
    }
}

let ListNum = 4;
let tree = new Tree(8);
tree.makeList(ListNum);
tree.add(4, ListNum);
tree.add(2, ListNum);
tree.add(1, ListNum);
tree.add(3, ListNum);
tree.add(6, ListNum);
tree.add(5, ListNum);
tree.add(7, ListNum);
tree.add(12, ListNum);
tree.add(10, ListNum);
tree.add(9, ListNum);
tree.add(11, ListNum);
tree.add(14, ListNum);
tree.add(13, ListNum);
tree.add(15, ListNum);

tree.remove(6);