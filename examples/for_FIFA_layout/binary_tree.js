class BTreeNode {
  constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
      this.parent = null;
  }

  // Method to add a value to the binary tree
  add(value) {
      const newNode = new BTreeNode(value);
      let current = this;

      while ((current.value <= value && current.right !== null) || 
             (current.value > value && current.left !== null)) {
          if (current.value <= value) {
              current = current.right;
          } else {
              current = current.left;
          }
      }

      if (current.value <= value) {
          current.right = newNode;
          newNode.parent = current;
      } else {
          current.left = newNode;
          newNode.parent = current;
      }
  }

  // Method to swap the left and right children of the node
  swap() {
      const temp = this.left;
      this.left = this.right;
      this.right = temp;
  }

  // Method to remove the value of the node and all its children
  removeValue() {
      this.value = null;
      if (this.left !== null) this.left.removeValue();
      if (this.right !== null) this.right.removeValue();
  }
}

// Example usage:
const tree = new BTreeNode(4);
tree.add(2);
tree.add(1);
tree.add(3);
tree.add(6);
tree.add(5);
tree.add(7);

tree.swap();
tree.removeValue();
