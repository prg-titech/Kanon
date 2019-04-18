class Tree{
    constructor(val){
        this.val = val;
        this.l = null;
        this.r = null;
        this.p = null;
    }
    
    add(val){
        let temp = new Tree(val);
        let current = this;
        
        while((current.val <= val && current.r != null) || (current.val > val && current.l != null)){
            if(current.val <= val){
                current = current.r;
            } else {
                current = current.l;
            }
        }
        
        if(current.val <= val){
            current.r = temp;
            temp.p = current;
        } else {
            current.l = temp;
            temp.p = current;
        }
    }
}

var tree = new Tree(4);
tree.add(2);
tree.add(1);
tree.add(3);
tree.add(6);
tree.add(5);
tree.add(7);