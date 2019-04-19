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
var dot1 = new Dot("id1", "Node");
var dot2 = new Dot("id2", "Node");
var dot3 = new Dot("id3", "Node");
var dot4 = new Dot("id4", "Node");
var dot5 = new Dot("id5", "number");
var dot6 = new Dot("id6", "number");
var dot7 = new Dot("id7", "number");
var dot8 = new Dot("id8", "number");
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
var nodes = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8];
var grp = new Graph(nodes);
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
///<reference path="example.ts" />
setGraphLocation(grp);
//グラフの描画をするための変数
var canvas = document.getElementById("cv");
var context = canvas.getContext("2d");
context.font = "italic 50px Arial";
grp.draw(context);
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
            var array = new Array(this.stack.length);
            for (var i = 0; i < this.stack.length; i++) {
                array[i] = this.stack[i];
            }
            return array;
        };
        return Stack;
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
    //角度付きエッジのクラス
    var EdgeWithAngle = /** @class */ (function () {
        function EdgeWithAngle(ID1, ID2, angle) {
            this.ID1 = ID1;
            this.ID2 = ID2;
            this.angle = angle;
        }
        return EdgeWithAngle;
    }());
    //配列内に引数と同じ値があるかどうかを走査する
    function sameT_InArray(t, arrayT) {
        var bool = false;
        for (var i = 0; i < Object.keys(arrayT).length; i++) {
            bool = bool || (arrayT[i] == t);
        }
        return bool;
    }
    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph, edgelist, drawcircle) {
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
                decisionEdgeAngleConnectingSameClass(graph, edgelist, allObjectClassExceptDuplication[i], IDsSeparateClass[i], drawcircle);
            }
        }
        //異なる型を参照するエッジの角度を決定
        decisonEdgeAngleConnectingDifferentClass(graph, edgelist, ObjectIDs, allObjectClass, ObjectIDsExceptPrimitiveValue);
    }
    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str) {
        return (str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function");
    }
    //同じ型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisionEdgeAngleConnectingSameClass(graph, edgelist, cls, IDs, drawcircle) {
        //必要なフィールド名の配列
        var arrayField = necessaryField(graph, cls, IDs);
        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingSameClass(graph, edgelist, cls, IDs, arrayField);
        //閉路があるか探索し、閉路があった場合は閉路上のエッジの角度を全て無しにする
        searchCycleGraph(graph, edgelist, cls, IDs, arrayField, drawcircle);
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
        function makeEdgeListConnectingSameClass(graph, edgelist, cls, IDs, arrayfield) {
            //辿ったオブジェクトのIDを記録する配列
            var usedObjectIDs = new Array();
            //ID順にオブジェクトを辿りながらエッジリストを作る
            for (var i = 0; i < IDs.length; i++) {
                makeEdgeListConnectingSameClass_sub(graph, edgelist, cls, IDs[i], arrayfield);
            }
            //補助関数
            function makeEdgeListConnectingSameClass_sub(graph, edgelist, cls, ID, arrayField) {
                if (!sameT_InArray(ID, usedObjectIDs)) { //引数のオブジェクトIDがまだ見たことのないものならば
                    usedObjectIDs.push(ID); //見ているオブジェクトのIDを記録
                    for (var j = 0; j < arrayField.length; j++) {
                        var nextID = graph.getField(ID, arrayField[j]); //次のオブジェクトのID
                        if (graph.getClass(nextID) == cls) {
                            switch (arrayField.length) {
                                case 0:
                                    edgelist.push(new EdgeWithAngle(ID, nextID, 9973));
                                    break;
                                case 1:
                                    edgelist.push(new EdgeWithAngle(ID, nextID, 0));
                                    break;
                                default:
                                    edgelist.push(new EdgeWithAngle(ID, nextID, Math.PI * (arrayField.length * 2 - j * 2 - 1) / (arrayField.length * 2)));
                            }
                            makeEdgeListConnectingSameClass_sub(graph, edgelist, cls, nextID, arrayField);
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
        function searchCycleGraph(graph, edgelist, cls, IDs, arrayField, drawcircle) {
            //閉路上のIDの配列
            var cycleIDs = cycleGraphIDs(graph, cls, IDs, arrayField);
            if (drawcircle) { //閉路上のエッジの角度を全て無効にする
                for (var i = 0; i < cycleIDs.length; i++) {
                    for (var j = 0; j < cycleIDs[i].length - 1; j++) {
                        for (var k = 0; k < edgelist.length; k++) {
                            if (cycleIDs[i][j] == edgelist[k].ID1 && cycleIDs[i][j + 1] == edgelist[k].ID2) {
                                edgelist[k].angle = 9973; //角度を無効にするためには、角度に9973を代入する
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
            //補助関数、閉路を探索し、閉路上のIDの配列を返す（問題あり）
            function cycleGraphIDs(graph, cls, IDs, arrayField) {
                var cycleIDs = new Array();
                for (var i = 0; i < IDs.length; i++) {
                    var cycleIDsFromOneID = cycleGraphIDsFromOneID(graph, cls, IDs, arrayField, IDs[i]);
                    for (var j = 0; j < cycleIDsFromOneID.length; j++) {
                        if (!sameCycleGraph(cycleIDsFromOneID[j], cycleIDs)) {
                            cycleIDs.push(cycleIDsFromOneID[j]);
                        }
                    }
                }
                return cycleIDs;
                //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
                function cycleGraphIDsFromOneID(graph, cls, IDs, arrayField, ID) {
                    var cycleIDs = new Array();
                    var stack = new Stack(); //経路を記録するためのスタック
                    var usedIDs = new Array(); //訪問したノードのIDを記録するための配列
                    usedIDs.push(ID);
                    stack.push(ID);
                    while (true) {
                        var v = stack.pop(); //現在注目しているノード
                        stack.push(v);
                        var isConnectNonvisitedNode = false; //まだ訪問していないノードが接続先にある場合trueを返す変数
                        for (var i = 0; i < arrayField.length; i++) {
                            var u = graph.getField(v, arrayField[i]);
                            if (!sameT_InArray(u, usedIDs)) {
                                isConnectNonvisitedNode = true;
                                usedIDs.push(u);
                                stack.push(u);
                            }
                            else if (u == ID) {
                                isConnectNonvisitedNode = false;
                                cycleIDs.push(stack.returnArray());
                                cycleIDs[cycleIDs.length - 1].push(ID);
                            }
                            else {
                                isConnectNonvisitedNode = false;
                            }
                        }
                        if (!isConnectNonvisitedNode) {
                            stack.pop();
                        }
                        if (stack.isZero()) {
                            break;
                        }
                    }
                    return cycleIDs;
                }
                //補助関数の補助関数、与えられた閉路と同じものが配列cycleIDs内にあるかどうかを判断する
                function sameCycleGraph(onecycle, cycles) {
                    var bool = false;
                    for (var i = 0; i < cycles.length; i++) {
                        if (onecycle.length != cycles[i].length) { //配列の長さが同じでなければ
                            bool = bool || false;
                        }
                        else { //配列の長さが同じならば
                            var a1 = onecycle;
                            var a2 = cycles[i];
                            a1.pop(); //末尾を削除
                            a2.pop(); //末尾を削除
                            for (var j = 0; j < a2.length; j++) {
                                var car = a2[0];
                                a2.shift();
                                a2.push(car);
                                if (a2 === a1) {
                                    bool = bool || true;
                                }
                            }
                        }
                    }
                    return bool;
                }
            }
        }
    }
    //異なる型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisonEdgeAngleConnectingDifferentClass(graph, edgelist, IDs, classes, withoutPrimitiveIDs) {
        //必要なフィールド名の配列
        var arrayField = necessaryField(graph, IDs, classes, withoutPrimitiveIDs);
        //フィールドの角度を決定する
        decisionAngleClassAndField(arrayField);
        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingDifferentClass(graph, edgelist, IDs, classes, withoutPrimitiveIDs, arrayField);
        //参照先がプリミティブ型のときには角度を決めずにエッジを作る
        makeEdgeListConnectingPrimitiveValue(graph, edgelist, IDs, withoutPrimitiveIDs);
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
        function necessaryField(graph, IDs, classes, withoutPrimitiveIDs) {
            var necessaryfields = new Array();
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]); //フィールド名の配列
                var fieldIDs = new Array(fields.length); //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) { //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }
                for (var j = 0; j < fieldIDs.length; j++) {
                    if (graph.getClass(fieldIDs[j]) != graph.getClass(withoutPrimitiveIDs[i]) && sameT_InArray(fieldIDs[j], withoutPrimitiveIDs)) {
                        var caf = new ClassAndField(graph.getClass(withoutPrimitiveIDs[i]), fields[j]);
                        if (!sameT_InArray(caf, necessaryfields)) {
                            necessaryfields.push(caf);
                        }
                    }
                }
            }
            return necessaryfields;
        }
        /*
         * オブジェクトを辿りながらエッジリストを作る関数
         */
        function makeEdgeListConnectingDifferentClass(graph, edgelist, IDs, classes, withoutPrimitiveIDs, arrayField) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]); //フィールド名の配列
                var fieldIDs = new Array(fields.length); //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) { //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }
                for (var j = 0; j < fieldIDs.length; j++) {
                    for (var k = 0; k < arrayField.length; k++) {
                        if (arrayField[k].cls == graph.getClass(withoutPrimitiveIDs[i]) && arrayField[k].field == fields[j]) {
                            var newedge = new EdgeWithAngle(withoutPrimitiveIDs[i], fieldIDs[j], arrayField[k].angle);
                            edgelist.push(newedge);
                        }
                    }
                }
            }
        }
        /*
         * 参照先がプリミティブ型のときには角度を決めずにエッジを作る
         */
        function makeEdgeListConnectingPrimitiveValue(graph, edgelist, IDs, withoutPrimitiveIDs) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields = graph.getFields(withoutPrimitiveIDs[i]);
                for (var j = 0; j < fields.length; j++) {
                    var nextID = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                    if (!sameT_InArray(nextID, withoutPrimitiveIDs)) {
                        var newedge = new EdgeWithAngle(withoutPrimitiveIDs[i], nextID, 9973);
                        edgelist.push(newedge);
                    }
                }
            }
        }
    }
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList) {
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
        //ノード数
        var DOTNUMBER = ObjectIDs.length;
        //エッジ数
        var EDGENUMBER = edgeWithAngleList.length;
        var WIDTH = 1280; //表示する画面の横幅
        var HEIGHT = 720; //表示する画面の縦幅
        var K = Math.min(WIDTH, HEIGHT) / 50; //クーロン力に係る係数
        var Knum = 8; //斥力のKの次数
        var rnum = 3; //斥力のrの次数
        var ravenum = (Knum + 1) / (rnum + 2);
        var KRAD = 30000.0; //角度に働く力の係数
        var ITERATION = 8000; //反復回数
        var T = Math.max(WIDTH, HEIGHT); //温度パラメータ
        var t = T;
        var dt = T / (ITERATION);
        //点のクラス
        var Dot_G = /** @class */ (function () {
            function Dot_G() {
            }
            //点の初期化
            Dot_G.prototype.init = function (x, y) {
                this.x = x;
                this.y = y;
                this.dx = 0;
                this.dy = 0;
                this.fax = 0;
                this.fay = 0;
                this.frx = 0;
                this.fry = 0;
                this.fmx = 0;
                this.fmy = 0;
            };
            //点に働く力から速度を求める
            Dot_G.prototype.init_velocity = function () {
                this.dx = this.fax + this.frx + this.fmx;
                this.dy = this.fay + this.fry + this.fmy;
            };
            //点の速度
            Dot_G.prototype.velocity = function () {
                return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            };
            return Dot_G;
        }());
        //辺のクラス
        var Edge_G = /** @class */ (function () {
            function Edge_G() {
            }
            //辺の初期化
            Edge_G.prototype.init = function (dot1, dot2, angle) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.angle = angle;
            };
            //エッジの長さ（2点間の距離）を求める
            Edge_G.prototype.length = function () {
                var xl = this.dot1.x - this.dot2.x;
                var yl = this.dot1.y - this.dot2.y;
                return Math.sqrt(xl * xl + yl * yl);
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
            return Graph_G;
        }());
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
            edges[i].init(dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID1)], dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID2)], edgeWithAngleList[i].angle);
        }
        //グラフの用意
        var graph_g = new Graph_G();
        graph_g.init(DOTNUMBER, EDGENUMBER, edges, dots);
        center_of_gravity(dots, WIDTH, HEIGHT);
        //温度パラメータが0以下になるまで安定状態を探索する
        while (true) {
            draw();
            if (t <= 0)
                break;
        }
        //fruchterman-Reingold法でエネルギーを最小化し、グラフを描画する
        function draw() {
            //各点に働く力を計算
            focus_calculate(dots);
            //各点の速度から、次の座標を計算する
            for (var i = 0; i < DOTNUMBER; i++) {
                var dx = dots[i].dx;
                var dy = dots[i].dy;
                var disp = Math.sqrt(dx * dx + dy * dy);
                if (disp != 0) {
                    var d = Math.min(disp, t) / disp;
                    dots[i].x += dx * d;
                    dots[i].y += dy * d;
                }
            }
            //重心が画面の中央になるように調整する
            center_of_gravity(dots, WIDTH, HEIGHT);
            //温度パラメータを下げていく、0を下回ったら終了
            t -= dt;
            if (t <= 0)
                stopCalculate();
        }
        //計算を終了し、graphに座標情報を書きこんでいく
        function stopCalculate() {
            for (var i = 0; i < ObjectIDs.length; i++) {
                graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);
            }
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
        //２点間の引力を計算
        function f_a(r, K) {
            return r * r / K;
        }
        //2点間の斥力を計算
        function f_r(r, K) {
            return Math.pow(K, Knum) / Math.pow(r, rnum);
        }
        //各点の引力・斥力を計算し、Dot[]に代入していく
        function focus_calculate(dots) {
            //各点の速度・力ベクトルを0に初期化
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].dx = 0;
                dots[i].dy = 0;
                dots[i].fax = 0;
                dots[i].fay = 0;
                dots[i].frx = 0;
                dots[i].fry = 0;
                dots[i].fmx = 0;
                dots[i].fmy = 0;
            }
            //各点の斥力を計算
            for (var i = 0; i < DOTNUMBER; i++) {
                for (var j = 0; j < DOTNUMBER; j++) {
                    if (j != i) {
                        var dx = dots[i].x - dots[j].x;
                        var dy = dots[i].y - dots[j].y;
                        var delta = Math.sqrt(dx * dx + dy * dy);
                        if (delta != 0) {
                            var d = f_r(delta, K) / delta;
                            dots[i].frx += dx * d;
                            dots[i].fry += dy * d;
                        }
                    }
                }
            }
            //各点の引力を計算
            for (var i = 0; i < EDGENUMBER; i++) {
                var dx = edges[i].dot1.x - edges[i].dot2.x;
                var dy = edges[i].dot1.y - edges[i].dot2.y;
                var delta = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    var d = f_a(delta, K) / delta;
                    var ddx = dx * d;
                    var ddy = dy * d;
                    edges[i].dot1.fax += -ddx;
                    edges[i].dot2.fax += +ddx;
                    edges[i].dot1.fay += -ddy;
                    edges[i].dot2.fay += +ddy;
                }
            }
            //各点の角度に基づいて働く力を計算
            for (var i = 0; i < EDGENUMBER; i++) {
                if (edgeWithAngleList[i].angle != 9973) {
                    var dx = edges[i].dot2.x - edges[i].dot1.x;
                    var dy = edges[i].dot2.y - edges[i].dot1.y;
                    var delta = Math.sqrt(dx * dx + dy * dy);
                    var rad = Math.atan2(dy, dx);
                    if (delta != 0) {
                        var d = rad - edgeWithAngleList[i].angle;
                        var ddx;
                        var ddy;
                        var ex = KRAD * dy / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        var ey = -KRAD * dx / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        if (Math.abs(d) <= Math.PI) {
                            ddx = d * Math.abs(d) * ex;
                            ddy = d * Math.abs(d) * ey;
                        }
                        else {
                            var dd = d + 2 * Math.PI;
                            if (d < 0) {
                                ddx = dd * Math.abs(dd) * ex;
                                ddy = dd * Math.abs(dd) * ey;
                            }
                            else {
                                ddx = -dd * Math.abs(dd) * ex;
                                ddy = -dd * Math.abs(dd) * ey;
                            }
                        }
                        edges[i].dot1.fmx += -ddx;
                        edges[i].dot1.fmy += -ddy;
                        edges[i].dot2.fmx += ddx;
                        edges[i].dot2.fmy += ddy;
                    }
                }
            }
            //力ベクトルから速度を求める
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init_velocity();
            }
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
    }
    /**************
     * 実行部分
     * ************/
    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle = true;
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var edgeWithAngleList = new Array();
    edgeListInit(graph, edgeWithAngleList, DrawCircle);
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList);
}
//# sourceMappingURL=app.js.map