let array = new Array(0);

class Node{
    constructor(val){
        this.val = val;
    }
}

for(let i = 0; i < 4; i++){
    array.push(new Node(i));
}

swap(array, 1, 3);

function swap(array, val1, val2){
    let first = array[val1];
    let second = array[val2];
    array[val1] = second;
    array[val2] = first;
}