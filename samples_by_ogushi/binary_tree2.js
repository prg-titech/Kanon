class Node{
    constructor(val){
        this.val = val;
        this.l = null;
        this.r = null;
        this.p = null;
    }
    
    add(val){
        let temp = new Node(val);
        let current = this;
        
        while((current.val <= val && current.r != null) || 
        (current.val > val && current.l != null)){
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
    
    swap(){
        let temp = this.l;
        this.l = this.r;
        this.r = temp;
    }

    removeVal() {
        this.val = null;
        if(this.l != null) this.l.removeVal();
        if(this.r != null) this.r.removeVal();
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

tree.swap();
tree.removeVal();