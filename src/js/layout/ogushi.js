__$__.Layout = {
    enabled: true,


    setLocation(graph) {
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
            console.log("class = " + cls);

            var necessaryFieldStartTime = performance.now();
            //必要なフィールド名の配列
            var arrayField = necessaryField(graph, cls, IDs);
            var necessaryFieldEndTime = performance.now();
            console.log("  necessaryField Time = " + (necessaryFieldEndTime - necessaryFieldStartTime) + " ms");

            var makeEdgeStartTime = performance.now();
            //オブジェクトを辿りながらエッジリストを作る
            makeEdgeListConnectingSameClass(graph, edgelist, cls, IDs, arrayField);
            var makeEdgeEndTime = performance.now();
            console.log("  makeEdge Time = " + (makeEdgeEndTime - makeEdgeStartTime) + " ms");

            var searchCycleStartTime = performance.now();
            //閉路があるか探索し、閉路があった場合は閉路上のエッジの角度を全て無しにする
            searchCycleGraph(graph, edgelist, cls, IDs, arrayField, drawcircle);
            var searchCycleEndTime = performance.now();
            console.log("  searchCycle Time = " + (searchCycleEndTime - searchCycleStartTime) + " ms");

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
                //補助関数、閉路を探索し、閉路上のIDの配列を返す
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
        var edgeListInitStartTime = performance.now();
        edgeListInit(graph, edgeWithAngleList, DrawCircle);
        var edgeListInitEndTime = performance.now();
        console.log("edgeListInit Time = " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
        //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
        //graphオブジェクト内のノード座標を破壊的に書き替える
        var forceDirectedMethodStartTime = performance.now();
        calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList);
        var forceDirectedMethodEndTime = performance.now();
        console.log("forceDirectedMethod Time = " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
    },


    /**
     * We assume that linked-list is already completed(this means that next edges are defined between nodes).
     */
    setLinkedList: function(graph, nodeLabel = "Node", nextLabel = 'next', valueLabel = 'val') {
        // collect nodes whose label are nodeLabel
        let listNodes = [];
        graph.nodes.forEach(node => {
            node.__checked = false;
            if (node.label === nodeLabel) {
                listNodes.push(node);
            }
        });
    
        // collect edges whose label are nextLabel
        let listEdgesOfNext = [];
        // collect edges whose label are valueLabel
        let listEdgesOfValue = [];
        graph.edges.forEach(edge => {
            if (edge.label === nextLabel) {
                listEdgesOfNext.push(edge);
            } else if (edge.label === valueLabel) {
                listEdgesOfValue.push(edge);
            }
        });
    
        // This loop defines __next and __prev property to the nodes whose label are nodeLabel.
        listEdgesOfNext.forEach(edge => {
            let fromNode = graph.nodes.find(node => {
                return node.id === edge.from;
            });
            let toNode = graph.nodes.find(node => {
                return node.id === edge.to;
            });
    
            if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
                fromNode.__next = toNode;
                toNode.__prev = fromNode;
            }
        });
    
        // This loop defines __val property to the nodes that have a property that represents valueLabel of the node.
        listEdgesOfValue.forEach(edge => {
            let fromNode = graph.nodes.find(node => {
                return node.id === edge.from;
            });
            let valNode = graph.nodes.find(node => {
                return node.id === edge.to
            });
    
            if (fromNode.label === nodeLabel)
                fromNode.__val = valNode;
        });
    
        /**
         * sort listNodes in following code
         * In order to support multiple linked-lists,
         * each list is a list that is a element of sortedListNode.
         * e.g.)
         * list1 : a -> b -> c
         * list2 : w -> x -> y -> z
         * then, sortedListNode is [[a, b, c], [w, x, y, z]]
         * (where a, b, etc. mean nodes.)
         */
        let sortedListNode = [];
        let sortedListNode_CenterPos = [];
    
        while (listNodes.length > 0) {
            let list = [listNodes.shift()];
            let pos = {
                x: list[0].x || 0,
                y: list[0].y || 0
            };
            list[0].__checked = true;
            while (list[0].__prev && !list[0].__prev.__checked) {
                let prev = list[0].__prev;
                pos.x += prev.x || 0;
                pos.y += prev.y || 0;
                prev.__checked = true;
                list.unshift(listNodes.splice(listNodes.indexOf(prev),1)[0]);
                delete list[1].__prev;
                delete prev.__next;
            }
            while (list[list.length-1].__next && !list[list.length-1].__next.__checked) {
                let next = list[list.length-1].__next;
                pos.x += next.x || 0;
                pos.y += next.y || 0;
                next.__checked = true;
                delete list[list.length-1].__next;
                list.push(listNodes.splice(listNodes.indexOf(next),1)[0]);
                delete next.__prev;
            }
    
            if (list.length > 1) {
                pos.x /= list.length;
                pos.y /= list.length;

                sortedListNode.push(list);
                sortedListNode_CenterPos.push(pos);
            } else {
                list[0].__checked = false;
            }
        }
    
        let listRegion = [];
        // register nodes position and the valueLabel nodes
        for (let i = 0; i < sortedListNode.length; i++) {
            let region = {x: {from: NaN, to: NaN}, y: {from: NaN, to: NaN}};
            for (let j = 0; j < sortedListNode[i].length; j++) {
                let node = sortedListNode[i][j];

                let newPos = {
                    x: sortedListNode_CenterPos[i].x + 100 * (j - (sortedListNode[i].length - 1) / 2),
                    y: sortedListNode_CenterPos[i].y
                };

                if (!(newPos.x > region.x.from))
                    region.x.from = newPos.x;
                if (!(region.x.to > newPos.x))
                    region.x.to = newPos.x;
                if (!(newPos.y > region.y.from))
                    region.y.from = newPos.y;
                if (!(region.y.to > newPos.y))
                    region.y.to = newPos.y;

                node.x = newPos.x;
                node.y = newPos.y;
    
                if (node.__val) {
                    if (!(node.x > region.x.from))
                        region.x.from = node.x;
                    if (!(region.x.to > node.x))
                        region.x.to = node.x;
                    if (!(node.y + 100 > region.y.from))
                        region.y.from = node.y + 100;
                    if (!(region.y.to > node.y + 100))
                        region.y.to = node.y + 100;

                    node.__val.x = node.x;
                    node.__val.y = node.y + 100;
                    node.__val.__checked = true;
                }
            }
            region.x.from -= 10;
            region.x.to += 10;
            region.y.from -= 10;
            region.y.to += 10;
            listRegion.push(region);
        }
    
        graph.nodes.forEach(node => {
            if (node.__checked) {
                delete node.__checked;
            } else {
                listRegion.forEach(region => {
                    if (region.x.from <= node.x && node.x <= region.x.to
                        && region.y.from <= node.y && node.y <= region.y.to) {
                        node.y = region.y.to + 50;
                        if (node.__val) {
                            node.__val.x = node.x;
                            node.__val.y = node.y + 100;
                        }
                    }
                });
            }
            if (node.__next !== undefined)
                delete node.__next;
            if (node.__prev !== undefined)
                delete node.__prev;
            if (node.__val !== undefined)
                delete node.__val;
        });
    },
    

    /**
     * We assume that binary tree is already completed(this means that left and right edges are defined between nodes).
     */
    setBinaryTree: function(graph, nodeLabel = "Node", leftLabel = 'left', rightLabel = 'right', valueLabel = 'val') {
        // collect nodes whose label are nodeLabel
        let listNodes = [];
        graph.nodes.forEach(node => {
            if (node.label === nodeLabel) {
                listNodes.push(node);
            }
        });
    
        // collect edges whose label are leftLabel or rightLabel
        let listEdgesOfLeft = [];
        let listEdgesOfRight = [];
        // collect edges whose label are valueLabel
        let listEdgesOfValue = [];
        graph.edges.forEach(edge => {
            if (edge.label === leftLabel) {
                listEdgesOfLeft.push(edge);
            } else if (edge.label === rightLabel) {
                listEdgesOfRight.push(edge);
            } else if (edge.label === valueLabel) {
                listEdgesOfValue.push(edge);
            }
        });
    
        // This loop defines __left and __parent property to the nodes whose label are nodeLabel.
        listEdgesOfLeft.forEach(edge => {
            let fromNode = graph.nodes.filter(node => {
                return node.id === edge.from;
            })[0];
            let toNode = graph.nodes.filter(node => {
                return node.id === edge.to;
            })[0];
    
            if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
                fromNode.__left = toNode;
                toNode.__parent = fromNode;
            }
        });
    
        // This loop defines __right and __parent property to the nodes whose label are nodeLabel.
        listEdgesOfRight.forEach(edge => {
            let fromNode = graph.nodes.filter(node => {
                return node.id === edge.from;
            })[0];
            let toNode = graph.nodes.filter(node => {
                return node.id === edge.to;
            })[0];
    
            if (fromNode.label === nodeLabel && toNode.label === nodeLabel) {
                fromNode.__right = toNode;
                toNode.__parent = fromNode;
            }
        });
    
        // This loop defines __val property to the nodes that have a property that represents valueLabel of the node.
        listEdgesOfValue.forEach(edge => {
            let fromNode = graph.nodes.filter(node => {
                return node.id === edge.from;
            })[0];
            let valNode = graph.nodes.filter(node => {
                return node.id === edge.to
            })[0];
    
            if (fromNode.label === nodeLabel)
                fromNode.__val = valNode;
        });
    
        // these types are Array because a graph might have some trees.
        let treeRoots = [];
        let tree_CenterPos = [];
        /**
         * if height of a tree is 0, then width = 1;
         * if height of a tree is 1, then width = 2;
         * if height of a tree is 2, then width = 4;
         * if height of a tree is 3, then width = 8;
         * ...
         * if height of a tree is n, then width = 2^n;
         */
        let heightBinaryTree = rootNode => {
            if (rootNode === undefined) {
                return -1;
            } else {
                return Math.max(heightBinaryTree(rootNode.__left), heightBinaryTree(rootNode.__right)) + 1;
            }
        };
    
        makeTree: while (listNodes.length > 0) {
            let node = listNodes[0];
            let centerPos = {x: 0, y: 0};
            let n = 0; // the number of the node of this tree
    
            let checked = [node];
            while (node.__parent) {
                if (checked.indexOf(node.__parent) === -1) {
                    if (listNodes.indexOf(node.__parent) >= 0) {
                        node = node.__parent;
                        checked.push(node);
                    } else {
                        delete node.__parent;
                        break;
                    }
                } else {
                    // Here is executed when node objects are not tree.
                    checked.forEach(checkedNode => {
                        if (checkedNode.__parent)
                            delete checkedNode.__parent;
                        if (checkedNode.__left)
                            delete checkedNode.__left;
                        if (checkedNode.__right)
                            delete checkedNode.__right;
                        listNodes.splice(listNodes.indexOf(checkedNode), 1);
                    });
                    continue makeTree;
                }
            }

            let tree = {
                root: node,
                height: heightBinaryTree(node)
            };
    
            let current = node;
            let isTree = false;
            while (current && (current.__left || current.__right || current.__parent) || isTree && current === tree.root) {
                if (current.__left && listNodes.indexOf(current.__left) >= 0) {
                    let left = current.__left;
                    current = left;
                } else if (current.__right && listNodes.indexOf(current.__right) >= 0) {
                    let right = current.__right;
                    current = right;
                } else {
                    let parent = current.__parent;
                    delete current.__parent;
                    listNodes.splice(listNodes.indexOf(current), 1);
                    centerPos.x += current.x;
                    centerPos.y += current.y;
                    current = parent;
                    n++;
                }
                isTree = true;
            }
    
            if (isTree) {
                centerPos.x /= n;
                centerPos.y /= n;
                treeRoots.push(tree);
                tree_CenterPos.push(centerPos);
            } else {
                listNodes.splice(0, 1);
            }
        }
    
        let oldCenterPos = [];
        let setPosition = function(node, depth, width_from, width_to, tree_num) {
            let next_x = (width_to === 0) ? 0 : ((width_from + width_to) / 2) * 100;
            let next_y = depth * 100;
    
            // register node's position.
            node.x = next_x;
            node.y = next_y;
            oldCenterPos[tree_num].x += node.x;
            oldCenterPos[tree_num].y += node.y;
            node.__tree_num = tree_num;
    
            if (node.__val) {
                node.__val.x = node.x;
                node.__val.y = node.y + 75;
                node.__val.__tree_num = tree_num;
                delete node.__val;
            }
    
            // define the middle between width_from and width_to.
            let width_mid = Math.floor((width_from + width_to) / 2);
            
            let ret = 1;
            if (node.__left) {
                // recursive call if node.__left is defined.
                ret += setPosition(node.__left, depth+1, width_from, width_mid, tree_num);
                delete node.__left;
            }
    
            if (node.__right) {
                // recursive call if node.__right is defined.
                ret += setPosition(node.__right, depth+1, width_mid + 1, width_to, tree_num);
                delete node.__right;
            }
            return ret;
        };
    
        // this array represents how distance the root node is moved.
        let mvRootPos = [];
        let count = 0;
        for (let i = 0; i < treeRoots.length; i++) {
            let root = treeRoots[i].root;
            oldCenterPos.push({x: 0, y: 0});
            let width = Math.pow(2, treeRoots[i].height);
    
            let nodeSize = setPosition(root, 0, count, count + width - 1, i);
            oldCenterPos[i].x /= nodeSize;
            oldCenterPos[i].y /= nodeSize;
    
            mvRootPos.push({
                x: tree_CenterPos[i].x - oldCenterPos[i].x,
                y: tree_CenterPos[i].y - oldCenterPos[i].y
            });
    
            count += width;
        }
    
        graph.nodes.forEach(node => {
            if (node.__tree_num !== undefined) {
                let beforePos = __$__.StorePositions.oldNetwork.nodes[node.id];
                let mvPos = mvRootPos[node.__tree_num];
                node.x += mvPos.x;
                node.y += mvPos.y;
                delete node.__tree_num;
            }
            if (node.__left !== undefined)
                delete node.__left;
            if (node.__right !== undefined)
                delete node.__right;
            if (node.__parent !== undefined)
                delete node.__parent;
            if (node.__val !== undefined)
                delete node.__val;
        });
    },

    switchEnabled: () => {
        if (__$__.Layout.enabled) {
            __$__.Layout.enabled = false;
            __$__.Update.updateValueOfArray = false;
        } else {
            __$__.Layout.enabled = true;
            __$__.Update.updateValueOfArray = true;
        }
        __$__.Update.updateArrayValuePosition();
        __$__.Update.ContextUpdate();
    }
};
