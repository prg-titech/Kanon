///<reference path="example.ts" />

//import sgl = require('./app');
//sgl.setGraphLocation(grp);

setGraphLocation(grp);

////グラフの描画をするための変数
var canvas = <HTMLCanvasElement>document.getElementById("cv");
var context = canvas.getContext("2d");
context.font = "italic 50px Arial";

grp.draw(context);

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

    //角度付きエッジのクラス
    class EdgeWithAngle {
        ID1: string;
        ID2: string;
        angle: number;

        constructor(ID1: string, ID2: string, angle: number) {
            this.ID1 = ID1;
            this.ID2 = ID2;
            this.angle = angle;
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
    function edgeListInit(graph: Graph, edgelist: EdgeWithAngle[], drawcircle: boolean, edgewithprimitivevalue: boolean) {

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
                decisionEdgeAngleConnectingSameClass(graph, edgelist, allObjectClassExceptDuplication[i], IDsSeparateClass[i], drawcircle);
            }
        }

        //異なる型を参照するエッジの角度を決定
        decisonEdgeAngleConnectingDifferentClass(graph, edgelist, ObjectIDs, allObjectClass, ObjectIDsExceptPrimitiveValue, edgewithprimitivevalue);

    }

    //引数がプリミティブ型を表す文字列でないかどうかを調べる、そうでなければtrueを返す
    function isPrimitiveString(str: string): boolean {
        return (str != "number") && (str != "string") && (str != "boolean") && (str != "symbol") && (str != "undefined") && (str != "function");
    }

    //同じ型のオブジェクトを結ぶエッジの角度を決定し、edgelistに書きこむ
    function decisionEdgeAngleConnectingSameClass(graph: Graph, edgelist: EdgeWithAngle[], cls: string, IDs: string[], drawcircle: boolean) {

        //必要なフィールド名の配列
        var arrayField: string[] = necessaryField(graph, cls, IDs);

        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingSameClass(graph, edgelist, cls, IDs, arrayField);

        //閉路があるか探索し、閉路があった場合は閉路上のエッジの角度を全て無しにする
        searchCycleGraph(graph, edgelist, cls, IDs, arrayField, drawcircle);



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
        function makeEdgeListConnectingSameClass(graph: Graph, edgelist: EdgeWithAngle[], cls: string, IDs: string[], arrayfield: string[]) {

            //辿ったオブジェクトのIDを記録する配列
            var usedObjectIDs: string[] = new Array();

            //ID順にオブジェクトを辿りながらエッジリストを作る
            for (var i = 0; i < IDs.length; i++) {
                makeEdgeListConnectingSameClass_sub(graph, edgelist, cls, IDs[i], arrayfield);
            }

            //補助関数
            function makeEdgeListConnectingSameClass_sub(graph: Graph, edgelist: EdgeWithAngle[], cls: string, ID: string, arrayField: string[]) {
                if (!sameT_InArray<string>(ID, usedObjectIDs)) {                //引数のオブジェクトIDがまだ見たことのないものならば
                    usedObjectIDs.push(ID);                                 //見ているオブジェクトのIDを記録

                    for (var j = 0; j < arrayField.length; j++) {
                        var nextID: string = graph.getField(ID, arrayField[j]);     //次のオブジェクトのID

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
        function searchCycleGraph(graph: Graph, edgelist: EdgeWithAngle[], cls: string, IDs: string[], arrayField: string[], drawcircle: boolean) {

            //閉路上のIDの配列
            var cycleIDs: string[][] = cycleGraphIDs(graph, cls, IDs, arrayField);
            //console.log(cycleIDs);

            if (drawcircle) {       //閉路上のエッジの角度を全て無効にする
                for (var i = 0; i < cycleIDs.length; i++) {
                    for (var j = 0; j < cycleIDs[i].length - 1; j++) {
                        for (var k = 0; k < edgelist.length; k++) {
                            if (cycleIDs[i][j] == edgelist[k].ID1 && cycleIDs[i][j + 1] == edgelist[k].ID2) {
                                edgelist[k].angle = 9973;       //角度を無効にするためには、角度に9973を代入する
                            }
                        }
                    }
                }
            } else {                //閉路上のエッジを一本削除する
                /*
                 * アルゴリズムが思い浮かばなかったので後回し
                 */
            }


            /*
             * 
            //補助関数、閉路を探索し、閉路上のIDの配列を返す（旧）
            function cycleGraphIDs(graph: Graph, cls: string, IDs: string[], arrayField: string[]): string[][] {
                var cycleIDs: string[][] = new Array();

                for (var i = 0; i < IDs.length; i++) {
                    var cycleIDsFromOneID: string[][] = cycleGraphIDsFromOneID(graph, cls, IDs, arrayField, IDs[i]);
                    for (var j = 0; j < cycleIDsFromOneID.length; j++) {
                        if (!sameCycleGraph(cycleIDsFromOneID[j], cycleIDs)) {
                            cycleIDs.push(cycleIDsFromOneID[j]);
                        }
                    }
                }

                return cycleIDs;

                //補助関数の補助関数、一つのIDから探索していき、見つかった閉路上のIDの配列を返す（深さ優先探索）
                function cycleGraphIDsFromOneID(graph: Graph, cls: string, IDs: string[], arrayField: string[], ID: string): string[][] {

                    var cycleIDs: string[][] = new Array();

                    var stack: Stack = new Stack();     //経路を記録するためのスタック
                    var usedIDs: string[] = new Array();    //訪問したノードのIDを記録するための配列

                    deep_first_search(graph, stack, cycleIDs, arrayField, ID, ID);


                    //補助関数、深さ優先探索的（厳密には違う）にノードを辿っていく
                    function deep_first_search(graph: Graph, stack: Stack, cycleIDs: string[][], arrayField: string[], nowID: string, ID: string) {
                        stack.push(nowID);
                        for (var i = 0; i < arrayField.length; i++) {
                            var u: string = graph.getField(nowID, arrayField[i]);
                            if (u != undefined) {
                                if (!sameT_InArray<string>(u, stack.stack)) {
                                    deep_first_search(graph, stack, cycleIDs, arrayField, u, ID);
                                } else if (u == ID) {
                                    cycleIDs.push(stack.returnArray());
                                    cycleIDs[cycleIDs.length - 1].push(ID);
                                }
                            }
                        }
                        stack.pop();
                    }

                    return cycleIDs;

                }

                //補助関数の補助関数、与えられた閉路と同じものが配列cycleIDs内にあるかどうかを判断する
                function sameCycleGraph(onecycle: string[], cycles: string[][]): boolean {
                    var bool: boolean = false;
                    for (var i = 0; i < cycles.length; i++) {
                        if (onecycle.length != cycles[i].length) {  //配列の長さが同じでなければ
                            bool = bool || false;
                        } else {                                    //配列の長さが同じならば
                            var a1: string[] = copyArray(onecycle);
                            var a2: string[] = copyArray(cycles[i]);
                            a1.pop();       //末尾を削除
                            a2.pop();       //末尾を削除

                            for (var j = 0; j < a1.length; j++) {
                                if (arrayEqual(a1, a2)) {
                                    bool = bool || true;
                                }
                                var car: string = a2.shift();
                                a2.push(car);
                            }
                        }
                    }
                    return bool;
                }
            }
             *
             */


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
    function decisonEdgeAngleConnectingDifferentClass(graph: Graph, edgelist: EdgeWithAngle[], IDs: string[], classes: string[], withoutPrimitiveIDs: string[], edgewithprimitivevalue: boolean) {

        //必要なフィールド名の配列
        var arrayField: ClassAndField[] = necessaryField(graph, IDs, classes, withoutPrimitiveIDs, edgewithprimitivevalue);

        //フィールドの角度を決定する
        decisionAngleClassAndField(arrayField);

        //オブジェクトを辿りながらエッジリストを作る
        makeEdgeListConnectingDifferentClass(graph, edgelist, IDs, classes, withoutPrimitiveIDs, arrayField);

        //参照先がプリミティブ型のときには角度を決めずにエッジを作る
        if (!edgewithprimitivevalue) {
            makeEdgeListConnectingPrimitiveValue(graph, edgelist, IDs, withoutPrimitiveIDs);
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
        function makeEdgeListConnectingDifferentClass(graph: Graph, edgelist: EdgeWithAngle[], IDs: string[], classes: string[], withoutPrimitiveIDs: string[], arrayField: ClassAndField[]) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields: string[] = graph.getFields(withoutPrimitiveIDs[i]);     //フィールド名の配列
                var fieldIDs: string[] = new Array(fields.length);                  //フィールドのIDの配列
                for (var j = 0; j < fieldIDs.length; j++) {                         //初期化
                    fieldIDs[j] = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                }

                for (var j = 0; j < fieldIDs.length; j++) {
                    for (var k = 0; k < arrayField.length; k++) {
                        if (arrayField[k].cls == graph.getClass(withoutPrimitiveIDs[i]) && arrayField[k].field == fields[j]) {
                            var newedge: EdgeWithAngle = new EdgeWithAngle(withoutPrimitiveIDs[i], fieldIDs[j], arrayField[k].angle);
                            edgelist.push(newedge);
                        }
                    }
                }
            }
        }

        /*
         * 参照先がプリミティブ型のときには角度を決めずにエッジを作る
         */
        function makeEdgeListConnectingPrimitiveValue(graph: Graph, edgelist: EdgeWithAngle[], IDs: string[], withoutPrimitiveIDs: string[]) {
            for (var i = 0; i < withoutPrimitiveIDs.length; i++) {
                var fields: string[] = graph.getFields(withoutPrimitiveIDs[i]);
                for (var j = 0; j < fields.length; j++) {
                    var nextID: string = graph.getField(withoutPrimitiveIDs[i], fields[j]);
                    if (!sameT_InArray<string>(nextID, withoutPrimitiveIDs)) {
                        var newedge: EdgeWithAngle = new EdgeWithAngle(withoutPrimitiveIDs[i], nextID, 9973);
                        edgelist.push(newedge);
                    }
                }
            }
        }
    }

    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    function calculateLocationWithForceDirectedMethod(graph: Graph, edgeWithAngleList: EdgeWithAngle[]) {

        //オブジェクトのIDの配列
        var ObjectIDs: string[] = graph.getObjectIDs();

        //ノード数
        var DOTNUMBER: number = ObjectIDs.length;

        //エッジ数
        var EDGENUMBER: number = edgeWithAngleList.length;

        var WIDTH: number = 1280;    //表示する画面の横幅
        var HEIGHT: number = 720;     //表示する画面の縦幅
        var K: number = Math.min(WIDTH, HEIGHT) / 50;   //クーロン力に係る係数
        var Knum: number = 8;       //斥力のKの次数
        var rnum: number = 3;       //斥力のrの次数
        var ravenum: number = (Knum + 1) / (rnum + 2);
        var KRAD: number = 300000.0;             //角度に働く力の係数
        var ITERATION: number = 8000;        //反復回数
        var T: number = Math.max(WIDTH, HEIGHT);         //温度パラメータ
        var t: number = T;
        var dt: number = T / (ITERATION);

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

            //点の初期化
            init(x: number, y: number) {
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
        }

        //辺のクラス
        class Edge_G {
            dot1: Dot_G;
            dot2: Dot_G;
            angle: number;      //辺の角度

            //辺の初期化
            init(dot1: Dot_G, dot2: Dot_G, angle: number) {
                this.dot1 = dot1;
                this.dot2 = dot2;
                this.angle = angle;
            }

            //エッジの長さ（2点間の距離）を求める
            length(): number {
                var xl: number = this.dot1.x - this.dot2.x;
                var yl: number = this.dot1.y - this.dot2.y;

                return Math.sqrt(xl * xl + yl * yl);
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
        }

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
            edges[i].init(dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID1)], dots[ObjectIDs.indexOf(edgeWithAngleList[i].ID2)], edgeWithAngleList[i].angle);
        }

        //グラフの用意
        var graph_g = new Graph_G();
        graph_g.init(DOTNUMBER, EDGENUMBER, edges, dots);

        center_of_gravity(dots, WIDTH, HEIGHT);

        //温度パラメータが0以下になるまで安定状態を探索する
        while (true) {
            draw();
            if (t <= 0) break;
        }

        //fruchterman-Reingold法でエネルギーを最小化し、グラフを描画する
        function draw() {

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

        //計算を終了し、graphに座標情報を書きこんでいく
        function stopCalculate() {
            for (var i = 0; i < ObjectIDs.length; i++) {
                graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);
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

        //２点間の引力を計算
        function f_a(r: number, K: number): number {
            return r * r / K;
        }

        //2点間の斥力を計算
        function f_r(r: number, K: number): number {
            return Math.pow(K, Knum) / Math.pow(r, rnum);
        }

        //各点の引力・斥力を計算し、Dot[]に代入していく
        function focus_calculate(dots: Dot_G[]) {

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
                        var dx: number = dots[i].x - dots[j].x;
                        var dy: number = dots[i].y - dots[j].y;
                        var delta = Math.sqrt(dx * dx + dy * dy);
                        if (delta != 0) {
                            var d: number = f_r(delta, K) / delta;
                            dots[i].frx += dx * d;
                            dots[i].fry += dy * d;
                        }
                    }
                }
            }

            //各点の引力を計算
            for (var i = 0; i < EDGENUMBER; i++) {
                var dx: number = edges[i].dot1.x - edges[i].dot2.x;
                var dy: number = edges[i].dot1.y - edges[i].dot2.y;
                var delta: number = Math.sqrt(dx * dx + dy * dy);
                if (delta != 0) {
                    var d: number = f_a(delta, K) / delta;
                    var ddx: number = dx * d;
                    var ddy: number = dy * d;
                    edges[i].dot1.fax += -ddx;
                    edges[i].dot2.fax += +ddx;
                    edges[i].dot1.fay += -ddy;
                    edges[i].dot2.fay += +ddy;
                }
            }

            //各点の角度に基づいて働く力を計算
            for (var i = 0; i < EDGENUMBER; i++) {
                if (edgeWithAngleList[i].angle != 9973) {
                    var dx: number = edges[i].dot2.x - edges[i].dot1.x;
                    var dy: number = edges[i].dot2.y - edges[i].dot1.y;
                    var delta: number = Math.sqrt(dx * dx + dy * dy);
                    var rad: number = Math.atan2(dy, dx);
                    if (delta != 0) {
                        var d: number = rad - edgeWithAngleList[i].angle;
                        var ddx: number;
                        var ddy: number;
                        var ex: number = KRAD * dy / delta;     //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        var ey: number = - KRAD * dx / delta;   //角度に関する力の基本ベクトル（元のベクトルを負の方向に90度回転）
                        if (Math.abs(d) <= Math.PI) {
                            ddx = d * Math.abs(d) * ex;
                            ddy = d * Math.abs(d) * ey;
                        } else {
                            var dd: number = d + 2 * Math.PI;
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
                    }
                }
            }

            //力ベクトルから速度を求める
            for (var i = 0; i < DOTNUMBER; i++) {
                dots[i].init_velocity();
            }
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
    }




    /**************
     * 実行部分
     * ************/

    //オブジェクトがグラフ構造か木構造かを判別して描画するか否な
    //falseにすると、すべてを循環の無い木構造と見なして描画する
    var DrawCircle: boolean = true;

    //参照先がprimitive型のときに角度を決定するかどうか
    var EdgeWithPrimitiveValue: boolean = true;

    var edgeListInitStartTime = performance.now();
    //角度付きエッジリストを用意し、参照関係を元に初期化する
    var edgeWithAngleList: EdgeWithAngle[] = new Array();
    edgeListInit(graph, edgeWithAngleList, DrawCircle, EdgeWithPrimitiveValue);
    var edgeListInitEndTime = performance.now();
    console.log("edgeListInit Time = " + (edgeListInitEndTime - edgeListInitStartTime) + " ms");

    var forceDirectedMethodStartTime = performance.now();
    //角度付きエッジリストを元に、力学的手法を用いて各ノードの座標を計算
    //graphオブジェクト内のノード座標を破壊的に書き替える
    calculateLocationWithForceDirectedMethod(graph, edgeWithAngleList);
    var forceDirectedMethodEndTime = performance.now();
    console.log("forceDirectedMethod Time = " + (forceDirectedMethodEndTime - forceDirectedMethodStartTime) + " ms");
}