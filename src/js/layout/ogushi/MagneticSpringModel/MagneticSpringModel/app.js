//コンパイルを通すためにGraphクラスを仮決め
var Graph = /** @class */ (function () {
    function Graph(nodes) {
        this.nodes = nodes;
    }
    Graph.prototype.getObjectIDs = function () {
        var IDs = new Array();
        for (var i = 0; i < this.nodes.length; i++) {
            IDs[Object.keys(IDs).length] = this.nodes[i].id;
        }
        return IDs;
    };
    Graph.prototype.getClass = function (ID) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                return this.nodes[i].class;
            }
        }
    };
    Graph.prototype.getFields = function (ID) {
        var fields = new Array();
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                for (var x in this.nodes[i].field) {
                    fields[Object.keys(fields).length] = x;
                }
            }
        }
        return fields;
    };
    Graph.prototype.getField = function (ID, FN) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                for (var x in this.nodes[i].field) {
                    if (x == FN) {
                        return this.nodes[i].field[x].id;
                    }
                }
            }
        }
    };
    Graph.prototype.setLocation = function (ID, x, y) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (ID == this.nodes[i].id) {
                this.nodes[i].x = x;
                this.nodes[i].y = y;
            }
        }
    };
    Graph.prototype.draw = function (context) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].draw(context, 50, 50);
        }
    };
    return Graph;
}());
var Dot = /** @class */ (function () {
    function Dot(id, cls) {
        this.id = id;
        this.class = cls;
        this.field = {};
        this.x = 0;
        this.y = 0;
    }
    Dot.prototype.addfield = function (name, dot) {
        this.field[name] = dot;
    };
    Dot.prototype.draw = function (context, width, height) {
        var x = this.x - width / 2;
        var y = this.y - height / 2;
        context.strokeStyle = "rgba(0,0,0,1.0)";
        context.fillStyle = "rgba(0,0,0,1.0)";
        context.strokeRect(x, y, width, height); //矩形の描画
        context.font = "italic 50px Arial";
        context.fillText(this.id, x, y + height); //数字の描画
        for (var fld in this.field) {
            context.beginPath();
            context.moveTo(this.x, this.y);
            context.lineTo(this.field[fld].x, this.field[fld].y);
            context.stroke();
        }
    };
    return Dot;
}());
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
//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//var dot5: Dot = new Dot("id5", "Node");
//var dot6: Dot = new Dot("id6", "Node");
//var dot7: Dot = new Dot("id7", "Node");
//var dot8: Dot = new Dot("id8", "Node");
//var dot9: Dot = new Dot("id9", "Node");
//var dot10: Dot = new Dot("id10", "Node");
//var dot11: Dot = new Dot("id11", "Node");
//var dot12: Dot = new Dot("id12", "Node");
//dot1.addfield("next", dot7);
//dot1.addfield("next2", dot12);
//dot2.addfield("next", dot1);
//dot2.addfield("next2", dot10);
//dot3.addfield("next", dot2);
//dot3.addfield("next2", dot4);
//dot3.addfield("next3", dot9);
//dot4.addfield("next", dot5);
//dot5.addfield("next", dot6);
//dot6.addfield("next", dot3);
//dot6.addfield("next2", dot8);
//dot7.addfield("next", dot6);
//dot8.addfield("next", dot5);
//dot9.addfield("next", dot6);
//dot11.addfield("next", dot1);
//dot11.addfield("next2", dot2);
//dot12.addfield("next", dot11);
//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8, dot9, dot10, dot11, dot12];
//var grp: Graph = new Graph(nodes);
/*
 * Example and Test 7
 * complex cycle
 */
//var dotn: number = 100;
//var nodes: Dot[] = new Array(dotn);
//var grp: Graph = new Graph(nodes);
//for (var i = 0; i < dotn; i++) {
//    nodes[i] = new Dot("id" + i, "Node");
//}
//for (var i = 0; i < dotn - 1; i++) {
//    var j: number = i + 1;
//    nodes[i].addfield("next", nodes[i + 1]);
//}
//nodes[dotn - 1].addfield("next", nodes[0]);
/*
 * Example and Test 7
 * super simple list
 */
//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//dot1.addfield("next", dot2);
//dot2.addfield("prev", dot1);
//dot2.addfield("next", dot3);
//dot3.addfield("prev", dot2);
//dot3.addfield("next", dot4);
//dot4.addfield("prev", dot3);
//var nodes: Dot[] = [dot1, dot2];
////var nodes: Dot[] = [dot1, dot2, dot3];
//var nodes: Dot[] = [dot1, dot2, dot3, dot4];
//var grp: Graph = new Graph(nodes);
/*
 * Example and Test 8
 * super simple tree
 */
//var dot1: Dot = new Dot("id1", "Node");
//var dot2: Dot = new Dot("id2", "Node");
//var dot3: Dot = new Dot("id3", "Node");
//var dot4: Dot = new Dot("id4", "Node");
//var dot5: Dot = new Dot("id5", "Node");
//var dot6: Dot = new Dot("id6", "Node");
//var dot7: Dot = new Dot("id7", "Node");
//dot1.addfield("left", dot2);
//dot2.addfield("parent", dot1);
//dot1.addfield("right", dot3);
//dot3.addfield("parent", dot1);
//dot2.addfield("left", dot4);
//dot4.addfield("parent", dot2);
//dot2.addfield("right", dot5);
//dot5.addfield("parent", dot2);
//dot3.addfield("left", dot6);
//dot6.addfield("parent", dot3);
//dot3.addfield("right", dot7);
//dot7.addfield("parent", dot3);
//var nodes: Dot[] = [dot1, dot2, dot3, dot4, dot5, dot6, dot7];
//var grp: Graph = new Graph(nodes);
/*
 * Example and Test 8
 * n tree
 */
function makeNTree(n) {
    var nodes = new Array();
    for (var i = 0; i < Math.pow(2, n) - 1; i++) {
        var dot = new Dot("id" + i, "Node");
        nodes.push(dot);
    }
    for (var i = 0; i < Math.pow(2, n) / 2 - 1; i++) {
        nodes[i].addfield("left", nodes[i * 2 + 1]);
        nodes[i * 2 + 1].addfield("parent", nodes[i]);
        nodes[i].addfield("right", nodes[i * 2 + 2]);
        nodes[i * 2 + 2].addfield("parent", nodes[i]);
    }
    return nodes;
}
var grp = new Graph(makeNTree(4));
///<reference path="example.ts" />
setGraphLocation(grp);
//グラフの描画をするための変数
var canvas = document.getElementById("cv");
var context = canvas.getContext("2d");
context.font = "italic 50px Arial";
//context.clearRect(0, 0, 3200, 1800);
//grp.draw(context);
console.log(grp);
//Kanonからgraphオブジェクトを受け取り、graphオブジェクト内のノードの座標を更新する関する（メイン関数）
function setGraphLocation(graph) {
    //スタックの実装
    var Stack = /** @class */ (function () {
        function Stack() {
            this.stack = new Array();
        }
        //プッシュ
        Stack.prototype.push = function (str) {
            this.stack.push(str);
        };
        //ポップ
        Stack.prototype.pop = function () {
            if (this.stack.length == 0) {
                return null;
            }
            else {
                var p = this.stack.pop();
                return p;
            }
        };
        //スタックの中身が空の場合、trueを返す
        Stack.prototype.isZero = function () {
            return this.stack.length == 0;
        };
        //スタックされている値を配列として返す
        Stack.prototype.returnArray = function () {
            return copyArray(this.stack);
        };
        return Stack;
    }());
    //ベクトルの実装
    var Vector = /** @class */ (function () {
        function Vector(angle, size) {
            this.angle = angle;
            this.size = size;
        }
        return Vector;
    }());
    /*
     * クラス名とフィールド名をまとめてクラス定義する
     */
    var ClassAndField = /** @class */ (function () {
        function ClassAndField(cls, field) {
            this.cls = cls;
            this.field = field;
            this.angle = 0;
        }
        return ClassAndField;
    }());
    ////角度付きエッジのクラス
    //class EdgeWithAngle {
    //    ID1: string;
    //    ID2: string;
    //    angle: number;
    //    constructor(ID1: string, ID2: string, angle: number) {
    //        this.ID1 = ID1;
    //        this.ID2 = ID2;
    //        this.angle = angle;
    //    }
    //}
    //磁針エッジクラス
    var MagneticNeedleEdge = /** @class */ (function () {
        /*
         * typeofNeedleは磁針のタイプを数字で表す。
         * 0ならば有向辺の磁針、
         * 1ならば無向辺の磁針（N極とS極の区別がない）
         * 2ならば磁場からの影響を受けない辺
         */
        function MagneticNeedleEdge(startID, endID, cls, fld, type) {
            this.startID = startID;
            this.endID = endID;
            this.class = cls;
            this.field = fld;
            this.typeOfNeedle = type;
        }
        return MagneticNeedleEdge;
    }());
    //磁場を表すクラス
    var MagneticField = /** @class */ (function () {
        function MagneticField(cls, fld, vtr) {
            this.class = cls;
            this.field = fld;
            this.vector = vtr;
        }
        return MagneticField;
    }());
    //配列内に引数と同じ値があるかどうかを走査する
    function sameT_InArray(t, arrayT) {
        var bool = false;
        for (var i = 0; i < arrayT.length; i++) {
            bool = bool || (arrayT[i] == t);
        }
        return bool;
    }
    //ClassAndFieldの配列内に引数と同じ値があるかどうかを走査する
    function sameClassAndField_InArray(caf, arrayCaf) {
        var bool = false;
        for (var i = 0; i < arrayCaf.length; i++) {
            bool = bool || (caf.cls == arrayCaf[i].cls && caf.field == arrayCaf[i].field);
        }
        return bool;
    }
    //配列を別の配列にコピーする
    function copyArray(origin) {
        var array = new Array(origin.length);
        for (var i = 0; i < origin.length; i++) {
            array[i] = origin[i];
        }
        return array;
    }
    //配列同士が同じものであるかどうかを調べる
    function arrayEqual(a1, a2) {
        var bool = true;
        if (a1.length != a2.length) {
            return false;
        }
        else {
            for (var i = 0; i < a1.length; i++) {
                bool = bool && (a1[i] === a2[i]);
            }
            return bool;
        }
    }
    //値から配列の最初のkeyを取得し、keyより前の要素を削除した配列を返す
    function arraySpliceBoforeIndexOf(key, array) {
        var carray = copyArray(array);
        var index = carray.indexOf(key);
        carray.splice(0, index);
        return carray;
    }
    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph, medgelist, mfield, drawcircle, edgewithprimitivevalue) {
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
        //プリミティブ型の値を除いたオブジェクトID配列
        var ObjectIDsExceptPrimitiveValue = ObjectIDs.filter(function (value, index, array) {
            return isPrimitiveString(graph.getClass(value));
        });
        //グラフ内で使われているオブジェクトのクラス名の配列
        var allObjectClass = new Array(ObjectIDs.length);
        for (var i = 0; i < ObjectIDs.length; i++) {
            allObjectClass[i] = graph.getClass(ObjectIDs[i]);
        }
        //重複を除いたクラス名の配列
        var allObjectClassExceptDuplication = allObjectClass.filter(function (value, index, array) {
            return array.indexOf(value) === index;
        });
        //クラス名ごとに所属するIDを配列にする、IDsSeparateClassは配列の配列
        var IDsSeparateClass = new Array(allObjectClassExceptDuplication.length);
        for (var i = 0; i < allObjectClassExceptDuplication.length; i++) {
            IDsSeparateClass[i] = ObjectIDs.filter(function (value, index, array) {
                return graph.getClass(value) == allObjectClassExceptDuplication[i];
            });
        }
        //同じ型のオブジェクトを結ぶエッジの角度を決定
        for (var i = 0; i < allObjectClassExceptDuplication.length; i++) {
            if (isPrimitiveString(allObjectClassExceptDuplication[i])) {
                decisionEdgeAngleConnectingSameClass(graph, medgelist, mfield, allObjectClassExceptDuplication[i], IDsSeparateClass[i], drawcircle);
            }
        }
        //異なる型を参照するエッジの角度を決定
        decisonEdgeAngleConnectingDifferentClass(graph, medgelist, mfield, ObjectIDs, allObjectClass, ObjectIDsExceptPrimitiveValue, edgewithprimitivevalue);
    }
    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str) {
        return (str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function");
    }
    //同じ型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisionEdgeAngleConnectingSameClass(graph, medgelist, mfield, cls, IDs, drawcircle) {
        //必要なフィールド名の配列
        var arrayField = necessaryField(graph, cls, IDs);
        //MagneticFieldの追加
        if (arrayField.length != 0) {
            if (arrayField.length == 1) {
                var mf = new MagneticField(cls, arrayField[0], new Vector(0, 1));
                mfield.push(mf);
            }
            else {
                var mfs = new Array(arrayField.length);
                for (var i = 0; i < mfs.length; i++) {
                    mfs[i] = new MagneticField(cls, arrayField[i], new Vector(Math.PI * (arrayField.length * 2 - i * 2 - 1) / (arrayField.length * 2), 1));
                    mfield.push(mfs[i]);
                }
            }
        }
        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingSameClass(graph, medgelist, cls, IDs, arrayField);
        //閉路があるか探索し、閉路があった場合は閉路上のエッジの角度を全て無しにする
        searchCycleGraph(graph, medgelist, cls, IDs, arrayField, drawcircle);
        /*
         * 必要なフィールド名の配列を返す関数
         */
        function necessaryField(graph, cls, IDs) {
            //自身の型を再帰的に参照する全てのフィールド名
            var allRecursiveFields = identifyAllRecursiveField(graph, cls, IDs);
            //不必要なフィールド名
            var unnecessaryFields = identifyUnnecessaryField(graph, cls, IDs);
            //全ての再帰的なフィールド名から不必要なフィールド名を除いた配列
            var necessaryFields = allRecursiveFields.filter(function (value, index, array) {
                return !sameT_InArray(value, unnecessaryFields);
            });
            return necessaryFields;
            //補助関数、自身の型を再規定に参照する全てのフィールド名を返す
            function identifyAllRecursiveField(graph, cls, IDs) {
                var fieldArray = new Array();
                for (var i = 0; i < IDs.length; i++) {
                    var getFields = graph.getFields(IDs[i]);
                    for (var j = 0; j < getFields.length; j++) {
                        if (graph.getClass(graph.getField(IDs[i], getFields[j])) == cls && !sameT_InArray(getFields[j], fieldArray)) {
                            fieldArray.push(getFields[j]);
                        }
                    }
                }
                return fieldArray;
            }
            //補助関数、不必要なフィールド名を返す
            function identifyUnnecessaryField(graph, cls, IDs) {
                var unnecessaryFields = new Array();
                //⇄の関係となっているフィールド名のペアを列挙
                var setFields = identifySetField(graph, cls, IDs);
                identifyUnnecessaryField_sub(setFields, unnecessaryFields);
                return unnecessaryFields;
                //⇄の関係となっているフィールド名のペアを列挙する補助関数
                function identifySetField(graph, cls, IDs) {
                    var usedObjectIDs = new Array();
                    var pairFields = new Array();
                    for (var i = 0; i < IDs.length; i++) {
                        identifySetField_sub(graph, cls, IDs[i]);
                    }
                    return pairFields;
                    //補助関数の補助関数
                    function identifySetField_sub(graph, cls, ID) {
                        if (!sameT_InArray(ID, usedObjectIDs)) {
                            usedObjectIDs.push(ID); //今見ているオブジェクトのID
                            var getFields = graph.getFields(ID);
                            for (var j = 0; j < getFields.length; j++) {
                                if (graph.getClass(graph.getField(ID, getFields[j])) == cls && !sameT_InArray(graph.getField(ID, getFields[j]), usedObjectIDs)) {
                                    var nextID = graph.getField(ID, getFields[j]); //次のオブジェクトのID
                                    var getFields2 = graph.getFields(nextID);
                                    for (var k = 0; k < getFields2.length; k++) {
                                        if (graph.getField(nextID, getFields2[k]) == ID) {
                                            pairFields.push(getFields[j]);
                                            pairFields.push(getFields2[k]);
                                        }
                                    }
                                    identifySetField_sub(graph, cls, nextID);
                                }
                            }
                        }
                    }
                }
                //補助関数、不必要なフィールド名を列挙する
                function identifyUnnecessaryField_sub(setField, unnecessaryField) {
                    if (setField.length != 0) {
                        var str = mode_inArray(setField);
                        unnecessaryField.push(str);
                        var numArray = new Array();
                        for (var i = 0; i < setField.length / 2; i++) {
                            if (setField[2 * i] == str || setField[2 * i + 1] == str) {
                                numArray.push(i);
                            }
                        }
                        for (var i = 0; i < numArray.length; i++) {
                            numArray[i] = numArray[i] - i;
                            setField.splice(2 * numArray[i], 2);
                        }
                        identifyUnnecessaryField_sub(setField, unnecessaryField);
                    }
                    //補助関数の補助関数、配列の中の最頻値を求める
                    function mode_inArray(array) {
                        var strArray = new Array();
                        for (var i = 0; i < array.length; i++) {
                            if (!sameT_InArray(array[i], strArray)) {
                                strArray.push(array[i]);
                            }
                        }
                        var length = strArray.length;
                        var numArray = new Array(length);
                        for (var i = 0; i < length; i++) {
                            numArray[i] = 0;
                        }
                        for (var i = 0; i < array.length; i++) {
                            for (var j = 0; j < length; j++) {
                                if (array[i] == strArray[j]) {
                                    numArray[j] += 1;
                                }
                            }
                        }
                        var max = numArray[0];
                        var id = 0;
                        for (var i = 0; i < length; i++) {
                            if (max <= numArray[i]) {
                                max = numArray[i];
                                id = i;
                            }
                        }
                        return strArray[id];
                    }
                }
            }
        }
        /*
         * オブジェクトを辿りながらエッジリストを作る関数
         */
        function makeEdgeListConnectingSameClass(graph, medgelist, cls, IDs, arrayfield) {
            //辿ったオブジェクトのIDを記録する配列
            var usedObjectIDs = new Array();
            //ID順にオブジェクトを辿りながらエッジリストを作る
            for (var i = 0; i < IDs.length; i++) {
                makeEdgeListConnectingSameClass_sub(graph, medgelist, cls, IDs[i], arrayfield);
            }
            //補助関数
            function makeEdgeListConnectingSameClass_sub(graph, medgelist, cls, ID, arrayField) {
                if (!sameT_InArray(ID, usedObjectIDs)) { //引数のオブジェクトIDがまだ見たことのないものならば
                    usedObjectIDs.push(ID); //見ているオブジェクトのIDを記録
                    for (var j = 0; j < arrayField.length; j++) {
                        var nextID = graph.getField(ID, arrayField[j]); //次のオブジェクトのID
                        if (graph.getClass(nextID) == cls) {
                            medgelist.push(new MagneticNeedleEdge(ID, nextID, cls, arrayField[j], 0));
                            makeEdgeListConnectingSameClass_sub(graph, medgelist, cls, nextID, arrayField);
                        }
                    }
                }
            }
        }
        /*
         * 閉路を探索する
         * drawcircleがtrueの場合、閉路上のエッジの角度を全て無効にする
         * drawcircleがfalseの場合、閉路上のエッジを一本削除する
         */
        function searchCycleGraph(graph, medgelist, cls, IDs, arrayField, drawcircle) {
            //閉路上のIDの配列
            var cycleIDs = cycleGraphIDs(graph, cls, IDs, arrayField);
            if (drawcircle) { //閉路上のエッジの角度を全て無効にする
                for (var i = 0; i < cycleIDs.length; i++) {
                    for (var j = 0; j < cycleIDs[i].length - 1; j++) {
                        for (var k = 0; k < medgelist.length; k++) {
                            if (cycleIDs[i][j] == medgelist[k].startID && cycleIDs[i][j + 1] == medgelist[k].endID) {
                                medgelist[k].typeOfNeedle = 2; //角度を無効にするためには、typeOfNeedleに2を代入する
                            }
                        }
                    }
                }
            }
            else { //閉路上のエッジを一本削除する
                /*
                 * アルゴリズムが思い浮かばなかったので後回し
                 */
            }
            //補助関数、閉路を探索し、閉路上のIDの配列を返す（新）
            function cycleGraphIDs(graph, cls, IDs, arrayField) {
                var cycleIDs = new Array();
                var usedIDs = new Array(); //訪れたことのあるIDを記録
                for (var i = 0; i < IDs.length; i++) {
                    if (!sameT_InArray(IDs[i], usedIDs)) {
                        var cycleIDsFromOneID = cycleGraphIDsFromOneID(graph, cls, usedIDs, arrayField, IDs[i]);
                        for (var j = 0; j < cycleIDsFromOneID.length; j++) {
                            cycleIDs.push(cycleIDsFromOneID[j]);
                        }
                    }
                }
                return cycleIDs;
                //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
                function cycleGraphIDsFromOneID(graph, cls, usedIDs, arrayField, ID) {
                    var cycleIDs = new Array();
                    var stack = new Stack(); //経路を記録するためのスタック
                    deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, ID);
                    //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                    function deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, nowID) {
                        stack.push(nowID);
                        //alert("push " + nowID + " !!");
                        //alert("stack length = " + stack.stack.length);
                        if (!sameT_InArray(nowID, usedIDs)) { //今いるノードが未訪問ならば訪問した印をつける
                            usedIDs.push(nowID);
                        }
                        for (var i = 0; i < arrayField.length; i++) {
                            var u = graph.getField(nowID, arrayField[i]);
                            if (u != undefined) {
                                if (!sameT_InArray(u, stack.stack)) {
                                    deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                                }
                                else {
                                    var cycleInStack = arraySpliceBoforeIndexOf(u, stack.stack);
                                    cycleIDs.push(cycleInStack);
                                    cycleIDs[cycleIDs.length - 1].push(u);
                                    //alert("memory " + cycleInStack.length + " length array!!");
                                }
                            }
                        }
                        stack.pop();
                        //alert("pop!! now length = " + stack.stack.length);
                    }
                    //alert(ID + " end!!");
                    return cycleIDs;
                }
            }
        }
    }
    //異なる型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisonEdgeAngleConnectingDifferentClass(graph, medgelist, mfield, IDs, classes, withoutPrimitiveIDs, edgewithprimitivevalue) {
        //必要なフィールド名の配列
        var arrayField = necessaryField(graph, IDs, classes, withoutPrimitiveIDs, edgewithprimitivevalue);
        //フィールドの角度を決定する
        decisionAngleClassAndField(arrayField);
        //MagneticFieldの追加
        for (var i = 0; i < arrayField.length; i++) {
            var mf = new MagneticField(arrayField[i].cls, arrayField[i].field, new Vector(arrayField[i].angle, 1));
            mfield.push(mf);
        }
        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingDifferentClass(graph, medgelist, IDs, classes, withoutPrimitiveIDs, arrayField);
        //参照先がプリミティブ型のときには角度を決めずにエッジを作る
        if (!edgewithprimitivevalue) {
            makeEdgeListConnectingPrimitiveValue(graph, medgelist, IDs, withoutPrimitiveIDs);
        }
        //補助関数、ClassAndFieldの配列からそれぞれのエッジの角度を決定して書きこむ
        function decisionAngleClassAndField(cafs) {
            var allCls = new Array();
            for (var i = 0; i < cafs.length; i++) {
                if (!sameT_InArray(cafs[i].cls, allCls)) {
                    allCls.push(cafs[i].cls);
                }
            }
            var clsnumber = new Array(allCls.length);
            for (var i = 0; i < clsnumber.length; i++) {
                var cnt = 0;
                for (var j = 0; j < cafs.length; j++) {
                    if (allCls[i] == cafs[j].cls) {
                        cnt += 1;
                    }
                }
                clsnumber[i] = cnt;
            }
            var cntnumber = new Array(clsnumber.length);
            for (var i = 0; i < cntnumber.length; i++) {
                cntnumber[i] = 0;
            }
            for (var i = 0; i < cafs.length; i++) {
                for (var j = 0; j < allCls.length; j++) {
                    if (cafs[i].cls == allCls[j]) {
                        cafs[i].angle = Math.PI * (clsnumber[j] * 2 - cntnumber[j] * 2 - 1) / (clsnumber[j] * 2);
                        cntnumber[j] += 1;
                    }
                }
            }
        }
        /*
         * 必要なフィールド名の配列を返す関数
         */
        function necessaryField(graph, IDs, classes, withoutPrimitiveIDs, edgewithprimitivevalue) {
            var necessaryfields = new Array();
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]); //フィールド名の配列
                var fieldIDs = new Array(fields.length); //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) { //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }
                if (edgewithprimitivevalue) {
                    /*
                     * case 1
                     * 参照先がprimitive型のときも角度を決定する
                     *
                     */
                    for (var j = 0; j < fieldIDs.length; j++) {
                        if (graph.getClass(fieldIDs[j]) != graph.getClass(withoutPrimitiveIDs[i])) {
                            var caf = new ClassAndField(graph.getClass(withoutPrimitiveIDs[i]), fields[j]);
                            if (!sameClassAndField_InArray(caf, necessaryfields)) {
                                necessaryfields.push(caf);
                            }
                        }
                    }
                }
                else {
                    /*
                     * case 2
                     * 参照先がprimitive型のときは角度を決定しない
                     *
                     */
                    for (var j = 0; j < fieldIDs.length; j++) {
                        if (graph.getClass(fieldIDs[j]) != graph.getClass(withoutPrimitiveIDs[i]) && sameT_InArray(fieldIDs[j], withoutPrimitiveIDs)) {
                            var caf = new ClassAndField(graph.getClass(withoutPrimitiveIDs[i]), fields[j]);
                            if (!sameClassAndField_InArray(caf, necessaryfields)) {
                                necessaryfields.push(caf);
                            }
                        }
                    }
                }
            }
            return necessaryfields;
        }
        /*
         * オブジェクトを辿りながらエッジリストを作る関数
         */
        function makeEdgeListConnectingDifferentClass(graph, medgelist, IDs, classes, withoutPrimitiveIDs, arrayField) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]); //フィールド名の配列
                var fieldIDs = new Array(fields.length); //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) { //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }
                for (var j = 0; j < fieldIDs.length; j++) {
                    for (var k = 0; k < arrayField.length; k++) {
                        if (arrayField[k].cls == graph.getClass(withoutPrimitiveIDs[i]) && arrayField[k].field == fields[j]) {
                            var newedge = new MagneticNeedleEdge(withoutPrimitiveIDs[i], fieldIDs[j], graph.getClass(withoutPrimitiveIDs[i]), fields[j], 0);
                            medgelist.push(newedge);
                        }
                    }
                }
            }
        }
        /*
         * 参照先がプリミティブ型のときには角度を決めずにエッジを作る
         */
        function makeEdgeListConnectingPrimitiveValue(graph, medgelist, IDs, withoutPrimitiveIDs) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]);
                for (var j = 0; j < fields.length; j++) {
                    var nextID = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                    if (!sameT_InArray(nextID, withoutPrimitiveIDs)) {
                        //var newedge: EdgeWithAngle = new EdgeWithAngle(withoutPrimitiveIDs[i], nextID, 9973);
                        var newedge = new MagneticNeedleEdge(withoutPrimitiveIDs[i], nextID, graph.getClass(withoutPrimitiveIDs[i]), fields[j], 2);
                        medgelist.push(newedge);
                    }
                }
            }
        }
    }
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph, medgelist, mfields) {
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
        //ノード数
        var DOTNUMBER = ObjectIDs.length;
        //エッジ数
        var EDGENUMBER = medgelist.length;
        var WIDTH = 1280; //表示する画面の横幅
        var HEIGHT = 720; //表示する画面の縦幅
        var WidthDot = 50; //点の縦幅
        var HeightDot = 50; //点の横幅
        var D = 0.3 * Math.sqrt(WIDTH * HEIGHT / DOTNUMBER); //スプリングの自然長
        var cs = 500; //スプリング力の係数
        var cr = 500000; //斥力の係数
        var cm = 10; //磁力の係数
        var alpha = 1; //辺の長さに影響を与えるパラメータ
        var beta = 1; //辺の回転力に影響を与えるパラメータ
        var M = 5000; //計算の繰り返し回数
        var T = Math.max(WIDTH, HEIGHT); //温度パラメータ
        var DrawVector = false; //力ベクトルを表示するか否か
        //点のクラス
        var Dot_G = /** @class */ (function () {
            function Dot_G() {
            }
            //点の初期化
            Dot_G.prototype.init = function (x, y) {
                this.x = x;
                this.y = y;
                this.vx = 0;
                this.vy = 0;
                this.fsx = 0;
                this.fsy = 0;
                this.frx = 0;
                this.fry = 0;
                this.fmx = 0;
                this.fmy = 0;
                this.nodeID = null;
            };
            //点に働く力から速度を求める
            Dot_G.prototype.init_velocity = function () {
                this.vx = this.fsx + this.frx + this.fmx;
                this.vy = this.fsy + this.fry + this.fmy;
            };
            //点の速度
            Dot_G.prototype.velocity = function () {
                return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            };
            //点の力をリセットする
            Dot_G.prototype.reset_force = function () {
                this.vx = 0;
                this.vy = 0;
                this.fsx = 0;
                this.fsy = 0;
                this.frx = 0;
                this.fry = 0;
                this.fmx = 0;
                this.fmy = 0;
            };
            //点を矩形で描画する
            Dot_G.prototype.draw = function (context, width, height) {
                var x = this.x - width / 2;
                var y = this.y - height / 2;
                context.strokeStyle = "rgba(0,0,0,1.0)";
                context.fillStyle = "rgba(0,0,0,1.0)";
                //context.fillRect(x, y, width, height);
                context.strokeRect(x, y, width, height); //矩形の描画
                if (this.nodeID != null) {
                    context.font = "italic 50px Arial";
                    context.fillText(this.nodeID, x, y + height); //数字の描画
                }
                if (DrawVector) {
                    context.strokeStyle = "rgba(255,0,0,0.5)";
                    context.fillStyle = "rgba(255,0,0,0.5)";
                    draw_vector(this.x, this.y, this.fsx, this.fsy); //スプリング力ベクトルは赤で表示
                    context.strokeStyle = "rgba(0,255,0,0.5)";
                    context.fillStyle = "rgba(0,255,0,0.5)";
                    draw_vector(this.x, this.y, this.frx, this.fry); //斥力ベクトルは緑で表示
                    context.strokeStyle = "rgba(0,0,255,0.5)";
                    context.fillStyle = "rgba(0,0,255,0.5)";
                    draw_vector(this.x, this.y, this.fmx, this.fmy); //磁力ベクトルは青で表示
                }
            };
            return Dot_G;
        }());
        //辺のクラス
        var Edge_G = /** @class */ (function () {
            function Edge_G() {
            }
            //辺の初期化
            Edge_G.prototype.init = function (dot1, dot2, cls, fld, type) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.class = cls;
                this.field = fld;
                this.type = type;
            };
            //エッジの長さ（2点間の距離）を求める
            Edge_G.prototype.length = function () {
                var xl = this.dot1.x - this.dot2.x;
                var yl = this.dot1.y - this.dot2.y;
                return Math.sqrt(xl * xl + yl * yl);
            };
            Edge_G.prototype.draw = function (context) {
                context.strokeStyle = "rgba(0,0,0,1.0)";
                context.fillStyle = "rgba(0,0,0,1.0)";
                context.beginPath();
                context.moveTo(this.dot1.x, this.dot1.y);
                context.lineTo(this.dot2.x, this.dot2.y);
                context.stroke();
            };
            return Edge_G;
        }());
        //グラフのクラス
        var Graph_G = /** @class */ (function () {
            function Graph_G() {
            }
            //グラフの初期化
            Graph_G.prototype.init = function (dn, en, edges, dots) {
                this.dot_number = dn;
                this.edge_number = en;
                this.edges = edges;
                this.dots = dots;
            };
            //グラフの全てのエッジの長さの合計を出す
            Graph_G.prototype.sum_length = function () {
                var gl = 0;
                for (var i = 0; i < this.edge_number; i++) {
                    gl += this.edges[i].length();
                }
                return gl;
            };
            //グラフの描画
            Graph_G.prototype.draw = function (context) {
                for (var i = 0; i < this.dots.length; i++) {
                    this.dots[i].draw(context, WidthDot, HeightDot);
                }
                for (var i = 0; i < this.edges.length; i++) {
                    this.edges[i].draw(context);
                }
            };
            return Graph_G;
        }());
        //ベクトルを画面に描画する
        function draw_vector(x, y, dx, dy) {
            var x1 = x;
            var y1 = y;
            var x2 = x1 + dx;
            var y2 = y1 + dy;
            var x3 = x2 + (-dx - dy) / 12;
            var y3 = y2 + (dx - dy) / 12;
            var x4 = x2 + (-dx + dy) / 12;
            var y4 = y2 + (-dx - dy) / 12;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
            context.beginPath();
            context.moveTo(x2, y2);
            context.lineTo(x3, y3);
            context.lineTo(x4, y4);
            context.closePath();
            context.fill();
        }
        //点の初期配置に重なりが無いかを確かめる
        function sameDot_exists(dots, dn) {
            var bool = false;
            for (var i = 0; i < dn - 1; i++) {
                for (var j = i + 1; j < dn; j++) {
                    bool = bool || (dots[i].x == dots[j].x && dots[i].y == dots[j].y);
                }
            }
            return bool;
        }
        //２点間のスプリング力を計算
        function f_s(d) {
            return cs * Math.log(d / D);
        }
        //2点間の斥力を計算
        function f_r(d) {
            return cr / (d * d);
        }
        //辺の両端の点に働く磁力を計算
        function f_m(b, t, d) {
            return cm * b * Math.pow(d, alpha) * Math.pow(Math.abs(t), beta);
        }
        //2点を結ぶ辺がある場合にその辺を返す
        function edgeConnectingTwoDots(dot1, dot2, edges) {
            var edge = null;
            for (var i = 0; i < edges.length; i++) {
                if ((edges[i].dot1 === dot1 && edges[i].dot2 === dot2) || (edges[i].dot2 === dot1 && edges[i].dot1 === dot2)) {
                    edge = edges[i];
                }
            }
            return edge;
        }
        //辺が影響を受ける磁場を発見し返す
        function magneticFieldEffectingEdge(edge, mfields) {
            var mfield = null;
            for (var i = 0; i < mfields.length; i++) {
                if (edge.class == mfields[i].class && edge.field == mfields[i].field) {
                    mfield = mfields[i];
                }
            }
            return mfield;
        }
        //辺の基準点における磁場の北からの終点のずれの角
        //磁場の向きと辺の向きのずれの角度を返す(-π～π)
        function dispartyAngle(mfr, ep) {
            return correctionAngle(ep - mfr);
        }
        //与えられた入力が-π＜t≦πになるまで繰り返し計算する
        function correctionAngle(t) {
            if (t <= Math.PI && t > -Math.PI) {
                return t;
            }
            else if (t > Math.PI) {
                return correctionAngle(t - 2 * Math.PI);
            }
            else if (t <= -Math.PI) {
                return correctionAngle(t + 2 * Math.PI);
            }
        }
        //各点のスプリング力・斥力・磁力を計算し、Dot_G[]に代入していく
        function focus_calculate(dots) {
            //始めに各点の力を初期化する
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].reset_force();
            }
            for (var i = 0; i < DOTNUMBER; i++) {
                for (var j = 0; j < DOTNUMBER; j++) {
                    if (i != j) {
                        var dot1 = dots[i];
                        var dot2 = dots[j];
                        var dx = dot2.x - dot1.x;
                        var dy = dot2.y - dot1.y;
                        var length = Math.sqrt(dx * dx + dy * dy);
                        if (length != 0) {
                            if (edgeConnectingTwoDots(dot1, dot2, edges) == null) {
                                //斥力を計算
                                dots[i].frx += -f_r(length) * dx / length;
                                dots[i].fry += -f_r(length) * dy / length;
                                dots[i].vx += dots[i].frx;
                                dots[i].vy += dots[i].fry;
                            }
                            else {
                                //スプリング力を計算
                                dots[i].fsx += f_s(length) * dx / length;
                                dots[i].fsy += f_s(length) * dy / length;
                                //磁力を計算
                                var e = edgeConnectingTwoDots(dot1, dot2, edges);
                                var rad = Math.atan2(dy, dx);
                                if (e.type == 0) {
                                    var mf = magneticFieldEffectingEdge(e, mfields);
                                    var mvec = mf.vector;
                                    var mvecangle;
                                    if (dot1 === e.dot1) {
                                        mvecangle = mvec.angle;
                                    }
                                    else {
                                        mvecangle = correctionAngle(mvec.angle - Math.PI);
                                    }
                                    var trad = dispartyAngle(mvecangle, rad);
                                    if (trad >= 0) {
                                        dots[i].fmx += -f_m(mvec.size, trad, length) * dy / length;
                                        dots[i].fmy += f_m(mvec.size, trad, length) * dx / length;
                                    }
                                    else {
                                        dots[i].fmx += f_m(mvec.size, trad, length) * dy / length;
                                        dots[i].fmy += -f_m(mvec.size, trad, length) * dx / length;
                                    }
                                }
                                else if (e.type == 1) {
                                    dots[i].fmx += 0;
                                    dots[i].fmy += 0;
                                }
                                else if (e.type == 2) {
                                    dots[i].fmx += 0;
                                    dots[i].fmy += 0;
                                }
                                dots[i].vx += dots[i].fsx + dots[i].fmx;
                                dots[i].vy += dots[i].fsy + dots[i].fmy;
                            }
                        }
                    }
                }
            }
        }
        //各点に働く力を計算し、座標を動かしていく
        function move_dots(dots) {
            var t = T;
            var dt = T / (M + 1);
            //力の計算をM回繰り返し計算
            for (var i = 0; i < M; i++) {
                focus_calculate(dots);
                for (var j = 0; j < DOTNUMBER; j++) {
                    var velocity = Math.sqrt(dots[j].vx * dots[j].vx + dots[j].vy * dots[j].vy);
                    if (velocity < t) {
                        dots[j].x += dots[j].vx;
                        dots[j].y += dots[j].vy;
                    }
                    else {
                        dots[j].x += dots[j].vx * t / velocity;
                        dots[j].y += dots[j].vy * t / velocity;
                    }
                }
                t -= dt;
            }
            //重心を画面の中央に合わせる
            center_of_gravity(dots, WIDTH, HEIGHT);
        }
        //グラフの点集合の重心を求め、重心が画面の中心になるように点移動させる
        function center_of_gravity(dots, width, height) {
            var cx = 0;
            var cy = 0;
            for (var i = 0; i < DOTNUMBER; i++) {
                cx += dots[i].x;
                cy += dots[i].y;
            }
            cx = cx / DOTNUMBER; //重心のx座標
            cy = cy / DOTNUMBER; //重心のy座標
            //重心が画面の中央になるように点移動させる
            var dx = width / 2 - cx;
            var dy = height / 2 - cy;
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].x += dx;
                dots[i].y += dy;
            }
        }
        /********************
         * 各点の座標の計算
         * ******************/
        //各点の用意、座標は適切に初期化し、同じ座標の点同士が存在しないようにする
        var dots = new Array(DOTNUMBER);
        for (var i = 0; i < DOTNUMBER; i++) {
            dots[i] = new Dot_G();
        }
        do {
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT));
            }
        } while (sameDot_exists(dots, DOTNUMBER));
        //各辺の用意
        var edges = new Array(EDGENUMBER);
        for (var i = 0; i < EDGENUMBER; i++) {
            edges[i] = new Edge_G();
            edges[i].init(dots[ObjectIDs.indexOf(medgelist[i].startID)], dots[ObjectIDs.indexOf(medgelist[i].endID)], medgelist[i].class, medgelist[i].field, medgelist[i].typeOfNeedle);
            if (edges[i].dot1.nodeID == null) {
                edges[i].dot1.nodeID = medgelist[i].startID;
            }
            if (edges[i].dot2.nodeID == null) {
                edges[i].dot2.nodeID = medgelist[i].endID;
            }
        }
        //グラフの用意
        var graph_g = new Graph_G();
        graph_g.init(DOTNUMBER, EDGENUMBER, edges, dots);
        //グラフの描画をするための変数
        var canvas = document.getElementById("cv");
        var context = canvas.getContext("2d");
        context.font = "italic 50px Arial";
        graph_g.draw(context);
        move_dots(dots);
        focus_calculate(dots);
        //画面に描画
        context.clearRect(0, 0, 3200, 1800);
        graph_g.draw(context);
        //コンソール画面に表示
        console.log("graph_g = ");
        console.log(graph_g);
        //計算した座標をgraphに書きこんでいく
        //for (var i = 0; i < ObjectIDs.length; i++) {
        //    graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);
        //}
    }
    /**************
     * 実行部分
     * ************/
    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle = true;
    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue = false;
    var edgeListInitStartTime = performance.now();
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var MagneticNeedleEdgeList = new Array();
    var MagneticFieldList = new Array();
    edgeListInit(graph, MagneticNeedleEdgeList, MagneticFieldList, DrawCircle, EdgeWithPrimitiveValue);
    console.log("MagneticNeedleEdgeList =");
    console.log(MagneticNeedleEdgeList);
    console.log("MagneticFieldList =");
    console.log(MagneticFieldList);
    var edgeListInitEndTime = performance.now();
    console.log("edgeListInit Time = " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    var forceDirectedMethodStartTime = performance.now();
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, MagneticNeedleEdgeList, MagneticFieldList);
    var forceDirectedMethodEndTime = performance.now();
    console.log("forceDirectedMethod Time = " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
}
//# sourceMappingURL=app.js.map