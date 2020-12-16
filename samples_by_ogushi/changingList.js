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

var list = new Node(0);
for(let i = 1; i < 4; i++) {
    list.add(i);
}

list.remove(2);