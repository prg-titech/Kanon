// check if Kanon sets __id fields to all objects
class C {constructor(x) {this.y = x;}}
class D extends C {
    constructor(v) {
	super(v);
	this.x = v;
    }
}
let c0 = new C(0);
let c1 = new C(new C(1));
let d0 = new D(0);
let d1 = new D(new D(1));

