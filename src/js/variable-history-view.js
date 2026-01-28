console.log("★ variable-history-view.js (Execution Order Ver) Loaded");

window.VariableHistoryView = {
    targetVariableName: "current",

    COLORS: [
        { border: '#FF1493', background: '#FF69B4' }, // 0: 現在
        { border: '#FF69B4', background: '#FFB6C1' }, // 1: 1つ前
        { border: '#FFB6C1', background: '#FFC0CB' }, // 2: 2つ前
        { border: '#FFC0CB', background: '#FFE4E1' }, // 3: 3つ前
        { border: '#FFE4E1', background: '#FFF0F5' }  // 4: 4つ前
    ],

    applyColorsToVisData: function(visGraph) {
        if (!__$__.Context || !__$__.Context.getVarTarget) return;

        const currentSnapshot = __$__.Context.SnapshotContext;
        if (!currentSnapshot || currentSnapshot.cpID === undefined) return;

        // 1. 履歴データを取得（sortせずにそのまま使う！）
        // これが実行時の時系列（Trace）そのものです
        const history = __$__.Context.getVarTarget(this.targetVariableName);
        if (!history || history.length === 0) return;

        const currentCPID = currentSnapshot.cpID;
        const currentContextID = currentSnapshot.contextSensitiveID;
        
        // 2. 履歴の中から「現在のスナップショット」に該当するインデックス(n)を探す
        const n = this.findCurrentIndex(history, currentCPID, currentContextID);
        
        if (n === -1) {
            // 見つからない場合（まだ代入が一度も起きていない時点など）は終了
            return;
        }

        // --- 色塗り処理 ---
        const nodeMap = new Map();
        visGraph.nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });

        // 3. 履歴配列のインデックスを使って色を塗る
        // n が現在。n-1 が1つ前の実行時点、n-2 が2つ前... となります
        for (let i = 0; i <= n; i++) {
            const historyItem = history[i];
            const node = nodeMap.get(historyItem.nodeID);

            if (node) {
                // n (現在) からの距離
                let diff = n - i;
                
                // 5つ以上前はスキップ
                if (diff > 4) continue;
                // 4つ前より古いものは全て一番薄い色
                //if (diff > 4) diff = 4; 

                const colorSet = this.COLORS[diff];
                node.color = {
                    border: colorSet.border,
                    background: colorSet.background,
                    highlight: { border: colorSet.border, background: colorSet.background },
                    hover: { border: colorSet.border, background: colorSet.background }
                };
            }
        }
    },

    /**
     * 現在のスナップショット(ContextID, cpID)が、
     * 実行履歴配列(history)の「何番目」の状態なのかを特定する
     */
    findCurrentIndex: function(history, currentCPID, currentContextID) {
        let bestIndex = -1;
        const currentCpNum = parseInt(currentCPID, 10);

        // 配列は「昔→今」の順に並んでいる前提で走査
        for (let i = 0; i < history.length; i++) {
            const item = history[i];
            
            // 1. まずコンテキスト（関数呼び出しやループの特定回）が一致するものだけに絞る
            // ※ContextIDはユニークなので、これで「実行中のこの瞬間」の履歴だけが見つかります
            if (item.contextID !== currentContextID) continue;

            const itemCpNum = parseInt(item.cpID, 10);
            
            // 2. そのコンテキスト内で、現在のCP（プログラムカウンタ）以前のログを探す
            if (!isNaN(itemCpNum) && !isNaN(currentCpNum)) {
                if (itemCpNum <= currentCpNum) {
                    // 条件に合う中で、一番後ろにあるもの（＝最新）が「現在の状態」
                    bestIndex = i;
                }
            }
        }
        return bestIndex;
    }
};

// Hook処理
(function() {
    const hookInterval = setInterval(() => {
        if (typeof __$__ !== 'undefined' && 
            __$__.StoredGraphFormat && 
            __$__.StoredGraphFormat.Graph && 
            __$__.StoredGraphFormat.Graph.prototype.generateVisjsGraph) {
            
            clearInterval(hookInterval);
            console.log("[VariableHistoryView] Hook installed.");

            const GraphProto = __$__.StoredGraphFormat.Graph.prototype;
            const originalGenerateVisjsGraph = GraphProto.generateVisjsGraph;

            GraphProto.generateVisjsGraph = function(nodeFixed) {
                const visGraph = originalGenerateVisjsGraph.apply(this, arguments);
                try {
                    if (window.VariableHistoryView) {
                        window.VariableHistoryView.applyColorsToVisData(visGraph);
                    }
                } catch (e) {
                    console.error("History coloring failed:", e);
                }
                return visGraph;
            };
        }
    }, 100);
})();