//コンパイルを通すためにGraphクラスを仮決め
class Graph {
    nodes: Dot[];
    variableEdges: Edge[];

    constructor(nodes: Dot[]) {
        this.nodes = nodes;
        this.variableEdges = new Array();
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

    setDistance(ID: string, distance: number) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                this.nodes[i].distance = distance;
            }
        }
    }

    setSize(ID: string, size: number) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                this.nodes[i].size = size;
            }
        }
    }

    setColor(ID: string, color: string) {

    }

    setEdgeLabelSize(fromID: string, toID: string, size: number) {

    }

    setVariableEdgeLabelSize(toID: string, size: number) {

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
    distance: number;
    size: number;

    constructor(id: string, cls: string) {
        this.id = id;
        this.class = cls;
        this.field = {};
        this.x = 0;
        this.y = 0;
        this.distance = -1;
        this.size = -1;
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

class Edge {
    from: string;
    to: string;
    label: string;

    constructor(from, to, label) {
        this.from = from;
        this.to = to;
        this.label = label;
    }
}

/**
 * test1：シンプルなリスト
 * test2：ツリーの入ったリスト
 * test3：循環リスト
 * test4：シンプルなツリー
 * test5：複雑な循環を持った構造①
 * test6：複雑な循環を持った構造②
 * test7：任意長の循環リスト
 * test8：複数のクラスのオブジェクトからなる例
 * test9：同一のフィールドが同一のオブジェクトを参照している例
 * test10：プリミティブ型を持たないシンプルなツリー
 * test11：リストの中にリスト*/
var testNumber = 1;

switch (testNumber) {
    case 1:
        /*
         * Example and Test 1
         * simple list
         */
        var dot1: Dot = new Dot("id1", "Node");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "Node");
        var dot4: Dot = new Dot("id4", "number");
        var dot5: Dot = new Dot("id5", "number");
        var dot6: Dot = new Dot("id6", "number");

        dot1.addfield("next", dot2);
        dot2.addfield("prev", dot1);
        dot2.addfield("next", dot3);
        dot3.addfield("prev", dot2);
        dot1.addfield("val", dot4);
        dot2.addfield("val", dot5);
        dot3.addfield("val", dot6);

        var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6];
        var grp: Graph = new Graph(nodes);
        break;

    case 2:
        /*
         * Example and Test 2
         * list having tree
         */
        var dot1: Dot = new Dot("id1", "List");
        var dot2: Dot = new Dot("id2", "List");
        var dot3: Dot = new Dot("id3", "List");
        var dot4: Dot = new Dot("id4", "Tree");
        var dot5: Dot = new Dot("id5", "Tree");
        var dot6: Dot = new Dot("id6", "Tree");
        var dot7: Dot = new Dot("id7", "Tree");
        var dot8: Dot = new Dot("id8", "Tree");
        var dot9: Dot = new Dot("id9", "Tree");
        var dot10: Dot = new Dot("id10", "number");
        var dot11: Dot = new Dot("id11", "number");
        var dot12: Dot = new Dot("id12", "number");
        var dot13: Dot = new Dot("id13", "number");
        var dot14: Dot = new Dot("id14", "number");
        var dot15: Dot = new Dot("id15", "number");
        var dot16: Dot = new Dot("id16", "number");
        var dot17: Dot = new Dot("id17", "number");
        var dot18: Dot = new Dot("id18", "number");

        dot1.addfield("next", dot2);
        dot1.addfield("in", dot4);
        dot1.addfield("num", dot10);
        dot2.addfield("next", dot3);
        dot2.addfield("prev", dot1);
        dot2.addfield("in", dot6);
        dot2.addfield("num", dot11);
        dot3.addfield("prev", dot2);
        dot3.addfield("in", dot9);
        dot3.addfield("num", dot12);
        dot4.addfield("right", dot5);
        dot4.addfield("val", dot13);
        dot5.addfield("parent", dot4);
        dot5.addfield("val", dot14);
        dot6.addfield("left", dot7);
        dot6.addfield("right", dot8);
        dot6.addfield("val", dot16);
        dot7.addfield("parent", dot6);
        dot7.addfield("val", dot15);
        dot8.addfield("parent", dot6);
        dot8.addfield("val", dot17);
        dot9.addfield("val", dot18);

        //追加のフィールド
        dot4.addfield("parent", dot1);
        dot6.addfield("parent", dot2);
        dot9.addfield("parent", dot3);

        var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9, dot10, dot11, dot12, dot13, dot14, dot15, dot16, dot17, dot18];
        var grp: Graph = new Graph(nodes);
        break;

    case 3:
        /*
         * Example and Test 3
         * cycle list
         */
        var dot1: Dot = new Dot("id1", "Node");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "Node");
        var dot4: Dot = new Dot("id4", "Node");
        var dot5: Dot = new Dot("id5", "number");
        var dot6: Dot = new Dot("id6", "number");
        var dot7: Dot = new Dot("id7", "number");
        var dot8: Dot = new Dot("id8", "number");

        dot1.addfield("next", dot2);
        dot1.addfield("prev", dot4);
        dot1.addfield("val", dot5);
        dot2.addfield("next", dot3);
        dot2.addfield("prev", dot1);
        dot2.addfield("val", dot6);
        dot3.addfield("next", dot4);
        dot3.addfield("prev", dot2);
        dot3.addfield("val", dot7);
        dot4.addfield("next", dot1);
        dot4.addfield("prev", dot3);
        dot4.addfield("val", dot8);

        var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8];
        var grp: Graph = new Graph(nodes);
        break;

    case 4:
        /*
         * Example and Test 4
         * simple tree
         */
        var dot0: Dot = new Dot("id0", "Node");
        var dot1: Dot = new Dot("id1", "Node");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "Node");
        var dot4: Dot = new Dot("id4", "Node");
        var dot5: Dot = new Dot("id5", "number");
        var dot6: Dot = new Dot("id6", "number");
        var dot7: Dot = new Dot("id7", "number");
        var dot8: Dot = new Dot("id8", "number");
        var dot9: Dot = new Dot("id9", "number");

        dot0.addfield("left", dot1);
        dot0.addfield("right", dot4);
        dot0.addfield("val", dot5);
        dot1.addfield("left", dot2);
        dot1.addfield("right", dot3);
        dot1.addfield("parent", dot0);
        dot1.addfield("val", dot6);
        dot2.addfield("parent", dot1);
        dot2.addfield("val", dot7);
        dot3.addfield("parent", dot1);
        dot3.addfield("val", dot8);
        dot4.addfield("parent", dot0);
        dot4.addfield("val", dot9);

        var nodes: Dot[] = [dot0, dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9];
        var grp: Graph = new Graph(nodes);
        break;

    case 5:
        /*
         * Example and Test 5
         * complex cycle
         */
        var dot1: Dot = new Dot("id1", "Node");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "Node");
        var dot4: Dot = new Dot("id4", "Node");
        var dot5: Dot = new Dot("id5", "Node");
        var dot6: Dot = new Dot("id6", "Node");

        dot1.addfield("next", dot2);
        dot2.addfield("next", dot5);
        dot2.addfield("next2", dot6);
        dot3.addfield("next", dot2);
        dot4.addfield("next", dot3);
        dot4.addfield("next2", dot1);
        dot5.addfield("next", dot4);
        dot6.addfield("next", dot4);

        var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6];
        var grp: Graph = new Graph(nodes);
        break;

    case 6:
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
        break;

    case 7:
        /*
         * Example and Test 7
         * complex cycle
         */
        var dotn: number = 10;
        var nodes: Dot[] = new Array(dotn);
        var grp: Graph = new Graph(nodes);

        for (var i = 0; i < dotn; i++) {
            nodes[i] = new Dot("id" + i, "Node");
        }

        for (var i = 0; i < dotn - 1; i++) {
            var j: number = i + 1;
            nodes[i].addfield("next", nodes[i + 1]);
        }
        nodes[dotn - 1].addfield("next", nodes[0]);
        break;

    case 8:
        /*
         * Example and Test 8
         * hybrid data structure
         */
        var dot1: Dot = new Dot("id1", "List");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "number");

        dot1.addfield("child", dot2);
        dot1.addfield("val", dot3);
        dot2.addfield("parent", dot1);

        var nodes: Dot[] = [dot1, dot2, dot3];
        var grp: Graph = new Graph(nodes);
        break;

    case 9:
        /*
         * Example and Test 9
         * hybrid data structure
         */
        var dot1: Dot = new Dot("id1", "Parent");
        var dot2: Dot = new Dot("id2", "Parent");
        var dot3: Dot = new Dot("id3", "Child");

        dot1.addfield("child", dot3);
        dot2.addfield("child", dot3);
        dot1.addfield("wife", dot2);
        dot2.addfield("husband", dot1);

        var nodes: Dot[] = [dot1, dot2, dot3];
        var grp: Graph = new Graph(nodes);
        break;

    case 10:
        /*
         * Example and Test 10
         * simple tree
         */
        var dot0: Dot = new Dot("id0", "Node");
        var dot1: Dot = new Dot("id1", "Node");
        var dot2: Dot = new Dot("id2", "Node");
        var dot3: Dot = new Dot("id3", "Node");
        var dot4: Dot = new Dot("id4", "Node");
        var dot5: Dot = new Dot("id5", "Node");
        var dot6: Dot = new Dot("id6", "Node");

        dot0.addfield("left", dot1);
        dot0.addfield("right", dot4);
        dot1.addfield("left", dot2);
        dot1.addfield("right", dot3);
        dot1.addfield("parent", dot0);
        dot2.addfield("parent", dot1);
        dot3.addfield("parent", dot1);
        dot4.addfield("parent", dot0);
        dot4.addfield("left", dot5);
        dot4.addfield("right", dot6);
        dot5.addfield("parent", dot4);
        dot6.addfield("parent", dot4);

        var nodes: Dot[] = [dot0, dot1, dot2, dot3, dot4, dot5, dot6];
        var grp: Graph = new Graph(nodes);
        break;

    case 11:
        /*
         * Example and Test 11
         * List in List
         */
        var ListLength: number = 3;
        var Hierarchy: number = 2;

        var NodeNumber = ListLength * (Math.pow(ListLength, Hierarchy) - 1) / (ListLength - 1);

        var nodes: Dot[] = new Array(NodeNumber);
        var grp: Graph = new Graph(nodes);

        for (var i = 0; i < NodeNumber; i++) {
            nodes[i] = new Dot("id" + i, "List");
        }
        for (var i = 0; i < NodeNumber; i++) {
            if (i % ListLength != (ListLength - 1)) {
                nodes[i].addfield("next", nodes[i + 1]);
            }
            if (i * ListLength + ListLength < NodeNumber) {
                nodes[i].addfield("in", nodes[i * ListLength + ListLength]);
            }
        }

        break;
}