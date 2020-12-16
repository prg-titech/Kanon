﻿//Kanonからgraphオブジェクトを受け取り、graphオブジェクト内のノードの座標を更新する関する（メイン関数）
function setGraphLocation(graph: Graph) {

    /*
     * クラス名とフィールド名をまとめてクラス定義する
     */
    class ClassAndField {
        parentcls: string;
        childcls: string;
        field: string;
        angle: number;
        EwithAs: EdgeWithAngle[];

        constructor(pcls: string, ccls: string, field: string, EwA: EdgeWithAngle) {
            this.parentcls = pcls;
            this.childcls = ccls;
            this.field = field;
            this.angle = 0;
            this.EwithAs = new Array(EwA);
        }
    }

    //角度付きエッジのクラス
    class EdgeWithAngle {
        ID1: string;
        ID2: string;
        fromtype: string;
        totype: string;
        fieldname: string;
        underforce: boolean;
        NIpatternmatch: string;

        constructor(ID1: string, ID2: string, fromtype: string, totype: string, fieldname: string) {
            this.ID1 = ID1;
            this.ID2 = ID2;
            this.fromtype = fromtype;
            this.totype = totype;
            this.fieldname = fieldname;
            this.underforce = true;
            this.NIpatternmatch = "";
        }
    }

    //ClassAndFieldの配列内に引数と同じ値があるかどうかを走査する
    //あった場合は最初の値のindexを、なければ-1を返す
    function sameClassAndField_InArray(caf: ClassAndField, arrayCaf: ClassAndField[]): number {
        //var bool: boolean = false;
        var index: number = -1;

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
    function copyArray(origin: string[]): string[] {
        var array: string[] = new Array(origin.length);
        for (var i = 0; i < origin.length; i++) {
            array[i] = origin[i];
        }
        return array;
    }

    //値から配列の最初のkeyを取得し、keyより前の要素を削除した配列を返す
    function arraySpliceBoforeIndexOf(key: string, array: string[]): string[] {
        var carray: string[] = copyArray(array);
        var index: number = carray.indexOf(key);
        carray.splice(0, index);
        return carray;
    }

    //与えられたエッジオブジェクトが与えられたクラスフィールドに属しているかを判定する
    function edgeIncludeCaF(edge: EdgeWithAngle, caf: ClassAndField) {
        return edge.fromtype == caf.parentcls && edge.totype == caf.childcls && edge.fieldname == caf.field;
    }

    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str: string): boolean {
        return !((str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function"));
    }





    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph: Graph, edgelist: EdgeWithAngle[], caflist: ClassAndField[],
        drawcircle: boolean, edgewithprimitivevalue: boolean, interestNodes: string[]) {
        var edgeListInitStartTime = performance.now();

        //オブジェクトのIDの配列
        var ObjectIDs: string[] = graph.getObjectIDs();

        //グラフ内で使われているオブジェクトのクラス名の配列
        var allObjectClass: string[] = new Array(ObjectIDs.length);
        for (var i = 0; i < ObjectIDs.length; i++) {
            allObjectClass[i] = graph.getClass(ObjectIDs[i]);
        }

        //重複を除いたクラス名の配列
        var allObjectClassExceptDuplication: string[] = allObjectClass.filter(function (value, index, array) {
            return array.indexOf(value) === index;
        })

        //クラス名ごとに所属するIDを配列にする、IDsSeparateClassは配列の配列
        var IDsSeparateClass: string[][] = new Array(allObjectClassExceptDuplication.length);
        for (var i = 0; i < allObjectClassExceptDuplication.length; i++) {
            IDsSeparateClass[i] = ObjectIDs.filter(function (value, index, array) {
                return graph.getClass(value) == allObjectClassExceptDuplication[i];
            })
        }

        for (var i = 0; i < ObjectIDs.length; i++) {
            //ID1(始点ノード)のIDとクラス
            var ID1: string = ObjectIDs[i];
            var ID1type: string = graph.getClass(ID1);

            //ID1の持つフィールドの列
            var fields: string[] = graph.getFields(ID1);
            for (var j = 0; j < fields.length; j++) {
                var fieldname: string = fields[j];
                var ID2: string = graph.getField(ID1, fieldname);
                var ID2type: string = graph.getClass(ID2);
                edgelist.push(new EdgeWithAngle(ID1, ID2, ID1type, ID2type, fieldname));
                if (edgewithprimitivevalue == false) {      //プリミティブ型を指すフィールドエッジに角度力を働かせない
                    edgelist[edgelist.length - 1].underforce = false;
                }
            }
        }

        //必要なフィールド名
        for (var i = 0; i < edgelist.length; i++) {
            var caf: ClassAndField = new ClassAndField(edgelist[i].fromtype, edgelist[i].totype, edgelist[i].fieldname, edgelist[i]);
            var index: number = sameClassAndField_InArray(caf, caflist);
            if (index == -1) {
                caflist.push(caf);
            } else {
                caflist[index].EwithAs.push(edgelist[i]);
            }
        }
        necessaryCaFList(graph, caflist, ObjectIDs);

        //必要なフィールド名以外のエッジを削除する
        for (var i = edgelist.length - 1; i >= 0; i--) {
            var bool: boolean = false;
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
            //for (var i = 0; i < caflist.length; i++) {
            //    if (caflist[i].parentcls == caflist[i].childcls) {
            //        searchCycleGraph(graph, edgelist, ObjectIDs, caflist);
            //    }
            //}
            searchCycleGraph(graph, edgelist, ObjectIDs, caflist);
        }

        //ListInListに対応したアルゴリズム
        for (var i = 0; i < allObjectClassExceptDuplication.length; i++) {
            if (!isPrimitiveString(allObjectClassExceptDuplication[i])) {
                HierarchyAngleDecition(graph, edgelist, caflist, allObjectClassExceptDuplication[i], IDsSeparateClass[i]);
            }
        }

        //色のセット
        //for (var i = 0; i < ObjectIDs.length; i++) {
        //    if (!isPrimitiveString(graph.getClass(ObjectIDs[i]))) {
        //        graph.setColor(ObjectIDs[i], "skyblue");
        //    }
        //}

        //注目ノードの特定
        interestNodesInit(graph, interestNodes, edgelist);

        //注目ノードの色を変更する
        for (var i = 0; i < interestNodes.length; i++) {
            graph.setColor(interestNodes[i], "hotpink");
        }

        var edgeListInitEndTime = performance.now();
        console.log("edgeListInit\n   " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");
    }

    //交互参照しているフィールドを発見し、削除する
    function necessaryCaFList(graph: Graph, caflist: ClassAndField[], ObjectIDs: string[]) {
        for (var i = caflist.length - 1; i >= 0; i--) {
            var caf1: ClassAndField = caflist[i];
            //console.log("i = " + i);
            //console.log(caf1);
            var near_caf1: ClassAndField[] = new Array();       //caf1と逆の（型）→（型）を持つフィールド名の集合
            for (var j = 0; j < caflist.length; j++) {
                if (caflist[j] != caf1 && caflist[j].parentcls == caf1.childcls && caflist[j].childcls == caf1.parentcls) {
                    near_caf1.push(caflist[j]);
                }
            }
            //console.log("near_caf1 = ");
            //console.log(near_caf1);

            var bool: boolean = false;
            for (var j = 0; j < near_caf1.length; j++) {
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
            var bool: boolean = true;
            for (var i = 0; i < ObjectIDs.length; i++) {
                var ID1: string = ObjectIDs[i];
                if (graph.getClass(ID1) == cafy.parentcls) {
                    var ID2: string = graph.getField(ID1, cafy.field);
                    if (ID2 != undefined && graph.getClass(ID2) == cafy.childcls) {
                        var nextID: string = graph.getField(ID2, cafx.field);
                        bool = bool && nextID == ID1;
                        if (!bool) break;
                    }
                }
            }
            return bool && cafx.EwithAs.length >= cafy.EwithAs.length;
        }
    }

    /*
     * 閉路を探索する
     * drawcircleがtrueの場合、閉路上のエッジの角度を全て無効にする
     * drawcircleがfalseの場合、閉路上のエッジを一本削除する
     */
    function searchCycleGraph(graph: Graph, edgelist: EdgeWithAngle[], IDs: string[], arrayField: ClassAndField[]) {

        //閉路上のIDの配列
        var cycleIDs: string[][] = cycleGraphIDs(graph, IDs, arrayField);

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
        function cycleGraphIDs(graph: Graph, IDs: string[], arrayField: ClassAndField[]): string[][] {
            var cycleIDs: string[][] = new Array();

            var usedIDs: string[] = new Array();        //訪れたことのあるIDを記録

            for (var i = 0; i < IDs.length; i++) {
                if (usedIDs.indexOf(IDs[i]) == -1) {
                    var cycleIDsFromOneID: string[][] = cycleGraphIDsFromOneID(graph, usedIDs, arrayField, IDs[i]);
                    for (var j = 0; j < cycleIDsFromOneID.length; j++) {
                        cycleIDs.push(cycleIDsFromOneID[j]);
                    }
                }
            }

            return cycleIDs;

            //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
            function cycleGraphIDsFromOneID(graph: Graph, usedIDs: string[], arrayField: ClassAndField[], ID: string): string[][] {

                var cycleIDs: string[][] = new Array();

                var stack: string[] = new Array();     //経路を記録するためのスタック

                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, ID);

                return cycleIDs;


                //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                function deep_first_search(graph: Graph, stack: string[], cycleIDs: string[][], usedIDs: string[], arrayField: ClassAndField[], nowID: string) {
                    
                    stack.push(nowID);

                    if (usedIDs.indexOf(nowID) == -1) {      //今いるノードが未訪問ならば訪問した印をつける
                        usedIDs.push(nowID);
                    }

                    for (var i = 0; i < arrayField.length; i++) {
                        var u: string = graph.getField(nowID, arrayField[i].field);
                        if (u != undefined) {
                            if (stack.indexOf(u) == -1) {
                                deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                            } else {
                                var cycleInStack: string[] = arraySpliceBoforeIndexOf(u, stack);
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

    //ClassAndFieldの数から各フィールドの角度を決定する
    function decitionFieldAngle(caflist: ClassAndField[]) {
        var checklist: number[] = new Array(caflist.length);
        for (var i = 0; i < checklist.length; i++) {
            checklist[i] = -1;

        }
        for (var i = 0; i < caflist.length; i++) {
            if (checklist[i] == -1) {
                var cafnumber = 1;
                checklist[i] = 1;
                var from: string = caflist[i].parentcls;
                var to: string = caflist[i].childcls;

                if (from == "Kanon-ArrayNode" && to == "Kanon-ArrayNode") {     //配列ノードの場合
                    if (caflist[i].field == "next") {
                        caflist[i].angle = 0;
                    } else if (caflist[i].field == "ref") {
                        caflist[i].angle = 90;
                    }
                    checklist[i] = 0;
                } else if (from == to) {    //フィールドの指すクラスが元のクラスと同じ場合
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
                            } else {
                                caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                                ii++;
                            }
                            checklist[j] = 0;
                        }
                    }
                } else if (isPrimitiveString(to)) {    //プリミティブ型を指している場合
                    for (var j = i + 1; j < caflist.length; j++) {
                        if (caflist[j].parentcls == from && isPrimitiveString(caflist[j].childcls)) {
                            cafnumber++;
                            checklist[j] = 1;
                        }
                    }
                    var ii = 0;
                    for (var j = i; j < caflist.length; j++) {
                        if (checklist[j] == 1) {
                            //caflist[j].angle = 180 - 180 / (cafnumber * 2) * (2 * ii + 1);
                            caflist[j].angle = 120 - 60 / (cafnumber * 2) * (2 * ii + 1);
                            ii++;
                            checklist[j] = 0;
                        }
                    }
                } else {    //異なるクラスを指している場合
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
    function HierarchyAngleDecition(graph: Graph, edgelist: EdgeWithAngle[], caflist: ClassAndField[], cls: string, IDs: string[]) {

        //必要なClassAndFieldの列挙
        var fields: ClassAndField[] = new Array();
        for (var i = 0; i < caflist.length; i++) {
            if (caflist[i].parentcls == cls && caflist[i].childcls == cls) {
                fields.push(caflist[i]);
            }
        }

        //fieldsの中から最も使われているClasssAndFieldを列挙
        var fieldsnumber: number[] = new Array(fields.length);
        for (var i = 0; i < fields.length; i++) {
            fieldsnumber[i] = 0;     //初期化
            for (var j = 0; j < edgelist.length; j++) {
                if (edgelist[j].fromtype == fields[i].parentcls && edgelist[j].fieldname == fields[i].field) {
                    fieldsnumber[i]++;
                }
            }
        }
        var MostUsedField: ClassAndField = fields[fieldsnumber.indexOf(Math.max.apply(null, fieldsnumber))];
        var SubField: ClassAndField = null;
        if (fields.length == 2) {
            if (fields[0] == MostUsedField) {
                SubField = fields[1];
            } else {
                SubField = fields[0];
            }
        } else {
            return;
        }
        //console.log(MostUsedField);
        //console.log(SubField);

        //IDsを連結しているノードの集合に分ける
        var IDsGroup: number[] = new Array(IDs.length);
        for (var i = 0; i < IDsGroup.length; i++) {
            IDsGroup[i] = -1;       //未訪問のノードに該当する番号には-1を代入する
        }
        var GroupNumber: number = -1;
        for (var i = 0; i < IDsGroup.length; i++) {
            if (IDsGroup[i] == -1) {
                GroupNumber++;
                IDsGroup[i] = GroupNumber;
                var ID: string = IDs[i];
                depth_first_search(ID, GroupNumber);

                //補助関数
                function depth_first_search(ID: string, GroupNumber: number) {
                    for (var j = 0; j < fields.length; j++) {
                        var ID2: string = graph.getField(ID, fields[j].field);
                        if (IDsGroup[IDs.indexOf(ID2)] == -1 || IDsGroup[IDs.indexOf(ID2)] != GroupNumber) {
                            IDsGroup[IDs.indexOf(ID2)] = GroupNumber;
                            depth_first_search(ID2, GroupNumber);
                        }
                    }
                }
            }
        }
        var connectedGraph: string[][] = new Array(GroupNumber + 1);
        for (var i = 0; i < connectedGraph.length; i++) {
            connectedGraph[i] = new Array();
        }
        for (var i = 0; i < IDsGroup.length; i++) {
            connectedGraph[IDsGroup[i]].push(IDs[i]);
        }

        //クラスオブジェクトの中から始点を見つける
        var startNodes: string[] = new Array(connectedGraph.length);
        for (var i = 0; i < startNodes.length; i++) {
            startNodes[i] = search_start_node(connectedGraph[i]);
        }
        //補助関数：始点を探す
        function search_start_node(IDs: string[]): string {
            var referedNumber: number[] = new Array(IDs.length);      //ノードごとに参照されているエッジの数を記録する
            for (var i = 0; i < referedNumber.length; i++) {
                referedNumber[i] = 0;
            }

            //クラスオブジェクトの中から始点を見つける
            for (var i = 0; i < IDs.length; i++) {
                var ID: string = IDs[i];
                for (var j = 0; j < edgelist.length; j++) {
                    if (edgelist[j].ID2 == ID) {
                        referedNumber[i]++;
                    }
                }
            }
            var min: number = Math.min.apply(null, referedNumber);
            var rootID: string = IDs[referedNumber.indexOf(min)];
            return rootID;
        }

        //console.log(cls);
        //console.log(startNodes);

    }


    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph: Graph, edgeWithAngleList: EdgeWithAngle[],
        caflist: ClassAndField[], interestNodes: string[]) {
        var forceDirectedMethodStartTime = performance.now();

        var graphInitializationStartTime = performance.now();

        var ObjectIDs: string[] = graph.getObjectIDs();     //オブジェクトのIDの配列
        var DOTNUMBER: number = ObjectIDs.length;       //ノード数
        var EDGENUMBER: number = edgeWithAngleList.length;      //エッジ数

        var WIDTH: number = 1280;    //表示する画面の横幅
        var HEIGHT: number = 720;     //表示する画面の縦幅
        var CS: number = 150;   //スプリング力に係る係数
        var CR: number = 150000;   //斥力に係る係数
        var KRAD: number = 0.5;      //角度に働く力の係数(弧度法から度数法に変更)
        var ITERATION: number = 3000;        //反復回数
        var T: number = Math.max(WIDTH, HEIGHT);         //温度パラメータ
        var t: number = T;
        var dt: number = T / (ITERATION);

        //フロイドワーシャル法で各点同士の最短経路長を求める
        var dddd: number[] = new Array(DOTNUMBER * DOTNUMBER);
        FloydWarshall(DOTNUMBER, EDGENUMBER, dddd);
        var ddddMax: number = 0;    //最短経路長の最大値
        for (var i = 0; i < dddd.length; i++) {
            if (dddd[i] != DOTNUMBER && dddd[i] > ddddMax) ddddMax = dddd[i];
        }

        var NODESIZE: number = 15;
        var NODEMAXSIZE: number = NODESIZE + Math.pow(DOTNUMBER, 2 / 3);   //ノードの大きさの最大値
        var NODEMINSIZE: number = NODESIZE * (1 + Math.exp(-Math.min(ddddMax, DOTNUMBER))) * 2 / 3;
        var NODEMAXSIZE_literal: number = NODEMAXSIZE * 2 / 3;
        var NODEMINSIZE_literal: number = NODEMINSIZE * 2 / 3;
        /*
         * 参考：デフォルトのノードの大きさ
         *  クラスオブジェクト 15
         *  リテラルオブジェクト 10
         */
        var STANDARD_EDGELENGTH: number = 130;
        var STANDARD_EDGEFONTSIZE: number = 14;

        var DISTORTION: number = 0 + ddddMax * ddddMax / 48;     //歪み変数


        //点のクラス
        class Dot_G {
            x: number;
            y: number;
            dx: number;     //速度のx成分
            dy: number;     //速度のy成分
            fax: number;    //引力のx成分
            fay: number;    //引力のy成分
            frx: number;    //斥力のx成分
            fry: number;    //斥力のy成分
            fmx: number;    //モーメントのx成分
            fmy: number;    //モーメントのy成分
            nodenum: number | string;    //点をノードと見なした時の中身の変数
            nodecls: string;            //点をノードと見なした時のクラス名
            route_length: number;   //注目点との距離
            size: number;       //ノードの大きさ
            feye_distance: number;  //注目点との魚眼レイアウトでの理想距離
            isLiteral: boolean;     //プリミティブ型かどうか
            interested: boolean;    //ユーザーがこのノードに興味があるか（ないと縮小表示される）

            //点の初期化
            init(x: number, y: number, cls: string) {
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
                this.route_length = -1;
                this.size = NODESIZE;
                this.feye_distance = -1;
                this.isLiteral = isPrimitiveString(cls);
                this.interested = true;
            }

            //点に働く力から速度を求める
            init_velocity() {
                this.dx = this.fax + this.frx + this.fmx;
                this.dy = this.fay + this.fry + this.fmy;
            }

            //点の速度
            velocity(): number {
                return Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            }

            //力のベクトルの描画
            //drawForceVector() {
            //    context.strokeStyle = "rgba(255, 0, 0, 0.5)";
            //    context.fillStyle = "rgba(255, 0, 0, 0.5)";
            //    draw_vector(this.x, this.y, this.fax, this.fay);    //引力ベクトルは赤で表示
            //    context.strokeStyle = "rgba(0, 255, 0, 0.5)";
            //    context.fillStyle = "rgba(0, 255, 0, 0.5)";
            //    draw_vector(this.x, this.y, this.frx, this.fry);    //斥力ベクトルは緑で表示
            //    context.strokeStyle = "rgba(0, 0, 255, 0.5)";
            //    context.fillStyle = "rgba(0, 0, 255, 0.5)";
            //    draw_vector(this.x, this.y, this.fmx, this.fmy);    //角度力ベクトルは青で表示
            //}
        }

        //補助クラス、ベクトルのクラス
        class Vector_G {
            x: number;
            y: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
            }

            //２ベクトルの加算
            sum(vec2: Vector_G): Vector_G {
                return new Vector_G(this.x + vec2.x, this.y + vec2.y);
            }

            //ベクトルの角度を計算する
            angle(): number {
                var angle: number = Math.atan2(this.y, this.x) * 180 / Math.PI;
                return angle;
            }
        }

        //辺のクラス
        class Edge_G {
            dot1: Dot_G;
            dot2: Dot_G;
            dot1cls: string;
            dot2cls: string;
            edgename: string;   //エッジの名前（フィールド名）
            ideal_length: number;   //エッジの理想長
            krad: number;       //エッジの角度に対して働く力の係数
            smooth: boolean;    //ベジェ曲線で描くかどうか

            //辺の初期化
            init(dot1: Dot_G, dot2: Dot_G, edgename: string) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.dot1cls = dot1.nodecls;
                this.dot2cls = dot2.nodecls;
                this.edgename = edgename;
                this.ideal_length = STANDARD_EDGELENGTH;
                this.krad = KRAD;
                this.smooth = true;
            }

            //エッジの長さ（2点間の距離）を求める
            length(): number {
                var xl: number = this.dot1.x - this.dot2.x;
                var yl: number = this.dot1.y - this.dot2.y;

                return Math.sqrt(xl * xl + yl * yl);
            }

            //エッジの理想の長さを求め、ideal_lengthに上書きする
            feye_length() {
                var id1: number = this.dot1.feye_distance;
                var id2: number = this.dot2.feye_distance;

                if (id1 != id2) {
                    this.ideal_length = Math.abs(id1 - id2) * STANDARD_EDGELENGTH;
                }
            }

            //エッジの角度を計算する
            angle(): number {
                var dx: number = this.dot2.x - this.dot1.x;
                var dy: number = this.dot2.y - this.dot1.y;
                var delta: number = Math.sqrt(dx * dx + dy * dy);
                var angle: number = Math.atan2(dy, dx) * 180 / Math.PI;
                return angle;
            }

            //エッジと同じ角度の単位ベクトルを返す
            unitVector(): Vector_G {
                var dx: number = this.dot2.x - this.dot1.x;
                var dy: number = this.dot2.y - this.dot1.y;
                var delta: number = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    return new Vector_G(dx / delta, dy / delta);
                } else {
                    return new Vector_G(0, 0);
                }
            }
        }

        //グラフのクラス
        class Graph_G {
            dot_number: number;
            edge_number: number;
            edges: Edge_G[];
            dots: Dot_G[];

            //グラフの初期化
            init(dn: number, en: number, edges: Edge_G[], dots: Dot_G[]) {
                this.dot_number = dn;
                this.edge_number = en;
                this.edges = edges;
                this.dots = dots;
            }

            //グラフの全てのエッジの長さの合計を出す
            sum_length(): number {
                var gl: number = 0;
                for (var i = 0; i < this.edge_number; i++) {
                    gl += this.edges[i].length();
                }

                return gl;
            }

            //力のベクトルの描画
            //drawForceVector() {
            //    for (var i = 0; i < this.dots.length; i++) {
            //        this.dots[i].drawForceVector();
            //    }
            //}
        }

        //各点の用意、座標は適切に初期化し、同じ座標の点同士が存在しないようにする
        var dots: Dot_G[] = new Array(DOTNUMBER);
        for (var i = 0; i < DOTNUMBER; i++) {
            dots[i] = new Dot_G();
        }
        do {
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), graph.getClass(ObjectIDs[i]));
                //dots[i].init(WIDTH / 2 + Math.min(WIDTH, HEIGHT) * 0.7 * Math.cos(Math.PI * 2 * i / DOTNUMBER), HEIGHT / 2 + Math.sin(Math.PI * 2 * i / DOTNUMBER), graph.getClass(ObjectIDs[i]));
            }
        } while (sameDot_exists(dots, DOTNUMBER));

        //各辺の用意
        var edges: Edge_G[] = new Array(EDGENUMBER);
        for (var i = 0; i < EDGENUMBER; i++) {
            edges[i] = new Edge_G();
            edges[i].init(dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID1)], dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID2)], edgeWithAngleList[i].fieldname);
        }

        //グラフの用意
        var graph_g = new Graph_G();
        graph_g.init(DOTNUMBER, EDGENUMBER, edges, dots);

        center_of_gravity(dots, WIDTH, HEIGHT);


        if (graph.CustomMode) {    //カスタムモードのとき

            for (var i = 0; i < DOTNUMBER; i++) {
                if (graph.notInterestedClass.indexOf(dots[i].nodecls) != -1) {  //興味のないノードは
                    dots[i].interested = false;
                    dots[i].size = NODESIZE / 8;    //大きさを小さくする
                }
            }
            for (var i = 0; i < EDGENUMBER; i++) {
                if (graph.notInterestedClass.indexOf(edges[i].dot2cls) != -1) {     //エッジのtoノードが興味なしのとき
                    if (graph.notInterestedClass.indexOf(edges[i].dot1cls) != -1) { //エッジのfromノードも興味ないとき
                        edges[i].ideal_length = STANDARD_EDGELENGTH / 24;
                    } else {
                        edges[i].ideal_length = STANDARD_EDGELENGTH / 6;
                    }
                    edges[i].smooth = false;
                } else {
                    if (graph.notInterestedClass.indexOf(edges[i].dot1cls) != -1) {
                        edges[i].krad = KRAD / 4;
                        if (isPrimitiveString(edges[i].dot2cls)) {
                            edges[i].dot2.interested = false;
                            edges[i].dot2.size = NODESIZE / 8;
                            edges[i].ideal_length = STANDARD_EDGELENGTH / 24;
                            edges[i].smooth = false;
                        }
                    }
                }
            }
        } else if (interestNodes.length > 0) {  //もし注目点があるのならば

            //注目点の番号
            var indexes: number[] = new Array();
            for (var i = 0; i < interestNodes.length; i++) {
                indexes.push(ObjectIDs.indexOf(interestNodes[i]));
            }
            //各点に注目点との最短経路長を追加
            var maxDistance: number = 0;
            for (var i = 0; i < DOTNUMBER; i++) {
                var minLength: number = DOTNUMBER;
                for (var j = 0; j < indexes.length; j++) {
                    if (minLength > dddd[indexes[j] * DOTNUMBER + i]) {
                        minLength = dddd[indexes[j] * DOTNUMBER + i];
                    }
                }
                //var arr: number[] = new Array();
                //for (var j = 0; j < indexes.length; j++) {
                //    arr.push(dddd[indexes[j] * DOTNUMBER + i]);
                //}
                //var minLength: number = Math.min(...arr);
                if (minLength != DOTNUMBER) {
                    dots[i].route_length = minLength;
                    if (maxDistance < dots[i].route_length) {
                        maxDistance = dots[i].route_length;
                    }
                }
            }

            //注目点との経路長を元に注目点との理想距離を計算
            for (var i = 0; i < DOTNUMBER; i++) {
                if (dots[i].route_length == 0) {
                    dots[i].feye_distance = 0;
                } else {
                    dots[i].feye_distance = (DISTORTION + 1) * maxDistance /
                        (DISTORTION + maxDistance / dots[i].route_length);
                }
            }
            for (var i = 0; i < EDGENUMBER; i++) {
                edges[i].feye_length();
            }

            //console.log("edges =");
            //console.log(edges);

            //注目点との距離を元に各点のサイズを追加
            for (var i = 0; i < DOTNUMBER; i++) {
                if (dots[i].route_length != -1 && maxDistance != 0) {
                    //if (dots[i].isLiteral) {
                    //    dots[i].size = NODEMAXSIZE_literal - (NODEMAXSIZE_literal - NODEMINSIZE_literal) * dots[i].distance / maxDistance;
                    //} else {
                    //    dots[i].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * dots[i].distance / maxDistance;
                    //}
                    dots[i].size = NODEMAXSIZE - (NODEMAXSIZE - NODEMINSIZE) * dots[i].feye_distance / maxDistance;
                }
            }
        }
        var cs: number = (interestNodes.length > 0) ? CS : CS * 0.6;
        var cr: number = (interestNodes.length > 0) ? CR * 0.5 : CR;

        //プリミティブ型や配列型を参照しているエッジの理想長を短くする
        for (var i = 0; i < EDGENUMBER; i++) {
            if (edges[i].dot2.isLiteral || (edges[i].dot1cls == "Array" && edges[i].edgename == "ref")) {
                edges[i].ideal_length *= 0.7;
            }
        }

        //隣接行列を用意する
        var adjacency_matrix: number[][] = new Array(DOTNUMBER);
        for (var i = 0; i < DOTNUMBER; i++) {
            adjacency_matrix[i] = new Array(DOTNUMBER);
            adjacency_matrix[i].fill(-1);
            adjacency_matrix[i][i] = 0;
        }
        for (var i = 0; i < EDGENUMBER; i++) {
            var d1: number = dots.indexOf(edges[i].dot1);
            var d2: number = dots.indexOf(edges[i].dot2);
            adjacency_matrix[d1][d2] = 1;
            adjacency_matrix[d2][d1] = 1;
        }

        var graphInitializationEndTime = performance.now();
        console.log("graphInitialization\n   " + (graphInitializationEndTime - graphInitializationStartTime) + " ms");

        var focusCalculationTime = 0;
        var spring_angleCalcTime = 0;
        var repulsiveCalcTime = 0;

        //温度パラメータが0以下になるまで安定状態を探索する
        while (true) {
            draw();
            if (t <= 0) break;
        }
        console.log("focusCalculation\n   " + focusCalculationTime + " ms");
        console.log(" spring and angle\n   " + spring_angleCalcTime + " ms");
        console.log(" repulsive\n   " + repulsiveCalcTime + " ms");

        //fruchterman-Reingold法でエネルギーを最小化し、グラフを描画する
        function draw() {

            //相対角度で描画する場合
            if (RelativeAngle) {

                //各エッジの平均角度を求める
                for (var i = 0; i < caflist.length; i++) {
                    var vectorSum: Vector_G = new Vector_G(0, 0);
                    var edgeNum: number = 0;
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
                var dx: number = dots[i].dx;
                var dy: number = dots[i].dy;
                var disp: number = Math.sqrt(dx * dx + dy * dy);

                if (disp != 0) {
                    var d: number = Math.min(disp, t) / disp;
                    dots[i].x += dx * d;
                    dots[i].y += dy * d;
                }
            }

            //重心が画面の中央になるように調整する
            center_of_gravity(dots, WIDTH, HEIGHT);

            //温度パラメータを下げていく、0を下回ったら終了
            t -= dt;
            if (t <= 0) stopCalculate();
        }

        //計算を終了し、graph変数に情報を書きこんでいく
        function stopCalculate() {

            move_near_center(dots);
            center_of_gravity(dots, 0, 100);

            for (var i = 0; i < ObjectIDs.length; i++) {
                graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);      //ノードの座標
                graph.setDistance(ObjectIDs[i], dots[i].route_length);      //ノードの注目点からの距離（デバッグ用）
                graph.setSize(ObjectIDs[i], dots[i].size);                  //ノードのサイズ
            }

            for (var i = 0; i < EDGENUMBER; i++) {

                var edge: Edge_G = edges[i];
                var dot1ID: string = ObjectIDs[dots.indexOf(edge.dot1)];
                var dot2ID: string = ObjectIDs[dots.indexOf(edge.dot2)];
                //var edgefontSize: number = (edge.dot2.size - NODESIZE) * 10 / (NODEMAXSIZE - NODEMINSIZE) + STANDARD_EDGEFONTSIZE;
                var edgefontSize: number = edge.dot2.size * STANDARD_EDGEFONTSIZE / NODESIZE;

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
                    graph.setEdgeLength(dot1ID, dot2ID, edge.ideal_length / 100);
                    graph.setEdgeLength(dot2ID, dot1ID, edge.ideal_length / 100);
                } else {
                    graph.setEdgeLength(dot1ID, dot2ID, edge.ideal_length / 2);
                    graph.setEdgeLength(dot2ID, dot1ID, edge.ideal_length / 2);
                }

                //ベジェ曲線で描くかどうか
                graph.setEdgeSmooth(dot1ID, dot2ID, edge.smooth);
                graph.setEdgeSmooth(dot2ID, dot1ID, edge.smooth);
                if (edge.dot1cls == "Kanon-ArrayNode" && edge.dot2cls == "Kanon-ArrayNode" && (edge.edgename == "next" || edge.edgename == "")) {
                    graph.setEdgeSmooth(dot1ID, dot2ID, false);
                }
            }

            var greenEdges: Edge[] = graph.variableEdges;   //緑の矢印の集合
            for (var i = 0; i < greenEdges.length; i++) {
                if (!dots[ObjectIDs.indexOf(greenEdges[i].to)].interested) {
                    var edgefontSize: number = edge.dot2.size * STANDARD_EDGEFONTSIZE / NODESIZE;

                    //エッジのラベルのサイズ
                    //graph.setVariableEdgeLabelSize(greenEdges[i].to, edgefontSize);
                    //エッジの太さ
                    //graph.setVariableEdgeWidth(greenEdges[i].to, 3);
                    //エッジの長さ
                    graph.setVariableEdgeLength(greenEdges[i].to, STANDARD_EDGELENGTH / 100);
                }
            }

            if (interestNodes.length > 0) {
                for (var i = 0; i < interestNodes.length; i++) {
                    var node: Dot_G = dots[ObjectIDs.indexOf(interestNodes[i])];
                    var edgefontSize: number = (node.size - NODEMINSIZE) * 10 / (NODEMAXSIZE - NODEMINSIZE) + STANDARD_EDGEFONTSIZE;
                    graph.setVariableEdgeLabelSize(interestNodes[i], edgefontSize);     //緑エッジのラベルのサイズ
                }
            }
        }



        //点の初期配置に重なりが無いかを確かめる
        function sameDot_exists(dots: Dot_G[], dn: number): boolean {
            var bool: boolean = false;

            for (var i = 0; i < dn - 1; i++) {
                for (var j = i + 1; j < dn; j++) {
                    bool = bool || (dots[i].x == dots[j].x && dots[i].y == dots[j].y);
                }
            }
            return bool;
        }

        //ばねで繋がれた２点間のスプリング力を計算
        //d:２点間の距離、c:係数、ideal_length:ばねの自然長
        //斥力になる場合は符号がマイナス
        function f_s(d: number, c: number, ideal_length: number): number {
            let ratio: number = d / ideal_length;
            //let p: number = (ratio < 1) ? Math.log(ratio) : ratio * Math.sqrt(ratio);
            let p: number = Math.max(1, Math.pow(ratio, 1.5)) * Math.log(ratio);
            return c * p;
        }

        //非隣接2点間の斥力を計算
        //d:２点間の距離、c:係数
        function f_r(d: number, c: number): number {
            return c / (d * d);
        }

        //各点の引力・斥力を計算し、Dot[]に代入していく
        function focus_calculate(dots: Dot_G[]) {
            var focusCalculationStartTime = performance.now();

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

            var spring_angleCalcStartTime = performance.now();
            //エッジの端点に働く角度力とスプリング力を計算
            for (var i = 0; i < EDGENUMBER; i++) {
                if (edgeWithAngleList[i].underforce == true) {
                    var angle: number = edges[i].angle();
                    for (var j = 0; j < caflist.length; j++) {
                        if (edgeIncludeCaF(edgeWithAngleList[i], caflist[j])) {
                            var dx: number = edges[i].dot2.x - edges[i].dot1.x;
                            var dy: number = edges[i].dot2.y - edges[i].dot1.y;
                            var delta: number = Math.sqrt(dx * dx + dy * dy);
                            if (delta != 0) {

                                //各点の角度に基づいて働く力を計算
                                var d: number = angle - caflist[j].angle; //弧度法から度数法に変更
                                var ddx: number;
                                var ddy: number;
                                var krad: number = edges[i].krad * edges[i].dot2.size * edges[i].dot1.size / (NODESIZE * NODESIZE);
                                var ex: number = krad * dy / delta;     //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                                var ey: number = - krad * dx / delta;   //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                                if (Math.abs(d) <= 180) {
                                    ddx = d * Math.abs(d) * ex;
                                    ddy = d * Math.abs(d) * ey;
                                } else {
                                    var dd: number = d + 2 * 180;
                                    if (d < 0) {
                                        ddx = dd * Math.abs(dd) * ex;
                                        ddy = dd * Math.abs(dd) * ey;
                                    } else {
                                        ddx = -dd * Math.abs(dd) * ex;
                                        ddy = -dd * Math.abs(dd) * ey;
                                    }
                                }
                                edges[i].dot1.fmx += -ddx;
                                edges[i].dot1.fmy += -ddy;
                                edges[i].dot2.fmx += ddx;
                                edges[i].dot2.fmy += ddy;

                                //２点が辺で繋がっている場合はスプリング力を計算
                                var ds: number = f_s(delta, cs, edges[i].ideal_length) / delta * edges[i].dot2.size * edges[i].dot1.size / (NODESIZE * NODESIZE);
                                var ddsx: number = dx * ds;
                                var ddsy: number = dy * ds;
                                edges[i].dot2.fax -= ddsx;
                                edges[i].dot2.fay -= ddsy;
                                edges[i].dot1.fax += ddsx;
                                edges[i].dot1.fay += ddsy;
                            }
                        }
                    }
                }
            }
            var spring_angleCalcEndTime = performance.now();
            spring_angleCalcTime += spring_angleCalcEndTime - spring_angleCalcStartTime;

            var repulsiveCalcStartTime = performance.now();
            //各点の斥力を計算
            for (var i = 0; i < DOTNUMBER; i++) {
                for (var j = i + 1; j < DOTNUMBER; j++) {
                    if (adjacency_matrix[i][j] == -1) {
                        var dx: number = dots[i].x - dots[j].x;
                        var dy: number = dots[i].y - dots[j].y;
                        var delta: number = Math.sqrt(dx * dx + dy * dy);
                        var bool1: boolean = dots[i].interested;
                        var bool2: boolean = dots[j].interested;
                        if (delta != 0 && (bool1 && bool2) && delta < 800) {
                            //var d: number = f_r(delta, cr) / delta;
                            var d: number = f_r(delta, cr) / delta * dots[i].size * dots[j].size / (NODESIZE * NODESIZE);
                            dots[i].frx += dx * d;
                            dots[i].fry += dy * d;
                            dots[j].frx -= dx * d;
                            dots[j].fry -= dy * d;
                        }
                    }
                }
            }
            var repulsiveCalcEndTime = performance.now();
            repulsiveCalcTime += repulsiveCalcEndTime - repulsiveCalcStartTime;

            //力ベクトルから速度を求める
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init_velocity();
            }

            var focusCalculationEndTime = performance.now();
            focusCalculationTime += focusCalculationEndTime - focusCalculationStartTime;
        }

        //ベクトルを画面に表示する
        function draw_vector(x: number, y: number, dx: number, dy: number) {
            var x1: number = x;
            var y1: number = y;
            var x2: number = x1 + dx;
            var y2: number = y1 + dy;
            var x3: number = x2 + (-dx - dy) / 12;
            var y3: number = y2 + (dx - dy) / 12;
            var x4: number = x2 + (-dx + dy) / 12;
            var y4: number = y2 + (-dx - dy) / 12;

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
        function center_of_gravity(dots: Dot_G[], width: number, height: number) {
            var cx: number = 0;
            var cy: number = 0;
            for (var i = 0; i < DOTNUMBER; i++) {
                cx += dots[i].x;
                cy += dots[i].y;
            }
            cx = cx / DOTNUMBER;        //重心のx座標
            cy = cy / DOTNUMBER;        //重心のy座標

            //重心が画面の中央になるように点移動させる
            var dx: number = width / 2 - cx;
            var dy: number = height / 2 - cy;
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].x += dx;
                dots[i].y += dy;
            }
        }

        //計算後に連結していないノード同士が離れすぎていないように、グループ毎に全体の重心に近づけていく
        function move_near_center(dots: Dot_G[]) {

            var darray: number[] = new Array(DOTNUMBER);
            for (var i = 0; i < DOTNUMBER; i++) {
                darray[i] = 1;      //初期化
            }

            var groupArray: number[][] = new Array();

            for (var i = 0; i < DOTNUMBER; i++) {
                if (darray[i] != -1) {
                    var ary: number[] = new Array();
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
                    var left: number = dots[this.nodeArray[0]].x;
                    var right: number = dots[this.nodeArray[0]].x;
                    var up: number = dots[this.nodeArray[0]].y;
                    var down: number = dots[this.nodeArray[0]].y;

                    for (var i = 1; i < this.nodeNumber; i++) {
                        if (dots[this.nodeArray[i]].x < left) {
                            left = dots[this.nodeArray[i]].x;
                        }
                        if (dots[this.nodeArray[i]].x > right) {
                            right = dots[this.nodeArray[i]].x;
                        }
                        if (dots[this.nodeArray[i]].y < up) {
                            up = dots[this.nodeArray[i]].y;
                        }
                        if (dots[this.nodeArray[i]].y > down) {
                            down = dots[this.nodeArray[i]].y;
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
                    var dx: number = this.rightX - this.leftX;
                    var dy: number = this.downY - this.upY;
                    return Math.sqrt(dx * dx + dy * dy) / 2;
                }

                moveX(mx: number) {
                    for (var i = 0; i < this.nodeNumber; i++) {
                        dots[this.nodeArray[i]].x += mx;
                    }
                }

                moveY(my: number) {
                    for (var i = 0; i < this.nodeNumber; i++) {
                        dots[this.nodeArray[i]].y += my;
                    }
                }

                resetPower() {
                    this.powerX = 0;
                    this.powerY = 0;
                }
            }

            var groupRectangle: Rectangle_Nodes[] = new Array();
            for (var i = 0; i < groupArray.length; i++) {
                groupRectangle[i] = new Rectangle_Nodes(groupArray[i]);
            }

            var t: number = T;
            var dt: number = T / 1000;

            while (true) {

                //グループにかかるスプリング力を計算
                for (var i = 0; i < groupRectangle.length; i++) {
                    groupRectangle[i].resetPower();
                    for (var j = 0; j < groupRectangle.length; j++) {
                        if (i != j) {
                            var dx: number = groupRectangle[j].centerX() - groupRectangle[i].centerX();
                            var dy: number = groupRectangle[j].centerY() - groupRectangle[i].centerY();
                            var delta: number = Math.sqrt(dx * dx + dy * dy);
                            var ideal_length: number =
                                (groupRectangle[j].diagonal_length() + groupRectangle[i].diagonal_length()) * 1.1;
                            var spower: number = f_s(delta, CS, ideal_length);
                            if (delta != 0) {
                                groupRectangle[i].powerX += dx * spower / delta;
                                groupRectangle[i].powerY += dy * spower / delta;
                            }
                        }
                    }
                }

                //計算した力を元にグループ単位で移動させていく
                for (var i = 0; i < groupRectangle.length; i++) {
                    var dx: number = groupRectangle[i].powerX;
                    var dy: number = groupRectangle[i].powerY;
                    var disp: number = Math.sqrt(dx * dx + dy * dy);

                    if (disp != 0) {
                        var d: number = Math.min(disp, t) / disp;
                        groupRectangle[i].moveX(dx * d);
                        groupRectangle[i].moveY(dy * d);
                    }
                    groupRectangle[i].calculation();
                }

                t -= dt;
                if (t <= 0) break;
            }
            //console.log(groupRectangle);
        }

        //各点同士の最短経路長を求める
        function FloydWarshall(dotnumber: number, edgenumber: number, d: number[]) {
            for (var i = 0; i < dotnumber; i++) {
                for (var j = 0; j < dotnumber; j++) {
                    d[i * dotnumber + j] = dotnumber;
                }
                d[i * dotnumber + i] = 0;
            }
            for (var i = 0; i < edgenumber; i++) {
                var one: number = ObjectIDs.indexOf(edgeWithAngleList[i].ID1);
                var two: number = ObjectIDs.indexOf(edgeWithAngleList[i].ID2);
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
        console.log("forceDirectedMethod\n   " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
    }


    //注目ノードの特定
    function interestNodesInit(graph: Graph, interestNodes: string[], EwithAs: EdgeWithAngle[]) {

        var greenEdges: Edge[] = graph.variableEdges;   //緑の矢印の集合
        var bool: boolean = false;
        for (var i = 0; i < greenEdges.length; i++) {
            if (greenEdges[i].label == "this") {
                interestNodes.push(greenEdges[i].to);
                bool = true;
                break;
            }
        }

        var global_variables: string[] = graph.getGlobalVariables();    //グローバル変数の集合
        if (/*bool*/true) {
            for (var i = 0; i < greenEdges.length; i++) {
                //ローカル変数の指すノードを拡大表示する
                if (greenEdges[i].label != "this" && global_variables.indexOf(greenEdges[i].label) == -1) {
                    interestNodes.push(greenEdges[i].to);
                }
            }
        }
    }



    /**************
     * 実行部分
     * ************/

    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle: boolean = true;

    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue: boolean = true;

    //相対角度で描画するかどうか
    var RelativeAngle: boolean = false;

    //特定のクラスを極小表示するモード
    //var CustomMode: boolean = true;

    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var edgeWithAngleList: EdgeWithAngle[] = new Array();
    var classAndFieldList: ClassAndField[] = new Array();
    var interestNodes: string[] = new Array();
    edgeListInit(graph, edgeWithAngleList, classAndFieldList, DrawCircle, EdgeWithPrimitiveValue, interestNodes);

    //console.log("edgeList = ");
    //console.log(edgeWithAngleList);
    //console.log("cafList = ");
    //console.log(classAndFieldList);
    //console.log("interest Nodes = ");
    //console.log(interestNodes);

    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList, classAndFieldList, interestNodes);

    //console.log("edgeList = ");
    //console.log(edgeWithAngleList);
}