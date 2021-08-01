class List{
    constructor(){
        this.head = null;
        this.tail = null;
    }
    
    add(m){
        if(this.head === null) this.head = m;
        else {
            if(this.tail === null){
                this.tail = new List();
                this.tail.head = m;    
            } else {
                this.tail.add(m);
            }
            
        }
    }
}

let l = new List();

[1,2,3,4,5].forEach(x => l.add(x));


function f(list, m){
    if(list.tail === null) return list;
    else {
        list = list.tail;
        return g(list, m);
    }
}

function g(list,m){
    if(list.tail === null) return list;
    list = list.tail;
    return f(list, m);
}
