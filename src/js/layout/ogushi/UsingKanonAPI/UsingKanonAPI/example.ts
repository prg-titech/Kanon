//コンパイルを通すためにGraphクラスを仮決め
class Graph {
    nodes: Dot[];

    constructor(nodes: Dot[]) {
        this.nodes = nodes;
    }

    getObjectIDs(): string[] {
        var IDs: string[] = new Array();
        for (var i = 0; i < this.nodes.length; i++) {
            IDs[Object.keys(IDs).length] = this.nodes[i].id;
        }
        return IDs;
    }

    getClass(ID: string): string {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                return this.nodes[i].class;
            }
        }
    }

    getFields(ID: string): string[] {
        var fields: string[] = new Array();
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                for (var x in this.nodes[i].field) {
                    fields[Object.keys(fields).length] = x;
                }
            }
        }
        return fields;
    }

    getField(ID: string, FN: string): string {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                for (var x in this.nodes[i].field) {
                    if (x == FN) {
                        return this.nodes[i].field[x].id;
                    }
                }
            }
        }
    }

    setLocation(ID: string, x: number, y: number) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                this.nodes[i].x = x;
                this.nodes[i].y = y;
            }
        }
    }

    draw(context) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].draw(context, 50, 50);
        }
    }
}

class Dot {
    id: string;
    class: string;
    field: { [index: string]: Dot };
    x: number;
    y: number;

    constructor(id: string, cls: string) {
        this.id = id;
        this.class = cls;
        this.field = {};
        this.x = 0;
        this.y = 0;
    }

    addfield(name: string, dot: Dot) {
        this.field[name] = dot;
    }

    draw(context, width: number, height: number) {
        var x: number = this.x - width / 2;
        var y: number = this.y - height / 2;

        context.strokeStyle = "rgba(0,0,0,1.0)";
        context.fillStyle = "rgba(0,0,0,1.0)";

        context.strokeRect(x, y, width, height);        //矩形の描画

        context.font = "italic 50px Arial";
        context.fillText(this.id, x, y + height);      //数字の描画

        for (var fld in this.field) {
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(this.field[fld].x, this.field[fld].y);
            context.stroke();
        }
    }
}


/*
 * Example and Test 1
 * simple list
 */

//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "number");
//var dot5: Dot = new Dot("id5", "number");
//var dot6: Dot = new Dot("id6", "number");

//dot1.addfield("next", dot2);
//dot1.addfield("val", dot4);
//dot2.addfield("next", dot3);
//dot2.addfield("prev", dot1);
//dot2.addfield("val", dot5);
//dot3.addfield("prev", dot2);
//dot3.addfield("val", dot6);

//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6];
//var grp: Graph = new Graph(nodes);

//console.log(grp.getObjectIDs());
//console.log(grp.getClass("id2"));
//console.log(grp.getClass("id4"));
//console.log(grp.getFields("id2"));
//console.log(grp.getField("id1", "next"));



/*
 * Example and Test 2
 * list having tree
 */

//var dot1: Dot = new Dot("id1", "List");
//var dot2: Dot = new Dot("id2", "List");
//var dot3: Dot = new Dot("id3", "List");
//var dot4: Dot = new Dot("id4", "Tree");
//var dot5: Dot = new Dot("id5", "Tree");
//var dot6: Dot = new Dot("id6", "Tree");
//var dot7: Dot = new Dot("id7", "Tree");
//var dot8: Dot = new Dot("id8", "Tree");
//var dot9: Dot = new Dot("id9", "Tree");
//var dot10: Dot = new Dot("id10", "number");
//var dot11: Dot = new Dot("id11", "number");
//var dot12: Dot = new Dot("id12", "number");
//var dot13: Dot = new Dot("id13", "number");
//var dot14: Dot = new Dot("id14", "number");
//var dot15: Dot = new Dot("id15", "number");
//var dot16: Dot = new Dot("id16", "number");
//var dot17: Dot = new Dot("id17", "number");
//var dot18: Dot = new Dot("id18", "number");

//dot1.addfield("next", dot2);
//dot1.addfield("in", dot4);
//dot1.addfield("num", dot10);
//dot2.addfield("next", dot3);
//dot2.addfield("prev", dot1);
//dot2.addfield("in", dot6);
//dot2.addfield("num", dot11);
//dot3.addfield("prev", dot2);
//dot3.addfield("in", dot9);
//dot3.addfield("num", dot12);
//dot4.addfield("right", dot5);
//dot4.addfield("val", dot13);
//dot5.addfield("parent", dot4);
//dot5.addfield("val", dot14);
//dot6.addfield("left", dot7);
//dot6.addfield("right", dot8);
//dot6.addfield("val", dot16);
//dot7.addfield("parent", dot6);
//dot7.addfield("val", dot15);
//dot8.addfield("parent", dot6);
//dot8.addfield("val", dot17);
//dot9.addfield("val", dot18);

//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9, dot10, dot11, dot12, dot13, dot14, dot15, dot16, dot17, dot18];
//var grp: Graph = new Graph(nodes);

/*
 * Example and Test 3
 * cycle list
 */

//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//var dot5: Dot = new Dot("id5", "number");
//var dot6: Dot = new Dot("id6", "number");
//var dot7: Dot = new Dot("id7", "number");
//var dot8: Dot = new Dot("id8", "number");

//dot1.addfield("next", dot2);
//dot1.addfield("prev", dot4);
//dot1.addfield("val", dot5);
//dot2.addfield("next", dot3);
//dot2.addfield("prev", dot1);
//dot2.addfield("val", dot6);
//dot3.addfield("next", dot4);
//dot3.addfield("prev", dot2);
//dot3.addfield("val", dot7);
//dot4.addfield("next", dot1);
//dot4.addfield("prev", dot3);
//dot4.addfield("val", dot8);

//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8];
//var grp: Graph = new Graph(nodes);

/*
 * Example and Test 3
 * simple tree
 */

//var dot0: Dot = new Dot("id0", "Node");
//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//var dot5: Dot = new Dot("id5", "number");
//var dot6: Dot = new Dot("id6", "number");
//var dot7: Dot = new Dot("id7", "number");
//var dot8: Dot = new Dot("id8", "number");
//var dot9: Dot = new Dot("id9", "number");

//dot0.addfield("left", dot1);
//dot0.addfield("right", dot4);
//dot0.addfield("val", dot5);
//dot1.addfield("left", dot2);
//dot1.addfield("right", dot3);
//dot1.addfield("parent", dot0);
//dot1.addfield("val", dot6);
//dot2.addfield("parent", dot1);
//dot2.addfield("val", dot7);
//dot3.addfield("parent", dot1);
//dot3.addfield("val", dot8);
//dot4.addfield("parent", dot0);
//dot4.addfield("val", dot9);

//var nodes: Dot[] = [dot0, dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9];
//var grp: Graph = new Graph(nodes);

/*
 * Example and Test 5
 * complex cycle
 */

//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//var dot5: Dot = new Dot("id5", "Node");
//var dot6: Dot = new Dot("id6", "Node");

//dot1.addfield("next", dot2);
//dot2.addfield("next", dot5);
//dot2.addfield("next2", dot6);
//dot3.addfield("next", dot2);
//dot4.addfield("next", dot3);
//dot4.addfield("next2", dot1);
//dot5.addfield("next", dot4);
//dot6.addfield("next", dot4);

//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6];
//var grp: Graph = new Graph(nodes);

/*
 * Example and Test 6
 * complex cycle
 */

var dot1: Dot = new Dot("id1", "Node");
var dot2: Dot = new Dot("id2", "Node");
var dot3: Dot = new Dot("id3", "Node");
var dot4: Dot = new Dot("id4", "Node");
var dot5: Dot = new Dot("id5", "Node");
var dot6: Dot = new Dot("id6", "Node");
var dot7: Dot = new Dot("id7", "Node");
var dot8: Dot = new Dot("id8", "Node");
var dot9: Dot = new Dot("id9", "Node");
var dot10: Dot = new Dot("id10", "Node");
var dot11: Dot = new Dot("id11", "Node");
var dot12: Dot = new Dot("id12", "Node");

dot1.addfield("next", dot7);
dot1.addfield("next2", dot12);
dot2.addfield("next", dot1);
dot2.addfield("next2", dot10);
dot3.addfield("next", dot2);
dot3.addfield("next2", dot4);
dot3.addfield("next3", dot9);
dot4.addfield("next", dot5);
dot5.addfield("next", dot6);
dot6.addfield("next", dot3);
dot6.addfield("next2", dot8);
dot7.addfield("next", dot6);
dot8.addfield("next", dot5);
dot9.addfield("next", dot6);
dot11.addfield("next", dot1);
dot11.addfield("next2", dot2);
dot12.addfield("next", dot11);

var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9, dot10, dot11, dot12];
var grp: Graph = new Graph(nodes);