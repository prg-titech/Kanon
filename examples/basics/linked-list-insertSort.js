class Node {
    constructor (val, next) {
        this.val = val;
        this.next = next;
    }
    
    insertSort() {
        if (this.next) {
            let next = this.next.insertSort();
            this.next = null;
            next = next.insert(this);
            return next;
        } else {
            return this;
        }
    }
    
    insert(node) {
        if (this.next) {
            if (this.val < node.val) {
                if (this.next.val < node.val) {
                    this.next.insert(node);
                    return this;
                } else {
                    node.next = this.next;
                    this.next = node;
                    return this;
                }
            } else {
                node.next = this;
                return node;
            }
        } else {
            this.next = node;
            return this;
        }
    }
}

let l = new Node(4,
            new Node(0,
                new Node(3,
                    new Node(1, null))));
l = l.insertSort();
