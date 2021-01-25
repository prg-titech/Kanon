//Kanonからgraphオブジェクトを受け取り、graphオブジェクト内のノードの座標を更新する関数（メイン関数）
function setGraphLocation(graph) {
    /**************
     * クラス宣言
     * ************/
    //クラス名とフィールド名をまとめてクラス定義する
    var ClassAndField = /** @class */ (function () {
        function ClassAndField(pcls, ccls, field, f_edge) {
            this.parentcls = pcls;
            this.childcls = ccls;
            this.field = field;
            this.angle = 0;
            this.f_edges = new Array(f_edge);
        }
        return ClassAndField;
    }());
    //エッジのクラス
    var FiFA_Edge = /** @class */ (function () {
        function FiFA_Edge(dot1, dot2, name) {
            this.ID1 = dot1.ID;
            this.ID2 = dot2.ID;
            this.ID1class = dot1.cls;
            this.ID2class = dot2.cls;
            this.dot1 = dot1;
            this.dot2 = dot2;
            this.name = name;
            this.underforce = true;
            this.interested = true;
            this.smooth = true;
            this.id_length = STANDARD_EDGELENGTH;
            this.id_angle = 0;
            this.krad = KRAD;
        }
        //エッジの長さ（2点間の距離）を求める
        FiFA_Edge.prototype.length = function () {
            var xl = this.dot1.x - this.dot2.x;
            var yl = this.dot1.y - this.dot2.y;
            return Math.sqrt(xl * xl + yl * yl);
        };
        //エッジの角度を計算する
        FiFA_Edge.prototype.angle = function () {
            var dx = this.dot2.x - this.dot1.x;
            var dy = this.dot2.y - this.dot1.y;
            var angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return angle;
        };
        //エッジの理想の長さを求め、id_lengthに上書きする
        FiFA_Edge.prototype.feye_length = function (maxDistance, distortion) {
            var id1 = this.dot1.feye_distance;
            var id2 = this.dot2.feye_distance;
            if (id1 != id2) {
                this.id_length = Math.abs(id1 - id2) * STANDARD_EDGELENGTH;
            }
            else {
                this.id_length = (distortion + 1) * maxDistance / (distortion + maxDistance) * STANDARD_EDGELENGTH;
            }
        };
        return FiFA_Edge;
    }());
    //クラスターエッジのクラス
    var FiFA_Cluster_Edge = /** @class */ (function () {
        function FiFA_Cluster_Edge(cluster1, cluster2, edge) {
            this.cluster1 = cluster1;
            this.cluster2 = cluster2;
            this.edge = edge;
            this.name = edge.name;
            this.underforce = edge.underforce;
            this.interested = edge.interested;
            this.smooth = edge.smooth;
            this.id_angle = this.edge.id_angle;
            this.id_length = this.edge.id_length;
            this.krad = this.edge.krad;
        }
        //エッジの長さ（2点間の距離）を求める
        FiFA_Cluster_Edge.prototype.length = function () {
            var xl = this.cluster1.x - this.cluster2.x;
            var yl = this.cluster1.y - this.cluster2.y;
            return Math.sqrt(xl * xl + yl * yl);
        };
        //エッジの角度を計算する
        FiFA_Cluster_Edge.prototype.angle = function () {
            var dx = this.cluster2.x - this.cluster1.x;
            var dy = this.cluster2.y - this.cluster1.y;
            var angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return angle;
        };
        //エッジの理想の長さを求め、id_lengthに上書きする
        FiFA_Cluster_Edge.prototype.feye_length = function (maxDistance, distortion) {
            var id1 = this.cluster1.feye_distance;
            var id2 = this.cluster2.feye_distance;
            if (id1 != id2) {
                this.id_length = Math.abs(id1 - id2) * STANDARD_EDGELENGTH;
            }
            else {
                this.id_length = (distortion + 1) * maxDistance / (distortion + maxDistance) * STANDARD_EDGELENGTH;
            }
        };
        return FiFA_Cluster_Edge;
    }());
    //ノードのクラス
    var FiFA_Node = /** @class */ (function () {
        function FiFA_Node(ID) {
            this.ID = ID;
            this.cls = graph.getClass(ID);
            this.isLiteral = graph.isLiteral(ID);
            this.f_edges = new Array();
            this.cluster = null;
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
            this.route_length = -1;
            this.size = NODESIZE;
            this.feye_distance = -1;
            this.interested = true;
            this.attention = false;
            this.color = graph.getColor(ID);
        }
        //座標を初期化する
        FiFA_Node.prototype.init = function (x, y) {
            this.x = x;
            this.y = y;
        };
        //自身の所属するクラスターを登録する
        FiFA_Node.prototype.register_cluster = function (cluster) {
            this.cluster = cluster;
        };
        //働く力の初期化
        FiFA_Node.prototype.focus_init = function () {
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
        };
        //移動させる
        FiFA_Node.prototype.move = function (dx, dy) {
            this.x += dx;
            this.y += dy;
        };
        //ノードに働く力から速度を求める
        FiFA_Node.prototype.init_velocity = function () {
            this.dx = this.fax + this.frx + this.fmx;
            this.dy = this.fay + this.fry + this.fmy;
        };
        //ノードの速度
        FiFA_Node.prototype.velocity = function () {
            return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        };
        return FiFA_Node;
    }());
    //クラスターノードのクラス
    var FiFA_Cluster_Node = /** @class */ (function () {
        function FiFA_Cluster_Node(main, sub) {
            this.main = main;
            this.sub = sub;
            this.f_cluster_edges = new Array();
            this.f_include_edges = new Array();
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
            this.route_length = -1;
            this.size = NODESIZE;
            this.feye_distance = -1;
            this.attention = false;
            //所属しているノードにクラスターを登録させる
            if (this.main != null)
                this.main.register_cluster(this);
            for (var i_1 = 0; i_1 < this.sub.length; i_1++) {
                this.sub[i_1].register_cluster(this);
            }
        }
        //初期化
        FiFA_Cluster_Node.prototype.init = function (x, y) {
            this.x = x;
            this.y = y;
            if (this.main != null) {
                this.main.x = x;
                this.main.y = y;
            }
        };
        //サブノードの座標をメインに近い場所でランダムに初期化する
        FiFA_Cluster_Node.prototype.sub_init = function (width, height) {
            for (var i_2 = 0; i_2 < this.sub.length; i_2++) {
                this.sub[i_2].init(this.x - width / 2 + Math.floor(Math.random() * width), this.y - height / 2 + Math.floor(Math.random() * height));
            }
        };
        //引数のノードが含まれているか判定する
        FiFA_Cluster_Node.prototype.belong = function (node) {
            if (this.main == node)
                return true;
            else if (this.sub.indexOf(node) != -1)
                return true;
            else
                return false;
        };
        //クラスターに所属しているノード数を返す
        FiFA_Cluster_Node.prototype.quantity = function () {
            return this.sub.length + 1;
        };
        //働く力の初期化
        FiFA_Cluster_Node.prototype.focus_init = function () {
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
        };
        //クラスターを移動させる
        FiFA_Cluster_Node.prototype.move = function (dx, dy) {
            this.x += dx;
            this.y += dy;
            if (this.main != null) {
                this.main.move(dx, dy);
            }
            for (var i_3 = 0; i_3 < this.sub.length; i_3++) {
                this.sub[i_3].move(dx, dy);
            }
        };
        //クラスター内部のノード座標をクラスター座標に合わせる
        FiFA_Cluster_Node.prototype.move_only_node = function () {
            var rx = 0;
            var ry = 0;
            if (this.main != null) {
                rx = this.main.x;
                ry = this.main.y;
            }
            else {
                var anum = Math.floor((this.sub.length - 1) / 2);
                rx = this.sub[anum].x;
                ry = this.sub[anum].y;
            }
            if (this.main != null) {
                this.main.move(this.x - rx, this.y - ry);
            }
            for (var i_4 = 0; i_4 < this.sub.length; i_4++) {
                this.sub[i_4].move(this.x - rx, this.y - ry);
            }
        };
        //ノードに働く力から速度を求める
        FiFA_Cluster_Node.prototype.init_velocity = function () {
            this.dx = this.fax + this.frx + this.fmx;
            this.dy = this.fay + this.fry + this.fmy;
        };
        //ノードの速度
        FiFA_Cluster_Node.prototype.velocity = function () {
            return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        };
        return FiFA_Cluster_Node;
    }());
    /**************
     * 変数宣言
     * ************/
    var DrawCircle = true; //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    var EdgeWithPrimitiveValue = true; //参照先がprimitive型のときに角度を決定するかどうか
    var RelativeAngle = false; //相対角度で描画するかどうか
    var ObjectIDs = graph.getObjectIDs(); //オブジェクトのIDの配列
    var WIDTH = 1280; //表示する画面の横幅
    var HEIGHT = 720; //表示する画面の縦幅
    var NODESIZE = 15;
    var STANDARD_EDGELENGTH = 130;
    var STANDARD_EDGEFONTSIZE = 14;
    var CS = 150; //スプリング力に係る係数
    var CR = 150000; //斥力に係る係数
    var KRAD = 0.5; //角度に働く力の係数(弧度法から度数法に変更)
    var ITERATION = 3000; //反復回数
    var S_ITERATION = 3000; //極小ノードの座標計算の反復回数
    var T = Math.max(WIDTH, HEIGHT); //温度パラメータ
    var ct = T;
    var t = T;
    var cdt = T / (ITERATION);
    var dt = T / (S_ITERATION);
    var NODEMAXSIZE = 0;
    var NODEMINSIZE = 0;
    var DISTORTION = 0; //歪み変数
    var FiFA_NodeList = new Array();
    var FiFA_EdgeList = new Array();
    var FiFA_ClusterNodeList = new Array();
    var FiFA_ClusterEdgeList = new Array();
    var classAndFieldList = new Array();
    var attentionNodes = attentionNodesInit(graph);
    var cluster_shortest_path = null;
    //console.log("interest Nodes = ");
    //console.log(attentionNodes);
    /************
     * 実行部分
     * **********/
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    edgeListInit(graph, FiFA_NodeList, FiFA_EdgeList, FiFA_ClusterNodeList, FiFA_ClusterEdgeList, classAndFieldList, DrawCircle, EdgeWithPrimitiveValue, attentionNodes);
    //console.log("nodelist = ");
    //console.log(FiFA_NodeList);
    //console.log("edgeList = ");
    //console.log(FiFA_EdgeList);
    //console.log("cluster = ");
    //console.log(FiFA_ClusterNodeList);
    //console.log("cafList = ");
    //console.log(classAndFieldList);
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, FiFA_NodeList, FiFA_EdgeList, FiFA_ClusterNodeList, FiFA_ClusterEdgeList, attentionNodes);
    //console.log("clusternodelist = ");
    //console.log(FiFA_ClusterNodeList);
    /************
     * 関数宣言
     * **********/
    //ClassAndFieldの配列内に引数と同じ値があるかどうかを走査する
    //あった場合は最初の値のindexを、なければ-1を返す
    function sameClassAndField_InArray(caf, arrayCaf) {
        var index = -1;
        for (var i_5 = 0; i_5 < arrayCaf.length; i_5++) {
            if (caf.parentcls == arrayCaf[i_5].parentcls && caf.childcls == arrayCaf[i_5].childcls && caf.field == arrayCaf[i_5].field) {
                index = i_5;
            }
        }
        return index;
    }
    //値から配列の最初のkeyを取得し、keyより前の要素を削除した配列を返す
    function arraySpliceBoforeIndexOf(key, array) {
        var carray = copyArray(array);
        var index = carray.indexOf(key);
        carray.splice(0, index);
        return carray;
        //配列を別の配列にコピーする
        function copyArray(origin) {
            var array = new Array(origin.length);
            for (var i_6 = 0; i_6 < origin.length; i_6++) {
                array[i_6] = origin[i_6];
            }
            return array;
        }
    }
    //与えられたエッジオブジェクトが与えられたクラスフィールドに属しているかを判定する
    function edgeIncludeCaF(edge, caf) {
        return edge.ID1class == caf.parentcls && edge.ID2class == caf.childcls && edge.name == caf.field;
    }
    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str) {
        return !((str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function"));
    }
    /**********************
     * グラフエッジの生成
     * ********************/
    function edgeListInit(graph, nodelist, edgelist, clusternodelist, clusteredgelist, caflist, drawcircle, edgewithprimitivevalue, attentionNodes) {
        var edgeListInitStartTime = performance.now();
        //ノード群の生成
        for (var i_7 = 0; i_7 < ObjectIDs.length; i_7++) {
            var fnode = new FiFA_Node(ObjectIDs[i_7]);
            fnode.interested = graph.notInterestedClass.indexOf(fnode.cls) == -1;
            fnode.attention = attentionNodes.indexOf(ObjectIDs[i_7]) != -1;
            nodelist.push(fnode);
        }
        //グラフ内で使われているオブジェクトのクラス名の配列
        var allObjectClass = new Array(ObjectIDs.length);
        for (var i_8 = 0; i_8 < ObjectIDs.length; i_8++) {
            allObjectClass[i_8] = graph.getClass(ObjectIDs[i_8]);
        }
        //重複を除いたクラス名の配列
        var allObjectClassExceptDuplication = allObjectClass.filter(function (value, index, array) {
            return array.indexOf(value) === index;
        });
        //クラス名ごとに所属するIDを配列にする、IDsSeparateClassは配列の配列
        var IDsSeparateClass = new Array(allObjectClassExceptDuplication.length);
        var _loop_1 = function (i_9) {
            IDsSeparateClass[i_9] = ObjectIDs.filter(function (value, index, array) {
                return graph.getClass(value) == allObjectClassExceptDuplication[i_9];
            });
        };
        for (var i_9 = 0; i_9 < allObjectClassExceptDuplication.length; i_9++) {
            _loop_1(i_9);
        }
        //エッジ群の生成
        for (var i_10 = 0; i_10 < ObjectIDs.length; i_10++) {
            //ID1(始点ノード)のIDとクラス
            var ID1 = ObjectIDs[i_10];
            //ID1の持つフィールドの列
            var fields = graph.getFields(ID1);
            for (var j_1 = 0; j_1 < fields.length; j_1++) {
                var fieldname = fields[j_1];
                var ID2 = graph.getField(ID1, fieldname);
                var node2 = nodelist[ObjectIDs.indexOf(ID2)];
                var fedge = new FiFA_Edge(nodelist[i_10], node2, fieldname);
                if (!edgewithprimitivevalue && node2.isLiteral) { //プリミティブ型を指すフィールドエッジに角度力を働かせない
                    fedge.underforce = false;
                }
                edgelist.push(fedge);
                nodelist[i_10].f_edges.push(fedge);
            }
        }
        //必要なフィールド名
        for (var i_11 = 0; i_11 < edgelist.length; i_11++) {
            var caf = new ClassAndField(edgelist[i_11].ID1class, edgelist[i_11].ID2class, edgelist[i_11].name, edgelist[i_11]);
            var index = sameClassAndField_InArray(caf, caflist);
            if (index == -1) {
                caflist.push(caf);
            }
            else {
                caflist[index].f_edges.push(edgelist[i_11]);
            }
        }
        necessaryCaFList(graph, caflist, ObjectIDs);
        //必要なフィールド名以外のエッジを削除する
        for (var i_12 = edgelist.length - 1; i_12 >= 0; i_12--) {
            var bool = false;
            for (var j_2 = 0; j_2 < caflist.length; j_2++) {
                bool = bool || edgeIncludeCaF(edgelist[i_12], caflist[j_2]);
            }
            if (bool == false) {
                edgelist.splice(i_12, 1);
            }
        }
        //ClassAndFieldの数から各フィールドの角度を決定する
        decitionFieldAngle(caflist);
        //閉路上のエッジに働かせる角度力を無くす
        if (drawcircle) {
            searchCycleGraph(graph, edgelist, ObjectIDs, caflist);
        }
        //edgelistに理想角度を書き込んでいく
        for (var i_13 = 0; i_13 < caflist.length; i_13++) {
            for (var j_3 = 0; j_3 < caflist[i_13].f_edges.length; j_3++) {
                caflist[i_13].f_edges[j_3].id_angle = caflist[i_13].angle;
            }
        }
        //注目ノードの色を変更する
        for (var i_14 = 0; i_14 < attentionNodes.length; i_14++) {
            var pink = void 0;
            if (graph.getClass(attentionNodes[i_14]) == "Kanon-ArrayNode") {
                pink = {
                    border: 'deeppink',
                    background: 'mistyrose',
                    highlight: {
                        border: 'deeppink',
                        background: 'mistyrose'
                    },
                    hover: {
                        border: 'deeppink',
                        background: 'mistyrose'
                    }
                };
            }
            else
                pink = "hotpink";
            nodelist[ObjectIDs.indexOf(attentionNodes[i_14])].color = pink;
        }
        //極小ノードを生成する
        var notInterestedNodeClusterSort = makeMinimalNode(nodelist, edgelist);
        //極小ノードリストからクラスターを生成する
        makeCluster(nodelist, edgelist, clusternodelist, notInterestedNodeClusterSort);
        //クラスターエッジを生成する
        makeClusterEdge(edgelist, clusteredgelist);
        //クラスター間の最短経路長を計算する
        cluster_shortest_path = new Array(clusternodelist.length * clusternodelist.length);
        FloydWarshall_cluster(clusternodelist, clusteredgelist, cluster_shortest_path);
        var shortest_path_max = 0; //最短経路長の最大値
        for (var i_15 = 0; i_15 < cluster_shortest_path.length; i_15++) {
            if (cluster_shortest_path[i_15] != clusternodelist.length && cluster_shortest_path[i_15] > shortest_path_max) {
                shortest_path_max = cluster_shortest_path[i_15];
            }
        }
        //各グローバル変数の値の計算
        NODEMAXSIZE = NODESIZE + Math.pow(clusternodelist.length, 2 / 3);
        NODEMINSIZE = NODESIZE * (1 + Math.exp(-Math.min(shortest_path_max, clusternodelist.length))) * 2 / 3;
        DISTORTION = shortest_path_max * shortest_path_max / 48;
        if (attentionNodes.length > 0) { //もし注目点があるのならば
            //注目ノードの含まれるクラスターの番号
            var indexes = new Array();
            for (var i_16 = 0; i_16 < attentionNodes.length; i_16++) {
                var attendNode = nodelist[ObjectIDs.indexOf(attentionNodes[i_16])];
                var attendCluster = attendNode.cluster;
                indexes.push(clusternodelist.indexOf(attendCluster));
            }
            //各点クラスターにに注目クラスターとの最短経路長を追加
            var maxDistance = 0;
            for (var i_17 = 0; i_17 < clusternodelist.length; i_17++) {
                var minLength = clusternodelist.length;
                for (var j_4 = 0; j_4 < indexes.length; j_4++) {
                    if (minLength > cluster_shortest_path[indexes[j_4] * clusternodelist.length + i_17]) {
                        minLength = cluster_shortest_path[indexes[j_4] * clusternodelist.length + i_17];
                    }
                }
                if (minLength != clusternodelist.length) {
                    clusternodelist[i_17].route_length = minLength;
                    if (maxDistance < clusternodelist[i_17].route_length) {
                        maxDistance = clusternodelist[i_17].route_length;
                    }
                }
            }
            //注目点との経路長を元に注目点との理想距離を計算
            for (var i_18 = 0; i_18 < clusternodelist.length; i_18++) {
                if (clusternodelist[i_18].route_length == 0) {
                    clusternodelist[i_18].feye_distance = 0;
                }
                else {
                    clusternodelist[i_18].feye_distance = (DISTORTION + 1) * maxDistance /
                        (DISTORTION + maxDistance / clusternodelist[i_18].route_length);
                }
            }
            for (var i_19 = 0; i_19 < clusteredgelist.length; i_19++) {
                clusteredgelist[i_19].feye_length(maxDistance, DISTORTION);
                clusteredgelist[i_19].edge.id_length = clusteredgelist[i_19].id_length;
            }
            //console.log("edges =");
            //console.log(edges);
            //注目点との距離を元に各点のサイズを追加
            for (var i_20 = 0; i_20 < clusternodelist.length; i_20++) {
                if (clusternodelist[i_20].route_length != -1 && maxDistance != 0) {
                    clusternodelist[i_20].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * clusternodelist[i_20].feye_distance / maxDistance;
                }
                if (clusternodelist[i_20].main != null)
                    clusternodelist[i_20].main.size *= clusternodelist[i_20].size / NODESIZE;
                for (var j_5 = 0; j_5 < clusternodelist[i_20].sub.length; j_5++) {
                    clusternodelist[i_20].sub[j_5].size *= clusternodelist[i_20].size / NODESIZE;
                }
                for (var j_6 = 0; j_6 < clusternodelist[i_20].f_include_edges.length; j_6++) {
                    clusternodelist[i_20].f_include_edges[j_6].id_length *= clusternodelist[i_20].size / NODESIZE;
                }
            }
        }
        //プリミティブ型や配列型を参照しているエッジの理想長を短くする
        for (var i_21 = 0; i_21 < clusteredgelist.length; i_21++) {
            if (clusteredgelist[i_21].cluster2.main != null) {
                if (clusteredgelist[i_21].cluster2.main.isLiteral) {
                    clusteredgelist[i_21].id_length *= 0.7;
                    clusteredgelist[i_21].edge.id_length *= 0.7;
                }
                else if (clusteredgelist[i_21].cluster1.main != null) {
                    if (clusteredgelist[i_21].cluster1.main.cls == "Kanon-ArrayNode" && clusteredgelist[i_21].name == "ref") {
                        clusteredgelist[i_21].id_length *= 0.7;
                        clusteredgelist[i_21].edge.id_length *= 0.7;
                    }
                }
            }
        }
        var edgeListInitEndTime = performance.now();
        console.log("edgeListInit\n   " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    }
    /*
     * 交互参照しているフィールドを発見し、削除する
     */
    function necessaryCaFList(graph, caflist, ObjectIDs) {
        for (var i_22 = caflist.length - 1; i_22 >= 0; i_22--) {
            var caf1 = caflist[i_22];
            //console.log("i = " + i);
            //console.log(caf1);
            var near_caf1 = new Array(); //caf1と逆の（型）→（型）を持つフィールド名の集合
            for (var j_7 = 0; j_7 < caflist.length; j_7++) {
                if (caflist[j_7] != caf1 && caflist[j_7].parentcls == caf1.childcls && caflist[j_7].childcls == caf1.parentcls) {
                    near_caf1.push(caflist[j_7]);
                }
            }
            //console.log("near_caf1 = ");
            //console.log(near_caf1);
            var bool = false;
            for (var j_8 = 0; j_8 < near_caf1.length; j_8++) {
                bool = bool || isOverlapping(graph, caf1, near_caf1[j_8]);
            }
            //console.log("bool = " + bool);
            if (bool && near_caf1.length != 0) {
                caflist.splice(i_22, 1);
            }
        }
        /*
         * 補助関数
         * 二つのClassAndFieldのx,yを受け取り、xに該当するエッジを全探索する
         * xのエッジが全てyのエッジの逆向きエッジであるならばtrueを返り値として返す
         */
        function isOverlapping(graph, cafx, cafy) {
            var bool = true;
            for (var i_23 = 0; i_23 < ObjectIDs.length; i_23++) {
                var ID1 = ObjectIDs[i_23];
                if (graph.getClass(ID1) == cafy.parentcls) {
                    var ID2 = graph.getField(ID1, cafy.field);
                    if (ID2 != undefined && graph.getClass(ID2) == cafy.childcls) {
                        var nextID = graph.getField(ID2, cafx.field);
                        bool = bool && nextID == ID1;
                        if (!bool)
                            break;
                    }
                }
            }
            return bool && cafx.f_edges.length >= cafy.f_edges.length;
        }
    }
    /*
     * 閉路を探索する
     * drawcircleがtrueの場合、閉路上のエッジの角度を全て無効にする
     * drawcircleがfalseの場合、閉路上のエッジを一本削除する
     */
    function searchCycleGraph(graph, edgelist, IDs, arrayField) {
        //閉路上のIDの配列
        var cycleIDs = cycleGraphIDs(graph, IDs, arrayField);
        for (var i_24 = 0; i_24 < cycleIDs.length; i_24++) {
            for (var j_9 = 0; j_9 < cycleIDs[i_24].length - 1; j_9++) {
                for (var k = 0; k < edgelist.length; k++) {
                    if (cycleIDs[i_24][j_9] == edgelist[k].ID1 && cycleIDs[i_24][j_9 + 1] == edgelist[k].ID2) {
                        edgelist[k].underforce = false;
                    }
                }
            }
        }
        //補助関数、閉路を探索し、閉路上のIDの配列を返す
        function cycleGraphIDs(graph, IDs, arrayField) {
            var cycleIDs = new Array();
            var usedIDs = new Array(); //訪れたことのあるIDを記録
            for (var i_25 = 0; i_25 < IDs.length; i_25++) {
                if (usedIDs.indexOf(IDs[i_25]) == -1) {
                    var cycleIDsFromOneID = cycleGraphIDsFromOneID(graph, usedIDs, arrayField, IDs[i_25]);
                    for (var j_10 = 0; j_10 < cycleIDsFromOneID.length; j_10++) {
                        cycleIDs.push(cycleIDsFromOneID[j_10]);
                    }
                }
            }
            return cycleIDs;
            //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
            function cycleGraphIDsFromOneID(graph, usedIDs, arrayField, ID) {
                var cycleIDs = new Array();
                var stack = new Array(); //経路を記録するためのスタック
                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, ID);
                return cycleIDs;
                //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                function deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, nowID) {
                    stack.push(nowID);
                    if (usedIDs.indexOf(nowID) == -1) { //今いるノードが未訪問ならば訪問した印をつける
                        usedIDs.push(nowID);
                    }
                    for (var i_26 = 0; i_26 < arrayField.length; i_26++) {
                        var u = graph.getField(nowID, arrayField[i_26].field);
                        if (u != undefined) {
                            if (stack.indexOf(u) == -1) {
                                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                            }
                            else {
                                var cycleInStack = arraySpliceBoforeIndexOf(u, stack);
                                cycleIDs.push(cycleInStack);
                                cycleIDs[cycleIDs.length - 1].push(u);
                            }
                        }
                    }
                    stack.pop();
                }
            }
        }
    }
    /*
     * ClassAndFieldの数から各フィールドの角度を決定する
     */
    function decitionFieldAngle(caflist) {
        var checklist = new Array(caflist.length);
        for (var i_27 = 0; i_27 < checklist.length; i_27++) {
            checklist[i_27] = -1;
        }
        for (var i_28 = 0; i_28 < caflist.length; i_28++) {
            if (checklist[i_28] == -1) {
                var cafnumber = 1;
                checklist[i_28] = 1;
                var from = caflist[i_28].parentcls;
                var to = caflist[i_28].childcls;
                if (from == "Kanon-ArrayNode" && to == "Kanon-ArrayNode") { //配列ノードの場合
                    if (caflist[i_28].field == "next") {
                        caflist[i_28].angle = 0;
                    }
                    else if (caflist[i_28].field == "ref") {
                        caflist[i_28].angle = 90;
                    }
                    checklist[i_28] = 0;
                }
                else if (from == to) { //フィールドの指すクラスが元のクラスと同じ場合
                    for (var j_11 = i_28 + 1; j_11 < caflist.length; j_11++) {
                        if (caflist[j_11].parentcls == from && caflist[j_11].childcls == to) {
                            cafnumber++;
                            checklist[j_11] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j_12 = i_28; j_12 < caflist.length; j_12++) {
                        if (checklist[j_12] == 1) {
                            if (cafnumber == 1) {
                                caflist[j_12].angle = 0;
                            }
                            else {
                                caflist[j_12].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                                ii++;
                            }
                            checklist[j_12] = 0;
                        }
                    }
                }
                else if (isPrimitiveString(to)) { //プリミティブ型を指している場合
                    for (var j_13 = i_28 + 1; j_13 < caflist.length; j_13++) {
                        if (caflist[j_13].parentcls == from && isPrimitiveString(caflist[j_13].childcls)) {
                            cafnumber++;
                            checklist[j_13] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j_14 = i_28; j_14 < caflist.length; j_14++) {
                        if (checklist[j_14] == 1) {
                            //caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                            caflist[j_14].angle = 120 - 60 / (cafnumber * 2) * (2 * ii + 1);
                            ii++;
                            checklist[j_14] = 0;
                        }
                    }
                }
                else { //異なるクラスを指している場合
                    for (var j_15 = i_28 + 1; j_15 < caflist.length; j_15++) {
                        if (caflist[j_15].parentcls == from && caflist[j_15].childcls == to) {
                            cafnumber++;
                            checklist[j_15] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j_16 = i_28; j_16 < caflist.length; j_16++) {
                        if (checklist[j_16] == 1) {
                            caflist[j_16].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                            ii++;
                            checklist[j_16] = 0;
                        }
                    }
                }
            }
        }
    }
    /*
     * 興味なしノードをクラスターに分類する
     */
    function makeMinimalNode(nodelist, edgelist) {
        var notInterestNodeClusterSort = new Array(); //各クラスター内のノードをx座標の小さい順に並べ替えたもの
        var notInterestedNodes = new Array(); //興味なしのノード群
        var notInterestedEdges = new Array(); //端点が２つとも興味なしのエッジ群
        for (var i_29 = 0; i_29 < nodelist.length; i_29++) {
            if (!nodelist[i_29].interested) { //興味のないノードは
                nodelist[i_29].size = nodelist[i_29].size / 8; //大きさを小さくする
                notInterestedNodes.push(nodelist[i_29]);
            }
        }
        for (var i_30 = 0; i_30 < edgelist.length; i_30++) {
            if (!edgelist[i_30].dot2.interested) { //エッジのtoノードが興味なしのとき
                if (!edgelist[i_30].dot1.interested) { //エッジのfromノードも興味なしのとき
                    edgelist[i_30].id_length = edgelist[i_30].id_length / 32;
                    notInterestedEdges.push(edgelist[i_30]);
                }
                else {
                    edgelist[i_30].id_length = edgelist[i_30].id_length / 12;
                }
                edgelist[i_30].smooth = false;
            }
            else {
                if (!edgelist[i_30].dot1.interested) { //エッジのfromノードにのみ興味なしのとき
                    if (edgelist[i_30].dot2.isLiteral) {
                        edgelist[i_30].dot2.interested = false;
                        notInterestedNodes.push(edgelist[i_30].dot2);
                        notInterestedEdges.push(edgelist[i_30]);
                        edgelist[i_30].dot2.size = NODESIZE / 8;
                        edgelist[i_30].id_length = edgelist[i_30].id_length / 32;
                        edgelist[i_30].smooth = false;
                    }
                }
            }
        }
        //極小ノードをクラスターに分類していく
        var clusterNumber = new Array(notInterestedNodes.length);
        var clusterEdgeNumber = new Array(notInterestedEdges.length);
        clusterNumber.fill(-1);
        clusterEdgeNumber.fill(-1);
        var clusterNo = 0;
        for (var i_31 = 0; i_31 < notInterestedNodes.length; i_31++) {
            if (clusterNumber[i_31] == -1) {
                clusterNumber[i_31] = clusterNo;
                while (true) {
                    var bool = false;
                    for (var j_17 = 0; j_17 < notInterestedEdges.length; j_17++) {
                        var dot1_1 = notInterestedEdges[j_17].dot1;
                        var dot2_1 = notInterestedEdges[j_17].dot2;
                        var cn1 = clusterNumber[notInterestedNodes.indexOf(dot1_1)];
                        var cn2 = clusterNumber[notInterestedNodes.indexOf(dot2_1)];
                        if (cn1 == clusterNo && cn2 != clusterNo) {
                            clusterNumber[notInterestedNodes.indexOf(dot2_1)] = clusterNo;
                            clusterEdgeNumber[j_17] = clusterNo;
                            bool = true;
                        }
                        else if (cn2 == clusterNo && cn1 != clusterNo) {
                            clusterNumber[notInterestedNodes.indexOf(dot1_1)] = clusterNo;
                            clusterEdgeNumber[j_17] = clusterNo;
                            bool = true;
                        }
                    }
                    if (!bool)
                        break;
                }
                clusterNo++;
            }
        }
        var notInterestNodeCluster = new Array(); //興味なしノードのクラスター
        var notInterestEdgeCluster = new Array(); //興味なしエッジのクラスター
        for (var i_32 = 0; i_32 < clusterNo; i_32++) {
            var clusterNodeArray = new Array();
            for (var j_18 = 0; j_18 < clusterNumber.length; j_18++) {
                if (clusterNumber[j_18] == i_32) {
                    clusterNodeArray.push(notInterestedNodes[j_18]);
                }
            }
            notInterestNodeCluster.push(clusterNodeArray);
            var clusterEdgeArray = new Array();
            for (var j_19 = 0; j_19 < clusterEdgeNumber.length; j_19++) {
                if (clusterEdgeNumber[j_19] == i_32) {
                    clusterEdgeArray.push(notInterestedEdges[j_19]);
                }
            }
            notInterestEdgeCluster.push(clusterEdgeArray);
        }
        for (var i_33 = 0; i_33 < notInterestEdgeCluster.length; i_33++) {
            var notRootNode = new Array(notInterestNodeCluster[i_33].length);
            notRootNode.fill(true);
            for (var j_20 = 0; j_20 < notInterestEdgeCluster[i_33].length; j_20++) {
                var toNode = notInterestEdgeCluster[i_33][j_20].dot2;
                notRootNode[notInterestNodeCluster[i_33].indexOf(toNode)] = false;
            }
            if (notRootNode.indexOf(true) == -1) { //根のノードがクラスターになかった場合
                notInterestNodeClusterSort.push(notInterestNodeCluster[i_33]);
            }
            else {
                var root = notInterestNodeCluster[i_33][notRootNode.indexOf(true)]; //根のノード
                var sortCluster = new Array();
                edgeAngleSort(root, notInterestEdgeCluster[i_33], sortCluster);
                notInterestNodeClusterSort.push(sortCluster);
                function edgeAngleSort(node, edgeCluster, sortCluster) {
                    var edgeArray = new Array();
                    for (var i_34 = 0; i_34 < edgeCluster.length; i_34++) {
                        if (edgeCluster[i_34].dot1 == node)
                            edgeArray.push(edgeCluster[i_34]);
                    }
                    if (edgeArray.length == 0)
                        sortCluster.push(node);
                    else {
                        for (var i_35 = 0; i_35 < edgeArray.length; i_35++) { //エッジを理想角度の大きさでバブルソートする
                            for (var j_21 = 1; j_21 < edgeArray.length - i_35; j_21++) {
                                if (edgeArray[j_21].id_angle > edgeArray[j_21 - 1].id_angle) {
                                    var temp = edgeArray[j_21];
                                    edgeArray[j_21] = edgeArray[j_21 - 1];
                                    edgeArray[j_21 - 1] = temp;
                                }
                            }
                        }
                        var flag = false;
                        for (var i_36 = 0; i_36 < edgeArray.length; i_36++) {
                            if (edgeArray[i_36].id_angle <= 90 && !flag) {
                                sortCluster.push(node);
                                flag = true;
                            }
                            edgeAngleSort(edgeArray[i_36].dot2, edgeCluster, sortCluster);
                        }
                    }
                }
            }
        }
        for (var i_37 = 0; i_37 < notInterestNodeClusterSort.length; i_37++) {
            var nodeCluster = notInterestNodeClusterSort[i_37];
            var fromClusterEdges = new Array();
            for (var j_22 = 0; j_22 < nodeCluster.length; j_22++) {
                var node = nodeCluster[j_22];
                var fromNodeEdges = new Array();
                for (var k = 0; k < edgelist.length; k++) {
                    if (edgelist[k].dot1 == node && edgelist[k].dot2.interested == true) {
                        fromNodeEdges.push(edgelist[k]);
                    }
                }
                for (var k = 0; k < fromNodeEdges.length; k++) { //バブルソートで並び替え
                    for (var l = 1; l < fromNodeEdges.length - k; l++) {
                        if (fromNodeEdges[l].id_angle > fromNodeEdges[l - 1].id_angle) {
                            var temp = fromNodeEdges[l];
                            fromNodeEdges[l] = fromNodeEdges[l - 1];
                            fromNodeEdges[l - 1] = temp;
                        }
                    }
                }
                Array.prototype.push.apply(fromClusterEdges, fromNodeEdges);
            }
            for (var j_23 = 0; j_23 < fromClusterEdges.length; j_23++) {
                fromClusterEdges[j_23].id_angle = 120 - 60 / (fromClusterEdges.length * 2) * (2 * j_23 + 1);
            }
        }
        return notInterestNodeClusterSort;
    }
    /*
     * クラスターノードを生成する
     */
    function makeCluster(nodelist, edgelist, clusters, notInterestedNodeClusterSort) {
        var usedInterestNodes = new Array();
        for (var i_38 = 0; i_38 < notInterestedNodeClusterSort.length; i_38++) {
            var toClusterEdges = new Array();
            for (var j_24 = 0; j_24 < notInterestedNodeClusterSort[i_38].length; j_24++) {
                for (var k = 0; k < edgelist.length; k++) {
                    if (edgelist[k].dot2 == notInterestedNodeClusterSort[i_38][j_24] && edgelist[k].dot1.interested)
                        toClusterEdges.push(edgelist[k]);
                }
            }
            if (toClusterEdges.length == 0) {
                var cluster = new FiFA_Cluster_Node(null, notInterestedNodeClusterSort[i_38]);
                var jnum = Math.floor((notInterestedNodeClusterSort[i_38].length - 1) / 2);
                var centerNode = notInterestedNodeClusterSort[i_38][jnum];
                cluster.init(centerNode.x, centerNode.y);
                clusters.push(cluster);
            }
            else {
                var mainDot = toClusterEdges[0].dot1;
                var cluster = new FiFA_Cluster_Node(mainDot, notInterestedNodeClusterSort[i_38]);
                cluster.init(mainDot.x, mainDot.y);
                clusters.push(cluster);
                usedInterestNodes.push(mainDot);
            }
        }
        for (var i_39 = 0; i_39 < nodelist.length; i_39++) {
            if (usedInterestNodes.indexOf(nodelist[i_39]) == -1 && nodelist[i_39].interested) {
                var cluster = new FiFA_Cluster_Node(nodelist[i_39], []);
                cluster.init(nodelist[i_39].x, nodelist[i_39].y);
                clusters.push(cluster);
            }
        }
    }
    /*
     * クラスターエッジを生成する
     */
    function makeClusterEdge(edgelist, clusteredgelist) {
        for (var i_40 = 0; i_40 < edgelist.length; i_40++) {
            var cluster1 = edgelist[i_40].dot1.cluster;
            var cluster2 = edgelist[i_40].dot2.cluster;
            if (cluster1 != cluster2) { //異なるクラスターを結んでいるエッジ
                var clusteredge = new FiFA_Cluster_Edge(cluster1, cluster2, edgelist[i_40]);
                clusteredgelist.push(clusteredge);
                cluster1.f_cluster_edges.push(clusteredge);
            }
            else {
                cluster1.f_include_edges.push(edgelist[i_40]);
            }
        }
        //重複するエッジを削除する
        for (var i_41 = clusteredgelist.length - 1; i_41 > 0; i_41--) {
            var clusteredge1 = clusteredgelist[i_41];
            for (var j_25 = 0; j_25 < i_41; j_25++) {
                var clusteredge2 = clusteredgelist[j_25];
                if (clusteredge1.cluster1 == clusteredge2.cluster1 && clusteredge1.cluster2 == clusteredge2.cluster2) {
                    clusteredgelist.splice(i_41, 1);
                }
                else if (clusteredge1.cluster2 == clusteredge2.cluster1 && clusteredge1.cluster1 == clusteredge2.cluster2) {
                    clusteredgelist.splice(i_41, 1);
                }
            }
        }
    }
    /**********************
     * ノードの座標の計算
     * ********************/
    function calculateLocationWithForceDirectedMethod(graph, nodelist, edgelist, clusternodelist, clusteredgelist, attentionNodes) {
        var forceDirectedMethodStartTime = performance.now();
        var CLUSTERNUM = clusternodelist.length;
        var CEDGENUM = clusteredgelist.length;
        //各クラスターの座標の初期化、同じ座標の点同士が存在しないようにする
        do {
            for (var i_42 = 0; i_42 < CLUSTERNUM; i_42++) {
                clusternodelist[i_42].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT));
                clusternodelist[i_42].sub_init(30, 30);
            }
        } while (sameNode_exists(nodelist));
        center_of_gravity(nodelist, clusternodelist, WIDTH, HEIGHT);
        //クラスター隣接行列を用意する
        var cluster_admx = new Array(CLUSTERNUM * CLUSTERNUM);
        cluster_admx.fill(false);
        for (var i_43 = 0; i_43 < CEDGENUM; i_43++) {
            var c1 = clusternodelist.indexOf(clusteredgelist[i_43].cluster1);
            var c2 = clusternodelist.indexOf(clusteredgelist[i_43].cluster2);
            cluster_admx[c1 * CLUSTERNUM + c2] = true;
            cluster_admx[c2 * CLUSTERNUM + c1] = true;
        }
        //各クラスター内の隣接行列を用意する
        var ad_matrixes = new Array(CLUSTERNUM);
        for (var i_44 = 0; i_44 < CLUSTERNUM; i_44++) {
            var nodeNum = clusternodelist[i_44].quantity();
            ad_matrixes[i_44] = new Array(nodeNum * nodeNum);
            ad_matrixes[i_44].fill(false);
            for (var j_26 = 0; j_26 < clusternodelist[i_44].f_include_edges.length; j_26++) {
                var dot1_2 = clusternodelist[i_44].f_include_edges[j_26].dot1;
                var dot2_2 = clusternodelist[i_44].f_include_edges[j_26].dot2;
                var n1 = (dot1_2 == clusternodelist[i_44].main) ? 0 : clusternodelist[i_44].sub.indexOf(dot1_2) + 1;
                var n2 = (dot2_2 == clusternodelist[i_44].main) ? 0 : clusternodelist[i_44].sub.indexOf(dot2_2) + 1;
                ad_matrixes[i_44][n1 * nodeNum + n2] = true;
                ad_matrixes[i_44][n2 * nodeNum + n1] = true;
            }
        }
        var cs = (attentionNodes.length > 0) ? CS : CS * 0.6;
        var cr = (attentionNodes.length > 0) ? CR * 0.5 : CR;
        //クラスターを力学モデルで座標移動させていく
        while (true) {
            cluster_force_move();
            if (ct <= 0)
                break;
        }
        //クラスター内のノードを力学モデルで座標移動させていく
        if (graph.notInterestedClass.length > 0) {
            while (true) {
                force_move();
                if (t <= 0)
                    break;
            }
        }
        //計算を終了し、graphに情報を書き込んでいく
        stopCalculate();
        //FiFAレイアウト手法でクラスターノードを移動させていく
        function cluster_force_move() {
            //各点に働く力を計算
            cluster_focus_calculate(clusternodelist);
            //各点の速度から、次の座標を計算する
            for (var i_45 = 0; i_45 < CLUSTERNUM; i_45++) {
                var dx = clusternodelist[i_45].dx;
                var dy = clusternodelist[i_45].dy;
                var disp = Math.sqrt(dx * dx + dy * dy);
                if (disp != 0) {
                    var d = Math.min(disp, ct) / disp;
                    clusternodelist[i_45].move(dx * d, dy * d);
                }
            }
            //温度パラメータを下げていく
            ct -= cdt;
        }
        //FiFAレイアウト手法でクラスター内の各ノードを移動させていく
        function force_move() {
            //各点に働く力を計算
            focus_calculate(clusternodelist, nodelist);
            //各クラスター内のsubのノードを移動させていく
            for (var i_46 = 0; i_46 < CLUSTERNUM; i_46++) {
                //mainの移動
                if (clusternodelist[i_46].main != null) {
                    var dx = clusternodelist[i_46].main.dx;
                    var dy = clusternodelist[i_46].main.dy;
                    var disp = Math.sqrt(dx * dx + dy * dy);
                    if (disp != 0) {
                        var d = Math.min(disp, t) / disp;
                        clusternodelist[i_46].main.move(dx * d, dy * d);
                    }
                }
                //subの移動
                for (var j_27 = 0; j_27 < clusternodelist[i_46].sub.length; j_27++) {
                    var dx = clusternodelist[i_46].sub[j_27].dx;
                    var dy = clusternodelist[i_46].sub[j_27].dy;
                    var disp = Math.sqrt(dx * dx + dy * dy);
                    if (disp != 0) {
                        var d = Math.min(disp, t) / disp;
                        clusternodelist[i_46].sub[j_27].move(dx * d, dy * d);
                    }
                }
                //クラスター内のノード座標をクラスター座標に合わせる
                clusternodelist[i_46].move_only_node();
            }
            //温度パラメータを下げていく
            t -= dt;
        }
        //ばねで繋がれた２点間のスプリング力を計算
        //d:２点間の距離、c:係数、ideal_length:ばねの自然長
        //斥力になる場合は符号がマイナス
        function f_s(d, c, ideal_length) {
            var ratio = d / ideal_length;
            var p = Math.max(1, Math.pow(ratio, 1.5)) * Math.log(ratio);
            return c * p;
        }
        //非隣接2点間の斥力を計算
        //d:２点間の距離、c:係数
        function f_r(d, c) {
            return c / (d * d);
        }
        //各クラスターの引力・斥力を計算する
        function cluster_focus_calculate(clusternodelist) {
            //各点の速度・力ベクトルを0に初期化
            for (var i_47 = 0; i_47 < CLUSTERNUM; i_47++) {
                clusternodelist[i_47].focus_init();
            }
            //エッジの端点に働く角度力とスプリング力を計算
            for (var i_48 = 0; i_48 < clusteredgelist.length; i_48++) {
                var dx = clusteredgelist[i_48].cluster2.x - clusteredgelist[i_48].cluster1.x;
                var dy = clusteredgelist[i_48].cluster2.y - clusteredgelist[i_48].cluster1.y;
                var delta = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    var d1size = clusteredgelist[i_48].cluster1.size;
                    var d2size = clusteredgelist[i_48].cluster2.size;
                    if (clusteredgelist[i_48].underforce == true) {
                        //各点の角度に基づいて働く力を計算
                        var d = clusteredgelist[i_48].angle() - clusteredgelist[i_48].id_angle; //弧度法から度数法に変更
                        var ddx = void 0;
                        var ddy = void 0;
                        var krad = clusteredgelist[i_48].krad * d2size * d1size / (NODESIZE * NODESIZE);
                        var ex = krad * dy / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        var ey = -krad * dx / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
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
                        clusteredgelist[i_48].cluster1.fmx += -ddx;
                        clusteredgelist[i_48].cluster1.fmy += -ddy;
                        clusteredgelist[i_48].cluster2.fmx += ddx;
                        clusteredgelist[i_48].cluster2.fmy += ddy;
                    }
                    //２点が辺で繋がっている場合はスプリング力を計算
                    var ds = f_s(delta, cs, clusteredgelist[i_48].id_length) / delta * d2size * d1size / (NODESIZE * NODESIZE);
                    var ddsx = dx * ds;
                    var ddsy = dy * ds;
                    clusteredgelist[i_48].cluster2.fax -= ddsx;
                    clusteredgelist[i_48].cluster2.fay -= ddsy;
                    clusteredgelist[i_48].cluster1.fax += ddsx;
                    clusteredgelist[i_48].cluster1.fay += ddsy;
                }
            }
            //各点の斥力を計算
            for (var i_49 = 0; i_49 < CLUSTERNUM; i_49++) {
                for (var j_28 = i_49 + 1; j_28 < CLUSTERNUM; j_28++) {
                    if (cluster_admx[i_49 * CLUSTERNUM + j_28] == false) {
                        var dx = clusternodelist[i_49].x - clusternodelist[j_28].x;
                        var dy = clusternodelist[i_49].y - clusternodelist[j_28].y;
                        var delta = Math.sqrt(dx * dx + dy * dy);
                        if (delta != 0 && delta < 800) {
                            var d1size = clusternodelist[i_49].size;
                            var d2size = clusternodelist[j_28].size;
                            var d = f_r(delta, cr) / delta * d1size * d2size / (NODESIZE * NODESIZE);
                            clusternodelist[i_49].frx += dx * d;
                            clusternodelist[i_49].fry += dy * d;
                            clusternodelist[j_28].frx -= dx * d;
                            clusternodelist[j_28].fry -= dy * d;
                        }
                    }
                }
            }
            //力ベクトルから速度を求める
            for (var i_50 = 0; i_50 < CLUSTERNUM; i_50++) {
                clusternodelist[i_50].init_velocity();
            }
        }
        //各クラスター内でそれぞれのノード間に働く引力・斥力を計算する
        function focus_calculate(clusternodelist, nodelist) {
            //各点の速度・力ベクトルを0に初期化
            for (var i_51 = 0; i_51 < nodelist.length; i_51++) {
                nodelist[i_51].focus_init();
            }
            for (var i_52 = 0; i_52 < CLUSTERNUM; i_52++) {
                var cluster = clusternodelist[i_52];
                var smalledgelist = cluster.f_include_edges;
                var isMain = (cluster.main != null) ? 0 : 1;
                var nodeNum = cluster.quantity();
                var includelist = [cluster.main].concat(cluster.sub);
                //エッジの端点に働く角度力とスプリング力を計算
                for (var j_29 = 0; j_29 < smalledgelist.length; j_29++) {
                    var dx = smalledgelist[j_29].dot2.x - smalledgelist[j_29].dot1.x;
                    var dy = smalledgelist[j_29].dot2.y - smalledgelist[j_29].dot1.y;
                    var delta = Math.sqrt(dx * dx + dy * dy);
                    if (delta != 0) {
                        if (smalledgelist[j_29].underforce == true) {
                            //各点の角度に基づいて働く力を計算
                            var d = smalledgelist[j_29].angle() - smalledgelist[j_29].id_angle; //弧度法から度数法に変更
                            var ddx = void 0;
                            var ddy = void 0;
                            var krad = smalledgelist[j_29].krad / 2;
                            var ex = krad * dy / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                            var ey = -krad * dx / delta; //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
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
                            smalledgelist[j_29].dot1.fmx += -ddx;
                            smalledgelist[j_29].dot1.fmy += -ddy;
                            smalledgelist[j_29].dot2.fmx += ddx;
                            smalledgelist[j_29].dot2.fmy += ddy;
                        }
                        //２点が辺で繋がっている場合はスプリング力を計算
                        var ds = f_s(delta, cs, smalledgelist[j_29].id_length) / delta / 10;
                        var ddsx = dx * ds;
                        var ddsy = dy * ds;
                        smalledgelist[j_29].dot2.fax -= ddsx;
                        smalledgelist[j_29].dot2.fay -= ddsy;
                        smalledgelist[j_29].dot1.fax += ddsx;
                        smalledgelist[j_29].dot1.fay += ddsy;
                    }
                }
                //各点の斥力を計算
                for (var j_30 = isMain; j_30 < nodeNum; j_30++) {
                    for (var k = j_30 + 1; k < nodeNum; k++) {
                        if (ad_matrixes[i_52][j_30 * nodeNum + k] == false) {
                            var dx = includelist[j_30].x - includelist[k].x;
                            var dy = includelist[j_30].y - includelist[k].y;
                            var delta = Math.sqrt(dx * dx + dy * dy);
                            if (delta != 0 && delta < 800) {
                                var d = f_r(delta, cr) / delta / 160;
                                includelist[j_30].frx += dx * d;
                                includelist[j_30].fry += dy * d;
                                includelist[k].frx -= dx * d;
                                includelist[k].fry -= dy * d;
                            }
                        }
                    }
                }
            }
            //力ベクトルから速度を求める
            for (var i_53 = 0; i_53 < nodelist.length; i_53++) {
                nodelist[i_53].init_velocity();
            }
        }
        //計算を終了し、graph変数に情報を書きこんでいく
        function stopCalculate() {
            move_near_center(nodelist, clusternodelist);
            center_of_gravity(nodelist, clusternodelist, 0, 100);
            for (var i_54 = 0; i_54 < ObjectIDs.length; i_54++) {
                graph.setLocation(ObjectIDs[i_54], nodelist[i_54].x, nodelist[i_54].y); //ノードの座標
                graph.setDistance(ObjectIDs[i_54], nodelist[i_54].route_length); //ノードの注目点からの距離（デバッグ用）
                graph.setSize(ObjectIDs[i_54], nodelist[i_54].size); //ノードのサイズ
                graph.setColor(ObjectIDs[i_54], nodelist[i_54].color);
            }
            for (var i_55 = 0; i_55 < edgelist.length; i_55++) {
                var edge = edgelist[i_55];
                var dot1ID = ObjectIDs[nodelist.indexOf(edge.dot1)];
                var dot2ID = ObjectIDs[nodelist.indexOf(edge.dot2)];
                var edgefontSize = edge.dot2.size * STANDARD_EDGEFONTSIZE / NODESIZE;
                //エッジのラベルのサイズ
                graph.setEdgeLabelSize(dot1ID, dot2ID, edgefontSize);
                graph.setEdgeLabelSize(dot2ID, dot1ID, edgefontSize);
                //エッジの太さ
                if (edgefontSize < STANDARD_EDGEFONTSIZE && graph.CustomMode) {
                    graph.setEdgeWidth(dot1ID, dot2ID, edgefontSize / STANDARD_EDGEFONTSIZE * 3);
                    graph.setEdgeWidth(dot2ID, dot1ID, edgefontSize / STANDARD_EDGEFONTSIZE * 3);
                }
                else {
                    graph.setEdgeWidth(dot1ID, dot2ID, 3);
                    graph.setEdgeWidth(dot2ID, dot1ID, 3);
                }
                //エッジの長さ
                if (!edge.dot2.interested) {
                    graph.setEdgeLength(dot1ID, dot2ID, edge.id_length / 100);
                    graph.setEdgeLength(dot2ID, dot1ID, edge.id_length / 100);
                }
                else {
                    graph.setEdgeLength(dot1ID, dot2ID, edge.id_length / 2);
                    graph.setEdgeLength(dot2ID, dot1ID, edge.id_length / 2);
                }
                //ベジェ曲線で描くかどうか
                graph.setEdgeSmooth(dot1ID, dot2ID, edge.smooth);
                graph.setEdgeSmooth(dot2ID, dot1ID, edge.smooth);
                if (edge.ID1class == "Kanon-ArrayNode" && edge.ID2class == "Kanon-ArrayNode" && (edge.name == "next" || edge.name == "")) {
                    graph.setEdgeSmooth(dot1ID, dot2ID, false);
                }
            }
            var greenEdges = graph.variableEdges; //緑の矢印の集合
            for (var i_56 = 0; i_56 < greenEdges.length; i_56++) {
                if (!nodelist[ObjectIDs.indexOf(greenEdges[i_56].to)].interested) {
                    var toNode = nodelist[ObjectIDs.indexOf(greenEdges[i_56].to)];
                    var edgefontSize = toNode.size * STANDARD_EDGEFONTSIZE / NODESIZE;
                    //エッジのラベルのサイズ
                    //graph.setletiableEdgeLabelSize(greenEdges[i].to, edgefontSize);
                    //エッジの太さ
                    //graph.setletiableEdgeWidth(greenEdges[i].to, 3);
                    //エッジの長さ
                    graph.setVariableEdgeLength(greenEdges[i_56].to, STANDARD_EDGELENGTH / 100);
                }
            }
            if (attentionNodes.length > 0) {
                for (var i_57 = 0; i_57 < attentionNodes.length; i_57++) {
                    var node = nodelist[ObjectIDs.indexOf(attentionNodes[i_57])];
                    var edgefontSize = (node.size - NODEMINSIZE) * 10 / (NODEMAXSIZE - NODEMINSIZE) + STANDARD_EDGEFONTSIZE;
                    graph.setVariableEdgeLabelSize(attentionNodes[i_57], edgefontSize); //緑エッジのラベルのサイズ
                }
            }
        }
        //計算後に連結していないノード同士が離れすぎていないように、グループ毎に全体の重心に近づけていく
        function move_near_center(nodelist, clusternodelist) {
            var darray = new Array(nodelist.length);
            darray.fill(1);
            var groupArray = new Array();
            for (var i_58 = 0; i_58 < nodelist.length; i_58++) {
                if (darray[i_58] != -1) {
                    var ary = new Array();
                    ary.push(i_58);
                    darray[i_58] = -1;
                    for (j = i_58 + 1; j < nodelist.length; j++) {
                        var n1 = clusternodelist.indexOf(nodelist[i_58].cluster);
                        var n2 = clusternodelist.indexOf(nodelist[j].cluster);
                        if (cluster_shortest_path[n1 * clusternodelist.length + n2] != clusternodelist.length) {
                            ary.push(j);
                            darray[j] = -1;
                        }
                    }
                    groupArray.push(ary);
                }
            }
            if (groupArray.length <= 1)
                return;
            var Rectangle_Nodes = /** @class */ (function () {
                function Rectangle_Nodes(nodeArray) {
                    this.nodeArray = nodeArray;
                    this.nodeNumber = nodeArray.length;
                    this.calculation();
                    this.powerX = 0;
                    this.powerY = 0;
                }
                Rectangle_Nodes.prototype.calculation = function () {
                    var left = nodelist[this.nodeArray[0]].x;
                    var right = nodelist[this.nodeArray[0]].x;
                    var up = nodelist[this.nodeArray[0]].y;
                    var down = nodelist[this.nodeArray[0]].y;
                    for (var i_59 = 1; i_59 < this.nodeNumber; i_59++) {
                        if (nodelist[this.nodeArray[i_59]].x < left) {
                            left = nodelist[this.nodeArray[i_59]].x;
                        }
                        if (nodelist[this.nodeArray[i_59]].x > right) {
                            right = nodelist[this.nodeArray[i_59]].x;
                        }
                        if (nodelist[this.nodeArray[i_59]].y < up) {
                            up = nodelist[this.nodeArray[i_59]].y;
                        }
                        if (nodelist[this.nodeArray[i_59]].y > down) {
                            down = nodelist[this.nodeArray[i_59]].y;
                        }
                    }
                    this.leftX = left;
                    this.rightX = right;
                    this.upY = up;
                    this.downY = down;
                };
                Rectangle_Nodes.prototype.centerX = function () {
                    return (this.leftX + this.rightX) / 2;
                };
                Rectangle_Nodes.prototype.centerY = function () {
                    return (this.upY + this.downY) / 2;
                };
                Rectangle_Nodes.prototype.diagonal_length = function () {
                    var dx = this.rightX - this.leftX;
                    var dy = this.downY - this.upY;
                    return Math.sqrt(dx * dx + dy * dy) / 2;
                };
                Rectangle_Nodes.prototype.moveX = function (mx) {
                    for (var i_60 = 0; i_60 < this.nodeNumber; i_60++) {
                        nodelist[this.nodeArray[i_60]].x += mx;
                    }
                };
                Rectangle_Nodes.prototype.moveY = function (my) {
                    for (var i_61 = 0; i_61 < this.nodeNumber; i_61++) {
                        nodelist[this.nodeArray[i_61]].y += my;
                    }
                };
                Rectangle_Nodes.prototype.resetPower = function () {
                    this.powerX = 0;
                    this.powerY = 0;
                };
                return Rectangle_Nodes;
            }());
            var groupRectangle = new Array();
            for (var i_62 = 0; i_62 < groupArray.length; i_62++) {
                groupRectangle[i_62] = new Rectangle_Nodes(groupArray[i_62]);
            }
            var t = T;
            var dt = T / 1000;
            while (true) {
                //グループにかかるスプリング力を計算
                for (var i_63 = 0; i_63 < groupRectangle.length; i_63++) {
                    groupRectangle[i_63].resetPower();
                    for (var j_31 = 0; j_31 < groupRectangle.length; j_31++) {
                        if (i_63 != j_31) {
                            var dx = groupRectangle[j_31].centerX() - groupRectangle[i_63].centerX();
                            var dy = groupRectangle[j_31].centerY() - groupRectangle[i_63].centerY();
                            var delta = Math.sqrt(dx * dx + dy * dy);
                            var ideal_length = (groupRectangle[j_31].diagonal_length() + groupRectangle[i_63].diagonal_length()) * 1.1;
                            var spower = f_s(delta, CS, ideal_length);
                            if (delta != 0) {
                                groupRectangle[i_63].powerX += dx * spower / delta;
                                groupRectangle[i_63].powerY += dy * spower / delta;
                            }
                        }
                    }
                }
                //計算した力を元にグループ単位で移動させていく
                for (var i_64 = 0; i_64 < groupRectangle.length; i_64++) {
                    var dx = groupRectangle[i_64].powerX;
                    var dy = groupRectangle[i_64].powerY;
                    var disp = Math.sqrt(dx * dx + dy * dy);
                    if (disp != 0) {
                        var d = Math.min(disp, t) / disp;
                        groupRectangle[i_64].moveX(dx * d);
                        groupRectangle[i_64].moveY(dy * d);
                    }
                    groupRectangle[i_64].calculation();
                }
                t -= dt;
                if (t <= 0)
                    break;
            }
            for (var i_65 = 0; i_65 < clusternodelist.length; i_65++) {
                if (clusternodelist[i_65].main != null) {
                    clusternodelist[i_65].x = clusternodelist[i_65].main.x;
                    clusternodelist[i_65].y = clusternodelist[i_65].main.y;
                }
            }
            //console.log(groupRectangle);
        }
        var forceDirectedMethodEndTime = performance.now();
        console.log("forceDirectedMethod\n   " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
    }
    //点の初期配置に重なりが無いかを確かめる
    function sameNode_exists(nodelist) {
        var bool = false;
        for (var i_66 = 0; i_66 < nodelist.length - 1; i_66++) {
            for (var j_32 = i_66 + 1; j_32 < nodelist.length; j_32++) {
                bool = bool || (nodelist[i_66].x == nodelist[j_32].x && nodelist[i_66].y == nodelist[j_32].y);
            }
        }
        return bool;
    }
    //クラスター同士の最短経路長を求める
    function FloydWarshall_cluster(clusternodelist, clusteredgelist, mtx) {
        var nodeNum = clusternodelist.length;
        for (var i_67 = 0; i_67 < nodeNum; i_67++) {
            for (var j_33 = 0; j_33 < nodeNum; j_33++) {
                mtx[i_67 * nodeNum + j_33] = nodeNum;
            }
            mtx[i_67 * nodeNum + i_67] = 0;
        }
        for (var i_68 = 0; i_68 < clusteredgelist.length; i_68++) {
            var one = clusternodelist.indexOf(clusteredgelist[i_68].cluster1);
            var two = clusternodelist.indexOf(clusteredgelist[i_68].cluster2);
            mtx[one * nodeNum + two] = 1;
            mtx[two * nodeNum + one] = 1;
        }
        for (var k = 0; k < nodeNum; k++) {
            for (var i_69 = 0; i_69 < nodeNum; i_69++) {
                for (var j_34 = 0; j_34 < nodeNum; j_34++) {
                    if (mtx[i_69 * nodeNum + j_34] > mtx[i_69 * nodeNum + k] + mtx[k * nodeNum + j_34]) {
                        mtx[i_69 * nodeNum + j_34] = mtx[i_69 * nodeNum + k] + mtx[k * nodeNum + j_34];
                    }
                }
            }
        }
    }
    //グラフの点集合の重心を求め、重心が画面の中心になるように点移動させる
    function center_of_gravity(nodelist, clusternodelist, width, height) {
        if (nodelist.length == 0)
            return;
        else {
            var cx = 0;
            var cy = 0;
            for (var i_70 = 0; i_70 < nodelist.length; i_70++) {
                cx += nodelist[i_70].x;
                cy += nodelist[i_70].y;
            }
            cx = cx / nodelist.length; //重心のx座標
            cy = cy / nodelist.length; //重心のy座標
            //重心が画面の中央になるように点移動させる
            var dx = width / 2 - cx;
            var dy = height / 2 - cy;
            for (var i_71 = 0; i_71 < clusternodelist.length; i_71++) {
                clusternodelist[i_71].move(dx, dy);
            }
        }
    }
    //注目ノードの特定
    function attentionNodesInit(graph) {
        var attentionNodes = new Array();
        var greenEdges = graph.variableEdges; //緑の矢印の集合
        var bool = false;
        for (var i_72 = 0; i_72 < greenEdges.length; i_72++) {
            if (greenEdges[i_72].label == "this") {
                attentionNodes.push(greenEdges[i_72].to);
                bool = true;
                break;
            }
        }
        var global_letiables = graph.getGlobalVariables(); //グローバル変数の集合
        if ( /*bool*/true) {
            for (var i_73 = 0; i_73 < greenEdges.length; i_73++) {
                //ローカル変数の指すノードを拡大表示する
                if (greenEdges[i_73].label != "this" && global_letiables.indexOf(greenEdges[i_73].label) == -1) {
                    attentionNodes.push(greenEdges[i_73].to);
                }
            }
        }
        return attentionNodes;
    }
}
//# sourceMappingURL=setGraphLocation.js.map