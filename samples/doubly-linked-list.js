var Node = function(val) {
    this.val = val;
    this.next = null;
    this.prev = null;
};

var DLList = function() {
    this.head = null;
    this.tail = null;
    this.length = 0;
};

DLList.prototype.add = function(val) {
    var temp = new Node(val);
    
    if (!this.head) {
        this.head = temp;
        this.tail = temp;
    } else {
        temp.prev = this.tail;
        this.tail.next = temp;
        this.tail = temp;
    }
    this.length++;
};

DLList.prototype.insert = function(val, index) {
    if (0 <= index && index <= this.length) {
        var temp = new Node(val);
        
        if (index === this.length) {
            temp.prev = this.tail;
            this.tail.next = temp;
            this.tail = temp;
        } else if (index === 0) {
            temp.next = this.head;
            this.head.prev = temp;
            this.head = temp;
        } else {
            var current = this.head;
            
            for (var i = 0; i < index; i++) {
                current = current.next;
            }
            temp.prev = current.prev;
            temp.next = current;
            current.prev.next = temp;
            current.prev = temp;
        }
        this.length++;
    }
};

DLList.prototype.remove = function(index) {
    if (0 <= index && index < this.length) {
        if (this.length === 1) {
            delete this.head;
            delete this.tail;
        } else if (0 === index) {
            this.head = this.head.next;
            delete this.head.prev.next;
            delete this.head.prev;
        } else if (index === this.length-1) {
            this.tail = this.tail.prev;
            delete this.tail.next.prev;
            delete this.tail.next;
        } else {
            var current = this.head;
            
            for (var i = 0; i < index; i++) {
                current = current.next;
            }
            
            current.prev.next = current.next;
            current.next.prev = current.prev;
            delete current.prev;
            delete current.next;
        }
        this.length--;
    }
};

DLList.prototype.reverse = function() {
    var current = this.head, temp = current.next;
    
    while (current !== this.tail) {
        current.prev = temp;
        temp = temp.next;
        current.prev.next = current;
        if (current === this.head) delete current.next;
        delete current.prev.prev;
        current = current.prev;
    }
    
    this.tail = this.head;
    this.head = current;
};

var list = new DLList();

list.add(1);
list.add(2);
list.add(3);
list.insert(4, 2);
list.insert(5, 4);
list.remove(3);
list.reverse();
