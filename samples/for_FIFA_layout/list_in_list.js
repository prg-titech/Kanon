class Node{
    constructor(val, list){
        this.val = val;
        this.next = null;
        this.prev = null;
        this.in = list;
    }
    
    add(val, list){
        if(this.next == null){
            let temp = new Node(val, list);
            this.next = temp;
            temp.prev = this;
        } else {
            this.next.add(val);
        }
    }
}

var list1 = new Node(4, null);
list1.add(1, null);
list1.add(9, null);

var list2 = new Node(97, null);
list2.add(44, null);
list2.add(41, null);

var list3 = new Node(9, null);
list3.add(84, null);
list3.add(11, null);

// var list4 = new Node(5, null);
// list4.add(21, null);
// list4.add(2, null);

var list = new Node(5, list1);
list.add(3, list2);
list.add(12, list3);