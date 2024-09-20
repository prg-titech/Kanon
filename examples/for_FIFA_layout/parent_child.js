class Parent {
    constructor(name,age){
        this.name = name;
        this.age = age;
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
    constructor(name,age){
        this.name = name;
        this.age = age;
    }
}

let dad = new Parent("ひろし",42);
let mom = new Parent("みさえ",40);
let son = new Child("しんのすけ",10);
dad.addWife(mom);
dad.addChild(son);
mom.addHusband(dad);
mom.addChild(son);