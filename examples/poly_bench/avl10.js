class Node {
    constructor(left, right, value, height) {
        this.left = left;
        this.right = right;
        this.value = value;
        this.height = height;
    }
}

class AVLTree {
    constructor() {
        this.root = null;
    }

    insert(value) {
        this.root = this._insert(this.root, value);
    }

    _insert(top, value) {
        if (!top) return new Node(null, null, value, 1);

        if (value < top.value) top.left = this._insert(top.left, value);
        else if (value > top.value) top.right = this._insert(top.right, value);
        this.updateHeight(top);
        const bal = this.treeHeight(top.left) - this.treeHeight(top.right);
        if (bal > 1) {
            if (value < top.left.value) {
                return this.rightRotation(top);
            } else {
                top.left = this.leftRotation(top.left);
                return this.rightrotation(top);
            }
        } else if (bal < -1) {
            if (value > top.right.value) {
                return this.leftRotation(top);
            } else {
                top.right = this.rightRotation(top.right);
                return this.leftRotation(top);
            }
        }

        return top;
    }

    rightRotation(top) {
        const newTop = top.left;
        top.left= top.right;
        newTop.right = top;
        this.updateHeight(top);
        this.updateHeight(newTop);
        return newTop;
    }

    leftRotation(top) {
        const newTop = top.right;
        top.right = newTop.left;
        newTop.left = top;
        this.updateHeight(top);
        this.updateHeight(newTop);
        return newTop;
    }

    treeHeight(tree) {
        return tree ? tree.height : 0;
    }

    updateHeight(tree) {
        tree.height = 1 + Math.max(this.treeHeight(tree.left), this.treeHeight(tree.right));
    }
}

const N = 10;
let list = new AVLTree();

for (let i = 0; i < N; i++) {
    list.insert((i * N) % (N + 1));
}
