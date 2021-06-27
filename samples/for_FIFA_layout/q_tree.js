class N_Tree {
    constructor(val, grade) {
        this.val = val;
        this.grade = grade;
        this.children = [];
    }

    addchild(val, grade) {
        if(val <= this.val) return;
        else if(grade == this.grade + 1) this.children.push(new N_Tree(val, grade));
        else {
            for(let i = 0; i < this.children.length; i++) {
                if(val > this.children[i].val) {
                    this.children[i].addchild(val, grade - 1);
                }
            }
        }
    }
}

let num = 5
let array = new Array(num);
for(let i = 0; i < num; i++) {
    array[i] = new N_Tree(Math.floor(Math.random() * num), 0);
    for(let j = 0; j < num*2; j++) {
        array[i].addchild(Math.floor(Math.random() * num*2), Math.floor(Math.random() * num));
    }
}