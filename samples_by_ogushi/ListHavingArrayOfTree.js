class haveParentTREE {

    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
    }

    add(val) {
        var temp = new haveParentTREE(val);
        var current = this;

        while ((current.val <= val && current.right != null) || (current.val > val && current.left != null)) {
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
    
    addRandom(size) {
        for(var i = 0; i < size - 1; i++) {
            this.add(Math.floor(Math.random() * 20));
        }
    }
}

// var ptree = new haveParentTREE(8);
// ptree.add(4);
// ptree.add(12);
// ptree.add(2);
// ptree.add(6);
// ptree.add(10);
// ptree.add(14);

class ListHavingArrayOfTree {

    constructor(val, arraySize, treeSize) {
        this.val = val;
        this.next = null;
        this.prev = null;
        this.array = new Array();
        for(var i = 0; i < arraySize; i++) {
            this.addNewTree(treeSize);
        }
    }

    add(val) {
        if (this.next == null) {
            var temp = new ListHavingArrayOfTree(val);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val);
        }
    }
    
    addNewArray(val, arraySize, treeSize) {
        if (this.next == null) {
            var temp = new ListHavingArrayOfTree(val);
            this.next = temp;
            temp.prev = this;
            for(var i = 0; i < arraySize; i++) {
                this.addNewTree(treeSize);
            }
        } else {
            this.next.addNewArray(val, arraySize, treeSize);
        }
    }

    addArray(tree) {
        if (this.next == null) {
            this.array.push(tree);
        } else {
            this.next.addArray(tree);
        }
    }
    
    addNewTree(size) {
        if(this.next == null) {
            var newTree = new haveParentTREE(Math.floor(Math.random() * 20));
            newTree.addRandom(size);
            this.array.push(newTree);
        } else {
            this.next.addNewTree(size);
        }
    }
}

var lat = new ListHavingArrayOfTree(3, 2, 4);

lat.addNewArray(1, 2, 4);

lat.addNewArray(4, 2, 4);
