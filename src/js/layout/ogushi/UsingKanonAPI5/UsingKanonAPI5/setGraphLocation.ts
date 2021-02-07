//Kanonからgraphオブジェクトを受け取り、graphオブジェクト内のノードの座標を更新する関数（メイン関数）
function setGraphLocation(graph: Graph) {

    /**************
     * クラス宣言
     * ************/

    //クラス名とフィールド名をまとめてクラス定義する
    class ClassAndField {
        parentcls: string;
        childcls: string;
        field: string;
        angle: number;
        f_edges: FiFA_Edge[];

        constructor(pcls: string, ccls: string, field: string, f_edge: FiFA_Edge) {
            this.parentcls = pcls;
            this.childcls = ccls;
            this.field = field;
            this.angle = 0;
            this.f_edges = new Array(f_edge);
        }
    }

    //エッジのクラス
    class FiFA_Edge {
        ID1: string;            //始点ノードのID
        ID2: string;            //終点ノードのID
        ID1class: string;
        ID2class: string;
        dot1: FiFA_Node;        //始点ノード
        dot2: FiFA_Node;        //終点ノード
        name: string;           //フィールド名
        underforce: boolean;    //回転力の影響下に置かれるか
        interested: boolean;    //このエッジに興味があるか（ない場合は先行して計算される）
        smooth: boolean;    //ベジェ曲線で描くかどうか
        id_angle: number;          //理想角度
        id_length: number;         //理想長
        krad: number;       //エッジの角度に対して働く力の係数

        constructor(dot1: FiFA_Node, dot2: FiFA_Node, name: string) {
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
        length(): number {
            let xl: number = this.dot1.x - this.dot2.x;
            let yl: number = this.dot1.y - this.dot2.y;

            return Math.sqrt(xl * xl + yl * yl);
        }

        //エッジの角度を計算する
        angle(): number {
            let dx: number = this.dot2.x - this.dot1.x;
            let dy: number = this.dot2.y - this.dot1.y;
            let angle: number = Math.atan2(dy, dx) * 180 / Math.PI;
            return angle;
        }

        //エッジの理想の長さを求め、id_lengthに上書きする
        feye_length(maxDistance: number, distortion: number) {
            let id1: number = this.dot1.feye_distance;
            let id2: number = this.dot2.feye_distance;

            if (id1 != id2) {
                this.id_length = Math.abs(id1 - id2) * STANDARD_EDGELENGTH;
            } else {
                this.id_length = (distortion + 1) * maxDistance / (distortion + maxDistance) * STANDARD_EDGELENGTH;
            }
        }
    }

    //クラスターエッジのクラス
    class FiFA_Cluster_Edge {
        cluster1: FiFA_Cluster_Node;        //始点クラスター
        cluster2: FiFA_Cluster_Node;        //終点クラスター
        edge: FiFA_Edge;                    //元となったエッジ
        name: string;           //フィールド名
        underforce: boolean;    //回転力の影響下に置かれるか
        interested: boolean;    //このエッジに興味があるか（ない場合は先行して計算される）
        smooth: boolean;    //ベジェ曲線で描くかどうか
        id_angle: number;          //理想角度
        id_length: number;         //理想長
        krad: number;       //エッジの角度に対して働く力の係数

        constructor(cluster1: FiFA_Cluster_Node, cluster2: FiFA_Cluster_Node, edge: FiFA_Edge) {
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
        length(): number {
            let xl: number = this.cluster1.x - this.cluster2.x;
            let yl: number = this.cluster1.y - this.cluster2.y;

            return Math.sqrt(xl * xl + yl * yl);
        }

        //エッジの角度を計算する
        angle(): number {
            let dx: number = this.cluster2.x - this.cluster1.x;
            let dy: number = this.cluster2.y - this.cluster1.y;
            let angle: number = Math.atan2(dy, dx) * 180 / Math.PI;
            return angle;
        }

        //エッジの理想の長さを求め、id_lengthに上書きする
        feye_length(maxDistance: number, distortion: number) {
            let id1: number = this.cluster1.feye_distance;
            let id2: number = this.cluster2.feye_distance;

            if (id1 != id2) {
                this.id_length = Math.abs(id1 - id2) * STANDARD_EDGELENGTH;
            } else {
                this.id_length = (distortion + 1) * maxDistance / (distortion + maxDistance) * STANDARD_EDGELENGTH;
            }
        }
    }

    //ノードのクラス
    class FiFA_Node {
        ID: string;
        cls: string;            //クラス名
        literals: Object;     //プリミティブ型かどうか
        f_edges: FiFA_Edge[];
        cluster: FiFA_Cluster_Node;     //自身の所属しているクラスター
        x: number;
        y: number;
        dx: number;     //速度のx成分
        dy: number;     //速度のy成分
        fax: number;    //引力のx成分
        fay: number;    //引力のy成分
        frx: number;    //斥力のx成分
        fry: number;    //斥力のy成分
        fmx: number;    //回転力のx成分
        fmy: number;    //回転力のy成分
        route_length: number;   //注目点との距離
        size: number;       //ノードの大きさ
        feye_distance: number;  //注目点との魚眼レイアウトでの理想距離
        interested: boolean;    //ユーザーがこのノードに興味があるか（ないと縮小表示される）
        attention: boolean;     //ローカル変数に束縛され、プログラマが注目しているかどうか
        color;

        constructor(ID: string) {
            this.ID = ID;
            this.cls = graph.getClass(ID);
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

            this.literals = new Object();
            let fieldnames: string[] = graph.getFields(ID);
            for (let i = 0; i < fieldnames.length; i++) {
                let fieldObjectID: string = graph.getField(ID, fieldnames[i]);
                if (graph.isLiteral(fieldObjectID)) {
                    this.literals[fieldnames[i]] = graph.nodes[fieldObjectID].value;
                }
            }
        }

        //座標を初期化する
        init(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        //自身の所属するクラスターを登録する
        register_cluster(cluster: FiFA_Cluster_Node) {
            this.cluster = cluster;
        }

        //働く力の初期化
        focus_init() {
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
        }

        //移動させる
        move(dx: number, dy: number) {
            this.x += dx;
            this.y += dy;
        }

        //ノードに働く力から速度を求める
        init_velocity() {
            this.dx = this.fax + this.frx + this.fmx;
            this.dy = this.fay + this.fry + this.fmy;
        }

        //ノードの速度
        velocity(): number {
            return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        }
    }

    //クラスターノードのクラス
    class FiFA_Cluster_Node {
        main: FiFA_Node;
        sub: FiFA_Node[];
        f_cluster_edges: FiFA_Cluster_Edge[];
        f_include_edges: FiFA_Edge[];
        x: number;
        y: number;
        dx: number;     //速度のx成分
        dy: number;     //速度のy成分
        fax: number;    //引力のx成分
        fay: number;    //引力のy成分
        frx: number;    //斥力のx成分
        fry: number;    //斥力のy成分
        fmx: number;    //回転力のx成分
        fmy: number;    //回転力のy成分
        route_length: number;   //注目点との距離
        size: number;       //ノードの大きさ
        feye_distance: number;  //注目点との魚眼レイアウトでの理想距離
        attention: boolean;     //ローカル変数に束縛され、プログラマが注目しているかどうか

        constructor(main: FiFA_Node, sub: FiFA_Node[]) {
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
            if (this.main != null) this.main.register_cluster(this);
            for (let i = 0; i < this.sub.length; i++) {
                this.sub[i].register_cluster(this);
            }
        }

        //初期化
        init(x: number, y: number) {
            this.x = x;
            this.y = y;
            if (this.main != null) {
                this.main.x = x;
                this.main.y = y;
            }
        }

        //サブノードの座標をメインに近い場所でランダムに初期化する
        sub_init(width: number, height: number) {
            for (let i = 0; i < this.sub.length; i++) {
                this.sub[i].init(this.x - width / 2 + Math.floor(Math.random() * width), this.y - height / 2 + Math.floor(Math.random() * height));
            }
        }

        //引数のノードが含まれているか判定する
        belong(node: FiFA_Node): boolean {
            if (this.main == node) return true;
            else if (this.sub.indexOf(node) != -1) return true;
            else return false;
        }

        //クラスターに所属しているノード数を返す
        quantity(): number {
            return this.sub.length + 1;
        }

        //働く力の初期化
        focus_init() {
            this.dx = 0;
            this.dy = 0;
            this.fax = 0;
            this.fay = 0;
            this.frx = 0;
            this.fry = 0;
            this.fmx = 0;
            this.fmy = 0;
        }

        //クラスターを移動させる
        move(dx: number, dy: number) {
            this.x += dx;
            this.y += dy;
            if (this.main != null) {
                this.main.move(dx, dy);
            }
            for (let i = 0; i < this.sub.length; i++) {
                this.sub[i].move(dx, dy);
            }
        }

        //クラスター内部のノード座標をクラスター座標に合わせる
        move_only_node() {
            let rx: number = 0;
            let ry: number = 0;
            if (this.main != null) {
                rx = this.main.x;
                ry = this.main.y;
            } else {
                let anum: number = Math.floor((this.sub.length - 1) / 2);
                rx = this.sub[anum].x;
                ry = this.sub[anum].y;
            }

            if (this.main != null) {
                this.main.move(this.x - rx, this.y - ry);
            }
            for (let i = 0; i < this.sub.length; i++) {
                this.sub[i].move(this.x - rx, this.y - ry);
            }
        }

        //ノードに働く力から速度を求める
        init_velocity() {
            this.dx = this.fax + this.frx + this.fmx;
            this.dy = this.fay + this.fry + this.fmy;
        }

        //ノードの速度
        velocity(): number {
            return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        }
    }


    /**************
     * 変数宣言
     * ************/

    let DrawCircle: boolean = true;                 //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    let RelativeAngle: boolean = false;             //相対角度で描画するかどうか

    let ObjectIDs: string[] = graph.getObjectIDs();     //オブジェクトのIDの配列
    let UsingObjectIDs: string[] = new Array();

    let WIDTH: number = 1280;    //表示する画面の横幅
    let HEIGHT: number = 720;     //表示する画面の縦幅
    let NODESIZE: number = 15;
    let STANDARD_EDGELENGTH: number = 200;
    let STANDARD_EDGEFONTSIZE: number = 14;
    let CS: number = 150;   //スプリング力に係る係数
    let CR: number = 150000;   //斥力に係る係数
    let KRAD: number = 0.5;      //角度に働く力の係数(弧度法から度数法に変更)
    let ITERATION: number = 3000;        //反復回数
    let S_ITERATION: number = 3000;     //極小ノードの座標計算の反復回数
    let T: number = Math.max(WIDTH, HEIGHT);         //温度パラメータ
    let ct: number = T;
    let t: number = T;
    let cdt: number = T / (ITERATION);
    let dt: number = T / (S_ITERATION);

    let NODEMAXSIZE: number = 0;
    let NODEMINSIZE: number = 0;
    let DISTORTION: number = 0;      //歪み変数
    let FiFA_NodeList: FiFA_Node[] = new Array();
    let FiFA_EdgeList: FiFA_Edge[] = new Array();
    let FiFA_ClusterNodeList: FiFA_Cluster_Node[] = new Array();
    let FiFA_ClusterEdgeList: FiFA_Cluster_Edge[] = new Array();
    let classAndFieldList: ClassAndField[] = new Array();
    let attentionNodes: string[] = attentionNodesInit(graph);
    let cluster_shortest_path: number[] = null;

    //console.log("interest Nodes = ");
    //console.log(attentionNodes);



    /************
     * 実行部分
     * **********/

    //角度付きエッジリストを用意し、参照関係を元に初期化する
    edgeListInit(graph, FiFA_NodeList, FiFA_EdgeList, FiFA_ClusterNodeList, FiFA_ClusterEdgeList, classAndFieldList,
        DrawCircle, attentionNodes);

    console.log("nodelist = ");
    console.log(FiFA_NodeList);
    console.log("edgeList = ");
    console.log(FiFA_EdgeList);
    console.log("cluster = ");
    console.log(FiFA_ClusterNodeList);
    console.log("cafList = ");
    console.log(classAndFieldList);

    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, FiFA_NodeList, FiFA_EdgeList, FiFA_ClusterNodeList, FiFA_ClusterEdgeList, attentionNodes);

    //console.log("nodelist = ");
    //console.log(FiFA_NodeList);
    //console.log("clusternodelist = ");
    //console.log(FiFA_ClusterNodeList);



    /************
     * 関数宣言
     * **********/

    //ClassAndFieldの配列内に引数と同じ値があるかどうかを走査する
    //あった場合は最初の値のindexを、なければ-1を返す
    function sameClassAndField_InArray(caf: ClassAndField, arrayCaf: ClassAndField[]): number {
        let index: number = -1;

        for (let i = 0; i < arrayCaf.length; i++) {
            if (caf.parentcls == arrayCaf[i].parentcls && caf.childcls == arrayCaf[i].childcls && caf.field == arrayCaf[i].field) {
                index = i;
            }
        }

        return index;
    }

    //値から配列の最初のkeyを取得し、keyより前の要素を削除した配列を返す
    function arraySpliceBoforeIndexOf(key: string, array: string[]): string[] {
        let carray: string[] = copyArray(array);
        let index: number = carray.indexOf(key);
        carray.splice(0, index);
        return carray;

        //配列を別の配列にコピーする
        function copyArray(origin: string[]): string[] {
            let array: string[] = new Array(origin.length);
            for (let i = 0; i < origin.length; i++) {
                array[i] = origin[i];
            }
            return array;
        }
    }

    //与えられたエッジオブジェクトが与えられたクラスフィールドに属しているかを判定する
    function edgeIncludeCaF(edge: FiFA_Edge, caf: ClassAndField) {
        return edge.ID1class == caf.parentcls && edge.ID2class == caf.childcls && edge.name == caf.field;
    }

    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str: string): boolean {
        return !((str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function"));
    }





    /**********************
     * グラフエッジの生成
     * ********************/

    function edgeListInit(graph: Graph, nodelist: FiFA_Node[], edgelist: FiFA_Edge[],
        clusternodelist: FiFA_Cluster_Node[], clusteredgelist: FiFA_Cluster_Edge[], caflist: ClassAndField[],
        drawcircle: boolean, attentionNodes: string[]) {
        let edgeListInitStartTime = performance.now();

        //ノード群の生成
        for (let i = 0; i < ObjectIDs.length; i++) {
            if (!graph.isLiteral(ObjectIDs[i])) {
                let fnode: FiFA_Node = new FiFA_Node(ObjectIDs[i]);
                fnode.interested = graph.notInterestedClass.indexOf(fnode.cls) == -1;
                fnode.attention = attentionNodes.indexOf(ObjectIDs[i]) != -1;
                nodelist.push(fnode);
                UsingObjectIDs.push(ObjectIDs[i]);
            }
        }
        
        //グラフ内で使われているオブジェクトのクラス名の配列
        let allObjectClass: string[] = new Array(UsingObjectIDs.length);
        for (let i = 0; i < UsingObjectIDs.length; i++) {
            allObjectClass[i] = graph.getClass(UsingObjectIDs[i]);
        }

        //重複を除いたクラス名の配列
        let allObjectClassExceptDuplication: string[] = allObjectClass.filter(function (value, index, array) {
            return array.indexOf(value) === index;
        })

        //クラス名ごとに所属するIDを配列にする、IDsSeparateClassは配列の配列
        let IDsSeparateClass: string[][] = new Array(allObjectClassExceptDuplication.length);
        for (let i = 0; i < allObjectClassExceptDuplication.length; i++) {
            IDsSeparateClass[i] = UsingObjectIDs.filter(function (value, index, array) {
                return graph.getClass(value) == allObjectClassExceptDuplication[i];
            })
        }

        //エッジ群の生成
        for (let i = 0; i < UsingObjectIDs.length; i++) {
            //ID1(始点ノード)のIDとクラス
            let ID1: string = UsingObjectIDs[i];

            //ID1の持つフィールドの列
            let fields: string[] = graph.getFields(ID1);
            for (let j = 0; j < fields.length; j++) {
                let fieldname: string = fields[j];
                let ID2: string = graph.getField(ID1, fieldname);
                if (!graph.isLiteral(ID2)) {
                    let node2: FiFA_Node = nodelist[UsingObjectIDs.indexOf(ID2)];
                    let fedge: FiFA_Edge = new FiFA_Edge(nodelist[i], node2, fieldname);
                    edgelist.push(fedge);
                    nodelist[i].f_edges.push(fedge);
                }
            }
        }
        
        //必要なフィールド名
        for (let i = 0; i < edgelist.length; i++) {
            let caf: ClassAndField = new ClassAndField(edgelist[i].ID1class, edgelist[i].ID2class, edgelist[i].name, edgelist[i]);
            let index: number = sameClassAndField_InArray(caf, caflist);
            if (index == -1) {
                caflist.push(caf);
            } else {
                caflist[index].f_edges.push(edgelist[i]);
            }
        }
        necessaryCaFList(graph, caflist, UsingObjectIDs);

        //必要なフィールド名以外のエッジを削除する
        for (let i = edgelist.length - 1; i >= 0; i--) {
            let bool: boolean = false;
            for (let j = 0; j < caflist.length; j++) {
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
            searchCycleGraph(graph, edgelist, UsingObjectIDs, caflist);
        }
        

        //edgelistに理想角度を書き込んでいく
        for (let i = 0; i < caflist.length; i++) {
            for (let j = 0; j < caflist[i].f_edges.length; j++) {
                caflist[i].f_edges[j].id_angle = caflist[i].angle;
            }
        }

        //注目ノードの色を変更する
        for (let i = 0; i < attentionNodes.length; i++) {
            let pink;
            if (graph.getClass(attentionNodes[i]) == "Kanon-ArrayNode") {
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
            } else pink = "hotpink";
            nodelist[UsingObjectIDs.indexOf(attentionNodes[i])].color = pink;
        }

        //極小ノードを生成する
        let notInterestedNodeClusterSort: FiFA_Node[][] = makeMinimalNode(nodelist, edgelist);

        //極小ノードリストからクラスターを生成する
        makeCluster(nodelist, edgelist, clusternodelist, notInterestedNodeClusterSort);

        //クラスターエッジを生成する
        makeClusterEdge(edgelist, clusteredgelist);

        //クラスター間の最短経路長を計算する
        cluster_shortest_path = new Array(clusternodelist.length * clusternodelist.length);
        FloydWarshall_cluster(clusternodelist, clusteredgelist, cluster_shortest_path);

        let shortest_path_max: number = 0;      //最短経路長の最大値
        for (let i = 0; i < cluster_shortest_path.length; i++) {
            if (cluster_shortest_path[i] != clusternodelist.length && cluster_shortest_path[i] > shortest_path_max) {
                shortest_path_max = cluster_shortest_path[i];
            }
        }

        //各グローバル変数の値の計算
        NODEMAXSIZE = NODESIZE + Math.pow(clusternodelist.length, 2 / 3);
        NODEMINSIZE = NODESIZE * (1 + Math.exp(-Math.min(shortest_path_max, clusternodelist.length))) * 2 / 3;
        DISTORTION = shortest_path_max * shortest_path_max / 48;
        
        if (attentionNodes.length > 0) {  //もし注目点があるのならば

            //注目ノードの含まれるクラスターの番号
            let indexes: number[] = new Array();
            for (let i = 0; i < attentionNodes.length; i++) {
                let attendNode: FiFA_Node = nodelist[UsingObjectIDs.indexOf(attentionNodes[i])];
                let attendCluster: FiFA_Cluster_Node = attendNode.cluster;
                indexes.push(clusternodelist.indexOf(attendCluster));
            }
            //各点クラスターにに注目クラスターとの最短経路長を追加
            let maxDistance: number = 0;
            for (let i = 0; i < clusternodelist.length; i++) {
                let minLength: number = clusternodelist.length;
                for (let j = 0; j < indexes.length; j++) {
                    if (minLength > cluster_shortest_path[indexes[j] * clusternodelist.length + i]) {
                        minLength = cluster_shortest_path[indexes[j] * clusternodelist.length + i];
                    }
                }
                if (minLength != clusternodelist.length) {
                    clusternodelist[i].route_length = minLength;
                    if (maxDistance < clusternodelist[i].route_length) {
                        maxDistance = clusternodelist[i].route_length;
                    }
                }
            }

            //注目点との経路長を元に注目点との理想距離を計算
            for (let i = 0; i < clusternodelist.length; i++) {
                if (clusternodelist[i].route_length == 0) {
                    clusternodelist[i].feye_distance = 0;
                } else {
                    clusternodelist[i].feye_distance = (DISTORTION + 1) * maxDistance /
                        (DISTORTION + maxDistance / clusternodelist[i].route_length);
                }
            }
            for (let i = 0; i < clusteredgelist.length; i++) {
                clusteredgelist[i].feye_length(maxDistance, DISTORTION);
                clusteredgelist[i].edge.id_length = clusteredgelist[i].id_length;
            }

            //console.log("edges =");
            //console.log(edges);

            //注目点との距離を元に各点のサイズを追加
            for (let i = 0; i < clusternodelist.length; i++) {
                if (clusternodelist[i].route_length != -1 && maxDistance != 0) {
                    clusternodelist[i].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * clusternodelist[i].feye_distance / maxDistance;
                }
                if (clusternodelist[i].main != null) clusternodelist[i].main.size *= clusternodelist[i].size / NODESIZE;
                for (let j = 0; j < clusternodelist[i].sub.length; j++) {
                    clusternodelist[i].sub[j].size *= clusternodelist[i].size / NODESIZE;
                }
                for (let j = 0; j < clusternodelist[i].f_include_edges.length; j++) {
                    clusternodelist[i].f_include_edges[j].id_length *= clusternodelist[i].size / NODESIZE;
                }
            }
        }

        //プリミティブ型や配列型を参照しているエッジの理想長を短くする
        for (let i = 0; i < clusteredgelist.length; i++) {
            if (clusteredgelist[i].cluster2.main != null) {
                if (clusteredgelist[i].cluster1.main != null) {
                    if (clusteredgelist[i].cluster1.main.cls == "Kanon-ArrayNode" && clusteredgelist[i].name == "ref") {
                        clusteredgelist[i].id_length *= 0.7;
                        clusteredgelist[i].edge.id_length *= 0.7;
                    }
                }
            }
        }

        let edgeListInitEndTime = performance.now();
        console.log("edgeListInit\n   " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    }

    /*
     * 交互参照しているフィールドを発見し、削除する
     */
    function necessaryCaFList(graph: Graph, caflist: ClassAndField[], UsingObjectIDs: string[]) {
        for (let i = caflist.length - 1; i >= 0; i--) {
            let caf1: ClassAndField = caflist[i];
            //console.log("i = " + i);
            //console.log(caf1);
            let near_caf1: ClassAndField[] = new Array();       //caf1と逆の（型）→（型）を持つフィールド名の集合
            for (let j = 0; j < caflist.length; j++) {
                if (caflist[j] != caf1 && caflist[j].parentcls == caf1.childcls && caflist[j].childcls == caf1.parentcls) {
                    near_caf1.push(caflist[j]);
                }
            }
            //console.log("near_caf1 = ");
            //console.log(near_caf1);

            let bool: boolean = false;
            for (let j = 0; j < near_caf1.length; j++) {
                bool = bool || isOverlapping(graph, caf1, near_caf1[j]);
            }
            //console.log("bool = " + bool);

            if (bool && near_caf1.length != 0) {
                caflist.splice(i, 1);
            }
        }

        /*
         * 補助関数
         * 二つのClassAndFieldのx,yを受け取り、xに該当するエッジを全探索する
         * xのエッジが全てyのエッジの逆向きエッジであるならばtrueを返り値として返す
         */
        function isOverlapping(graph: Graph, cafx: ClassAndField, cafy: ClassAndField): boolean {
            let bool: boolean = true;
            for (let i = 0; i < UsingObjectIDs.length; i++) {
                let ID1: string = UsingObjectIDs[i];
                if (graph.getClass(ID1) == cafy.parentcls) {
                    let ID2: string = graph.getField(ID1, cafy.field);
                    if (ID2 != undefined && graph.getClass(ID2) == cafy.childcls) {
                        let nextID: string = graph.getField(ID2, cafx.field);
                        bool = bool && nextID == ID1;
                        if (!bool) break;
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
    function searchCycleGraph(graph: Graph, edgelist: FiFA_Edge[], IDs: string[], arrayField: ClassAndField[]) {

        //閉路上のIDの配列
        let cycleIDs: string[][] = cycleGraphIDs(graph, IDs, arrayField);

        for (let i = 0; i < cycleIDs.length; i++) {
            for (let j = 0; j < cycleIDs[i].length - 1; j++) {
                for (let k = 0; k < edgelist.length; k++) {
                    if (cycleIDs[i][j] == edgelist[k].ID1 && cycleIDs[i][j + 1] == edgelist[k].ID2) {
                        edgelist[k].underforce = false;
                    }
                }
            }
        }


        //補助関数、閉路を探索し、閉路上のIDの配列を返す
        function cycleGraphIDs(graph: Graph, IDs: string[], arrayField: ClassAndField[]): string[][] {
            let cycleIDs: string[][] = new Array();

            let usedIDs: string[] = new Array();        //訪れたことのあるIDを記録

            for (let i = 0; i < IDs.length; i++) {
                if (usedIDs.indexOf(IDs[i]) == -1) {
                    let cycleIDsFromOneID: string[][] = cycleGraphIDsFromOneID(graph, usedIDs, arrayField, IDs[i]);
                    for (let j = 0; j < cycleIDsFromOneID.length; j++) {
                        cycleIDs.push(cycleIDsFromOneID[j]);
                    }
                }
            }

            return cycleIDs;

            //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
            function cycleGraphIDsFromOneID(graph: Graph, usedIDs: string[], arrayField: ClassAndField[], ID: string): string[][] {

                let cycleIDs: string[][] = new Array();

                let stack: string[] = new Array();     //経路を記録するためのスタック

                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, ID);

                return cycleIDs;


                //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                function deep_first_search(graph: Graph, stack: string[], cycleIDs: string[][], usedIDs: string[], arrayField: ClassAndField[], nowID: string) {

                    stack.push(nowID);

                    if (usedIDs.indexOf(nowID) == -1) {      //今いるノードが未訪問ならば訪問した印をつける
                        usedIDs.push(nowID);
                    }

                    for (let i = 0; i < arrayField.length; i++) {
                        let u: string = graph.getField(nowID, arrayField[i].field);
                        if (u != undefined) {
                            if (stack.indexOf(u) == -1) {
                                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                            } else {
                                let cycleInStack: string[] = arraySpliceBoforeIndexOf(u, stack);
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
    function decitionFieldAngle(caflist: ClassAndField[]) {
        let checklist: number[] = new Array(caflist.length);
        for (let i = 0; i < checklist.length; i++) {
            checklist[i] = -1;

        }
        for (let i = 0; i < caflist.length; i++) {
            if (checklist[i] == -1) {
                let cafnumber = 1;
                checklist[i] = 1;
                let from: string = caflist[i].parentcls;
                let to: string = caflist[i].childcls;

                if (from == "Kanon-ArrayNode" && to == "Kanon-ArrayNode") {     //配列ノードの場合
                    if (caflist[i].field == "next") {
                        caflist[i].angle = 0;
                    } else if (caflist[i].field == "ref") {
                        caflist[i].angle = 90;
                    }
                    checklist[i] = 0;
                } else if (from == to) {    //フィールドの指すクラスが元のクラスと同じ場合
                    for (let j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && caflist[j].childcls == to) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    let ii = 0;
                    for (let j = i; j < caflist.length; j++) {
                        if (checklist[j] == 1) {
                            if (cafnumber == 1) {
                                caflist[j].angle = 0;
                            } else {
                                caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                                ii++;
                            }
                            checklist[j] = 0;
                        }
                    }
                } else {    //異なるクラスを指している場合
                    for (let j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && caflist[j].childcls == to) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    let ii = 0;
                    for (let j = i; j < caflist.length; j++) {
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

    /*
     * 興味なしノードをクラスターに分類する
     */
    function makeMinimalNode(nodelist: FiFA_Node[], edgelist: FiFA_Edge[]): FiFA_Node[][] {
        let notInterestNodeClusterSort: FiFA_Node[][] = new Array();        //各クラスター内のノードをx座標の小さい順に並べ替えたもの
        let notInterestedNodes: FiFA_Node[] = new Array();      //興味なしのノード群
        let notInterestedEdges: FiFA_Edge[] = new Array();     //端点が２つとも興味なしのエッジ群

        for (let i = 0; i < nodelist.length; i++) {
            if (!nodelist[i].interested) {  //興味のないノードは
                nodelist[i].size = nodelist[i].size / 8;    //大きさを小さくする
                notInterestedNodes.push(nodelist[i]);
            }
        }

        for (let i = 0; i < edgelist.length; i++) {
            if (!edgelist[i].dot2.interested) {     //エッジのtoノードが興味なしのとき
                if (!edgelist[i].dot1.interested) { //エッジのfromノードも興味なしのとき
                    edgelist[i].id_length = edgelist[i].id_length / 32;
                    notInterestedEdges.push(edgelist[i]);
                } else {
                    edgelist[i].id_length = edgelist[i].id_length / 12;
                }
                edgelist[i].smooth = false;
            }
        }

        //極小ノードをクラスターに分類していく
        let clusterNumber: number[] = new Array(notInterestedNodes.length);
        let clusterEdgeNumber: number[] = new Array(notInterestedEdges.length);
        clusterNumber.fill(-1);
        clusterEdgeNumber.fill(-1);
        let clusterNo: number = 0;
        for (let i = 0; i < notInterestedNodes.length; i++) {
            if (clusterNumber[i] == -1) {
                clusterNumber[i] = clusterNo;
                while (true) {
                    let bool: boolean = false;
                    for (let j = 0; j < notInterestedEdges.length; j++) {
                        let dot1: FiFA_Node = notInterestedEdges[j].dot1;
                        let dot2: FiFA_Node = notInterestedEdges[j].dot2;
                        let cn1: number = clusterNumber[notInterestedNodes.indexOf(dot1)];
                        let cn2: number = clusterNumber[notInterestedNodes.indexOf(dot2)];
                        if (cn1 == clusterNo && cn2 != clusterNo) {
                            clusterNumber[notInterestedNodes.indexOf(dot2)] = clusterNo;
                            clusterEdgeNumber[j] = clusterNo;
                            bool = true;
                        } else if (cn2 == clusterNo && cn1 != clusterNo) {
                            clusterNumber[notInterestedNodes.indexOf(dot1)] = clusterNo;
                            clusterEdgeNumber[j] = clusterNo;
                            bool = true;
                        }
                    }
                    if (!bool) break;
                }
                clusterNo++;
            }
        }

        let notInterestNodeCluster: FiFA_Node[][] = new Array();    //興味なしノードのクラスター
        let notInterestEdgeCluster: FiFA_Edge[][] = new Array();   //興味なしエッジのクラスター
        for (let i = 0; i < clusterNo; i++) {
            let clusterNodeArray: FiFA_Node[] = new Array();
            for (let j = 0; j < clusterNumber.length; j++) {
                if (clusterNumber[j] == i) {
                    clusterNodeArray.push(notInterestedNodes[j]);
                }
            }
            notInterestNodeCluster.push(clusterNodeArray);

            let clusterEdgeArray: FiFA_Edge[] = new Array();
            for (let j = 0; j < clusterEdgeNumber.length; j++) {
                if (clusterEdgeNumber[j] == i) {
                    clusterEdgeArray.push(notInterestedEdges[j]);
                }
            }
            notInterestEdgeCluster.push(clusterEdgeArray);
        }

        for (let i = 0; i < notInterestEdgeCluster.length; i++) {
            let notRootNode: boolean[] = new Array(notInterestNodeCluster[i].length);
            notRootNode.fill(true);
            for (let j = 0; j < notInterestEdgeCluster[i].length; j++) {
                let toNode: FiFA_Node = notInterestEdgeCluster[i][j].dot2;
                notRootNode[notInterestNodeCluster[i].indexOf(toNode)] = false;
            }
            if (notRootNode.indexOf(true) == -1) {      //根のノードがクラスターになかった場合
                notInterestNodeClusterSort.push(notInterestNodeCluster[i]);
            } else {
                let root: FiFA_Node = notInterestNodeCluster[i][notRootNode.indexOf(true)];     //根のノード
                let sortCluster: FiFA_Node[] = new Array();
                edgeAngleSort(root, notInterestEdgeCluster[i], sortCluster);
                notInterestNodeClusterSort.push(sortCluster);


                function edgeAngleSort(node: FiFA_Node, edgeCluster: FiFA_Edge[], sortCluster: FiFA_Node[]) {
                    let edgeArray: FiFA_Edge[] = new Array();
                    for (let i = 0; i < edgeCluster.length; i++) {
                        if (edgeCluster[i].dot1 == node) edgeArray.push(edgeCluster[i]);
                    }

                    if (edgeArray.length == 0) sortCluster.push(node);
                    else {
                        for (let i = 0; i < edgeArray.length; i++) {        //エッジを理想角度の大きさでバブルソートする
                            for (let j = 1; j < edgeArray.length - i; j++) {
                                if (edgeArray[j].id_angle > edgeArray[j - 1].id_angle) {
                                    let temp: FiFA_Edge = edgeArray[j];
                                    edgeArray[j] = edgeArray[j - 1];
                                    edgeArray[j - 1] = temp;
                                }
                            }
                        }
                        let flag: boolean = false;
                        for (let i = 0; i < edgeArray.length; i++) {
                            if (edgeArray[i].id_angle <= 90 && !flag) {
                                sortCluster.push(node);
                                flag = true;
                            }
                            edgeAngleSort(edgeArray[i].dot2, edgeCluster, sortCluster);
                        }
                    }
                }
            }
        }

        for (let i = 0; i < notInterestNodeClusterSort.length; i++) {
            let nodeCluster: FiFA_Node[] = notInterestNodeClusterSort[i];
            let fromClusterEdges: FiFA_Edge[] = new Array();
            for (let j = 0; j < nodeCluster.length; j++) {
                let node: FiFA_Node = nodeCluster[j];
                let fromNodeEdges: FiFA_Edge[] = new Array();
                for (let k = 0; k < edgelist.length; k++) {
                    if (edgelist[k].dot1 == node && edgelist[k].dot2.interested == true) {
                        fromNodeEdges.push(edgelist[k]);
                    }
                }
                for (let k = 0; k < fromNodeEdges.length; k++) {        //バブルソートで並び替え
                    for (let l = 1; l < fromNodeEdges.length - k; l++) {
                        if (fromNodeEdges[l].id_angle > fromNodeEdges[l - 1].id_angle) {
                            let temp: FiFA_Edge = fromNodeEdges[l];
                            fromNodeEdges[l] = fromNodeEdges[l - 1];
                            fromNodeEdges[l - 1] = temp;
                        }
                    }
                }
                Array.prototype.push.apply(fromClusterEdges, fromNodeEdges);
            }
            for (let j = 0; j < fromClusterEdges.length; j++) {
                fromClusterEdges[j].id_angle = 120 - 60 / (fromClusterEdges.length * 2) * (2 * j + 1);
            }
        }

        return notInterestNodeClusterSort;
    }

    /*
     * クラスターノードを生成する
     */
    function makeCluster(nodelist: FiFA_Node[], edgelist: FiFA_Edge[], clusters: FiFA_Cluster_Node[], notInterestedNodeClusterSort: FiFA_Node[][]) {
        let usedInterestNodes: FiFA_Node[] = new Array();
        for (let i = 0; i < notInterestedNodeClusterSort.length; i++) {
            let toClusterEdges: FiFA_Edge[] = new Array();
            for (let j = 0; j < notInterestedNodeClusterSort[i].length; j++) {
                for (let k = 0; k < edgelist.length; k++) {
                    if (edgelist[k].dot2 == notInterestedNodeClusterSort[i][j] && edgelist[k].dot1.interested) toClusterEdges.push(edgelist[k]);
                }
            }
            if (toClusterEdges.length == 0) {
                let cluster: FiFA_Cluster_Node = new FiFA_Cluster_Node(null, notInterestedNodeClusterSort[i]);
                let jnum: number = Math.floor((notInterestedNodeClusterSort[i].length - 1) / 2);
                let centerNode: FiFA_Node = notInterestedNodeClusterSort[i][jnum];
                cluster.init(centerNode.x, centerNode.y);
                clusters.push(cluster);
            } else {
                let mainDot: FiFA_Node = toClusterEdges[0].dot1
                let cluster: FiFA_Cluster_Node = new FiFA_Cluster_Node(mainDot, notInterestedNodeClusterSort[i]);
                cluster.init(mainDot.x, mainDot.y);
                clusters.push(cluster);
                usedInterestNodes.push(mainDot);
            }
        }
        for (let i = 0; i < nodelist.length; i++) {
            if (usedInterestNodes.indexOf(nodelist[i]) == -1 && nodelist[i].interested) {
                let cluster: FiFA_Cluster_Node = new FiFA_Cluster_Node(nodelist[i], []);
                cluster.init(nodelist[i].x, nodelist[i].y);
                clusters.push(cluster);
            }
        }
    }

    /*
     * クラスターエッジを生成する
     */
    function makeClusterEdge(edgelist: FiFA_Edge[], clusteredgelist: FiFA_Cluster_Edge[]) {
        for (let i = 0; i < edgelist.length; i++) {
            let cluster1: FiFA_Cluster_Node = edgelist[i].dot1.cluster;
            let cluster2: FiFA_Cluster_Node = edgelist[i].dot2.cluster;
            if (cluster1 != cluster2) {     //異なるクラスターを結んでいるエッジ
                let clusteredge: FiFA_Cluster_Edge = new FiFA_Cluster_Edge(cluster1, cluster2, edgelist[i]);
                clusteredgelist.push(clusteredge);
                cluster1.f_cluster_edges.push(clusteredge);
            } else {
                cluster1.f_include_edges.push(edgelist[i]);
            }
        }
        //重複するエッジを削除する
        for (let i = clusteredgelist.length - 1; i > 0; i--) {
            let clusteredge1: FiFA_Cluster_Edge = clusteredgelist[i];
            for (let j = 0; j < i; j++) {
                let clusteredge2: FiFA_Cluster_Edge = clusteredgelist[j];
                if (clusteredge1.cluster1 == clusteredge2.cluster1 && clusteredge1.cluster2 == clusteredge2.cluster2) {
                    clusteredgelist.splice(i, 1);
                } else if (clusteredge1.cluster2 == clusteredge2.cluster1 && clusteredge1.cluster1 == clusteredge2.cluster2) {
                    clusteredgelist.splice(i, 1);
                }
            }
        }
    }



    /**********************
     * ノードの座標の計算
     * ********************/

    function calculateLocationWithForceDirectedMethod(graph: Graph, nodelist: FiFA_Node[], edgelist: FiFA_Edge[],
        clusternodelist: FiFA_Cluster_Node[], clusteredgelist: FiFA_Cluster_Edge[], attentionNodes: string[]) {
        let forceDirectedMethodStartTime = performance.now();

        let CLUSTERNUM: number = clusternodelist.length;
        let CEDGENUM: number = clusteredgelist.length;

        //各クラスターの座標の初期化、同じ座標の点同士が存在しないようにする
        do {
            for (let i = 0; i < CLUSTERNUM; i++) {
                clusternodelist[i].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT));
                clusternodelist[i].sub_init(30, 30);
            }
        } while (sameNode_exists(nodelist));

        center_of_gravity(nodelist, clusternodelist, WIDTH, HEIGHT);

        //クラスター隣接行列を用意する
        let cluster_admx: boolean[] = new Array(CLUSTERNUM * CLUSTERNUM);
        cluster_admx.fill(false);
        for (let i = 0; i < CEDGENUM; i++) {
            let c1: number = clusternodelist.indexOf(clusteredgelist[i].cluster1);
            let c2: number = clusternodelist.indexOf(clusteredgelist[i].cluster2);
            cluster_admx[c1 * CLUSTERNUM + c2] = true;
            cluster_admx[c2 * CLUSTERNUM + c1] = true;
        }

        //各クラスター内の隣接行列を用意する
        let ad_matrixes: boolean[][] = new Array(CLUSTERNUM);
        for (let i = 0; i < CLUSTERNUM; i++) {
            let nodeNum: number = clusternodelist[i].quantity();
            ad_matrixes[i] = new Array(nodeNum * nodeNum);
            ad_matrixes[i].fill(false);
            for (let j = 0; j < clusternodelist[i].f_include_edges.length; j++) {
                let dot1: FiFA_Node = clusternodelist[i].f_include_edges[j].dot1;
                let dot2: FiFA_Node = clusternodelist[i].f_include_edges[j].dot2;
                let n1: number = (dot1 == clusternodelist[i].main) ? 0 : clusternodelist[i].sub.indexOf(dot1) + 1;
                let n2: number = (dot2 == clusternodelist[i].main) ? 0 : clusternodelist[i].sub.indexOf(dot2) + 1;
                ad_matrixes[i][n1 * nodeNum + n2] = true;
                ad_matrixes[i][n2 * nodeNum + n1] = true;
            }
        }

        let cs: number = (attentionNodes.length > 0) ? CS : CS * 0.6;
        let cr: number = (attentionNodes.length > 0) ? CR * 0.5 : CR;

        //クラスターを力学モデルで座標移動させていく
        while (true) {
            cluster_force_move();
            if (ct <= 0) break;
        }

        //クラスター内のノードを力学モデルで座標移動させていく
        if (graph.notInterestedClass.length > 0) {
            while (true) {
                force_move();
                if (t <= 0) break;
            }
        }

        //計算を終了し、graphに情報を書き込んでいく
        stopCalculate();




        //FiFAレイアウト手法でクラスターノードを移動させていく
        function cluster_force_move() {

            //各点に働く力を計算
            cluster_focus_calculate(clusternodelist);

            //各点の速度から、次の座標を計算する
            for (let i = 0; i < CLUSTERNUM; i++) {
                let dx: number = clusternodelist[i].dx;
                let dy: number = clusternodelist[i].dy;
                let disp: number = Math.sqrt(dx * dx + dy * dy);

                if (disp != 0) {
                    let d: number = Math.min(disp, ct) / disp;
                    clusternodelist[i].move(dx * d, dy * d);
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
            for (let i = 0; i < CLUSTERNUM; i++) {
                //mainの移動
                if (clusternodelist[i].main != null) {
                    let dx: number = clusternodelist[i].main.dx;
                    let dy: number = clusternodelist[i].main.dy;
                    let disp: number = Math.sqrt(dx * dx + dy * dy);

                    if (disp != 0) {
                        let d: number = Math.min(disp, t) / disp;
                        clusternodelist[i].main.move(dx * d, dy * d);
                    }
                }

                //subの移動
                for (let j = 0; j < clusternodelist[i].sub.length; j++) {
                    let dx: number = clusternodelist[i].sub[j].dx;
                    let dy: number = clusternodelist[i].sub[j].dy;
                    let disp: number = Math.sqrt(dx * dx + dy * dy);

                    if (disp != 0) {
                        let d: number = Math.min(disp, t) / disp;
                        clusternodelist[i].sub[j].move(dx * d, dy * d);
                    }
                }

                //クラスター内のノード座標をクラスター座標に合わせる
                clusternodelist[i].move_only_node();
            }

            //温度パラメータを下げていく
            t -= dt;
        }

        //ばねで繋がれた２点間のスプリング力を計算
        //d:２点間の距離、c:係数、ideal_length:ばねの自然長
        //斥力になる場合は符号がマイナス
        function f_s(d: number, c: number, ideal_length: number): number {
            let ratio: number = d / ideal_length;
            let p: number = Math.max(1, Math.pow(ratio, 1.5)) * Math.log(ratio);
            return c * p;
        }

        //非隣接2点間の斥力を計算
        //d:２点間の距離、c:係数
        function f_r(d: number, c: number): number {
            return c / (d * d);
        }

        //各クラスターの引力・斥力を計算する
        function cluster_focus_calculate(clusternodelist: FiFA_Cluster_Node[]) {

            //各点の速度・力ベクトルを0に初期化
            for (let i = 0; i < CLUSTERNUM; i++) {
                clusternodelist[i].focus_init();
            }

            //エッジの端点に働く角度力とスプリング力を計算
            for (let i = 0; i < clusteredgelist.length; i++) {
                let dx: number = clusteredgelist[i].cluster2.x - clusteredgelist[i].cluster1.x;
                let dy: number = clusteredgelist[i].cluster2.y - clusteredgelist[i].cluster1.y;
                let delta: number = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    let d1size: number = clusteredgelist[i].cluster1.size;
                    let d2size: number = clusteredgelist[i].cluster2.size;

                    if (clusteredgelist[i].underforce == true) {
                        //各点の角度に基づいて働く力を計算
                        let d: number = clusteredgelist[i].angle() - clusteredgelist[i].id_angle; //弧度法から度数法に変更
                        let ddx: number;
                        let ddy: number;
                        let krad: number = clusteredgelist[i].krad * d2size * d1size / (NODESIZE * NODESIZE);
                        let ex: number = krad * dy / delta;     //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        let ey: number = - krad * dx / delta;   //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        if (Math.abs(d) <= 180) {
                            ddx = d * Math.abs(d) * ex;
                            ddy = d * Math.abs(d) * ey;
                        } else {
                            let dd: number = d + 2 * 180;
                            if (d < 0) {
                                ddx = dd * Math.abs(dd) * ex;
                                ddy = dd * Math.abs(dd) * ey;
                            } else {
                                ddx = -dd * Math.abs(dd) * ex;
                                ddy = -dd * Math.abs(dd) * ey;
                            }
                        }
                        clusteredgelist[i].cluster1.fmx += -ddx;
                        clusteredgelist[i].cluster1.fmy += -ddy;
                        clusteredgelist[i].cluster2.fmx += ddx;
                        clusteredgelist[i].cluster2.fmy += ddy;
                    }

                    //２点が辺で繋がっている場合はスプリング力を計算
                    let ds: number = f_s(delta, cs, clusteredgelist[i].id_length) / delta * d2size * d1size / (NODESIZE * NODESIZE);
                    let ddsx: number = dx * ds;
                    let ddsy: number = dy * ds;
                    clusteredgelist[i].cluster2.fax -= ddsx;
                    clusteredgelist[i].cluster2.fay -= ddsy;
                    clusteredgelist[i].cluster1.fax += ddsx;
                    clusteredgelist[i].cluster1.fay += ddsy;
                }
            }

            //各点の斥力を計算
            for (let i = 0; i < CLUSTERNUM; i++) {
                for (let j = i + 1; j < CLUSTERNUM; j++) {
                    if (cluster_admx[i * CLUSTERNUM + j] == false) {
                        let dx: number = clusternodelist[i].x - clusternodelist[j].x;
                        let dy: number = clusternodelist[i].y - clusternodelist[j].y;
                        let delta: number = Math.sqrt(dx * dx + dy * dy);
                        if (delta != 0 && delta < 800) {
                            let d1size: number = clusternodelist[i].size;
                            let d2size: number = clusternodelist[j].size;
                            let d: number = f_r(delta, cr) / delta * d1size * d2size / (NODESIZE * NODESIZE);
                            clusternodelist[i].frx += dx * d;
                            clusternodelist[i].fry += dy * d;
                            clusternodelist[j].frx -= dx * d;
                            clusternodelist[j].fry -= dy * d;
                        }
                    }
                }
            }

            //力ベクトルから速度を求める
            for (let i = 0; i < CLUSTERNUM; i++) {
                clusternodelist[i].init_velocity();
            }
        }

        //各クラスター内でそれぞれのノード間に働く引力・斥力を計算する
        function focus_calculate(clusternodelist: FiFA_Cluster_Node[], nodelist: FiFA_Node[]) {

            //各点の速度・力ベクトルを0に初期化
            for (let i = 0; i < nodelist.length; i++) {
                nodelist[i].focus_init();
            }

            for (let i = 0; i < CLUSTERNUM; i++) {
                let cluster: FiFA_Cluster_Node = clusternodelist[i];
                let smalledgelist: FiFA_Edge[] = cluster.f_include_edges;
                let isMain: number = (cluster.main != null) ? 0 : 1;
                let nodeNum: number = cluster.quantity();
                let includelist: FiFA_Node[] = [cluster.main].concat(cluster.sub);

                //エッジの端点に働く角度力とスプリング力を計算
                for (let j = 0; j < smalledgelist.length; j++) {
                    let dx: number = smalledgelist[j].dot2.x - smalledgelist[j].dot1.x;
                    let dy: number = smalledgelist[j].dot2.y - smalledgelist[j].dot1.y;
                    let delta: number = Math.sqrt(dx * dx + dy * dy);
                    if (delta != 0) {

                        if (smalledgelist[j].underforce == true) {
                            //各点の角度に基づいて働く力を計算
                            let d: number = smalledgelist[j].angle() - smalledgelist[j].id_angle; //弧度法から度数法に変更
                            let ddx: number;
                            let ddy: number;
                            let krad: number = smalledgelist[j].krad / 2;
                            let ex: number = krad * dy / delta;     //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                            let ey: number = - krad * dx / delta;   //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                            if (Math.abs(d) <= 180) {
                                ddx = d * Math.abs(d) * ex;
                                ddy = d * Math.abs(d) * ey;
                            } else {
                                let dd: number = d + 2 * 180;
                                if (d < 0) {
                                    ddx = dd * Math.abs(dd) * ex;
                                    ddy = dd * Math.abs(dd) * ey;
                                } else {
                                    ddx = -dd * Math.abs(dd) * ex;
                                    ddy = -dd * Math.abs(dd) * ey;
                                }
                            }
                            smalledgelist[j].dot1.fmx += -ddx;
                            smalledgelist[j].dot1.fmy += -ddy;
                            smalledgelist[j].dot2.fmx += ddx;
                            smalledgelist[j].dot2.fmy += ddy;
                        }

                        //２点が辺で繋がっている場合はスプリング力を計算
                        let ds: number = f_s(delta, cs, smalledgelist[j].id_length) / delta / 10;
                        let ddsx: number = dx * ds;
                        let ddsy: number = dy * ds;
                        smalledgelist[j].dot2.fax -= ddsx;
                        smalledgelist[j].dot2.fay -= ddsy;
                        smalledgelist[j].dot1.fax += ddsx;
                        smalledgelist[j].dot1.fay += ddsy;
                    }
                }

                //各点の斥力を計算
                for (let j = isMain; j < nodeNum; j++) {
                    for (let k = j + 1; k < nodeNum; k++) {
                        if (ad_matrixes[i][j * nodeNum + k] == false) {
                            let dx: number = includelist[j].x - includelist[k].x;
                            let dy: number = includelist[j].y - includelist[k].y;
                            let delta: number = Math.sqrt(dx * dx + dy * dy);
                            if (delta != 0 && delta < 800) {
                                let d: number = f_r(delta, cr) / delta / 160;
                                includelist[j].frx += dx * d;
                                includelist[j].fry += dy * d;
                                includelist[k].frx -= dx * d;
                                includelist[k].fry -= dy * d;
                            }
                        }
                    }
                }
            }

            //力ベクトルから速度を求める
            for (let i = 0; i < nodelist.length; i++) {
                nodelist[i].init_velocity();
            }
        }

        //計算を終了し、graph変数に情報を書きこんでいく
        function stopCalculate() {

            move_near_center(nodelist, clusternodelist);
            center_of_gravity(nodelist, clusternodelist, 0, 100);

            for (let i = 0; i < UsingObjectIDs.length; i++) {
                graph.setLocation(UsingObjectIDs[i], nodelist[i].x, nodelist[i].y);      //ノードの座標
                graph.setDistance(UsingObjectIDs[i], nodelist[i].route_length);      //ノードの注目点からの距離（デバッグ用）
                graph.setSize(UsingObjectIDs[i], nodelist[i].size);                  //ノードのサイズ
                graph.setColor(UsingObjectIDs[i], nodelist[i].color);

                let label: string = "<b>" + nodelist[i].cls + "</b>";
                for (let x in nodelist[i].literals) {
                    if (nodelist[i].literals.hasOwnProperty(x)) {
                        label = label + "\n <i> " + x + "</i>: " + nodelist[i].literals[x];
                    }
                }
                graph.setLabel(UsingObjectIDs[i], label);
            }

            for (let i = 0; i < edgelist.length; i++) {

                let edge: FiFA_Edge = edgelist[i];
                let dot1ID: string = UsingObjectIDs[nodelist.indexOf(edge.dot1)];
                let dot2ID: string = UsingObjectIDs[nodelist.indexOf(edge.dot2)];
                let edgefontSize: number = edge.dot2.size * STANDARD_EDGEFONTSIZE / NODESIZE;

                //エッジのラベルのサイズ
                graph.setEdgeLabelSize(dot1ID, dot2ID, edgefontSize);
                graph.setEdgeLabelSize(dot2ID, dot1ID, edgefontSize);

                //エッジの太さ
                if (edgefontSize < STANDARD_EDGEFONTSIZE && graph.CustomMode) {
                    graph.setEdgeWidth(dot1ID, dot2ID, edgefontSize / STANDARD_EDGEFONTSIZE * 3);
                    graph.setEdgeWidth(dot2ID, dot1ID, edgefontSize / STANDARD_EDGEFONTSIZE * 3);
                } else {
                    graph.setEdgeWidth(dot1ID, dot2ID, 3);
                    graph.setEdgeWidth(dot2ID, dot1ID, 3);
                }

                //エッジの長さ
                if (!edge.dot2.interested) {
                    graph.setEdgeLength(dot1ID, dot2ID, edge.id_length / 100);
                    graph.setEdgeLength(dot2ID, dot1ID, edge.id_length / 100);
                } else {
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

            let greenEdges: Edge[] = graph.variableEdges;   //緑の矢印の集合
            for (let i = 0; i < greenEdges.length; i++) {
                if (!nodelist[UsingObjectIDs.indexOf(greenEdges[i].to)].interested) {
                    let toNode: FiFA_Node = nodelist[UsingObjectIDs.indexOf(greenEdges[i].to)];
                    let edgefontSize: number = toNode.size * STANDARD_EDGEFONTSIZE / NODESIZE;

                    //エッジのラベルのサイズ
                    //graph.setletiableEdgeLabelSize(greenEdges[i].to, edgefontSize);
                    //エッジの太さ
                    //graph.setletiableEdgeWidth(greenEdges[i].to, 3);
                    //エッジの長さ
                    graph.setVariableEdgeLength(greenEdges[i].to, STANDARD_EDGELENGTH / 100);
                }
            }

            if (attentionNodes.length > 0) {
                for (let i = 0; i < attentionNodes.length; i++) {
                    let node: FiFA_Node = nodelist[UsingObjectIDs.indexOf(attentionNodes[i])];
                    let edgefontSize: number = (node.size - NODEMINSIZE) * 10 / (NODEMAXSIZE - NODEMINSIZE) + STANDARD_EDGEFONTSIZE;
                    graph.setVariableEdgeLabelSize(attentionNodes[i], edgefontSize);     //緑エッジのラベルのサイズ
                }
            }
        }

        //計算後に連結していないノード同士が離れすぎていないように、グループ毎に全体の重心に近づけていく
        function move_near_center(nodelist: FiFA_Node[], clusternodelist: FiFA_Cluster_Node[]) {

            let darray: number[] = new Array(nodelist.length);
            darray.fill(1);

            let groupArray: number[][] = new Array();

            for (let i = 0; i < nodelist.length; i++) {
                if (darray[i] != -1) {
                    let ary: number[] = new Array();
                    ary.push(i);
                    darray[i] = -1;
                    for (j = i + 1; j < nodelist.length; j++) {
                        let n1: number = clusternodelist.indexOf(nodelist[i].cluster);
                        let n2: number = clusternodelist.indexOf(nodelist[j].cluster);
                        if (cluster_shortest_path[n1 * clusternodelist.length + n2] != clusternodelist.length) {
                            ary.push(j);
                            darray[j] = -1;
                        }
                    }
                    groupArray.push(ary);
                }
            }

            if (groupArray.length <= 1) return;

            class Rectangle_Nodes {
                leftX: number;
                rightX: number;
                upY: number;
                downY: number;
                nodeNumber: number;
                nodeArray: number[];
                powerX: number;
                powerY: number;

                constructor(nodeArray: number[]) {
                    this.nodeArray = nodeArray;
                    this.nodeNumber = nodeArray.length;
                    this.calculation();
                    this.powerX = 0;
                    this.powerY = 0;
                }

                calculation() {
                    let left: number = nodelist[this.nodeArray[0]].x;
                    let right: number = nodelist[this.nodeArray[0]].x;
                    let up: number = nodelist[this.nodeArray[0]].y;
                    let down: number = nodelist[this.nodeArray[0]].y;

                    for (let i = 1; i < this.nodeNumber; i++) {
                        if (nodelist[this.nodeArray[i]].x < left) {
                            left = nodelist[this.nodeArray[i]].x;
                        }
                        if (nodelist[this.nodeArray[i]].x > right) {
                            right = nodelist[this.nodeArray[i]].x;
                        }
                        if (nodelist[this.nodeArray[i]].y < up) {
                            up = nodelist[this.nodeArray[i]].y;
                        }
                        if (nodelist[this.nodeArray[i]].y > down) {
                            down = nodelist[this.nodeArray[i]].y;
                        }
                    }

                    this.leftX = left;
                    this.rightX = right;
                    this.upY = up;
                    this.downY = down;
                }

                centerX(): number {
                    return (this.leftX + this.rightX) / 2;
                }

                centerY(): number {
                    return (this.upY + this.downY) / 2;
                }

                diagonal_length(): number {
                    let dx: number = this.rightX - this.leftX;
                    let dy: number = this.downY - this.upY;
                    return Math.max(Math.sqrt(dx * dx + dy * dy) / 2, NODESIZE * 5);
                }

                moveX(mx: number) {
                    for (let i = 0; i < this.nodeNumber; i++) {
                        nodelist[this.nodeArray[i]].x += mx;
                    }
                }

                moveY(my: number) {
                    for (let i = 0; i < this.nodeNumber; i++) {
                        nodelist[this.nodeArray[i]].y += my;
                    }
                }

                resetPower() {
                    this.powerX = 0;
                    this.powerY = 0;
                }
            }

            let groupRectangle: Rectangle_Nodes[] = new Array();
            for (let i = 0; i < groupArray.length; i++) {
                groupRectangle[i] = new Rectangle_Nodes(groupArray[i]);
            }

            let t: number = T;
            let dt: number = T / 1000;

            while (true) {

                //グループにかかるスプリング力を計算
                for (let i = 0; i < groupRectangle.length; i++) {
                    groupRectangle[i].resetPower();
                    for (let j = 0; j < groupRectangle.length; j++) {
                        if (i != j) {
                            let dx: number = groupRectangle[j].centerX() - groupRectangle[i].centerX();
                            let dy: number = groupRectangle[j].centerY() - groupRectangle[i].centerY();
                            let delta: number = Math.sqrt(dx * dx + dy * dy);
                            let ideal_length: number =
                                (groupRectangle[j].diagonal_length() + groupRectangle[i].diagonal_length()) * 1.1;
                            let spower: number = f_s(delta, CS, ideal_length);
                            if (delta != 0) {
                                groupRectangle[i].powerX += dx * spower / delta;
                                groupRectangle[i].powerY += dy * spower / delta;
                            }
                        }
                    }
                }

                //計算した力を元にグループ単位で移動させていく
                for (let i = 0; i < groupRectangle.length; i++) {
                    let dx: number = groupRectangle[i].powerX;
                    let dy: number = groupRectangle[i].powerY;
                    let disp: number = Math.sqrt(dx * dx + dy * dy);

                    if (disp != 0) {
                        let d: number = Math.min(disp, t) / disp;
                        groupRectangle[i].moveX(dx * d);
                        groupRectangle[i].moveY(dy * d);
                    }
                    groupRectangle[i].calculation();
                }

                t -= dt;
                if (t <= 0) break;
            }

            for (let i = 0; i < clusternodelist.length; i++) {
                if (clusternodelist[i].main != null) {
                    clusternodelist[i].x = clusternodelist[i].main.x;
                    clusternodelist[i].y = clusternodelist[i].main.y;
                }
            }
            //console.log(groupRectangle);
        }


        let forceDirectedMethodEndTime = performance.now();
        console.log("forceDirectedMethod\n   " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
    }

    //点の初期配置に重なりが無いかを確かめる
    function sameNode_exists(nodelist: FiFA_Node[]): boolean {
        let bool: boolean = false;

        for (let i = 0; i < nodelist.length - 1; i++) {
            for (let j = i + 1; j < nodelist.length; j++) {
                bool = bool || (nodelist[i].x == nodelist[j].x && nodelist[i].y == nodelist[j].y);
            }
        }
        return bool;
    }

    //クラスター同士の最短経路長を求める
    function FloydWarshall_cluster(clusternodelist: FiFA_Cluster_Node[], clusteredgelist: FiFA_Cluster_Edge[], mtx: number[]) {
        let nodeNum: number = clusternodelist.length;

        for (let i = 0; i < nodeNum; i++) {
            for (let j = 0; j < nodeNum; j++) {
                mtx[i * nodeNum + j] = nodeNum;
            }
            mtx[i * nodeNum + i] = 0;
        }
        for (let i = 0; i < clusteredgelist.length; i++) {
            let one: number = clusternodelist.indexOf(clusteredgelist[i].cluster1);
            let two: number = clusternodelist.indexOf(clusteredgelist[i].cluster2);
            mtx[one * nodeNum + two] = 1;
            mtx[two * nodeNum + one] = 1;
        }
        for (let k = 0; k < nodeNum; k++) {
            for (let i = 0; i < nodeNum; i++) {
                for (let j = 0; j < nodeNum; j++) {
                    if (mtx[i * nodeNum + j] > mtx[i * nodeNum + k] + mtx[k * nodeNum + j]) {
                        mtx[i * nodeNum + j] = mtx[i * nodeNum + k] + mtx[k * nodeNum + j];
                    }
                }
            }
        }
    }

    //グラフの点集合の重心を求め、重心が画面の中心になるように点移動させる
    function center_of_gravity(nodelist: FiFA_Node[], clusternodelist: FiFA_Cluster_Node[], width: number, height: number) {
        if (nodelist.length == 0) return;
        else {
            let cx: number = 0;
            let cy: number = 0;
            for (let i = 0; i < nodelist.length; i++) {
                cx += nodelist[i].x;
                cy += nodelist[i].y;
            }
            cx = cx / nodelist.length;        //重心のx座標
            cy = cy / nodelist.length;        //重心のy座標

            //重心が画面の中央になるように点移動させる
            let dx: number = width / 2 - cx;
            let dy: number = height / 2 - cy;
            for (let i = 0; i < clusternodelist.length; i++) {
                clusternodelist[i].move(dx, dy);
            }
        }
    }


    //注目ノードの特定
    function attentionNodesInit(graph: Graph): string[] {

        let attentionNodes: string[] = new Array();
        let greenEdges: Edge[] = graph.variableEdges;   //緑の矢印の集合
        let bool: boolean = false;
        for (let i = 0; i < greenEdges.length; i++) {
            if (greenEdges[i].label == "this") {
                attentionNodes.push(greenEdges[i].to);
                bool = true;
                break;
            }
        }

        let global_letiables: string[] = graph.getGlobalVariables();    //グローバル変数の集合
        if (/*bool*/true) {
            for (let i = 0; i < greenEdges.length; i++) {
                //ローカル変数の指すノードを拡大表示する
                if (greenEdges[i].label != "this" && global_letiables.indexOf(greenEdges[i].label) == -1) {
                    attentionNodes.push(greenEdges[i].to);
                }
            }
        }

        return attentionNodes;
    }
}