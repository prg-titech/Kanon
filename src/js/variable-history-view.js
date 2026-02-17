window.VariableHistoryView = {
    targetVariableName: "stack", 

    COLORS: [
        { border: '#FF1493', background: '#FF69B4' },
        { border: '#FF69B4', background: '#FFB6C1' },
        { border: '#FFB6C1', background: '#FFC0CB' },
        { border: '#FFC0CB', background: '#FFE4E1' },
        { border: '#FFE4E1', background: '#FFF0F5' } 
    ],

    STACK_COLOR: { 
        border: '#FF1493', 
        background: '#FFC0CB',
        highlight: { border: '#FF1493', background: '#FFC0CB' },
        hover: { border: '#FF1493', background: '#FFC0CB' }
    },

    applyColorsToVisData: function(visGraph) {
        if (!__$__.Context) return;
        const target = this.targetVariableName || 'stack';
        
        if (target === 'stack') {
            this.highlightStackContents(visGraph);
        } else {
            this.highlightSingleVariableHistory(visGraph);
        }
    },

    /**
     * 【修正版】ID文字列に依存せず、グラフのつながりでStackの中身を特定する
     */
    highlightStackContents: function(visGraph) {
        // 1. "stack" 変数が指している配列ノード(Array)を探す
        const stackEdge = visGraph.edges.find(e => e.from === '__Variable-stack');
        if (!stackEdge) return;

        const arrayNodeID = stackEdge.to; 
        const contentNodeIDs = new Set();

        // 2. その配列ノード(Array)から伸びている矢印をすべて探す
        // Kanonの内部実装が変わっても追従できるよう、fromが一致するものを全て取得
        visGraph.edges.forEach(edge => {
            // エッジの始点が配列ノードであれば、その先は要素であるとみなす
            if (edge.from === arrayNodeID) {
                contentNodeIDs.add(edge.to);
            }
            // 念のため、古いIDルール(main-new1-array-0など)もカバー
            else if (edge.from.startsWith(arrayNodeID)) {
                contentNodeIDs.add(edge.to);
            }
        });

        // 3. 特定したノードをピンクにする
        visGraph.nodes.forEach(node => {
            if (contentNodeIDs.has(node.id)) {
                node.color = this.STACK_COLOR;
            }
        });
    },

    highlightSingleVariableHistory: function(visGraph) {
        if (!__$__.Context.getVarTarget) return;

        const currentSnapshot = __$__.Context.SnapshotContext;
        if (!currentSnapshot || currentSnapshot.cpID === undefined) return;

        const history = __$__.Context.getVarTarget(this.targetVariableName);
        if (!history || history.length === 0) return;

        const currentCPID = currentSnapshot.cpID;
        const currentContextID = currentSnapshot.contextSensitiveID;
        
        const n = this.findCurrentIndex(history, currentCPID, currentContextID);
        if (n === -1) return;

        const nodeMap = new Map();
        visGraph.nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });

        for (let i = 0; i <= n; i++) {
            const historyItem = history[i];
            const node = nodeMap.get(historyItem.nodeID);

            if (node) {
                let diff = n - i;
                if (diff > 4) continue;

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

    findCurrentIndex: function(history, currentCPID, currentContextID) {
        let bestIndex = -1;
        const currentCpNum = parseInt(currentCPID, 10);

        for (let i = 0; i < history.length; i++) {
            const item = history[i];
            if (item.contextID !== currentContextID) continue;
            const itemCpNum = parseInt(item.cpID, 10);
            
            if (!isNaN(itemCpNum) && !isNaN(currentCpNum)) {
                if (itemCpNum <= currentCpNum) {
                    bestIndex = i;
                }
            }
        }
        return bestIndex;
    }
};

window.AnimationController = {
    timer: null,
    playBtn: null,
    stopBtn: null,
    container: null,
    
    // --- 初期化・UI関連 ---
    init: function() {
        const existingContainer = document.getElementById('kanon-animation-container');
        if (existingContainer) existingContainer.remove();
        this.container = document.createElement('div');
        this.container.id = 'kanon-animation-container';
        Object.assign(this.container.style, { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', gap: '10px' });
        document.body.appendChild(this.container);
        this.playBtn = document.createElement('button'); this.playBtn.textContent = '▶ Play Animation'; this.styleButton(this.playBtn, '#007bff'); this.playBtn.onclick = () => this.play(); this.container.appendChild(this.playBtn);
        this.stopBtn = document.createElement('button'); this.stopBtn.textContent = '■ Stop'; this.styleButton(this.stopBtn, '#dc3545'); this.stopBtn.style.display = 'none'; this.stopBtn.onclick = () => this.stop(); this.container.appendChild(this.stopBtn);
    },
    styleButton: function(btn, bgColor) { Object.assign(btn.style, { padding: '10px 20px', fontSize: '16px', fontWeight: 'bold', color: '#fff', backgroundColor: bgColor, border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }); btn.onmouseover = () => btn.style.opacity = '0.8'; btn.onmouseout = () => btn.style.opacity = '1.0'; },
    toggleState: function(isPlaying) { if (this.playBtn && this.stopBtn) { this.playBtn.style.display = isPlaying ? 'none' : 'block'; this.stopBtn.style.display = isPlaying ? 'block' : 'none'; } },
    stop: function() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.toggleState(false); console.log("Animation stopped."); },
    
    // --- 探索・ユーティリティ ---
    findTargetNode: function(root, targetID) { if (root.getContextSensitiveID() === targetID) return root; if (root.children) { for (let child of root.children) { const found = this.findTargetNode(child, targetID); if (found) return found; } } return null; },
    flattenChildrenOrder: function(node, list) { let children = node.children ? [].concat(node.children) : []; while (children.length > 0) { let child = children.shift(); if (child.constructor.name === 'FunctionCall' || child.constructor.name === 'Instance') { if (child.children && child.children.length > 0) { children.unshift(...child.children); } continue; } const ctxID = child.getContextSensitiveID(); if (ctxID) list.push(ctxID); this.flattenChildrenOrder(child, list); } },
    getLineNumber: function(cpID) { if (__$__.Context.CheckPointTable && __$__.Context.CheckPointTable[cpID]) { return __$__.Context.CheckPointTable[cpID].line; } return parseInt(cpID.toString().replace(/\D/g, '')) || 0; },

    // --- 変化検知ロジック ---
    // 色がついているノードのIDと色の組み合わせを指紋にする
    getVisualSignature: function(visNodes) {
        return visNodes
            .filter(n => n.color && n.color.background)
            .map(n => `${n.id}:${n.color.background}`)
            .sort()
            .join('|');
    },

    // --- メイン再生処理 ---
    play: function() {
        const currentSnapshot = __$__.Context.SnapshotContext;
        if (!currentSnapshot || !currentSnapshot.contextSensitiveID) { alert("Please select the method call you want to focus on first."); return; }
        const targetContextID = currentSnapshot.contextSensitiveID;
        const rootNode = __$__.CallTree.rootNode;
        if (!rootNode) { alert("CallTree is empty."); return; }
        const targetNode = this.findTargetNode(rootNode, targetContextID);
        if (!targetNode) { alert("Context not found in CallTree."); return; }

        const graphStorage = __$__.Context.StoredGraph;
        let allSnapshots = [];
        // CP番号順（実行順）にソート
        let traceIDs = Object.keys(graphStorage).map(k => parseInt(k, 10)).sort((a, b) => a - b);
        let relevantContextIDs = [targetContextID];
        let childCtxIDs = [];
        this.flattenChildrenOrder(targetNode, childCtxIDs);
        relevantContextIDs = relevantContextIDs.concat(childCtxIDs);

        // 歴史データの収集
        traceIDs.forEach(cpNum => {
            const cpID = cpNum.toString();
            relevantContextIDs.forEach(ctxID => {
                if (graphStorage[cpID] && graphStorage[cpID][ctxID]) {
                    allSnapshots.push({ cpID: cpID, cpNum: cpNum, contextID: ctxID, graph: graphStorage[cpID][ctxID], line: this.getLineNumber(cpID) });
                }
            });
        });
        
        // 念のため再ソート
        allSnapshots.sort((a, b) => a.cpNum - b.cpNum);
        
        if (allSnapshots.length === 0) { alert("No snapshots found."); return; }

        const filteredTimeline = [];
        let lastSignature = null;
        const targetVarName = window.VariableHistoryView ? window.VariableHistoryView.targetVariableName : 'stack';

        console.group("🔍 Animation Filtering Log (Strict Filter Removed)");

        allSnapshots.forEach((step, index) => {
            const originalCtx = __$__.Context.SnapshotContext;
            __$__.Context.SnapshotContext = { cpID: step.cpID, contextSensitiveID: step.contextID };
            const visData = step.graph.generateVisjsGraph(true);
            window.VariableHistoryView.applyColorsToVisData(visData);
            __$__.Context.SnapshotContext = originalCtx;

            // 1. データ自体が空っぽなら流石にスキップ (エラー防止)
            if (!visData.nodes || visData.nodes.length === 0) {
                return;
            }

            // 2. 見た目の変化（Signature）
            const currentSignature = this.getVisualSignature(visData.nodes);
            
            // 前回と見た目が少しでも違えば抽出
            if (currentSignature !== lastSignature) {
                step.cachedVisData = visData;
                filteredTimeline.push(step);
                lastSignature = currentSignature;
            } else {
                // 全く同じ絵なら重複としてスキップ
                // console.log(`[CP ${step.cpID}] Skipped (Duplicate)`);
            }
        });
        console.groupEnd();

        if (filteredTimeline.length === 0) { alert("No visual changes found for variable: " + targetVarName); return; }
        
        console.log(`🎬 Playing ${filteredTimeline.length} frames`);
        this.toggleState(true);

        // --- スーパーグラフ生成と座標計算 (変更なし) ---
        const superGraph = new __$__.StoredGraphFormat.Graph();
        filteredTimeline.forEach(step => {
            Object.values(step.graph.nodes).forEach(node => { if (!superGraph.nodes[node.id]) superGraph.pushNode(node.duplicate()); });
            Object.values(step.graph.variableNodes).forEach(node => { if (!superGraph.variableNodes[node.id]) superGraph.pushNode(node.duplicate()); });
            const addUniqueEdges = (edges, targetArr) => { edges.forEach(edge => { const exists = targetArr.some(e => e.from === edge.from && e.to === edge.to && e.label === edge.label); if (!exists) targetArr.push(edge.duplicate()); }); };
            addUniqueEdges(step.graph.edges, superGraph.edges);
            addUniqueEdges(step.graph.variableEdges, superGraph.variableEdges);
        });

        if (__$__.Layout && typeof __$__.Layout.setLocation === 'function') { __$__.Layout.setLocation(superGraph); }
        const positionMap = {};
        Object.values(superGraph.nodes).forEach(n => { if(n.x!==undefined) positionMap[n.id] = {x:n.x, y:n.y}; });
        Object.values(superGraph.variableNodes).forEach(n => { if(n.x!==undefined) positionMap[n.id] = {x:n.x, y:n.y}; });

        // --- 再生ループ (変更なし) ---
        let i = 0;
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (i >= filteredTimeline.length) { this.stop(); return; }
            const step = filteredTimeline[i];
            __$__.Context.SnapshotContext = { cpID: step.cpID, contextSensitiveID: step.contextID };
            const visData = step.cachedVisData;
            visData.nodes.forEach(node => { if (positionMap[node.id]) { node.x = positionMap[node.id].x; node.y = positionMap[node.id].y; node.physics = false; } });
            if (__$__.ObjectGraphNetwork && __$__.ObjectGraphNetwork.network) {
                __$__.ObjectGraphNetwork.network.setData({ nodes: new vis.DataSet(visData.nodes), edges: new vis.DataSet(visData.edges) });
                if (i === 0) __$__.ObjectGraphNetwork.network.fit({ animation: { duration: 1000 } });
            }
            i++;
        }, 1000); 
    }
};
(function() {
    const hookInterval = setInterval(() => {
        if (typeof __$__ !== 'undefined' && __$__.StoredGraphFormat) {
            clearInterval(hookInterval);
            const GraphProto = __$__.StoredGraphFormat.Graph.prototype;
            const originalGenerateVisjsGraph = GraphProto.generateVisjsGraph;
            GraphProto.generateVisjsGraph = function(nodeFixed) {
                const visGraph = originalGenerateVisjsGraph.apply(this, arguments);
                try { if (window.VariableHistoryView) window.VariableHistoryView.applyColorsToVisData(visGraph); } catch (e) {}
                return visGraph;
            };
            if (window.AnimationController) window.AnimationController.init();
        }
    }, 100);
})();