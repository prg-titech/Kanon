class DoublyCircularlyLinkedList {

    constructor(val) {
        this.val = val;
        this.next = this;
        this.prev = this;
    }

    add(val) {
        var newnode = new DoublyCircularlyLinkedList(val);
        var temp = this.next;
        this.next = newnode;
        newnode.prev = this;
        newnode.next = temp;
        temp.prev = newnode;
    }
}

var dcll = new DoublyCircularlyLinkedList(0);
for (var i = 1; i < 7; i++) {
    dcll.add(i);
}