class Node{
    constructor(val){
        this.val = val;
        this.next = null;
        this.prev = null;
    }
    
    add(val){
        if(this.next == null){
            let temp = new Node(val);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val);
        }
    }

    remove(val){
        
    }
}

var list = new Node(5);
list.add(1);
list.add(7);
list.add(8);

list.remove(7);