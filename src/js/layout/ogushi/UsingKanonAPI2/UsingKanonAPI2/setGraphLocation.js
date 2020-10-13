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
    /*
     * クラス名とフィールド名をまとめてクラス定義する
     */
    var ClassAndField = /** @class */ (function () {
        function ClassAndField(pcls, ccls, field, EwA) {
            this.parentcls = pcls;
            this.childcls = ccls;
            this.field = field;
            this.angle = 0;
            this.EwithAs = new Array(EwA);
        }
        return ClassAndField;
    }());
    //角度付きエッジのクラス
    var EdgeWithAngle = /** @class */ (function () {
        function EdgeWithAngle(ID1, ID2, fromtype, totype, fieldname) {
            this.ID1 = ID1;
            this.ID2 = ID2;
            this.fromtype = fromtype;
            this.totype = totype;
            this.fieldname = fieldname;
            this.underforce = true;
            this.NIpatternmatch = "";
        }
        return EdgeWithAngle;
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
    //あった場合は最初の値のindexを、なければ-1を返す
    function sameClassAndField_InArray(caf, arrayCaf) {
        //var bool: boolean = false;
        var index = -1;
        for (var i = 0; i < arrayCaf.length; i++) {
            if (caf.parentcls == arrayCaf[i].parentcls && caf.childcls == arrayCaf[i].childcls && caf.field == arrayCaf[i].field) {
                index = i;
            }
            //bool = bool || (caf.parentcls == arrayCaf[i].parentcls && caf.childcls == arrayCaf[i].childcls && caf.field == arrayCaf[i].field);
        }
        //return bool;
        return index;
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
    //与えられたエッジオブジェクトが与えられたクラスフィールドに属しているかを判定する
    function edgeIncludeCaF(edge, caf) {
        return edge.fromtype == caf.parentcls && edge.totype == caf.childcls && edge.fieldname == caf.field;
    }
    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str) {
        return (str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function");
    }
    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph, edgelist, caflist, drawcircle, edgewithprimitivevalue, interestNodes) {
        var edgeListInitStartTime = performance.now();
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
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
        for (var i = 0; i < ObjectIDs.length; i++) {
            //ID1(始点ノード)のIDとクラス
            var ID1 = ObjectIDs[i];
            var ID1type = graph.getClass(ID1);
            //ID1の持つフィールドの列
            var fields = graph.getFields(ID1);
            for (var j = 0; j < fields.length; j++) {
                var fieldname = fields[j];
                var ID2 = graph.getField(ID1, fieldname);
                var ID2type = graph.getClass(ID2);
                edgelist.push(new EdgeWithAngle(ID1, ID2, ID1type, ID2type, fieldname));
                if (edgewithprimitivevalue == false) { //プリミティブ型を指すフィールドエッジに角度力を働かせない
                    edgelist[edgelist.length - 1].underforce = false;
                }
            }
        }
        //必要なフィールド名
        for (var i = 0; i < edgelist.length; i++) {
            var caf = new ClassAndField(edgelist[i].fromtype, edgelist[i].totype, edgelist[i].fieldname, edgelist[i]);
            var index = sameClassAndField_InArray(caf, caflist);
            if (index == -1) {
                caflist.push(caf);
            }
            else {
                caflist[index].EwithAs.push(edgelist[i]);
            }
        }
        necessaryCaFList(graph, caflist, ObjectIDs);
        //必要なフィールド名以外のエッジを削除する
        for (var i = edgelist.length - 1; i >= 0; i--) {
            var bool = false;
            for (var j = 0; j < caflist.length; j++) {
                bool = bool || edgeIncludeCaF(edgelist[i], caflist[j]);
            }
            if (bool == false) {
                edgelist.splice(i, 1);
            }
        }
        //ClassAndFieldの数から各フィールドの角度を決定する
        decitionFieldAngle(caflist);
        //閉路上のエッジに働かせる角度力を無くす
        if (drawcircle) {
            for (var i = 0; i < caflist.length; i++) {
                if (caflist[i].parentcls == caflist[i].childcls) {
                    searchCycleGraph(graph, edgelist, caflist[i].parentcls, ObjectIDs, caflist);
                }
            }
        }
        //ListInListに対応したアルゴリズム
        for (var i = 0; i < allObjectClassExceptDuplication.length; i++) {
            if (isPrimitiveString(allObjectClassExceptDuplication[i])) {
                HierarchyAngleDecition(graph, edgelist, caflist, allObjectClassExceptDuplication[i], IDsSeparateClass[i]);
            }
        }
        //色のセット
        for (var i = 0; i < ObjectIDs.length; i++) {
            if (isPrimitiveString(graph.getClass(ObjectIDs[i]))) {
                graph.setColor(ObjectIDs[i], "skyblue");
            }
        }
        //注目ノードの特定
        interestNodesInit(graph, interestNodes, edgelist);
        //注目ノードの色を変更する
        for (var i = 0; i < interestNodes.length; i++) {
            graph.setColor(interestNodes[i], "hotpink");
        }
        var edgeListInitEndTime = performance.now();
        console.log("edgeListInit Time = " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    }
    //交互参照しているフィールドを発見し、削除する
    function necessaryCaFList(graph, caflist, ObjectIDs) {
        for (var i = caflist.length - 1; i >= 0; i--) {
            var caf1 = caflist[i];
            var near_caf1 = new Array(); //caf1と逆の（型）→（型）を持つフィールド名の集合
            for (var j = 0; j < caflist.length; j++) {
                if (caflist[j] != caf1 && caflist[j].parentcls == caf1.childcls && caflist[j].childcls == caf1.parentcls) {
                    near_caf1.push(caflist[j]);
                }
            }
            var bool = true;
            for (var j = 0; j < near_caf1.length; j++) {
                bool = bool && isOverlapping(graph, caf1, near_caf1[j]);
            }
            if (bool && near_caf1.length != 0) {
                caflist.splice(i, 1);
            }
        }
        /*
         * 補助関数
         * 二つのClassAndFieldのx,yを受け取り、yに該当するエッジを全探索する
         * yのエッジが全てxのエッジの逆向きエッジであるならばtrueを返り値として返す
         */
        function isOverlapping(graph, cafx, cafy) {
            var bool = true;
            for (var i = 0; i < ObjectIDs.length; i++) {
                var ID1 = ObjectIDs[i];
                if (graph.getClass(ID1) == cafy.parentcls) {
                    var ID2 = graph.getField(ID1, cafy.field);
                    if (ID2 != undefined && graph.getClass(ID2) == cafy.childcls) {
                        var nextID = graph.getField(ID2, cafx.field);
                        bool = bool && nextID == ID1;
                    }
                }
            }
            return bool;
        }
    }
    /*
     * 閉路を探索する
     * drawcircleがtrueの場合、閉路上のエッジの角度を全て無効にする
     * drawcircleがfalseの場合、閉路上のエッジを一本削除する
     */
    function searchCycleGraph(graph, edgelist, cls, IDs, arrayField) {
        //閉路上のIDの配列
        var cycleIDs = cycleGraphIDs(graph, cls, IDs, arrayField);
        //console.log(cycleIDs);
        for (var i = 0; i < cycleIDs.length; i++) {
            for (var j = 0; j < cycleIDs[i].length - 1; j++) {
                for (var k = 0; k < edgelist.length; k++) {
                    if (cycleIDs[i][j] == edgelist[k].ID1 && cycleIDs[i][j + 1] == edgelist[k].ID2) {
                        edgelist[k].underforce = false;
                    }
                }
            }
        }
        //補助関数、閉路を探索し、閉路上のIDの配列を返す
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
                    if (!sameT_InArray(nowID, usedIDs)) { //今いるノードが未訪問ならば訪問した印をつける
                        usedIDs.push(nowID);
                    }
                    for (var i = 0; i < arrayField.length; i++) {
                        var u = graph.getField(nowID, arrayField[i].field);
                        if (u != undefined) {
                            if (!sameT_InArray(u, stack.stack)) {
                                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                            }
                            else {
                                var cycleInStack = arraySpliceBoforeIndexOf(u, stack.stack);
                                cycleIDs.push(cycleInStack);
                                cycleIDs[cycleIDs.length - 1].push(u);
                            }
                        }
                    }
                    stack.pop();
                }
                return cycleIDs;
            }
        }
    }
    //ClassAndFieldの数から各フィールドの角度を決定する
    function decitionFieldAngle(caflist) {
        var checklist = new Array(caflist.length);
        for (var i = 0; i < checklist.length; i++) {
            checklist[i] = -1;
        }
        for (var i = 0; i < caflist.length; i++) {
            if (checklist[i] == -1) {
                var cafnumber = 1;
                checklist[i] = 1;
                var from = caflist[i].parentcls;
                var to = caflist[i].childcls;
                //フィールドの指すクラスが元のクラスと同じ場合
                if (from == to) {
                    for (var j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && caflist[j].childcls == to) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j = i; j < caflist.length; j++) {
                        if (checklist[j] == 1) {
                            if (cafnumber == 1) {
                                caflist[j].angle = 0;
                            }
                            else {
                                caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                                ii++;
                            }
                            checklist[j] = 0;
                        }
                    }
                }
                else if (!isPrimitiveString(to)) { //異なるクラスを指している場合
                    for (var j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && caflist[j].childcls == to) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j = i; j < caflist.length; j++) {
                        if (checklist[j] == 1) {
                            caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                            ii++;
                            checklist[j] = 0;
                        }
                    }
                }
                else { //プリミティブ型を指している場合
                    for (var j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && caflist[j].childcls == to) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j = i; j < caflist.length; j++) {
                        if (checklist[j] == 1) {
                            caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                            ii++;
                            checklist[j] = 0;
                        }
                    }
                }
            }
        }
    }
    //フィールドの階層構造を特定し、角度を変えるアルゴリズム（主にListInListに使う）
    function HierarchyAngleDecition(graph, edgelist, caflist, cls, IDs) {
        //必要なClassAndFieldの列挙
        var fields = new Array();
        for (var i = 0; i < caflist.length; i++) {
            if (caflist[i].parentcls == cls && caflist[i].childcls == cls) {
                fields.push(caflist[i]);
            }
        }
        //fieldsの中から最も使われているClasssAndFieldを列挙
        var fieldsnumber = new Array(fields.length);
        for (var i = 0; i < fields.length; i++) {
            fieldsnumber[i] = 0; //初期化
            for (var j = 0; j < edgelist.length; j++) {
                if (edgelist[j].fromtype == fields[i].parentcls && edgelist[j].fieldname == fields[i].field) {
                    fieldsnumber[i]++;
                }
            }
        }
        var MostUsedField = fields[fieldsnumber.indexOf(Math.max.apply(null, fieldsnumber))];
        var SubField = null;
        if (fields.length == 2) {
            if (fields[0] == MostUsedField) {
                SubField = fields[1];
            }
            else {
                SubField = fields[0];
            }
        }
        else {
            return;
        }
        //console.log(MostUsedField);
        //console.log(SubField);
        //IDsを連結しているノードの集合に分ける
        var IDsGroup = new Array(IDs.length);
        for (var i = 0; i < IDsGroup.length; i++) {
            IDsGroup[i] = -1; //未訪問のノードに該当する番号には-1を代入する
        }
        var GroupNumber = -1;
        for (var i = 0; i < IDsGroup.length; i++) {
            if (IDsGroup[i] == -1) {
                GroupNumber++;
                IDsGroup[i] = GroupNumber;
                var ID = IDs[i];
                depth_first_search(ID, GroupNumber);
                //補助関数
                function depth_first_search(ID, GroupNumber) {
                    for (var j = 0; j < fields.length; j++) {
                        var ID2 = graph.getField(ID, fields[j].field);
                        if (IDsGroup[IDs.indexOf(ID2)] == -1 || IDsGroup[IDs.indexOf(ID2)] != GroupNumber) {
                            IDsGroup[IDs.indexOf(ID2)] = GroupNumber;
                            depth_first_search(ID2, GroupNumber);
                        }
                    }
                }
            }
        }
        var connectedGraph = new Array(GroupNumber + 1);
        for (var i = 0; i < connectedGraph.length; i++) {
            connectedGraph[i] = new Array();
        }
        for (var i = 0; i < IDsGroup.length; i++) {
            connectedGraph[IDsGroup[i]].push(IDs[i]);
        }
        //クラスオブジェクトの中から始点を見つける
        var startNodes = new Array(connectedGraph.length);
        for (var i = 0; i < startNodes.length; i++) {
            startNodes[i] = search_start_node(connectedGraph[i]);
        }
        //補助関数：始点を探す
        function search_start_node(IDs) {
            var referedNumber = new Array(IDs.length); //ノードごとに参照されているエッジの数を記録する
            for (var i = 0; i < referedNumber.length; i++) {
                referedNumber[i] = 0;
            }
            //クラスオブジェクトの中から始点を見つける
            for (var i = 0; i < IDs.length; i++) {
                var ID = IDs[i];
                for (var j = 0; j < edgelist.length; j++) {
                    if (edgelist[j].ID2 == ID) {
                        referedNumber[i]++;
                    }
                }
            }
            var min = Math.min.apply(null, referedNumber);
            var rootID = IDs[referedNumber.indexOf(min)];
            return rootID;
        }
        //console.log(cls);
        //console.log(startNodes);
    }
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList, caflist, interestNodes) {
        var forceDirectedMethodStartTime = performance.now();
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
        //ノード数
        var DOTNUMBER = ObjectIDs.length;
        //エッジ数
        var EDGENUMBER = edgeWithAngleList.length;
        var WIDTH = 1280; //表示する画面の横幅
        var HEIGHT = 720; //表示する画面の縦幅
        var K = 100; //クーロン力に係る係数
        var ITERATION = 8000; //反復回数
        var T = Math.max(WIDTH, HEIGHT); //温度パラメータ
        var t = T;
        var dt = T / (ITERATION);
        var K = 150; //クーロン力に係る係数
        var Knum = 5; //斥力のKの次数
        var rnum = 4; //斥力のrの次数
        var KRAD = 0.5; //角度に働く力の係数(弧度法から度数法に変更)
        var NODEMAXSIZE = 35; //ノードの大きさの最大値
        var NODEMINSIZE = 15; //ノードの大きさの最小値
        var NODEMAXSIZE_literal = NODEMAXSIZE * 2 / 3;
        var NODEMINSIZE_literal = NODEMINSIZE * 2 / 3;
        /*
         * 参考：デフォルトのノードの大きさ
         *  クラスオブジェクト 15
         *  リテラルオブジェクト 10
         */
        //フロイドワーシャル法で各点同士の最短経路長を求める
        var dddd = new Array(DOTNUMBER * DOTNUMBER);
        FloydWarshall(DOTNUMBER, EDGENUMBER, dddd);
        //点のクラス
        var Dot_G = /** @class */ (function () {
            function Dot_G() {
            }
            //点の初期化
            Dot_G.prototype.init = function (x, y, cls) {
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
                this.nodecls = cls;
                this.distance = -1;
                this.size = -1;
                this.isLiteral = !isPrimitiveString(cls);
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
        //補助クラス、ベクトルのクラス
        var Vector_G = /** @class */ (function () {
            function Vector_G(x, y) {
                this.x = x;
                this.y = y;
            }
            //２ベクトルの加算
            Vector_G.prototype.sum = function (vec2) {
                return new Vector_G(this.x + vec2.x, this.y + vec2.y);
            };
            //ベクトルの角度を計算する
            Vector_G.prototype.angle = function () {
                var angle = Math.atan2(this.y, this.x) * 180 / Math.PI;
                return angle;
            };
            return Vector_G;
        }());
        //辺のクラス
        var Edge_G = /** @class */ (function () {
            function Edge_G() {
            }
            //辺の初期化
            Edge_G.prototype.init = function (dot1, dot2, edgename) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.dot1cls = dot1.nodecls;
                this.dot2cls = dot2.nodecls;
                this.edgename = edgename;
            };
            //エッジの長さ（2点間の距離）を求める
            Edge_G.prototype.length = function () {
                var xl = this.dot1.x - this.dot2.x;
                var yl = this.dot1.y - this.dot2.y;
                return Math.sqrt(xl * xl + yl * yl);
            };
            //エッジの角度を計算する
            Edge_G.prototype.angle = function () {
                var dx = this.dot2.x - this.dot1.x;
                var dy = this.dot2.y - this.dot1.y;
                var delta = Math.sqrt(dx * dx + dy * dy);
                var angle = Math.atan2(dy, dx) * 180 / Math.PI;
                return angle;
            };
            //エッジと同じ角度の単位ベクトルを返す
            Edge_G.prototype.unitVector = function () {
                var dx = this.dot2.x - this.dot1.x;
                var dy = this.dot2.y - this.dot1.y;
                var delta = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    return new Vector_G(dx / delta, dy / delta);
                }
                else {
                    return new Vector_G(0, 0);
                }
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
                dots[i].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), graph.getClass(ObjectIDs[i]));
                //dots[i].init(WIDTH / 2 + Math.min(WIDTH, HEIGHT) * 0.7 * Math.cos(Math.PI * 2 * i / DOTNUMBER), HEIGHT / 2 + Math.sin(Math.PI * 2 * i / DOTNUMBER), graph.getClass(ObjectIDs[i]));
            }
        } while (sameDot_exists(dots, DOTNUMBER));
        //各点に注目点との距離を追加
        var maxDistance = 0;
        for (var i = 0; i < DOTNUMBER; i++) {
            if (interestNodes.length > 0) {
                var index = ObjectIDs.indexOf(interestNodes[0]);
                if (dddd[index * DOTNUMBER + i] != DOTNUMBER) {
                    dots[i].distance = dddd[index * DOTNUMBER + i];
                    if (maxDistance < dots[i].distance) {
                        maxDistance = dots[i].distance;
                    }
                }
            }
        }
        //注目点との距離を元に各点のサイズを追加
        for (var i = 0; i < DOTNUMBER; i++) {
            if (dots[i].distance != -1 && maxDistance != 0) {
                //if (dots[i].isLiteral) {
                //    dots[i].size = NODEMAXSIZE_literal - (NODEMAXSIZE_literal - NODEMINSIZE_literal) * dots[i].distance / maxDistance;
                //} else {
                //    dots[i].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * dots[i].distance / maxDistance;
                //}
                dots[i].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * dots[i].distance / maxDistance;
            }
        }
        //各辺の用意
        var edges = new Array(EDGENUMBER);
        for (var i = 0; i < EDGENUMBER; i++) {
            edges[i] = new Edge_G();
            edges[i].init(dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID1)], dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID2)], edgeWithAngleList[i].fieldname);
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
            //相対角度で描画する場合
            if (RelativeAngle) {
                //各エッジの平均角度を求める
                for (var i = 0; i < caflist.length; i++) {
                    var vectorSum = new Vector_G(0, 0);
                    var edgeNum = 0;
                    for (var j = 0; j < EDGENUMBER; j++) {
                        if (edgeIncludeCaF(edgeWithAngleList[j], caflist[i])) {
                            vectorSum = vectorSum.sum(edges[j].unitVector());
                            edgeNum += 1;
                        }
                    }
                    caflist[i].angle = vectorSum.angle();
                }
            }
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
            move_near_center(dots);
            center_of_gravity(dots, 0, 100);
            for (var i = 0; i < ObjectIDs.length; i++) {
                graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);
                graph.setDistance(ObjectIDs[i], dots[i].distance);
                graph.setSize(ObjectIDs[i], dots[i].size);
            }
            //console.log(dots);
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
                            //if (dddd[i * DOTNUMBER + j] < DOTNUMBER) {  //連結していれば
                            //    dots[i].frx += dx * d;
                            //    dots[i].fry += dy * d;
                            //} else {        //連結していなければ
                            //    var rate: number = delta < K * 3 ? K : -1;    //距離がK*3以上なら引力、未満なら斥力を発生させる
                            //    dots[i].frx += dx * rate / delta;
                            //    dots[i].fry += dy * rate / delta;
                            //}
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
                if (edgeWithAngleList[i].underforce == true) {
                    var angle = edges[i].angle();
                    for (var j = 0; j < caflist.length; j++) {
                        if (edgeIncludeCaF(edgeWithAngleList[i], caflist[j])) {
                            var dx = edges[i].dot2.x - edges[i].dot1.x;
                            var dy = edges[i].dot2.y - edges[i].dot1.y;
                            var delta = Math.sqrt(dx * dx + dy * dy);
                            if (delta != 0) {
                                var d = angle - caflist[j].angle; //弧度法から度数法に変更
                                var ddx;
                                var ddy;
                                var ex = KRAD * dy / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                                var ey = -KRAD * dx / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                                if (Math.abs(d) <= 180) {
                                    ddx = d * Math.abs(d) * ex;
                                    ddy = d * Math.abs(d) * ey;
                                }
                                else {
                                    var dd = d + 2 * 180;
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
                }
            }
            //力ベクトルから速度を求める
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init_velocity();
            }
        }
        //ベクトルを画面に表示する
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
        //計算後に連結していないノード同士が離れすぎていないように、グループ毎に全体の重心に近づけていく
        function move_near_center(dots) {
            var cx = 0;
            var cy = 0;
            for (var i = 0; i < DOTNUMBER; i++) {
                cx += dots[i].x;
                cy += dots[i].y;
            }
            cx = cx / DOTNUMBER; //重心のx座標
            cy = cy / DOTNUMBER; //重心のy座標
            var darray = new Array(DOTNUMBER);
            for (var i = 0; i < DOTNUMBER; i++) {
                darray[i] = 1; //初期化
            }
            var groupArray = new Array();
            for (var i = 0; i < DOTNUMBER; i++) {
                if (darray[i] != -1) {
                    var ary = new Array();
                    ary.push(i);
                    darray[i] = -1;
                    for (j = i + 1; j < DOTNUMBER; j++) {
                        if (dddd[i * DOTNUMBER + j] != DOTNUMBER) {
                            ary.push(j);
                            darray[j] = -1;
                        }
                    }
                    groupArray.push(ary);
                }
            }
            if (groupArray.length <= 1)
                return;
            var groupCenterX = new Array(groupArray.length);
            var groupCenterY = new Array(groupArray.length);
            var groupRadius = new Array(groupArray.length);
            var groupWeight = new Array(groupArray.length);
            for (var i = 0; i < groupArray.length; i++) {
                var cnx = 0;
                var cny = 0;
                for (var j = 0; j < groupArray[i].length; j++) {
                    cnx += dots[groupArray[i][j]].x;
                    cny += dots[groupArray[i][j]].y;
                }
                cnx = cnx / groupArray[i].length; //連結しているグループの重心
                cny = cny / groupArray[i].length;
                var maxDistance = 0;
                for (var j = 0; j < groupArray[i].length; j++) {
                    var distanceX = dots[groupArray[i][j]].x - cnx;
                    var distanceY = dots[groupArray[i][j]].y - cny;
                    var distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
                    if (maxDistance < distance) {
                        maxDistance = distance;
                    }
                }
                groupCenterX[i] = cnx;
                groupCenterY[i] = cny;
                groupRadius[i] = maxDistance + 10;
                groupWeight[i] = groupArray[i].length;
                var defx = cnx - cx; //全体の重心とグループの重心の差
                var defy = cny - cy;
                var def = Math.sqrt(defx * defx + defy * defy);
                if (def != 0) {
                    var movex = (def - K * Math.sqrt(groupArray[i].length)) * defx / def;
                    var movey = (def - K * Math.sqrt(groupArray[i].length)) * defy / def;
                    for (var j = 0; j < groupArray[i].length; j++) {
                        dots[groupArray[i][j]].x -= movex;
                        dots[groupArray[i][j]].y -= movey;
                    }
                }
            }
            ////力学的手法により近づけていく
            //var t = 500;    //温度パラメータ
            //var dt = t / 100;   //100回計算を繰り返す
            //var groupPowerX: number[] = new Array(groupArray.length);
            //var groupPowerY: number[] = new Array(groupArray.length);
            //while (true) {
            //    //初期化
            //    for (var i = 0; i < groupArray.length; i++) {
            //        groupPowerX[i] = 0;
            //        groupPowerY[i] = 0;
            //    }
            //    //引力を計算
            //    for (var i = 0; i < groupArray.length; i++) {
            //        for (var j = i + 1; j < groupArray.length; j++) {
            //            var dx: number = groupCenterX[i] - groupCenterX[j];
            //            var dy: number = groupCenterY[i] - groupCenterY[j];
            //            var sumRadius: number = groupRadius[i] + groupRadius[j];
            //            var delta: number = Math.sqrt(dx * dx + dy * dy) - sumRadius;
            //            if (delta != 0) {
            //                var d: number = f_a(delta, 1) / delta;
            //                var ddx: number = dx * d;
            //                var ddy: number = dy * d;
            //                groupPowerX[i] += -ddx;
            //                groupPowerX[j] += +ddx;
            //                groupPowerY[i] += -ddy;
            //                groupPowerY[j] += +ddy;
            //            }
            //        }
            //    }
            //    //引力に従ってグループ単位で移動
            //    for (var i = 0; i < groupArray.length; i++) {
            //        var power: number = Math.sqrt(groupPowerX[i] * groupPowerX[i] + groupPowerY[i] * groupPowerY[i]);
            //        var moveX: number = 0;
            //        var moveY: number = 0;
            //        if (power < t) {
            //            moveX = groupPowerX[i];
            //            moveY = groupPowerY[i];
            //        } else if (power != 0) {
            //            moveX = t * groupPowerX[i] / power;
            //            moveY = t * groupPowerY[i] / power;
            //        }
            //        for (var j = 0; j < groupArray[i].length; j++) {
            //            dots[groupArray[i][j]].x += moveX;
            //            dots[groupArray[i][j]].y += moveY;
            //        }
            //    }
            //    t -= dt;
            //    if (t < 0) break;
            //}
        }
        //各点同士の最短経路長を求める
        function FloydWarshall(dotnumber, edgenumber, d) {
            for (var i = 0; i < dotnumber; i++) {
                for (var j = 0; j < dotnumber; j++) {
                    d[i * dotnumber + j] = dotnumber;
                }
                d[i * dotnumber + i] = 0;
            }
            for (var i = 0; i < edgenumber; i++) {
                var one = ObjectIDs.indexOf(edgeWithAngleList[i].ID1);
                var two = ObjectIDs.indexOf(edgeWithAngleList[i].ID2);
                d[one * dotnumber + two] = 1;
                d[two * dotnumber + one] = 1;
            }
            for (var k = 0; k < dotnumber; k++) {
                for (var i = 0; i < dotnumber; i++) {
                    for (var j = 0; j < dotnumber; j++) {
                        if (d[i * dotnumber + j] > d[i * dotnumber + k] + d[k * dotnumber + j]) {
                            d[i * dotnumber + j] = d[i * dotnumber + k] + d[k * dotnumber + j];
                        }
                    }
                }
            }
        }
        var forceDirectedMethodEndTime = performance.now();
        console.log("forceDirectedMethod Time = " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
    }
    //注目ノードの特定
    function interestNodesInit(graph, interestNodes, EwithAs) {
        ////緑の矢印で指されているノードID
        //var thisNodeIDs: string[] = new Array();
        //var greenEdges: Edge[] = graph.variableEdges;
        //for (var i = 0; i < greenEdges.length; i++) {
        //    if (greenEdges[i].label == "this") {
        //        thisNodeIDs.push(greenEdges[i].to);
        //    }
        //}
        ////緑の矢印が指しているノードが参照しているノードの集合のID
        //var referencedNodeIDs: string[] = new Array();
        //for (var i = 0; i < thisNodeIDs.length; i++) {
        //    for (var j = 0; j < EwithAs.length; j++) {
        //        var chdID: string = EwithAs[j].ID2;
        //        if (thisNodeIDs[i] == EwithAs[j].ID1 && referencedNodeIDs.indexOf(chdID) == -1) {
        //            referencedNodeIDs.push(chdID);
        //        }
        //    }
        //}
        ////注目しているノード全体
        //var array: string[] = thisNodeIDs.concat(referencedNodeIDs);
        //return array;
        //緑の矢印で指されているノードID
        var greenEdges = graph.variableEdges;
        for (var i = 0; i < greenEdges.length; i++) {
            if (greenEdges[i].label == "this") {
                interestNodes.push(greenEdges[i].to);
                break;
            }
        }
    }
    /**************
     * 実行部分
     * ************/
    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle = true;
    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue = true;
    //相対角度で描画するかどうか
    var RelativeAngle = false;
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var edgeWithAngleList = new Array();
    var classAndFieldList = new Array();
    var interestNodes = new Array();
    edgeListInit(graph, edgeWithAngleList, classAndFieldList, DrawCircle, EdgeWithPrimitiveValue, interestNodes);
    console.log("edgeList = ");
    console.log(edgeWithAngleList);
    console.log("cafList = ");
    console.log(classAndFieldList);
    console.log("interest Nodes = ");
    console.log(interestNodes);
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList, classAndFieldList, interestNodes);
}
//# sourceMappingURL=setGraphLocation.js.map