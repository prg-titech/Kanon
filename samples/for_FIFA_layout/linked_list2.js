class Node {
    constructor(val) {
        this.val = val;
    }
}

class DLList {
    constructor() {
        this.head = null;
        this.tail = null;
    }

    add(val) {
        let temp = new Node(val);

        if(this.head == null) {
            this.head = temp;
            this.tail = temp;
        } else {
            temp.prev = this.tail;
            this.tail.next = temp;
            this.tail = temp;
        }
    }
}

let l = new DLList();
l.add(1);
l.add(2);
l.add(3);
l.add(4);