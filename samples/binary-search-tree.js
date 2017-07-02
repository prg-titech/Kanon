class Node {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
    }
}

class BST {
    constructor() {
        this.root = null;
    }

    add(val) {
        let temp = new Node(val);

        if (this.root === null) {
            this.root = temp;
        } else {
            let current = this.root;

            while (current.val <= val && current.right || current.val > val && current.left) {
                if (current.val <= val) {
                    current = current.right;
                } else {
                    current = current.left;
                }
            }
            if (current.val <= val) {
                current.right = temp;
                temp.parent = current;
            } else {
                current.left = temp;
                temp.parent = current;
            }
        }
    }

    rotateRight() {
        if (this.root && this.root.left) {
            let current = this.root.left;
            let new_root = current;
            delete new_root.parent;
            current = current.right;
            this.root.left.right = this.root;
            this.root.parent = new_root;

            this.root.left = current;
            current.parent = this.root;
            this.root = new_root;
        }
    }

    delete(val) {
        if (this.root) {
            let delete_node = this.root;
            while (delete_node && delete_node.val !== val) {
                if (delete_node.val < val)
                    delete_node = delete_node.right;
                else if (delete_node.val > val)
                    delete_node = delete_node.left;
            }
            if (!delete_node)
                return;

            if (!delete_node.left && !delete_node.right) {
                if (delete_node.parent.right === delete_node)
                    delete delete_node.parent.right;
                else
                    delete delete_node.parent.left;
                delete delete_node.parent;
            } else if (!delete_node.left) {
                if (delete_node.parent.right === delete_node) {
                    // TODO
                } else {
                    delete_node.right.parent = delete_node.parent;
                    delete_node.parent.left = delete_node.right;
                    delete delete_node.right;
                    delete delete_node.parent;
                }
            } else if (!delete_node.right) {
                if (delete_node.parent.right === delete_node) {
                    // TODO
                } else {
                    delete_node.parent.left = delete_node.left;
                    delete_node.left.parent = delete_node.parent;
                    delete delete_node.left;
                    delete delete_node.parent;
                }
            } else {
                let current = delete_node.left;

                while (current.right)
                    current = current.right;

                if (current === delete_node.left) {
                    // TODO
                } else if (current.left) {
                    // TODO
                } else {
                    delete current.parent.right;
                    delete current.parent;
                    current.left = delete_node.left;
                    current.right = delete_node.right;
                    current.left.parent = current;
                    current.right.parent = current;
                    delete delete_node.left;
                    delete delete_node.right;
                    this.root = current;
                }
            }
        }
    }

    search(val) {
        // TODO
    }
}

let tree = new BST();

tree.add(6);
tree.add(4);
tree.add(2);
tree.add(3);
tree.add(7);
tree.add(5);
tree.add(1);
tree.rotateRight();
tree.search(4);
