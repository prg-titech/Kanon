function Node(val) {
    this.val = val;
    this.left = null;
    this.right = null;
    this.parent = null;
};

function BST() {
    this.root = null;
};

BST.prototype.add = function(val) {
    var temp = new Node(val);
    
    if (this.root === null) {
        this.root = temp;
    } else {
        var current = this.root;
        
        while (current.val <= val && current.right || current.val > val && current.left) {
            if (current.val <= val && current.right) {
                current = current.right;
            } else {
                current = current.left;
            }
        }
        
        if (current.val <= val) {
            current.right = temp;
        } else {
            current.left = temp;
        }
        temp.parent = current;
    }
};

BST.prototype.rotateRight = function() {
    if (this.root === null || this.root.left === null) {
        return;
    } else {
        var new_root = this.root.left;
        if (new_root.right) {
            new_root.right.parent = new_root.parent;
            new_root.parent.left = new_root.right;
            new_root.right = new_root.parent;
            delete new_root.parent;
            this.root.parent = new_root;
            this.root = new_root;
        } else {
            // TODO
        }
    }
};

var tree = new BST();
tree.add(5);
tree.add(3);
tree.add(8);
tree.add(4);
tree.add(6);
tree.add(1);
tree.add(10);

tree.rotateRight();
tree.rotateRight(); 
