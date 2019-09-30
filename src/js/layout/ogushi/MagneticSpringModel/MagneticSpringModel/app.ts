///<reference path="example.ts" />

setGraphLocation(grp);

//グラフの描画をするための変数
var canvas = <HTMLCanvasElement>document.getElementById("cv");
var context = canvas.getContext("2d");
context.font = "italic 50px Arial";

//context.clearRect(0, 0, 3200, 1800);
//grp.draw(context);

console.log(grp);




//Kanonからgraphオブジェクトを受け取り、graphオブジェクト内のノードの座標を更新する関する（メイン関数）
function setGraphLocation(graph: Graph) {

    //スタックの実装
    class Stack {
        stack: string[];

        constructor() {
            this.stack = new Array();
        }

        //プッシュ
        push(str: string) {
            this.stack.push(str);
        }

        //ポップ
        pop(): string {
            if (this.stack.length == 0) {
                return null;
            } else {
                var p: string = this.stack.pop();
                return p;
            }
        }

        //スタックの中身が空の場合、trueを返す
        isZero(): boolean {
            return this.stack.length == 0;
        }

        //スタックされている値を配列として返す
        returnArray(): string[] {
            return copyArray(this.stack);
        }
    }

    //ベクトルの実装
    class Vector {
        angle: number;
        size: number;

        constructor(angle: number, size: number) {
            this.angle = angle;
            this.size = size;
        }
    }

    /*
     * クラス名とフィールド名をまとめてクラス定義する
     */
    class ClassAndField {
        cls: string;
        field: string;
        angle: number;

        constructor(cls: string, field: string) {
            this.cls = cls;
            this.field = field;
            this.angle = 0;
        }
    }

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
    class MagneticNeedleEdge {
        startID: string;
        endID: string;
        class: string;
        field: string;
        typeOfNeedle: number;
        /*
         * typeofNeedleは磁針のタイプを数字で表す。
         * 0ならば有向辺の磁針、
         * 1ならば無向辺の磁針（N極とS極の区別がない）
         * 2ならば磁場からの影響を受けない辺
         */

        constructor(startID: string, endID: string, cls: string, fld: string, type: number) {
            this.startID = startID;
            this.endID = endID;
            this.class = cls;
            this.field = fld;
            this.typeOfNeedle = type;
        }
    }

    //磁場を表すクラス
    class MagneticField {
        class: string;
        field: string;
        vector: Vector;

        constructor(cls: string, fld: string, vtr: Vector) {
            this.class = cls;
            this.field = fld;
            this.vector = vtr;
        }
    }

    //配列内に引数と同じ値があるかどうかを走査する
    function sameT_InArray<T>(t: T, arrayT: T[]): boolean {
        var bool: boolean = false;

        for (var i = 0; i < arrayT.length; i++) {
            bool = bool || (arrayT[i] == t);
        }

        return bool;
    }

    //ClassAndFieldの配列内に引数と同じ値があるかどうかを走査する
    function sameClassAndField_InArray(caf: ClassAndField, arrayCaf: ClassAndField[]): boolean {
        var bool: boolean = false;

        for (var i = 0; i < arrayCaf.length; i++) {
            bool = bool || (caf.cls == arrayCaf[i].cls && caf.field == arrayCaf[i].field);
        }

        return bool;
    }

    //配列を別の配列にコピーする
    function copyArray(origin: string[]): string[] {
        var array: string[] = new Array(origin.length);
        for (var i = 0; i < origin.length; i++) {
            array[i] = origin[i];
        }
        return array;
    }

    //配列同士が同じものであるかどうかを調べる
    function arrayEqual(a1: string[], a2: string[]): boolean {
        var bool: boolean = true;
        if (a1.length != a2.length) {
            return false;
        } else {
            for (var i = 0; i < a1.length; i++) {
                bool = bool && (a1[i] === a2[i]);
            }
            return bool;
        }
    }

    //値から配列の最初のkeyを取得し、keyより前の要素を削除した配列を返す
    function arraySpliceBoforeIndexOf(key: string, array: string[]): string[] {
        var carray: string[] = copyArray(array);
        var index: number = carray.indexOf(key);
        carray.splice(0, index);
        return carray;
    }






    //角度付きエッジリストの情報をEdgeWithAngleとして書きこむ
    function edgeListInit(graph: Graph, medgelist: MagneticNeedleEdge[], mfield: MagneticField[], drawcircle: boolean, edgewithprimitivevalue: boolean) {

        //オブジェクトのIDの配列
        var ObjectIDs: string[] = graph.getObjectIDs();

        //プリミティブ型の値を除いたオブジェクトID配列
        var ObjectIDsExceptPrimitiveValue: string[] = ObjectIDs.filter(function (value, index, array) {
            return isPrimitiveString(graph.getClass(value));
        })

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
    function isPrimitiveString(str: string): boolean {
        return (str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function");
    }

    //同じ型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisionEdgeAngleConnectingSameClass(graph: Graph, medgelist: MagneticNeedleEdge[], mfield: MagneticField[], cls: string, IDs: string[], drawcircle: boolean) {
        
        //必要なフィールド名の配列
        var arrayField: string[] = necessaryField(graph, cls, IDs);

        //MagneticFieldの追加
        if (arrayField.length != 0) {
            if (arrayField.length == 1) {
                var mf = new MagneticField(cls, arrayField[0], new Vector(0, 1));
                mfield.push(mf);
            } else {
                var mfs: MagneticField[] = new Array(arrayField.length);
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
        function necessaryField(graph: Graph, cls: string, IDs: string[]): string[] {

            //自身の型を再帰的に参照する全てのフィールド名
            var allRecursiveFields: string[] = identifyAllRecursiveField(graph, cls, IDs);

            //不必要なフィールド名
            var unnecessaryFields: string[] = identifyUnnecessaryField(graph, cls, IDs);

            //全ての再帰的なフィールド名から不必要なフィールド名を除いた配列
            var necessaryFields: string[] = allRecursiveFields.filter(function (value, index, array) {
                return !sameT_InArray<string>(value, unnecessaryFields);
            })

            return necessaryFields;

            //補助関数、自身の型を再規定に参照する全てのフィールド名を返す
            function identifyAllRecursiveField(graph: Graph, cls: string, IDs: string[]): string[] {
                var fieldArray: string[] = new Array();

                for (var i = 0; i < IDs.length; i++) {
                    var getFields: string[] = graph.getFields(IDs[i]);
                    for (var j = 0; j < getFields.length; j++) {
                        if (graph.getClass(graph.getField(IDs[i], getFields[j])) == cls && !sameT_InArray<string>(getFields[j], fieldArray)) {
                            fieldArray.push(getFields[j]);
                        }
                    }
                }

                return fieldArray;
            }

            //補助関数、不必要なフィールド名を返す
            function identifyUnnecessaryField(graph: Graph, cls: string, IDs: string[]): string[] {
                var unnecessaryFields: string[] = new Array();

                //⇄の関係となっているフィールド名のペアを列挙
                var setFields: string[] = identifySetField(graph, cls, IDs);

                identifyUnnecessaryField_sub(setFields, unnecessaryFields);

                return unnecessaryFields;



                //⇄の関係となっているフィールド名のペアを列挙する補助関数
                function identifySetField(graph: Graph, cls: string, IDs: string[]): string[] {
                    var usedObjectIDs: string[] = new Array();
                    var pairFields: string[] = new Array();

                    for (var i = 0; i < IDs.length; i++) {
                        identifySetField_sub(graph, cls, IDs[i]);
                    }

                    return pairFields;

                    //補助関数の補助関数
                    function identifySetField_sub(graph: Graph, cls: string, ID: string) {
                        if (!sameT_InArray<string>(ID, usedObjectIDs)) {
                            usedObjectIDs.push(ID);                             //今見ているオブジェクトのID
                            var getFields: string[] = graph.getFields(ID);

                            for (var j = 0; j < getFields.length; j++) {
                                if (graph.getClass(graph.getField(ID, getFields[j])) == cls && !sameT_InArray<string>(graph.getField(ID, getFields[j]), usedObjectIDs)) {
                                    var nextID: string = graph.getField(ID, getFields[j]);      //次のオブジェクトのID
                                    var getFields2: string[] = graph.getFields(nextID);

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
                function identifyUnnecessaryField_sub(setField: string[], unnecessaryField: string[]) {
                    if (setField.length != 0) {
                        var str: string = mode_inArray(setField);
                        unnecessaryField.push(str);
                        var numArray: number[] = new Array();
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
                    function mode_inArray(array: string[]): string {
                        var strArray: string[] = new Array();
                        for (var i = 0; i < array.length; i++) {
                            if (!sameT_InArray<string>(array[i], strArray)) {
                                strArray.push(array[i]);
                            }
                        }

                        var length: number = strArray.length;
                        var numArray: number[] = new Array(length);
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

                        var max: number = numArray[0];
                        var id: number = 0;
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
        function makeEdgeListConnectingSameClass(graph: Graph, medgelist: MagneticNeedleEdge[], cls: string, IDs: string[], arrayfield: string[]) {

            //辿ったオブジェクトのIDを記録する配列
            var usedObjectIDs: string[] = new Array();

            //ID順にオブジェクトを辿りながらエッジリストを作る
            for (var i = 0; i < IDs.length; i++) {
                makeEdgeListConnectingSameClass_sub(graph, medgelist, cls, IDs[i], arrayfield);
            }

            //補助関数
            function makeEdgeListConnectingSameClass_sub(graph: Graph, medgelist: MagneticNeedleEdge[], cls: string, ID: string, arrayField: string[]) {
                if (!sameT_InArray<string>(ID, usedObjectIDs)) {                //引数のオブジェクトIDがまだ見たことのないものならば
                    usedObjectIDs.push(ID);                                 //見ているオブジェクトのIDを記録

                    for (var j = 0; j < arrayField.length; j++) {
                        var nextID: string = graph.getField(ID, arrayField[j]);     //次のオブジェクトのID

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
        function searchCycleGraph(graph: Graph, medgelist: MagneticNeedleEdge[], cls: string, IDs: string[], arrayField: string[], drawcircle: boolean) {

            //閉路上のIDの配列
            var cycleIDs: string[][] = cycleGraphIDs(graph, cls, IDs, arrayField);

            if (drawcircle) {       //閉路上のエッジの角度を全て無効にする
                for (var i = 0; i < cycleIDs.length; i++) {
                    for (var j = 0; j < cycleIDs[i].length - 1; j++) {
                        for (var k = 0; k < medgelist.length; k++) {
                            if (cycleIDs[i][j] == medgelist[k].startID && cycleIDs[i][j + 1] == medgelist[k].endID) {
                                medgelist[k].typeOfNeedle = 2;      //角度を無効にするためには、typeOfNeedleに2を代入する
                            }
                        }
                    }
                }
            } else {                //閉路上のエッジを一本削除する
                /*
                 * アルゴリズムが思い浮かばなかったので後回し
                 */
            }


            //補助関数、閉路を探索し、閉路上のIDの配列を返す（新）
            function cycleGraphIDs(graph: Graph, cls: string, IDs: string[], arrayField: string[]): string[][] {
                var cycleIDs: string[][] = new Array();

                var usedIDs: string[] = new Array();        //訪れたことのあるIDを記録

                for (var i = 0; i < IDs.length; i++) {
                    if (!sameT_InArray<string>(IDs[i], usedIDs)) {
                        var cycleIDsFromOneID: string[][] = cycleGraphIDsFromOneID(graph, cls, usedIDs, arrayField, IDs[i]);
                        for (var j = 0; j < cycleIDsFromOneID.length; j++) {
                            cycleIDs.push(cycleIDsFromOneID[j]);
                        }
                    }
                }

                return cycleIDs;

                //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
                function cycleGraphIDsFromOneID(graph: Graph, cls: string, usedIDs: string[], arrayField: string[], ID: string): string[][] {

                    var cycleIDs: string[][] = new Array();

                    var stack: Stack = new Stack();     //経路を記録するためのスタック

                    deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, ID);


                    //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                    function deep_first_search(graph: Graph, stack: Stack, cycleIDs: string[][], usedIDs: string[], arrayField: string[], nowID: string) {

                        stack.push(nowID);
                        //alert("push " + nowID + " !!");
                        //alert("stack length = " + stack.stack.length);

                        if (!sameT_InArray<string>(nowID, usedIDs)) {      //今いるノードが未訪問ならば訪問した印をつける
                            usedIDs.push(nowID);
                        }

                        for (var i = 0; i < arrayField.length; i++) {
                            var u: string = graph.getField(nowID, arrayField[i]);
                            if (u != undefined) {
                                if (!sameT_InArray<string>(u, stack.stack)) {
                                    deep_first_search(graph, stack, cycleIDs, usedIDs, arrayField, u);
                                } else {
                                    var cycleInStack: string[] = arraySpliceBoforeIndexOf(u, stack.stack);
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
    function decisonEdgeAngleConnectingDifferentClass(graph: Graph, medgelist: MagneticNeedleEdge[], mfield: MagneticField[], IDs: string[], classes: string[], withoutPrimitiveIDs: string[], edgewithprimitivevalue: boolean) {

        //必要なフィールド名の配列
        var arrayField: ClassAndField[] = necessaryField(graph, IDs, classes, withoutPrimitiveIDs, edgewithprimitivevalue);

        //フィールドの角度を決定する
        decisionAngleClassAndField(arrayField);

        //MagneticFieldの追加
        for (var i = 0; i < arrayField.length; i++) {
            var mf: MagneticField = new MagneticField(arrayField[i].cls, arrayField[i].field, new Vector(arrayField[i].angle, 1));
            mfield.push(mf);
        }

        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingDifferentClass(graph, medgelist, IDs, classes, withoutPrimitiveIDs, arrayField);

        //参照先がプリミティブ型のときには角度を決めずにエッジを作る
        if (!edgewithprimitivevalue) {
            makeEdgeListConnectingPrimitiveValue(graph, medgelist, IDs, withoutPrimitiveIDs);
        }





        //補助関数、ClassAndFieldの配列からそれぞれのエッジの角度を決定して書きこむ
        function decisionAngleClassAndField(cafs: ClassAndField[]) {
            var allCls: string[] = new Array();
            for (var i = 0; i < cafs.length; i++) {
                if (!sameT_InArray<string>(cafs[i].cls, allCls)) {
                    allCls.push(cafs[i].cls);
                }
            }

            var clsnumber: number[] = new Array(allCls.length);
            for (var i = 0; i < clsnumber.length; i++) {
                var cnt: number = 0;
                for (var j = 0; j < cafs.length; j++) {
                    if (allCls[i] == cafs[j].cls) {
                        cnt += 1;
                    }
                }
                clsnumber[i] = cnt;
            }

            var cntnumber: number[] = new Array(clsnumber.length);
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
        function necessaryField(graph: Graph, IDs: string[], classes: string[], withoutPrimitiveIDs: string[], edgewithprimitivevalue: boolean): ClassAndField[] {
            var necessaryfields: ClassAndField[] = new Array();
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields: string[] = graph.getFields(withoutPrimitiveIDs[i]);     //フィールド名の配列
                var fieldIDs: string[] = new Array(fields.length);                  //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) {                         //初期化
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
                            var caf: ClassAndField = new ClassAndField(graph.getClass(withoutPrimitiveIDs[i]), fields[j]);
                            if (!sameClassAndField_InArray(caf, necessaryfields)) {
                                necessaryfields.push(caf);
                            }
                        }
                    }
                } else {
                    /*
                     * case 2
                     * 参照先がprimitive型のときは角度を決定しない
                     * 
                     */

                    for (var j = 0; j < fieldIDs.length; j++) {
                        if (graph.getClass(fieldIDs[j]) != graph.getClass(withoutPrimitiveIDs[i]) && sameT_InArray<string>(fieldIDs[j], withoutPrimitiveIDs)) {
                            var caf: ClassAndField = new ClassAndField(graph.getClass(withoutPrimitiveIDs[i]), fields[j]);
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
        function makeEdgeListConnectingDifferentClass(graph: Graph, medgelist: MagneticNeedleEdge[], IDs: string[], classes: string[], withoutPrimitiveIDs: string[], arrayField: ClassAndField[]) {

            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields: string[] = graph.getFields(withoutPrimitiveIDs[i]);     //フィールド名の配列
                var fieldIDs: string[] = new Array(fields.length);                  //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) {                         //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }

                for (var j = 0; j < fieldIDs.length; j++) {
                    for (var k = 0; k < arrayField.length; k++) {
                        if (arrayField[k].cls == graph.getClass(withoutPrimitiveIDs[i]) && arrayField[k].field == fields[j]) {
                            var newedge: MagneticNeedleEdge = new MagneticNeedleEdge(withoutPrimitiveIDs[i], fieldIDs[j], graph.getClass(withoutPrimitiveIDs[i]), fields[j], 0);
                            medgelist.push(newedge);
                        }
                    }
                }
            }
        }

        /*
         * 参照先がプリミティブ型のときには角度を決めずにエッジを作る
         */
        function makeEdgeListConnectingPrimitiveValue(graph: Graph, medgelist: MagneticNeedleEdge[], IDs: string[], withoutPrimitiveIDs: string[]) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields: string[] = graph.getFields(withoutPrimitiveIDs[i]);
                for (var j = 0; j < fields.length; j++) {
                    var nextID: string = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                    if (!sameT_InArray<string>(nextID, withoutPrimitiveIDs)) {
                        //var newedge: EdgeWithAngle = new EdgeWithAngle(withoutPrimitiveIDs[i], nextID, 9973);
                        var newedge: MagneticNeedleEdge = new MagneticNeedleEdge(withoutPrimitiveIDs[i], nextID, graph.getClass(withoutPrimitiveIDs[i]), fields[j], 2);
                        medgelist.push(newedge);
                    }
                }
            }
        }
    }




    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph: Graph, medgelist: MagneticNeedleEdge[], mfields: MagneticField[]) {

        //オブジェクトのIDの配列
        var ObjectIDs: string[] = graph.getObjectIDs();

        //ノード数
        var DOTNUMBER: number = ObjectIDs.length;

        //エッジ数
        var EDGENUMBER: number = medgelist.length;

        var WIDTH: number = 1280;    //表示する画面の横幅
        var HEIGHT: number = 720;     //表示する画面の縦幅
        var WidthDot: number = 50;      //点の縦幅
        var HeightDot: number = 50;     //点の横幅
        var D: number = 0.3 * Math.sqrt(WIDTH * HEIGHT / DOTNUMBER);   //スプリングの自然長
        var cs: number = 500;         //スプリング力の係数
        var cr: number = 500000;         //斥力の係数
        var cm: number = 10;         //磁力の係数
        var alpha: number = 1;      //辺の長さに影響を与えるパラメータ
        var beta: number = 1;       //辺の回転力に影響を与えるパラメータ
        var M: number = 5000;       //計算の繰り返し回数
        var T: number = Math.max(WIDTH, HEIGHT);        //温度パラメータ
        var DrawVector: boolean = false;                //力ベクトルを表示するか否か

        //点のクラス
        class Dot_G {
            x: number;
            y: number;
            vx: number;     //速度のx成分
            vy: number;     //速度のy成分
            fsx: number;    //スプリング力のx成分
            fsy: number;    //スプリング力のy成分
            frx: number;    //斥力のx成分
            fry: number;    //斥力のy成分
            fmx: number;    //磁力のx成分
            fmy: number;    //磁力のy成分
            nodeID: string; //ノードID

            //点の初期化
            init(x: number, y: number) {
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
            }

            //点に働く力から速度を求める
            init_velocity() {
                this.vx = this.fsx + this.frx + this.fmx;
                this.vy = this.fsy + this.fry + this.fmy;
            }

            //点の速度
            velocity(): number {
                return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            }

            //点の力をリセットする
            reset_force() {
                this.vx = 0;
                this.vy = 0;
                this.fsx = 0;
                this.fsy = 0;
                this.frx = 0;
                this.fry = 0;
                this.fmx = 0;
                this.fmy = 0;
            }

            //点を矩形で描画する
            draw(context, width: number, height: number) {

                var x: number = this.x - width / 2;
                var y: number = this.y - height / 2;

                context.strokeStyle = "rgba(0,0,0,1.0)";
                context.fillStyle = "rgba(0,0,0,1.0)";

                //context.fillRect(x, y, width, height);
                context.strokeRect(x, y, width, height);        //矩形の描画

                if (this.nodeID != null) {
                    context.font = "italic 50px Arial";
                    context.fillText(this.nodeID, x, y + height);      //数字の描画
                }

                if (DrawVector) {
                    context.strokeStyle = "rgba(255,0,0,0.5)";
                    context.fillStyle = "rgba(255,0,0,0.5)";
                    draw_vector(this.x, this.y, this.fsx, this.fsy);    //スプリング力ベクトルは赤で表示
                    context.strokeStyle = "rgba(0,255,0,0.5)";
                    context.fillStyle = "rgba(0,255,0,0.5)";
                    draw_vector(this.x, this.y, this.frx, this.fry);    //斥力ベクトルは緑で表示
                    context.strokeStyle = "rgba(0,0,255,0.5)";
                    context.fillStyle = "rgba(0,0,255,0.5)";
                    draw_vector(this.x, this.y, this.fmx, this.fmy);    //磁力ベクトルは青で表示
                }
            }
        }

        //辺のクラス
        class Edge_G {
            dot1: Dot_G;
            dot2: Dot_G;
            class: string;
            field: string;
            type: number;

            //辺の初期化
            init(dot1: Dot_G, dot2: Dot_G, cls: string, fld: string, type: number) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.class = cls;
                this.field = fld;
                this.type = type;
            }

            //エッジの長さ（2点間の距離）を求める
            length(): number {
                var xl: number = this.dot1.x - this.dot2.x;
                var yl: number = this.dot1.y - this.dot2.y;

                return Math.sqrt(xl * xl + yl * yl);
            }

            draw(context) {
                context.strokeStyle = "rgba(0,0,0,1.0)";
                context.fillStyle = "rgba(0,0,0,1.0)";
                context.beginPath();
                context.moveTo(this.dot1.x, this.dot1.y);
                context.lineTo(this.dot2.x, this.dot2.y);
                context.stroke();
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

            //グラフの描画
            draw(context) {
                for (var i = 0; i < this.dots.length; i++) {
                    this.dots[i].draw(context, WidthDot, HeightDot);
                }
                for (var i = 0; i < this.edges.length; i++) {
                    this.edges[i].draw(context);
                }
            }
        }

        //ベクトルを画面に描画する
        function draw_vector(x: number, y: number, dx: number, dy: number) {
            var x1: number = x;
            var y1: number = y;
            var x2: number = x1 + dx;
            var y2: number = y1 + dy;
            var x3: number = x2 + (- dx - dy) / 12;
            var y3: number = y2 + (dx - dy) / 12;
            var x4: number = x2 + (- dx + dy) / 12;
            var y4: number = y2 + (- dx - dy) / 12;

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
        function sameDot_exists(dots: Dot_G[], dn: number): boolean {
            var bool: boolean = false;

            for (var i = 0; i < dn - 1; i++) {
                for (var j = i + 1; j < dn; j++) {
                    bool = bool || (dots[i].x == dots[j].x && dots[i].y == dots[j].y);
                }
            }
            return bool;
        }

        //２点間のスプリング力を計算
        function f_s(d: number): number {
            return cs * Math.log(d / D);
        }

        //2点間の斥力を計算
        function f_r(d: number): number {
            return cr / (d * d);
        }

        //辺の両端の点に働く磁力を計算
        function f_m(b: number, t: number, d: number): number {
            return cm * b * Math.pow(d, alpha) * Math.pow(Math.abs(t), beta);
        }

        //2点を結ぶ辺がある場合にその辺を返す
        function edgeConnectingTwoDots(dot1: Dot_G, dot2: Dot_G, edges: Edge_G[]): Edge_G {
            var edge: Edge_G = null;

            for (var i = 0; i < edges.length; i++) {
                if ((edges[i].dot1 === dot1 && edges[i].dot2 === dot2) || (edges[i].dot2 === dot1 && edges[i].dot1 === dot2)) {
                    edge = edges[i];
                }
            }
            return edge;
        }

        //辺が影響を受ける磁場を発見し返す
        function magneticFieldEffectingEdge(edge: Edge_G, mfields: MagneticField[]): MagneticField {
            var mfield: MagneticField = null;

            for (var i = 0; i < mfields.length; i++) {
                if (edge.class == mfields[i].class && edge.field == mfields[i].field) {
                    mfield = mfields[i];
                }
            }
            return mfield;
        }

        //辺の基準点における磁場の北からの終点のずれの角
        //磁場の向きと辺の向きのずれの角度を返す(-π～π)
        function dispartyAngle(mfr: number, ep: number): number {
            return correctionAngle(ep - mfr);
        }

        //与えられた入力が-π＜t≦πになるまで繰り返し計算する
        function correctionAngle(t: number): number {
            if (t <= Math.PI && t > -Math.PI) {
                return t;
            } else if (t > Math.PI) {
                return correctionAngle(t - 2 * Math.PI);
            } else if (t <= -Math.PI) {
                return correctionAngle(t + 2 * Math.PI);
            }
        }

        //各点のスプリング力・斥力・磁力を計算し、Dot_G[]に代入していく
        function focus_calculate(dots: Dot_G[]) {

            //始めに各点の力を初期化する
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].reset_force();
            }

            for (var i = 0; i < DOTNUMBER; i++) {
                for (var j = 0; j < DOTNUMBER; j++) {
                    if (i != j) {
                        var dot1: Dot_G = dots[i];
                        var dot2: Dot_G = dots[j];

                        var dx: number = dot2.x - dot1.x;
                        var dy: number = dot2.y - dot1.y;
                        var length: number = Math.sqrt(dx * dx + dy * dy);

                        if (length != 0) {
                            if (edgeConnectingTwoDots(dot1, dot2, edges) == null) {

                                //斥力を計算
                                dots[i].frx += -f_r(length) * dx / length;
                                dots[i].fry += -f_r(length) * dy / length;

                                dots[i].vx += dots[i].frx;
                                dots[i].vy += dots[i].fry;

                            } else {

                                //スプリング力を計算
                                dots[i].fsx += f_s(length) * dx / length;
                                dots[i].fsy += f_s(length) * dy / length;

                                //磁力を計算
                                var e: Edge_G = edgeConnectingTwoDots(dot1, dot2, edges);
                                var rad: number = Math.atan2(dy, dx);
                                if (e.type == 0) {
                                    var mf: MagneticField = magneticFieldEffectingEdge(e, mfields);
                                    var mvec: Vector = mf.vector;
                                    var mvecangle: number;
                                    if (dot1 === e.dot1) {
                                        mvecangle = mvec.angle;
                                    } else {
                                        mvecangle = correctionAngle(mvec.angle - Math.PI);
                                    }
                                    var trad: number = dispartyAngle(mvecangle, rad);

                                    if (trad >= 0) {
                                        dots[i].fmx += -f_m(mvec.size, trad, length) * dy / length;
                                        dots[i].fmy += f_m(mvec.size, trad, length) * dx / length;
                                    } else {
                                        dots[i].fmx += f_m(mvec.size, trad, length) * dy / length;
                                        dots[i].fmy += -f_m(mvec.size, trad, length) * dx / length;
                                    }
                                } else if (e.type == 1) {
                                    dots[i].fmx += 0;
                                    dots[i].fmy += 0;
                                } else if (e.type == 2) {
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
        function move_dots(dots: Dot_G[]) {
            var t: number = T;
            var dt: number = T / (M + 1);

            //力の計算をM回繰り返し計算
            for (var i = 0; i < M; i++) {
                focus_calculate(dots);
                for (var j = 0; j < DOTNUMBER; j++) {
                    var velocity: number = Math.sqrt(dots[j].vx * dots[j].vx + dots[j].vy * dots[j].vy);
                    if (velocity < t) {
                        dots[j].x += dots[j].vx;
                        dots[j].y += dots[j].vy;
                    } else {
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




        /********************
         * 各点の座標の計算
         * ******************/

        //各点の用意、座標は適切に初期化し、同じ座標の点同士が存在しないようにする
        var dots: Dot_G[] = new Array(DOTNUMBER);
        for (var i = 0; i < DOTNUMBER; i++) {
            dots[i] = new Dot_G();
        }

        do {
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT));
            }
        } while (sameDot_exists(dots, DOTNUMBER));

        //各辺の用意
        var edges: Edge_G[] = new Array(EDGENUMBER);
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
        var canvas = <HTMLCanvasElement>document.getElementById("cv");
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
    var DrawCircle: boolean = true;




    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue: boolean = false;




    var edgeListInitStartTime = performance.now();

    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var MagneticNeedleEdgeList: MagneticNeedleEdge[] = new Array();
    var MagneticFieldList: MagneticField[] = new Array();
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