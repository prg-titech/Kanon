const AVL  = require("..\\samples\\AVL.js");

describe("A balanced AVL-tree", () => {
	let avl = new AVL();
	avl.add(1);
	avl.add(2);
	avl.add(3);
	it("the root of this AVL tree should be 2", () => {
		expect(avl.root.val).toBe(2);
	});
	it("the left-side should be a node containing 1", () => {
		expect(avl.root.left.val).toBe(1);
	});
	it("the right-side should be a node containing 3", () => {
		expect(avl.root.right.val).toBe(3);
	})
});