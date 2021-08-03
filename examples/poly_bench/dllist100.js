class Node {
    constructor(val) {
        this.val = val;
        this.next = null;
        this.prev = null;
    }
}

class DLList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    add(val) {
        let temp = new Node(val);

        if (!this.head) {
            this.head = temp;
            this.tail = temp;
        } else {
            temp.prev = this.tail;
            this.tail.next = temp;
            this.tail = temp;
        }
        this.length++;
    }

    insert(val, idx) {
        if (0 <= idx && idx <= this.length) {
            let temp = new Node(val);

            if (idx === this.length) {
                temp.prev = this.tail;
                this.tail.next = temp;
                this.tail = temp;
            } else if (idx === 0) {
                temp.next = this.head;
                this.head.prev = temp;
                this.head = temp;
            } else {
                let current = this.head;

                for (let i = 0; i < idx; i++) {
                    current = current.next;
                }
                temp.prev = current.prev;
                temp.next = current;
                current.prev.next = temp;
                current.prev = temp;
            }
            this.length++;
        }
    }

    remove(index) {
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
                let current = this.head;

                for (let i = 0; i < index; i++) {
                    current = current.next;
                }

                current.prev.next = current.next;
                current.next.prev = current.prev;
                delete current.prev;
                delete current.next;
            }
            this.length--;
        }
    }

    reverse() {
        if (this.length > 0) {
            let current = this.head, temp = current.next;

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
        }
    }
}

const N = 100;
let list = new DLList();

for (let i = 0; i < N; i++) {
    list.add(i);
}
