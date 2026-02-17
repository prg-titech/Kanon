__$__.Traverse = {
    literals: {
        boolean: true,
        number: true,
        string: true,
        symbol: true
    },
    
    
    traverse: function(objs, variables = {}) {
        let retGraph = new __$__.StoredGraphFormat.Graph();
        let graphNodes = {};

        // 【追加 1】 オブジェクトIDから変数名を引くためのマップを作成
        // 例: { "object-id-123": "stack", "object-id-456": "list" }
        let idToVarName = {};
        Object.keys(variables).forEach(key => {
            if (variables[key] && variables[key].__id) {
                // 同じオブジェクトを指す変数が複数ある場合、後勝ちになりますが、
                // 可視化の目的上は主要な変数が取れればOKとします
                idToVarName[variables[key].__id] = key;
            }
        });

        for (let i = 0; i < objs.length; i++) {
            let obj = objs[i];
    
            if (graphNodes[obj.__id] || obj === null || obj === undefined)
                continue;
    
            __$__.Traverse.dfs(retGraph, obj, graphNodes, objs, idToVarName);
        }

        Object.keys(variables).forEach(key => {
            if (variables[key] && variables[key].__id/* && graphNodes[variables[key].__id]*/) {
                let tempNode = new __$__.StoredGraphFormat.VariableNode(key);
                let tempEdge = new __$__.StoredGraphFormat.Edge(tempNode.id, variables[key].__id, key);

                retGraph.pushNode(tempNode);
                retGraph.pushEdge(tempEdge);
            }
        });


        return retGraph;
    },
    
    dfs: function(graph, obj, graphNodes, objs, variableMap) {
        let node;
        if (obj.__id && !graphNodes[obj.__id]) {
            node = new __$__.StoredGraphFormat.Node(
                obj.__id,
                obj.__ClassName__ || obj.constructor.name,
                false,
                typeof obj
            );
            graph.pushNode(node);
            graphNodes[obj.__id] = obj;
        } else {
            return;
        }
    
        Object.keys(obj).forEach(key => {
            // Don't search if the head of property name is "__"
            if (key.slice(0, 2) === '__')
                return;

            // "to" is destination of edge
            let to = obj[key];
    
            if (typeof to !== "function" && to !== null && to !== undefined) {
                // エッジの出発点（ソース）IDを決める
                // デフォルトは親オブジェクト自身
                let edgeSourceID = obj.__id;
                let edgeDisplayLabel = key;

                // ★ 配列の場合の特別処理を追加
                if (Array.isArray(obj)) {
                    // スロット用ノードID: "親ID-インデックス-array"
                    let slotID = obj.__id + '-' + key + '-array';
                
                    // スロットノードを作成 (変数のような扱いにするため type='variable' としておく)
                    let slotNode = new __$__.StoredGraphFormat.Node(
                        slotID,
                        '',
                        false, 
                        'variable'
                    );

                    // スロットノードをグラフに追加
                    graph.pushNode(slotNode);

                    // エッジの出発点をこのスロットノードに変更
                    edgeSourceID = slotID;
                    let varPrefix = (variableMap && variableMap[obj.__id]) ? variableMap[obj.__id] : '';
                    edgeDisplayLabel = varPrefix + '[' + key + ']';
                }

                if (__$__.Traverse.literals[typeof to]) { // if "to" is literal
                    let literalNodeID = obj.__id + '-' + key;
                    let literalNode = new __$__.StoredGraphFormat.Node(
                        literalNodeID,
                        to,
                        true,
                        typeof to
                    );

                    graph.pushNode(literalNode);
                    graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                        edgeSourceID,
                        literalNodeID,
                        key,
                        edgeDisplayLabel
                    ));
                } else {
                    if (!to.__id) Object.setProperty(to, '__id' , obj.__id + '-' + key);
                    __$__.Traverse.dfs(graph, to, graphNodes, objs, variableMap);

                    graph.pushEdge(new __$__.StoredGraphFormat.Edge(
                        edgeSourceID,
                        to.__id,
                        key,
                        edgeDisplayLabel
                    ));
                }
            }
        });
    }
};
