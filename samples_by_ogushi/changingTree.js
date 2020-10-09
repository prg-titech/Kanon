class Node{
    constructor(val){
        this.val = val;
        this.left = null;
        this.right = null;
        this.parent = null;
    }
    
    add(val){
        let temp = new Node(val);
        let current = this;
        
        while((current.val <= val && current.right != null) || 
        (current.val > val && current.left != null)){
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

// var tree = new Node(2);
// tree.add(1);
// tree.add(3);


var tree = new Node(4);
tree.add(2);
tree.add(1);
tree.add(3);
tree.add(6);
tree.add(5);
tree.add(7);

tree.remove(6);