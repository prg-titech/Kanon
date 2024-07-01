// Class representing a node in the doubly linked list
class Node {
  constructor(value) {
      this.value = value; // Value stored in the node
      this.next = null;   // Pointer to the next node in the list
      this.prev = null;   // Pointer to the previous node in the list
  }
}

// Class representing a doubly linked list with head and tail
class DLList {
  constructor() {
      this.head = null; // Pointer to the first node in the list
      this.tail = null; // Pointer to the last node in the list
  }

  // Method to add a value to the end of the list
  add(value) {
      const newNode = new Node(value);

      if (this.head === null) {
          // If the list is empty, set head and tail to the new node
          this.head = newNode;
          this.tail = newNode;
      } else {
          // Otherwise, append the new node to the end of the list
          newNode.prev = this.tail;
          this.tail.next = newNode;
          this.tail = newNode;
      }
  }
}

// Example usage
const list = new DLList();
for (let i = 1; i <= 4; i++) {
  list.add(i);
}