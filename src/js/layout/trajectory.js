__$__.Trajectory = {
    draw: function() {
        // 安全チェック
        if (!__$__.ObjectGraphNetwork || !__$__.ObjectGraphNetwork.nodes || !__$__.ObjectGraphNetwork.edges) return;

        var orderNode = __$__.Context.getVarTarget("current");
        if (!orderNode || orderNode.length < 2) return;

        var nodesDataSet = __$__.ObjectGraphNetwork.nodes;
        var edgesDataSet = __$__.ObjectGraphNetwork.edges;
        var runId = Date.now() + "_" + Math.floor(Math.random() * 10000);
        var newEdges = [];

        // console.log("--- ID照合チェック開始 ---");

        // 最初のペアだけチェックして、ログに出す
        var testID = orderNode[0];
        var isExist = nodesDataSet.get(testID);
        
        if (!isExist) {
            
            // 画面にある「正解のID」を3つだけ表示してヒントにする
            var allIds = nodesDataSet.getIds();
            return; // 強制終了
        }

        // データ作成ループ
        var totalEdges = orderNode.length - 1;
        for (var i = 0; i < orderNode.length - 1; i++) {
            var fromID = orderNode[i];
            var toID = orderNode[i + 1];

            // 両方のノードが存在する場合のみ線を作る
            if (nodesDataSet.get(fromID) && nodesDataSet.get(toID)) {
                var alpha = 0.2 + (0.8 * (i / Math.max(totalEdges - 1, 1)));
                var redColor = "rgba(255, 0, 0, " + alpha + ")";

                newEdges.push({
                    id: "traj-" + runId + "-" + i,
                    from: fromID,
                    to: toID,
                    color: { color: redColor }, 
                    width: 4, 
                    arrows: { to: { 
                                enabled: true ,
                                scaleFactor: 1.0 ,
                                type: "arrow" ,
                                color: {color: redColor}
                                },
                    },
                    physics: false,
                    // dashes: true, //点線
                    smooth: { 
                        enabled: true,
                        type: "curvedCW", 
                        roundness: 0.3}
                        // roundness: 0.5 + (i * 0.02) }
                });
            }
        }

        // データ投入
        if (newEdges.length > 0) {
            try {
                edgesDataSet.update(newEdges);
                console.log("✅ 軌跡データ投入完了: " + newEdges.length + "本");
                if (__$__.ObjectGraphNetwork.network) {
                    __$__.ObjectGraphNetwork.network.redraw();
                }
            } catch (e) {
                console.error("描画エラー:", e);
            }
        } else {
            console.warn("⚠️ 描画できるエッジが0本でした（ID不一致の可能性あり）");
        }
    }
};