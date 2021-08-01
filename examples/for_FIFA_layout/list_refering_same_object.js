class List {
    constructor(val){
        this.val = val;
        this.next = null;
        this.prev = null;
    }
    
    add(val){
        if(this.next == null){
            let temp = new List(val);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val);
        }
    }

    remove(val){
        
    }
}

class Node {}

var node = new Node();
var list = new List(node);
for(let i = 1; i < 4; i++) {
    list.add(node);
}

list.remove(2);