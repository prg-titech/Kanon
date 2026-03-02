window.VariableHistoryView = {
    targetVariableName: "stack", 

    COLORS: [
        { border: '#FF1493', background: '#FF69B4' }, // 0: 現在
        { border: '#FF69B4', background: '#FFB6C1' }, // 1: 1つ前
        { border: '#FFB6C1', background: '#FFC0CB' }, // 2: 2つ前
        { border: '#FFC0CB', background: '#FFE4E1' }, // 3: 3つ前
        { border: '#FFE4E1', background: '#FFF0F5' }  // 4: 4つ前
    ],

    //前回集合 / 消えた要素の年齢(1..4)
    //prevSet: null,          // Set<string>
    //removedAges: new Map(), // Map<string, number>

    removeArrayNodes: function(visGraph) {
        const removalIds = new Set();
        visGraph.nodes = visGraph.nodes.filter(node => {
            if (node.shape === 'box') {
                removalIds.add(node.id);
                return false; 
            }
            return true;
        });
        visGraph.edges = visGraph.edges.filter(edge => {
            return !removalIds.has(edge.from) && !removalIds.has(edge.to);
        });
    },

    //配列かどうかの判定
    updateTargetType: function(visGraph) {
        const target = this.targetVariableName;
        const varEdge = visGraph.edges.find(e => e.from && e.from.includes(`Variable-${target}`));
        
        if (varEdge && varEdge.to) {
            this.targetIsArray = varEdge.to.includes('arr');
            return varEdge;
        }
        this.targetIsArray = false;
        return null;
    },
    
    applyColorsToVisData: function(visGraph) {
        if (!__$__.Context || !__$__.Context.getVarTarget) return;

        const varEdge = this.updateTargetType(visGraph);

        // 取れないなら「配列じゃない」とみなして単一変数側を実行
        if (!varEdge) {
            this.targetIsArray = false;
            this.highlightSingleVariableHistory(visGraph);
            return;
        }

        if (this.targetIsArray) this.highlightStackHistory(visGraph);
        else this.highlightSingleVariableHistory(visGraph);
    },

    getGraphAt: function(cpID, contextID) {
        const g = __$__.Context && __$__.Context.StoredGraph;
        if (!g) return null;
        const cp = g[cpID];
        if (!cp) return null;
        return cp[contextID] || cp[String(contextID)] || null;
    },

    getArrayContentsSetFromGraph: function(graphObj, arrayNodeID) {
        if (!graphObj || !Array.isArray(graphObj.edges)) return new Set();

        const nodesObj = graphObj.nodes || {}; // StoredGraphのgraphには nodes がある
        const isBox = (id) => nodesObj[id] && nodesObj[id].shape === 'box';

        // from が arrayNodeID（またはprefix）に一致する edge を列挙
        const outgoing = (fromId) => {
            const res = [];
            for (const e of graphObj.edges) {
                const from = e.from, to = e.to;
                if (!from || !to) continue;
                if (from === fromId || (typeof from === "string" && from.startsWith(fromId))) {
                    res.push(to);
                }
            }
            return res;
        };

        const result = new Set();

        // 1段目：arr から出る先を集める
        const first = outgoing(arrayNodeID);

        for (const to1 of first) {
            if (isBox(to1)) {
                // 2段目：boxの先を要素として採用
                const second = outgoing(to1);
                for (const to2 of second) {
                    result.add(to2);
                }
            } else {
                // 直接 Node ならそのまま採用
                result.add(to1);
            }
        }

        return result;
    },

    setEquals: function(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        if (a.size !== b.size) return false;
        for (const x of a) if (!b.has(x)) return false;
        return true;
    },
    paintNode: function(node, idx) {
        const c = this.COLORS[idx];
        node.color = {
            border: c.border,
            background: c.background,
            highlight: { border: c.border, background: c.background },
            hover: { border: c.border, background: c.background }
        };
    },

    collectSnapshotsByTimeCounter: function() {
        const stored = __$__.Context && __$__.Context.StoredGraph;
        const snap = __$__.Context && __$__.Context.SnapshotContext;
        if (!stored || !snap) return [];

        // 例: "main-call10-FunctionExpression3-WhileStatement1-2"
        const curCtx = String(snap.contextSensitiveID);

        // main-call10 の部分だけを取り出す（あなたのルールに合わせて調整可）
        const m = curCtx.match(/^(main-call\d+)/);
        const callPrefix = m ? m[1] : curCtx;

        const snaps = [];
        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const ctxID of Object.keys(contexts)) {
            // main-call10 で始まるものだけ集める
            if (!String(ctxID).startsWith(callPrefix)) continue;

            const g = contexts[ctxID];
            if (!g) continue;

            snaps.push({ cpID, contextID: String(ctxID), g, timeCounter: g.timeCounter ?? 0 });
        }
    }

        snaps.sort((a,b) => (a.timeCounter ?? 0) - (b.timeCounter ?? 0));
        return snaps;
        },

    // graphObj(variableEdges)から targetVariableName が指す配列ノードIDを取る
    getArrayNodeIdFromGraph: function(graphObj) {
        if (!graphObj || !Array.isArray(graphObj.variableEdges)) return null;

        const target = this.targetVariableName;
        // fromが "__Variable-<name>" の場合が多いが、label でも拾えるようにする
        const varKey = `__Variable-${target}`;

        const e = graphObj.variableEdges.find(v =>
            v.from === varKey || v.label === target || v.displayLabel === target
        );

        return e && e.to ? String(e.to) : null;
    },

    highlightStackHistory: function (visGraph) {
        const currentSnapshot = __$__.Context.SnapshotContext;
        if (!currentSnapshot || currentSnapshot.cpID === undefined) return;

        const contextID = String(currentSnapshot.contextSensitiveID);

        // 1) 同一contextのスナップショットを timeCounter 昇順で集める
        const snaps = this.collectSnapshotsByTimeCounter(contextID);
        if (snaps.length === 0) return;

        // 2) “現在の” timeCounter を StoredGraph から取る
        const currentGraphObj = this.getGraphAt(currentSnapshot.cpID, currentSnapshot.contextSensitiveID);
        const currentTime = currentGraphObj ? (currentGraphObj.timeCounter ?? null) : null;

        // 3) 現在時刻まで走査して「現在集合」と「消えた要素の年齢」を決定的に求める
        let prevSet = null;
        const removedAges = new Map(); // nodeID -> age(1..4)
        let currentSet = new Set();

        for (const s of snaps) {
            if (currentTime !== null && (s.timeCounter ?? 0) > currentTime) break;

            // ===== ① arrayNodeID が取れてるか確認 =====
            const arrayNodeID = this.getArrayNodeIdFromGraph(s.g);
            if (!arrayNodeID) {
                continue;
            }

            if (!String(arrayNodeID).includes("arr")) {
                // stack が配列を指していないと判定されたスナップショット
                continue;
            }

            const nextSet = this.getArrayContentsSetFromGraph(s.g, arrayNodeID);

            // ===== ② changed と prevSet.size/nextSet.size を確認 =====
            const changed = (prevSet !== null) ? !this.setEquals(prevSet, nextSet) : true;

            // changed のとき or 現在スナップショットのときだけ出す（ログが増えすぎないように）
            // if (changed || ((s.timeCounter ?? 0) === currentTime)) {
            //     console.log("[VHV] step",
            //         "time", s.timeCounter, "cp", s.cpID,
            //         "prevSize", prevSet ? prevSet.size : null,
            //         "nextSize", nextSet.size,
            //         "changed", changed
            //     );
            // }

            if (changed && prevSet) {
                // (1) 既存 removed を進める（変化があった時だけ）
                for (const [id, age] of removedAges.entries()) {
                    if (!nextSet.has(id)) removedAges.set(id, Math.min(age + 1, 4));
                }

                // (2) 今回消えたものを age=1 で追加
                for (const id of prevSet) {
                    if (!nextSet.has(id) && !removedAges.has(id)) removedAges.set(id, 1);
                }
            }

            // 戻ってきた要素は removed から外す（0が勝つ）
            for (const id of nextSet) {
                if (removedAges.has(id)) removedAges.delete(id);
            }

            prevSet = nextSet;
            currentSet = nextSet;
        }

        // 4) 色付け（0=現在集合、1..4=消えたもの）
        const nodeMap = new Map();
        visGraph.nodes.forEach(n => nodeMap.set(n.id, n));

        for (const id of currentSet) {
            const node = nodeMap.get(id);
            if (node) this.paintNode(node, 0);
        }

        for (const [id, age] of removedAges.entries()) {
            const node = nodeMap.get(id);
            if (node) this.paintNode(node, age);
        }

    },
    highlightSingleVariableHistory: function(visGraph) {
        const currentSnapshot = __$__.Context.SnapshotContext;
        if (!currentSnapshot || currentSnapshot.cpID === undefined) return;

        const history = __$__.Context.getVarTarget(this.targetVariableName);
        if (!history || history.length === 0) return;

        const n = this.findCurrentIndex(history, currentSnapshot.cpID, currentSnapshot.contextSensitiveID);
        if (n === -1) return;

        const nodeMap = new Map();
        visGraph.nodes.forEach(node => nodeMap.set(node.id, node));

        for (let i = 0; i <= n; i++) {
            const node = nodeMap.get(history[i].nodeID);
            if (node) {
                let diff = n - i;
                if (diff > 4) 
                    diff = 4;
                    //continue;
                const colorSet = this.COLORS[diff];
                node.color = {
                    border: colorSet.border,
                    background: colorSet.background,
                    highlight: { border: colorSet.border, background: colorSet.background },
                    hover: { border: colorSet.border, background: colorSet.background }
                };
            }
        }
        console.log("cpID", currentSnapshot.cpID, "parsed", parseInt(currentSnapshot.cpID,10));
    },

    findCurrentIndex: function(history, currentCPID, currentContextID) {
        let bestIndex = -1;
        const currentCpNum = parseInt(currentCPID, 10);
        for (let i = 0; i < history.length; i++) {
            const item = history[i];
            if (item.contextID !== currentContextID) continue;
            const itemCpNum = parseInt(item.cpID, 10);
            if (!isNaN(itemCpNum) && itemCpNum <= currentCpNum) bestIndex = i;
        }
        return bestIndex;
    }
    
};

// Hook処理（あなたのまま）
(function() {
    const hookInterval = setInterval(() => {
        if (typeof __$__ !== 'undefined' && 
            __$__.StoredGraphFormat && 
            __$__.StoredGraphFormat.Graph && 
            __$__.StoredGraphFormat.Graph.prototype.generateVisjsGraph) {
            
            clearInterval(hookInterval);
            
            const GraphProto = __$__.StoredGraphFormat.Graph.prototype;
            const originalGenerateVisjsGraph = GraphProto.generateVisjsGraph;

            GraphProto.generateVisjsGraph = function() {
                const visGraph = originalGenerateVisjsGraph.apply(this, arguments);
                try {
                    if (window.VariableHistoryView) {
                        window.VariableHistoryView.removeArrayNodes(visGraph);
                        window.VariableHistoryView.applyColorsToVisData(visGraph);
                    }
                } catch (e) {
                    console.error("View modification failed:", e);
                }
                return visGraph;
            };
        }
    }, 100);
})();


window.AnimationController = {
    timerId: null,
    changedSnapshots: [], 
    currentIndex: 0,
    interval: 800,
    fixedPositions: null, // 確定した座標を保持

    init: function() {
        this.createUI();
    },

    getSignature: function(snap, targetName, isTargetArray) {
        // 変数の参照先（配列ノードID）を取る：VariableHistoryView と揃えて label で探す
        const varEdge = (snap.variableEdges || []).find(e => e.label === targetName);
        const targetID = varEdge ? varEdge.to : "null";

        if (!isTargetArray) {
            return `VAR:${targetID}`;
        }
        if (targetID === "null") {
            return "ARRAY:null";
        }

        const set = window.VariableHistoryView.getArrayContentsSetFromGraph(snap, targetID);
        const arr = Array.from(set).sort();

        return `ARRAY:${targetID}:${arr.join(",")}`;
    },

    preprocess: function () {
        const targetName = window.VariableHistoryView.targetVariableName;
        const isTargetArray = !!window.VariableHistoryView.targetIsArray;

        const stored = __$__.Context.StoredGraph;

        // 1) 全snapshot抽出
        const snaps = [];
        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const contextID of Object.keys(contexts)) {
                const snap = contexts[contextID];
                if (!snap) continue;
                snaps.push({ cpID, contextID, snap });
            }
        }

        // 2) timeCounter順
        snaps.sort((a, b) => (a.snap.timeCounter ?? 0) - (b.snap.timeCounter ?? 0));

        // 3) 変化点抽出（signatureで比較）
        this.changedSnapshotKeys = [];
        this.changedSnapshotDebug = [];

        let lastSig = "";

        for (const { cpID, contextID, snap } of snaps) {
            const sig = this.getSignature(snap, targetName, isTargetArray);
            const changed = sig !== lastSig;

            if (changed) this.changedSnapshotKeys.push({ cpID, contextID });

            this.changedSnapshotDebug.push({
                cpID,
                contextID,
                timeCounter: snap.timeCounter,
                signature: sig,
                changed
            });

            lastSig = sig;
        }
    },
    start() {
        this.preprocess();
        this.currentIndex = 0;
        this.showFrame(this.currentIndex);

        this.stop(); // 多重起動防止
        this.timerId = setInterval(() => this.step(), this.interval);
    },

    stop() {
        if (this.timerId) clearInterval(this.timerId);
            this.timerId = null;
    },

    step() {
        this.currentIndex++;
            if (this.currentIndex >= this.changedSnapshotKeys.length) {
                this.stop();
            return;
            }
        this.showFrame(this.currentIndex);
    },

    showFrame(i) {
        const key = this.changedSnapshotKeys[i];
        const snap = __$__.Context.StoredGraph[key.cpID][key.contextID];
        this.applySnapshot(snap, key);

        this.statusLabel.innerText = `Frame ${i+1}/${this.changedSnapshotKeys.length}`;
    },

    applySnapshot(snap, key) {
  
    },

    createUI: function() {
        const old = document.getElementById('animation-panel');
        if (old) old.remove();
        const container = document.createElement('div');
        container.id = 'animation-panel';
        Object.assign(container.style, {
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10000, background: 'white', padding: '10px 20px', borderRadius: '30px',
            display: 'flex', gap: '15px', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #FF69B4'
        });
        this.statusLabel = document.createElement('span');
        this.statusLabel.innerText = "Ready";
        const playBtn = document.createElement('button');
        playBtn.innerText = "▶ Play Animation";
        playBtn.onclick = () => this.start();
        container.appendChild(this.statusLabel);
        container.appendChild(playBtn);
        document.body.appendChild(container);
    }
};
window.AnimationController.init();
// window.VariableHistoryView();