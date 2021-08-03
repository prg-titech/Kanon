class MinHeap {
    constructor() {
        this.arr = [0];
        this.pointer = 1;
    }

    insert(value) {
        this.arr[this.pointer] = value;

        for (let i = this.pointer; i > 1; i >>>= 1) {
            let v = this.arr[i]; 
            let tmp = this.arr[i >>> 1];
            if (tmp <= v) break;
            this.arr[i] = tmp;
            this.arr[i >>> 1] = v;
        }

        this.pointer++;
    }
}

const N = 100;
let heap = new MinHeap();

for (let i = 0; i < N; i++) {
    heap.insert((i * N) % 307);
}
