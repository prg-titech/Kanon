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
        else {}
    }
}

let t = (() => {})();
let t1 = t.eval();