/*
 * A Red-Black Tree is a type of self-balancing binary search tree. Each node in the tree contains an extra bit for
 * storing the color of the node, either red or black. The tree maintains balance through the following properties:
 * 
 * 1. Every node is either red or black.
 * 2. The root is always black.
 * 3. All leaves (NIL nodes) are black.
 * 4. If a red node has children, then the children are always black (no two red nodes can be adjacent).
 * 5. Every path from a node to its descendant NIL nodes has the same number of black nodes.
 * 
 * The balancing of the tree is ensured through rotations and color flips during insertions and deletions.
 */

class RedBlackTree {
  constructor() {
      this.tree = null; // Root of the red-black tree
  }

  // Method to insert a value into the red-black tree
  insert(value) {
      if (this.tree === null) {
          this.tree = new TreeNode("black", value, null, null, null);
      } else {
          this.tree = this.tree.add(value);
          if (isRed(this.tree)) this.tree.color = "black";
      }
  }

  // Method to delete a value from the red-black tree
  delete(value) {
      if (this.tree === null) {
          return;
      } else {
          let node = this.tree.search(value);
          this.tree = this.tree.remove(value);
          deleteFlag = false;
          if (isRed(this.tree)) this.tree.color = "black";
      }
  }
}

class TreeNode {
  constructor(color, value, left, right, parent) {
      this.color = color; // Color of the node (red or black)
      this.value = value; // Value stored in the node
      this.left = left;   // Left child
      this.right = right; // Right child
      this.parent = parent; // Parent node
  }

  // Method to find the maximum value in the subtree
  max() {
      let current = this;
      let maxValue = this.value;
      while (current.right !== null) {
          current = current.right;
          maxValue = current.value;
      }
      return maxValue;
  }

  // Method to add a value to the subtree
  add(value) {
      if (this.value == value) {
          return this; // Ignore duplicates
      } else {
          if (this.value > value) {
              if (this.left === null) {
                  this.left = new TreeNode("red", value, null, null, null);
                  this.left.parent = this;
                  return this;
              } else {
                  this.left = this.left.add(value);
                  return this.balance();
              }
          } else {
              if (this.right === null) {
                  this.right = new TreeNode("red", value, null, null, null);
                  this.right.parent = this;
                  return this;
              } else {
                  this.right = this.right.add(value);
                  return this.balance();
              }
          }
      }
  }

  // Method to balance the subtree
  balance() {
      if (isRed(this.left) && isRed(this.left.left)) {
          let newTree = rotateRight(this);
          newTree.left.color = "black";
          return newTree;
      } else if (isRed(this.left) && isRed(this.left.right)) {
          let newTree = rotateLeftRight(this);
          newTree.left.color = "black";
          return newTree;
      } else if (isRed(this.right) && isRed(this.right.right)) {
          let newTree = rotateLeft(this);
          newTree.right.color = "black";
          return newTree;
      } else if (isRed(this.right) && isRed(this.right.left)) {
          let newTree = rotateRightLeft(this);
          newTree.right.color = "black";
          return newTree;
      } else return this;
  }

  // Method to remove a value from the subtree
  remove(value) {
      if (this.value == value) {
          if (this.left === null) {
              if (this.color == "black") deleteFlag = true;
              this.parent = null;
              return this.right;
          } else {
              let maxValue = this.left.max();
              this.left = this.left.removeMax();
              if (this.left !== null) this.left.parent = this;
              this.value = maxValue;
              return this.balanceLeft();
          }
      } else if (this.value > value) {
          this.left = this.left.remove(value);
          if (this.left !== null) this.left.parent = this;
          return this.balanceLeft();
      } else {
          this.right = this.right.remove(value);
          if (this.right !== null) this.right.parent = this;
          return this.balanceRight();
      }
  }

  // Method to search for a value in the subtree
  search(value) {
      if (this.value == value) return this;
      else if (this.value > value) {
          if (this.left === null) return null;
          else return this.left.search(value);
      } else {
          if (this.right === null) return null;
          else return this.right.search(value);
      }
  }

  // Method to remove the maximum value from the subtree
  removeMax() {
      if (this.right !== null) {
          this.right = this.right.removeMax();
          if (this.right !== null) this.right.parent = this;
          return this.balanceRight();
      } else {
          deleteFlag = (this.color == "black");
          this.parent = null;
          return this.left;
      }
  }

  // Method to balance the left subtree
  balanceLeft() {
      if (!deleteFlag) return this;
      else {
          if (isBlack(this.right)) {
              if (isRed(this.right.left)) {
                  let newTree = rotateRightLeft(this);
                  newTree.color = this.color;
                  newTree.left.color = "black";
                  deleteFlag = false;
                  return newTree;
              } else if (isRed(this.right.right)) {
                  let newTree = rotateLeft(this);
                  newTree.color = this.color;
                  newTree.left.color = "black";
                  newTree.right.color = "black";
                  deleteFlag = false;
                  return newTree;
              } else {
                  this.color = "black";
                  this.right.color = "red";
                  deleteFlag = (this.color == "black");
                  return this;
              }
          } else if (isRed(this.right)) {
              let newTree = rotateLeft(this);
              newTree.color = "black";
              newTree.left.color = "red";
              newTree.left = newTree.left.balanceLeft();
              deleteFlag = false;
              return newTree;
          } else return this;
      }
  }

  // Method to balance the right subtree
  balanceRight() {
      if (!deleteFlag) return this;
      else {
          if (isBlack(this.left)) {
              if (isRed(this.left.right)) {
                  let newTree = rotateLeftRight(this);
                  newTree.color = this.color;
                  newTree.right.color = "black";
                  deleteFlag = false;
                  return newTree;
              } else if (isRed(this.left.left)) {
                  let newTree = rotateRight(this);
                  newTree.color = this.color;
                  newTree.left.color = "black";
                  newTree.right.color = "black";
                  deleteFlag = false;
                  return newTree;
              } else {
                  this.color = "black";
                  this.left.color = "red";
                  deleteFlag = (this.color == "black");
                  return this;
              }
          } else if (isRed(this.left)) {
              let newTree = rotateRight(this);
              newTree.color = "black";
              newTree.right.color = "red";
              newTree.right = newTree.right.balanceRight();
              deleteFlag = false;
              return newTree;
          } else return this;
      }
  }
}

var deleteFlag = false;

// Function to check if a node is red
function isRed(node) {
  if (node === null) return false;
  else return node.color === "red";
}

// Function to check if a node is black
function isBlack(node) {
  if (node === null) return false;
  else return node.color === "black";
}

// Function to perform a left rotation
function rotateLeft(node) {
  let rightChild = node.right;
  rightChild.parent = node.parent;
  let leftOfRightChild = rightChild.left;
  node.right = leftOfRightChild;
  if (leftOfRightChild !== null) leftOfRightChild.parent = node;
  rightChild.left = node;
  node.parent = rightChild;
  return rightChild;
}

// Function to perform a right rotation
function rotateRight(node) {
  let leftChild = node.left;
  leftChild.parent = node.parent;
  let rightOfLeftChild = leftChild.right;
  node.left = rightOfLeftChild;
  if (rightOfLeftChild !== null) rightOfLeftChild.parent = node;
  leftChild.right = node;
  node.parent = leftChild;
  return leftChild;
}

// Function to perform a left-right rotation
function rotateLeftRight(node) {
  node.left = rotateLeft(node.left);
  return rotateRight(node);
}

// Function to perform a right-left rotation
function rotateRightLeft(node) {
  node.right = rotateRight(node.right);
  return rotateLeft(node);
}

// Example usage
let rbt = new RedBlackTree();
for (let i = 1; i <= 6; i++) {
  rbt.insert(i);
}

rbt.delete(3);
