class Parent {
    constructor(name){
        this.name = name;
        this.wife = null;
        this.husband = null;
        this.child = null;
    }

    addWife(wife){
        this.wife = wife;
    }

    addHusband(husband){
        this.husband = husband;
    }

    addChild(child){
        this.child = child;
    }
}

class Child {
    constructor(name){
        this.name = name;
    }
}

let dad = new Parent("ひろし");
let mom = new Parent("みさえ");
let son = new Child("しんのすけ");
dad.addWife(mom);
dad.addChild(son);
mom.addHusband(dad);
mom.addChild(son);