__$__.Layout = {
    enabled: true,


    setLocation(graph) {
        console.log(document.getElementById("SelectDrawMethod").value);
        if(document.getElementById("SelectDrawMethod").value == "Ogushi"){
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
        function ClassAndField(pcls, ccls, field) {
            this.parentcls = pcls;
            this.childcls = ccls;
            this.field = field;
            this.angle = 0;
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
    function sameClassAndField_InArray(caf, arrayCaf) {
        var bool = false;
        for (var i = 0; i < arrayCaf.length; i++) {
            bool = bool || (caf.parentcls == arrayCaf[i].parentcls && caf.childcls == arrayCaf[i].childcls && caf.field == arrayCaf[i].field);
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
    //与えられたエッジオブジェクトが与えられたクラスフィールドに属しているかを判定する
    function edgeIncludeCaF(edge, caf) {
        return edge.fromtype == caf.parentcls && edge.totype == caf.childcls && edge.fieldname == caf.field;
    }
    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph, edgelist, caflist, drawcircle, edgewithprimitivevalue) {
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
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
            var caf = new ClassAndField(edgelist[i].fromtype, edgelist[i].totype, edgelist[i].fieldname);
            if (!sameClassAndField_InArray(caf, caflist)) {
                caflist.push(caf);
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
        //閉路上のエッジに働かせる角度力を無くす
        if (drawcircle) {
            for (var i = 0; i < caflist.length; i++) {
                if (caflist[i].parentcls == caflist[i].childcls) {
                    searchCycleGraph(graph, edgelist, caflist[i].parentcls, ObjectIDs, caflist);
                }
            }
        }
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
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList, caflist) {
        //オブジェクトのIDの配列
        var ObjectIDs = graph.getObjectIDs();
        //ノード数
        var DOTNUMBER = ObjectIDs.length;
        //エッジ数
        var EDGENUMBER = edgeWithAngleList.length;
        var WIDTH = 1280; //表示する画面の横幅
        var HEIGHT = 720; //表示する画面の縦幅
        //var K: number = Math.min(WIDTH, HEIGHT) / 50;   //クーロン力に係る係数
        var K = 100; //クーロン力に係る係数
        //var Knum: number = 8;       //斥力のKの次数
        //var rnum: number = 3;       //斥力のrの次数
        var ravenum = (Knum + 1) / (rnum + 2);
        //var KRAD: number = 300000.0 * Math.PI * Math.PI / (180 * 180);      //角度に働く力の係数(弧度法から度数法に変更)
        var ITERATION = 8000; //反復回数
        var T = Math.max(WIDTH, HEIGHT); //温度パラメータ
        var t = T;
        var dt = T / (ITERATION);
        var K = 150; //クーロン力に係る係数
        var Knum = 5; //斥力のKの次数
        var rnum = 4; //斥力のrの次数
        var KRAD = 0.5; //角度に働く力の係数(弧度法から度数法に変更)
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
            }
        } while (sameDot_exists(dots, DOTNUMBER));
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
            //graph_g.drawForceVector();
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
            var groupCenter = new Array(groupArray.length);
            for (var i = 0; i < groupArray.length; i++) {
                var cnx = 0;
                var cny = 0;
                for (var j = 0; j < groupArray[i].length; j++) {
                    cnx += dots[groupArray[i][j]].x;
                    cny += dots[groupArray[i][j]].y;
                }
                cnx = cnx / groupArray[i].length; //連結しているグループの重心
                cny = cny / groupArray[i].length;
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
    }
    /**************
     * 実行部分
     * ************/
    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle = true;
    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue = true;
    var edgeListInitStartTime = performance.now();
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var edgeWithAngleList = new Array();
    var classAndFieldList = new Array();
    edgeListInit(graph, edgeWithAngleList, classAndFieldList, DrawCircle, EdgeWithPrimitiveValue);
    var edgeListInitEndTime = performance.now();
    console.log("edgeListInit Time = " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    //console.log("edgeList = ");
    //console.log(edgeWithAngleList);
    //console.log("cafList = ");
    //console.log(classAndFieldList);
    var forceDirectedMethodStartTime = performance.now();
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList, classAndFieldList);
    var forceDirectedMethodEndTime = performance.now();
    console.log("forceDirectedMethod Time = " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");

        } else {

            let visGraph = graph.generateVisjsGraph(true);
            __$__.Layout.setLinkedList(visGraph);
            __$__.Layout.setBinaryTree(visGraph);
            for (let i = 0; i < visGraph.nodes.length; i++) {
                let node = visGraph.nodes[i];
                if (node.x !== undefined && node.y !== undefined) {
                    graph.setLocation(node.id, node.x, node.y);
                }
            }

        }
        
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
