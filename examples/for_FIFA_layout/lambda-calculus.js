// An unfinished lambda calculus interpreter 
//
// This file demonstrates how we can gradually implement lambda calculus 
// interpreter in Kanon.  We first define three classes with an empty 
// eval(), then repeat adding an example term, adding respective method
// body, and visually checking the result.  This file is incomplete 
// as not all possible lambda terms can be evaluated.  

class App {
    constructor(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }

    eval() {
        let t1 = this.t1.eval();
        let t2 = this.t2.eval();
        return t1.apply(t2);
    }

    apply(t) {}

    subst(target, t) {}
}

class Lam {
    constructor(v, t) {
        this.v = v;
        this.t = t;
    }

    eval() {
        return this;
    }

    apply(t) {
        return this.t.subst(this.v, t).eval();
    }

    subst(target, t) {}
}

class Var {
    constructor(v) {
        this.v = v;
    }

    eval() {
        return this;
    }

    apply(t) {}

    subst(target, t) {
        if(this.v === target) return t;
        else return this;
    }
}

function example1() {
    return new Var("x");
}
function example2() {
    return new Lam("x", example1());
}
function example3() {
    return new App(example2(), example1());
}
function example4() {
    return new App(example2(), example2());
}
function example5() {
    return new App(new Lam("y", example1()), new Var("z"));
}
let t1 = example1().eval();
let t2 = example2().eval();
let t3 = example3().eval();
let t4 = example4().eval();
let t5 = example5().eval();
