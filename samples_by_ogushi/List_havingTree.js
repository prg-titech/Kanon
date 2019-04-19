class haveParentTree{
    constructor(val){
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
    }
    
    add(val){
        let temp = new haveParentTree(val);
        let current = this;
        
        while((current.val <= val && current.right != null) || (current.val > val && current.left != null)){
            if(current.val <= val){
                current = current.right;
            } else {
                current = current.left;
            }
        }
        
        if(current.val <= val){
            current.right = temp;
            temp.parent = current;
        } else {
            current.left = temp;
            temp.parent = current;
        }
    }
}

var tree1 = new haveParentTree(1);
tree1.add(0);
tree1.add(2);

var tree2 = new haveParentTree(4);
tree2.add(3);
tree2.add(5);

var tree3 = new haveParentTree(7);
tree3.add(6);
tree3.add(8);

class List_havingTree{
    constructor(val, tree){
        this.val = val;
        this.next = null;
        this.prev = null;
        this.in = tree;
    }
    
    add(val, tree){
        if(this.next == null){
            let temp = new List_havingTree(val, tree);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val, tree);
        }
    }
}

var listT = new List_havingTree(100, tree1);
listT.add(101, tree2);
listT.add(102, tree3);