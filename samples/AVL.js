class Node {
    constructor(val) {
        this.val = val;
        this.right = null;
        this.left = null;
    }
    
    add(val) {
        if (this.val < val) {
            if (this.right) {
                this.right = this.right.add(val);
            } else {
                this.right = new Node(val);
            }
        } else {
            
        }
        return this.balance();
    }
    
    balance() {
        let factor = this.factor();
        if (-1 <= factor && factor <= 1) {
            return this;
        } else if (1 < factor) {
            
        } else {
            let right_factor = this.right.factor();
            if (right_factor > 0) {
                
            }
            
            let ret = this.right;
            this.right = ret.left;
            ret.left = this;
            return ret;
        }
    }
    
    height() {
        return Math.max((this.left) ? this.left.height() : -1, (this.right) ? this.right.height() : -1) + 1;
    }
    
    factor() {
        let left = (this.left) ? this.left.height() : -1;
        let right = (this.right) ? this.right.height() : -1;
        return left - right;
    }
}

class AVL {
    constructor() {
        this.root = null;
    }
    
    add(val) {
        if (this.root) {
            this.root = this.root.add(val);
        } else {
            this.root = new Node(val);
        }
    }
}

let tree = new AVL();

tree.add(1);
tree.add(2);
tree.add(3);
tree.add(4);
tree.add(5);

module.exports = AVL;