let array = [];

class Node{
    constructor(val){
        this.val = val;
    }
}

function swap(array, val1, val2){
    let first = array[val1];
    let second = array[val2];
    array[val1] = second;
    array[val2] = first;
}

for(let i = 0; i < 4; i++){
    array.push(new Node(i));
}

swap(array, 2, 3);