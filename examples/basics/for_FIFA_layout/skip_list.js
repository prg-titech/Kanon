/*　スキップリスト　*/

//参考URL：https://www.usna.edu/Users/cs/roche/courses/s16si486h/probs/skiplist.php?f=SkipList.java

/**
 * ノードに設定されるレベルを0~30でランダムに算出する
 * @returns {number} 算出されたノードレベル
 */
function getLevel(){
    var level, n, m;
    level = 0;
    n = Math.floor(Math.random() * Math.pow(2, 31));
    m = 1;
    while((n & m) != 0){
        m = m + m;
        level += 1;
    }
    return level;
}

// for(var i = 0; i < 10; i++){
//     console.log(getLevel());
// }



/*------------
    配列ver
-------------*/
class Tower {
    constructor(key){
        this.key = key;
        this.array = null;
    }

    makeArray(num){
        this.array = new Array(num);
    }
}

/**
 * 1から10までのスキップノードを生成する
 * 各ノードの配列の長さはgetLevel()でランダムに決められる
 * @return {Tower} スキップリストの先頭ノード
 */
function makeSkipList(num){
    var levels = new Array(num);
    var maxLevel = 1;
    for(var i = 0; i < num; i++){
        levels[i] = getLevel() + 1;
        if(maxLevel < levels[i]){
            maxLevel = levels[i];
        }
    }
    console.log("levels[] = ");
    console.log(levels);
    console.log("maxLevel = ");
    console.log(maxLevel);

    /**
     * 先頭ノードと終点ノードを作成
     * 配列の長さは最大レベルと同じにする
     */
    var head = new Tower("head");
    var tail = new Tower("tail");
    head.makeArray(maxLevel);
    tail.makeArray(maxLevel);

    var SkipListArray = new Array(num + 2);
    SkipListArray[0] = head;
    SkipListArray[num + 1] = tail;

    for(var i = num; i >= 0; i--){
        if(i != 0){
            SkipListArray[i] = new Tower(i);
            SkipListArray[i].makeArray(levels[i - 1]);
        }
        for(var j = 0; j < levels[i - 1]; j++){
            for(var k = i + 1; k < num + 2; k++){
                if(SkipListArray[k].array.length >= j + 1){
                    // console.log("i = " + i);
                    // console.log("k = " + k);
                    // console.log("SkipListArray[k].array.length = " + SkipListArray[k].array.length);
                    // console.log("j = " + j);
                    // console.log("\n");
                    SkipListArray[i].array[j] = SkipListArray[k];
                    break;
                }
            }
        }
        if(i == 0){
            for(var j = 0; j < maxLevel; j++){
                for(var k = i + 1; k < num + 2; k++){
                    if(SkipListArray[k].array.length >= j + 1){
                        SkipListArray[i].array[j] = SkipListArray[k];
                        break;
                    }
                }
            }
        }
    }   

    console.log(SkipListArray);
    SkipListArray.length = 0;

    return head;
}

/*------------
    リストver
-------------*/
// class Tower {
//     constructor(key){
//         this.key = key;
//         this.flinks = null;
//     }

//     makeList(num){
//         if(this.flinks == null){
//             this.flinks = new Links(null);
//             for(var i = 0; i < num - 1; i++){
//                 this.flinks.addTail(null);
//             }
//         }
//     }

//     flinksLength(){
//         if(this.flinks == null){
//             return 0;
//         } else {
//             return this.flinks.length();
//         }
//     }

//     //flinksのi番目の要素にlinkを格納する。ただし、先頭は0番目とする。
//     storageVal(i, link){
//         this.flinks.storage(i, link);
//     }

//     //flinksのi番目の要素を返す。ただし、先頭は0番目とする。
//     return_iList(i){
//         return this.flinks.iList(i);
//     }
// }

// class Links {
//     constructor(link){
//         this.link = link;
//         this.next = null;
//     }

//     addTail(link){
//         if(this.next == null){
//             this.next = new Links(link);
//         } else {
//             this.next.addTail(link);
//         }
//     }

//     length(){
//         if(this.next == null){
//             return 1;
//         } else {
//             return this.next.length() + 1;
//         }
//     }

//     //flinksのi番目の要素にlinkを格納する。ただし、先頭は0番目とする。
//     storage(i, link){
//         if(i == 0){
//             this.link = link;
//         } else if(i > 0 && this.next != null){
//             this.next.storage(i - 1, link);
//         } else {
//             throw "flinks length over!!";
//         }
//     }

//     //flinksのi番目の要素を返す。ただし、先頭は0番目とする。
//     iList(i){
//         if(i == 0){
//             return this;
//         } else if(i > 0 && this.next != null){
//             return this.next.iList(i - 1);
//         } else {
//             throw "flinks length over!!";
//         }
//     }
// }

// /**
//  * 1から10までのスキップノードを生成する
//  * 各ノードの配列の長さはgetLevel()でランダムに決められる
//  * @return {Tower} スキップリストの先頭ノード
//  */
// function makeSkipList(num){
//     var levels = new Array(num);
//     var maxLevel = 1;
//     for(var i = 0; i < num; i++){
//         levels[i] = getLevel() + 1;
//         if(maxLevel < levels[i]){
//             maxLevel = levels[i];
//         }
//     }
//     console.log("levels[] = ");
//     console.log(levels);
//     console.log("maxLevel = ");
//     console.log(maxLevel);

//     /**
//      * 先頭ノードと終点ノードを作成
//      * 配列の長さは最大レベルと同じにする
//      */
//     var head = new Tower("head");
//     var tail = new Tower("tail");
//     head.makeList(maxLevel);
//     tail.makeList(maxLevel);

//     var SkipListArray = new Array(num + 2);
//     SkipListArray[0] = head;
//     SkipListArray[num + 1] = tail;

//     for(var i = num; i >= 0; i--){
//         if(i != 0){
//             SkipListArray[i] = new Tower(i);
//             SkipListArray[i].makeList(levels[i - 1]);
//         }
//         for(var j = 0; j < levels[i - 1]; j++){
//             for(var k = i + 1; k < num + 2; k++){
//                 if(SkipListArray[k].flinksLength() >= j + 1){
//                     // console.log("i = " + i);
//                     // console.log("k = " + k);
//                     // console.log("SkipListArray[k].array.length = " + SkipListArray[k].array.length);
//                     // console.log("j = " + j);
//                     // console.log("\n");
//                     SkipListArray[i].storageVal(j, SkipListArray[k]);
//                     //SkipListArray[i].storageVal(j, SkipListArray[k].return_iList(j));
//                     break;
//                 }
//             }
//         }
//         if(i == 0){
//             for(var j = 0; j < maxLevel; j++){
//                 for(var k = i + 1; k < num + 2; k++){
//                     if(SkipListArray[k].flinksLength() >= j + 1){
//                         SkipListArray[i].storageVal(j, SkipListArray[k]);
//                         //SkipListArray[i].storageVal(j, SkipListArray[k].return_iList(j));
//                         break;
//                     }
//                 }
//             }
//         }
//     }   

//     console.log(SkipListArray);
//     SkipListArray.length = 0;
// }

let slist = makeSkipList(4);