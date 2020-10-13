class Tree{
    constructor(val){
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
    }
    
    add(val){
        let temp = new Tree(val);
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

    remove(val){
        
    }
}

var tree1 = new Tree(1);
tree1.add(0);
tree1.add(2);

var tree2 = new Tree(4);
tree2.add(3);
tree2.add(5);

var tree3 = new Tree(7);
tree3.add(6);
tree3.add(8);

class List{
    constructor(val, tree){
        this.val = val;
        this.next = null;
        this.prev = null;
        this.in = tree;
    }
    
    add(val, tree){
        if(this.next == null){
            let temp = new List(val, tree);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val, tree);
        }
    }

    remove(val){

    }
}

var listT = new List(100, tree1);
// tree1.parent = listT;
listT.add(101, tree2);
listT.add(102, tree3);

listT.remove(2);
tree1.remove(4);
tree2.remove(3);
tree3.remove(1);