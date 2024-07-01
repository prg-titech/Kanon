// Class representing a node in the doubly linked list
class Node {
  constructor(value) {
      this.value = value; // Value stored in the node
      this.next = null;   // Pointer to the next node in the list
      this.prev = null;   // Pointer to the previous node in the list
  }

  // Method to add a value to the end of the list
  add(value) {
      if (this.next === null) {
          // If this is the last node, add the new node here
          const newNode = new Node(value);
          this.next = newNode;
          newNode.prev = this;
      } else {
          // Otherwise, recursively call add on the next node
          this.next.add(value);
      }
  }
}

// Example usage
const list = new Node(0);
for (let i = 1; i < 4; i++) {
  list.add(i);
}