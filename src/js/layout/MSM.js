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
                    context.strokeStyle = "rgba(255,0,0,0.5)";
                    context.fillStyle = "rgba(255,0,0,0.5)";
                    draw_vector(this.x, this.y, this.fsx, this.fsy); //スプリング力ベクトルは赤で表示
                    context.strokeStyle = "rgba(0,255,0,0.5)";
                    context.fillStyle = "rgba(0,255,0,0.5)";
                    draw_vector(this.x, this.y, this.frx, this.fry); //斥力ベクトルは緑で表示
                    context.strokeStyle = "rgba(0,0,255,0.5)";
                    context.fillStyle = "rgba(0,0,255,0.5)";
                    draw_vector(this.x, this.y, this.fmx, this.fmy); //磁力ベクトルは青で表示
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
            // //グラフの描画をするための変数
            // var canvas = document.getElementById("cv");
            // var context = canvas.getContext("2d");
            // context.font = "italic 50px Arial";
            // graph_g.draw(context);
            move_dots(dots);
            focus_calculate(dots);
            //画面に描画
            // context.clearRect(0, 0, 3200, 1800);
            // graph_g.draw(context);
            //コンソール画面に表示
            console.log("graph_g = ");
            console.log(graph_g);
            //計算した座標をgraphに書きこんでいく
            for (var i = 0; i < ObjectIDs.length; i++) {
                graph.setLocation(ObjectIDs[i], dots[i].x, dots[i].y);
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
