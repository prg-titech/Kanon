window.VariableHistoryOptions = {
    
    // 変数指定方法
    // "variable" : editor 上で変数を右クリックして指定する現在の方式
    // "object"   : オブジェクトから、その object を参照した変数を指定する方式
    displayMode: "variable",

    // グラデーション方式
    // "time"  : 時系列で濃淡をつける現在の方式
    // "stack" : 配列内の index によって濃淡をつける方式
    gradientMode: "time",

    // 時系列グラデーション時の薄色化方式
    // "all"     : 古い参照も一番薄い色で残す
    // "recent5" : 現在 + 過去4つだけ残す
    fadeMode: "all",

    // stack グラデーション時の濃淡方向
    // "tailDark" : 末尾側、つまり最大 index 側を濃くする
    // "headDark" : 先頭側、つまり最小 index 側を濃くする
    stackShadeMode: "tailDark",

    // step4-11:
    // debug ログをまとめて制御する
    debugMode: false,

    allowedValues: {
        displayMode: new Set(["variable", "object"]),
        gradientMode: new Set(["time", "stack"]),
        fadeMode: new Set(["all", "recent5"]),
        stackShadeMode: new Set(["tailDark", "headDark"])
    },

    getState: function() {
        return {
            displayMode: this.displayMode,
            gradientMode: this.gradientMode,
            fadeMode: this.fadeMode,
            stackShadeMode: this.stackShadeMode
        };
    },

    // ----------------------------
    // step1-4:
    // animation の prepare 判定に使う option key
    // ----------------------------
    getAnimationOptionKey: function() {
        const state = this.getState();

        return [
            `displayMode=${state.displayMode}`,
            `gradientMode=${state.gradientMode}`,
            `fadeMode=${state.fadeMode}`,
            `stackShadeMode=${state.stackShadeMode}`
        ].join(";");
    },

    isValidOptionName: function(optionName) {
        return Object.prototype.hasOwnProperty.call(
            this.allowedValues,
            String(optionName ?? "")
        );
    },

    normalizeOptionValue: function(optionName, value) {
        const name = String(optionName ?? "");
        const v = String(value ?? "").trim();

        if (!this.isValidOptionName(name)) {
            console.warn("[VariableHistoryOptions] unknown option:", optionName);
            return null;
        }

        const allowed = this.allowedValues[name];

        if (!allowed.has(v)) {
            console.warn("[VariableHistoryOptions] invalid option value:", {
                optionName: name,
                value: v,
                allowed: Array.from(allowed)
            });
            return null;
        }

        return v;
    },

    setOption: function(optionName, value, options = {}) {
        const name = String(optionName ?? "");
        const normalized = this.normalizeOptionValue(name, value);

        if (normalized === null) {
            return false;
        }

        const beforeState = this.getState();
        const oldValue = this[name];

        this[name] = normalized;

        // ここで依存関係を整理する
        // 例: 配列変数がないのに stack にしたら time に戻す
        const normalizeResult =
            (typeof this.normalizeState === "function")
                ? this.normalizeState()
                : { changed: false, reasons: [] };

        const afterState = this.getState();

        const actuallyChanged =
            JSON.stringify(beforeState) !== JSON.stringify(afterState);

        if (!actuallyChanged) {
            console.log("[VariableHistoryOptions] unchanged:", {
                requested: { optionName: name, value: normalized },
                state: afterState,
                normalizeResult
            });
            return true;
        }

        console.log("[VariableHistoryOptions] changed:", {
            requested: {
                optionName: name,
                oldValue,
                requestedValue: normalized
            },
            beforeState,
            afterState,
            normalizeResult
        });

        // option が変わったら、古い animation prepare は使えないのでリセットする
        const shouldResetAnimation = options.resetAnimation !== false;
        const shouldRenderUI = options.renderUI !== false;
        const shouldRedraw = options.redraw === true;

        if (shouldResetAnimation) {
            this.resetAnimationState("options changed");
        }

        if (
            shouldRenderUI &&
            window.VariableHistoryOptionsUI &&
            typeof window.VariableHistoryOptionsUI.render === "function"
        ) {
            window.VariableHistoryOptionsUI.render();
        }

        if (shouldRedraw) {
            this.requestRedraw();
        }

        return true;
    },

    requestRedraw: function() {
        if (
            typeof __$__ !== "undefined" &&
            __$__.Update &&
            typeof __$__.Update.ContextUpdate === "function"
        ) {
            __$__.Update.ContextUpdate("changed");
        }
    },

    debugLog: function(...args) {
        if (!this.debugMode) return;
        console.log(...args);
    },

    debugWarn: function(...args) {
        if (!this.debugMode) return;
        console.warn(...args);
    },

    buildAnimationStatusText: function(reason = "updated") {
        const entries =
            window.AnimationController &&
            typeof window.AnimationController.getAnimationSelectionEntries === "function"
                ? window.AnimationController.getAnimationSelectionEntries()
                : (
                    window.VariableHistoryView &&
                    typeof window.VariableHistoryView.getActiveRingSelectionEntries === "function"
                        ? window.VariableHistoryView.getActiveRingSelectionEntries()
                        : []
                );

        if (!entries || entries.length === 0) {
            return "Ready (no variable selected)";
        }

        const label = entries
            .map(entry => `${entry.name}:${entry.paletteKey}`)
            .join(", ");

        const source =
            this.displayMode === "object"
                ? "Object"
                : "Editor";

        return `Ready (selected from ${source}; variables: ${label})`;
    },

    resetAnimationState: function(reason = "updated") {
        const ac = window.AnimationController;
        if (!ac) return false;

        if (typeof ac.stop === "function") {
            ac.stop();
        }

        ac.isPrepared = false;
        ac.isPreparing = false;
        ac.preparedCallPrefix = null;
        ac.preparedTargetName = null;
        ac.preparedSelectionKey = null;
        ac.displayedIndex = -1;
        ac.currentIndex = 0;
        ac.fixedPositions = null;

        if (typeof ac.setPlaybackControlsEnabled === "function") {
            ac.setPlaybackControlsEnabled(false);
        }

        if (ac.playBtn) {
            ac.playBtn.innerText = "▶ Prepare Animation";
            ac.playBtn.disabled = false;
            ac.playBtn.style.opacity = "1";
            ac.playBtn.style.cursor = "pointer";
        }

        if (ac.statusLabel) {
            ac.statusLabel.innerText = this.buildAnimationStatusText(reason);
        }

        return true;
    },

    handleSelectionChanged: function(options = {}) {
        const reason = options.reason || "selection changed";

        const normalizeResult =
            typeof this.normalizeState === "function"
                ? this.normalizeState()
                : { changed: false, reasons: [] };

        if (options.resetAnimation !== false) {
            this.resetAnimationState(reason);
        }

        if (
            window.VariableHistoryOptionsUI &&
            typeof window.VariableHistoryOptionsUI.render === "function"
        ) {
            window.VariableHistoryOptionsUI.render();
        }

        if (options.redraw !== false) {
            this.requestRedraw();
        }

        const result = {
            reason,
            state: this.getState(),
            availability:
                typeof this.getAvailabilityState === "function"
                    ? this.getAvailabilityState()
                    : null,
            normalizeResult
        };

        console.log("[VariableHistoryOptions] selection changed:", result);
        return result;
    },

    // ----------------------------
    // 現在選択されている変数の中に
    // 配列を参照した経験のある変数があるか判定する
    // ----------------------------

    getSelectionEntries: function() {
        const displayMode = this.displayMode || "variable";

        if (
            displayMode === "object" &&
            window.VariableHistoryObjectSelection &&
            typeof window.VariableHistoryObjectSelection.getEntries === "function"
        ) {
            return window.VariableHistoryObjectSelection.getEntries();
        }

        if (
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.getAll === "function"
        ) {
            return window.VariableHistorySelection.getAll();
        }

        const single =
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.get === "function"
                ? window.VariableHistorySelection.get()
                : null;

        if (!single) return [];

        return [{
            slot: "primary",
            name: String(single),
            paletteKey: "pink",
            layerRole: "main-fill"
        }];
    },

    getCurrentContextID: function() {
        return String(__$__.Context?.SnapshotContext?.contextSensitiveID ?? "");
    },

    getHistoryGroupKey: function(contextID) {
        const s = String(contextID ?? "");
        const m = s.match(/^(main-call\d+)/);
        return m ? m[1] : s;
    },

    collectCurrentGroupSnapshots: function() {
        const stored = __$__.Context?.StoredGraph;
        const snap = __$__.Context?.SnapshotContext;

        if (!stored || !snap) return [];

        const currentGroupKey = this.getHistoryGroupKey(snap.contextSensitiveID);
        const result = [];

        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const contextID of Object.keys(contexts)) {
                const groupKey = this.getHistoryGroupKey(contextID);
                if (groupKey !== currentGroupKey) continue;

                const graphObj = contexts[contextID];
                if (!graphObj) continue;

                result.push({
                    cpID: String(cpID),
                    contextID: String(contextID),
                    graphObj,
                    timeCounter: graphObj.timeCounter ?? null
                });
            }
        }

        result.sort((a, b) => (a.timeCounter ?? 0) - (b.timeCounter ?? 0));
        return result;
    },

    variableEdgeMatchesName: function(edge, variableName) {
        const target = String(variableName ?? "");
        if (!target) return false;

        const varKey1 = `__Variable-${target}`;
        const varKey2 = `Variable-${target}`;

        return (
            edge.from === varKey1 ||
            edge.from === varKey2 ||
            edge.label === target ||
            edge.displayLabel === target
        );
    },

    getVariableTargetIdFromGraph: function(graphObj, variableName) {
        if (!graphObj || !Array.isArray(graphObj.variableEdges)) return null;

        const edge = graphObj.variableEdges.find(e =>
            this.variableEdgeMatchesName(e, variableName)
        );

        return edge && edge.to ? String(edge.to) : null;
    },

    variableHasArrayInGraph: function(graphObj, variableName) {
        const targetId = this.getVariableTargetIdFromGraph(graphObj, variableName);
        return !!targetId && targetId.includes("arr");
    },

    variableHasArrayInCurrentGroup: function(variableName) {
        const name = String(variableName ?? "").trim();
        if (!name) return false;

        const snaps = this.collectCurrentGroupSnapshots();

        for (const s of snaps) {
            if (this.variableHasArrayInGraph(s.graphObj, name)) {
                return true;
            }
        }

        return false;
    },

    hasArraySelection: function() {
        const entries = this.getSelectionEntries();

        if (!entries || entries.length === 0) {
            return false;
        }

        return entries.some(entry =>
            this.variableHasArrayInCurrentGroup(entry.name)
        );
    },

    debugSelectionArrayInfo: function() {
        const entries = this.getSelectionEntries();

        const rows = entries.map(entry => ({
            slot: entry.slot,
            name: entry.name,
            paletteKey: entry.paletteKey,
            hasArrayInCurrentGroup: this.variableHasArrayInCurrentGroup(entry.name)
        }));

        console.table(rows);

        const result = {
            currentContextID: this.getCurrentContextID(),
            currentGroupKey: this.getHistoryGroupKey(this.getCurrentContextID()),
            hasArraySelection: this.hasArraySelection(),
            entries: rows
        };

        console.log("[VariableHistoryOptions] selection array info:", result);
        return result;
    },
    // ----------------------------
    // step0-3:
    // オプション同士の依存関係を整理する
    // ----------------------------

    canUseStackMode: function() {
        // Editor / Object のどちらから選んだ場合でも、
        // 選択中の変数が配列を参照した経験を持つなら Array index を使える
        return this.hasArraySelection();
    },

    canUseFadeMode: function() {
        // 薄色化指定は「時系列グラデーション」のときだけ意味がある
        return this.gradientMode === "time";
    },

    canUseStackShadeMode: function() {
        // stack の濃淡方向は stack モードのときだけ意味がある
        return this.gradientMode === "stack" && this.canUseStackMode();
    },

    getAvailabilityState: function() {
        return {
            hasArraySelection: this.hasArraySelection(),
            canUseStackMode: this.canUseStackMode(),
            canUseFadeMode: this.canUseFadeMode(),
            canUseStackShadeMode: this.canUseStackShadeMode()
        };
    },

    normalizeState: function() {
        const reasons = [];

        // 念のため、不正値が直接代入されていた場合も戻す
        if (!this.allowedValues.displayMode.has(this.displayMode)) {
            reasons.push({
                optionName: "displayMode",
                from: this.displayMode,
                to: "variable",
                reason: "invalid displayMode"
            });
            this.displayMode = "variable";
        }

        if (!this.allowedValues.gradientMode.has(this.gradientMode)) {
            reasons.push({
                optionName: "gradientMode",
                from: this.gradientMode,
                to: "time",
                reason: "invalid gradientMode"
            });
            this.gradientMode = "time";
        }

        if (!this.allowedValues.fadeMode.has(this.fadeMode)) {
            reasons.push({
                optionName: "fadeMode",
                from: this.fadeMode,
                to: "all",
                reason: "invalid fadeMode"
            });
            this.fadeMode = "all";
        }

        if (!this.allowedValues.stackShadeMode.has(this.stackShadeMode)) {
            reasons.push({
                optionName: "stackShadeMode",
                from: this.stackShadeMode,
                to: "tailDark",
                reason: "invalid stackShadeMode"
            });
            this.stackShadeMode = "tailDark";
        }

        // 配列変数がない、または object mode の場合は stack を使えない
        if (this.gradientMode === "stack" && !this.canUseStackMode()) {
            reasons.push({
                optionName: "gradientMode",
                from: "stack",
                to: "time",
                reason: "Array index requires at least one array variable selection"
            });
            this.gradientMode = "time";
        }

        return {
            changed: reasons.length > 0,
            reasons,
            state: this.getState(),
            availability: this.getAvailabilityState()
        };
    },

    debugAvailability: function() {
        const state = this.getState();
        const availability = this.getAvailabilityState();

        console.table({
            ...state,
            ...availability
        });

        const result = {
            state,
            availability
        };

        console.log("[VariableHistoryOptions] availability:", result);
        return result;
    },

    debug: function() {
        const state = this.getState();
        console.table(state);
        return state;
    }
};

window.VariableHistoryOptionsUI = {
    panelEl: null,
    buttons: {},

    dragState: null,
    positionStorageKey: "variable-history-options-panel-position",

    init: function() {
        this.createPanel();
        this.render();
    },

    createPanel: function() {
        const old = document.getElementById("variable-history-options-panel");
        if (old) old.remove();

        const panel = document.createElement("div");
        panel.id = "variable-history-options-panel";

        Object.assign(panel.style, {
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 12000,
            background: "rgba(255, 255, 255, 0.96)",
            border: "1px solid #ddd",
            borderRadius: "12px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
            padding: "10px",
            width: "260px",
            fontSize: "12px",
            color: "#333",
            fontFamily: "sans-serif"
        });

        const title = document.createElement("div");
        title.textContent = "Variable History Options";
        Object.assign(title.style, {
            fontWeight: "700",
            fontSize: "13px",
            marginBottom: "8px",
            cursor: "move",
            userSelect: "none"
        });
        panel.appendChild(title);

// step0-4a:
// タイトル部分をつかんでパネルを移動できるようにする
this.installDragHandle(title, panel);

        this.addSection(panel, "Select Variable From", [
            {
                key: "displayMode_variable",
                label: "Editor",
                optionName: "displayMode",
                value: "variable",
                title: "Select variables by right-clicking variable names in the editor."
            },
            {
                key: "displayMode_object",
                label: "Object",
                optionName: "displayMode",
                value: "object",
                title: "Click an object and select variables that have referred to it."
            }
        ]);

        this.addSection(panel, "Color Mapping", [
            {
                key: "gradientMode_time",
                label: "Time",
                optionName: "gradientMode",
                value: "time",
                title: "Use color intensity to show temporal history."
            },
            {
                key: "gradientMode_stack",
                label: "Array index",
                optionName: "gradientMode",
                value: "stack",
                availabilityKey: "canUseStackMode",
                title: "Use color intensity to show positions in an array-like variable."
            }
        ]);

        this.addSection(panel, "History Range", [
        {
            key: "fadeMode_all",
            label: "All",
            optionName: "fadeMode",
            value: "all",
            availabilityKey: "canUseFadeMode",
            title: "Keep older references using the lightest color."
        },
        {
            key: "fadeMode_recent5",
            label: "Recent 5",
            optionName: "fadeMode",
            value: "recent5",
            availabilityKey: "canUseFadeMode",
            title: "Show only the current and four most recent references."
        }
    ]);

            this.addSection(panel, "Array Index Direction", [
            {
                key: "stackShadeMode_tailDark",
                label: "Last Index Dark",
                optionName: "stackShadeMode",
                value: "tailDark",
                availabilityKey: "canUseStackShadeMode",
                title: "Make objects at larger array indices darker."
            },
            {
                key: "stackShadeMode_headDark",
                label: "First Index Dark",
                optionName: "stackShadeMode",
                value: "headDark",
                availabilityKey: "canUseStackShadeMode",
                title: "Make objects at smaller array indices darker."
            }
        ]);

        const info = document.createElement("div");
        info.id = "variable-history-options-info";
        Object.assign(info.style, {
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid #eee",
            color: "#666",
            lineHeight: "1.4"
        });
        panel.appendChild(info);

        document.body.appendChild(panel);
        this.panelEl = panel;
        // 前回ドラッグした位置があれば復元する
        this.applySavedPosition();
    },

    // ----------------------------
    // オプションパネルをドラッグ可能にする
    // ----------------------------

    installDragHandle: function(handleEl, panelEl) {
        if (!handleEl || !panelEl) return;

        handleEl.addEventListener("pointerdown", (e) => {
            // 左クリック・通常タッチ以外は無視
            if (typeof e.button === "number" && e.button !== 0) return;

            e.preventDefault();
            e.stopPropagation();

            const rect = panelEl.getBoundingClientRect();

            // right 指定のままだと left/top 移動と相性が悪いので、
            // ドラッグ開始時点で left/top 管理に切り替える
            panelEl.style.left = `${rect.left}px`;
            panelEl.style.top = `${rect.top}px`;
            panelEl.style.right = "auto";
            panelEl.style.bottom = "auto";

            this.dragState = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                startLeft: rect.left,
                startTop: rect.top
            };

            panelEl.style.opacity = "0.94";

            if (typeof handleEl.setPointerCapture === "function") {
                try {
                    handleEl.setPointerCapture(e.pointerId);
                } catch (_) {}
            }
        });

        handleEl.addEventListener("pointermove", (e) => {
            if (!this.dragState) return;

            e.preventDefault();
            e.stopPropagation();

            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;

            const nextLeft = this.dragState.startLeft + dx;
            const nextTop = this.dragState.startTop + dy;

            const clamped = this.clampPanelPosition(nextLeft, nextTop, panelEl);

            panelEl.style.left = `${clamped.left}px`;
            panelEl.style.top = `${clamped.top}px`;
            panelEl.style.right = "auto";
            panelEl.style.bottom = "auto";
        });

        const endDrag = (e) => {
            if (!this.dragState) return;

            this.dragState = null;
            panelEl.style.opacity = "1";

            this.saveCurrentPosition();

            if (typeof handleEl.releasePointerCapture === "function") {
                try {
                    handleEl.releasePointerCapture(e.pointerId);
                } catch (_) {}
            }
        };

        handleEl.addEventListener("pointerup", endDrag);
        handleEl.addEventListener("pointercancel", endDrag);
    },

    clampPanelPosition: function(left, top, panelEl = null) {
        const panel = panelEl || this.panelEl;
        const rect = panel ? panel.getBoundingClientRect() : null;

        const width = rect ? rect.width : 260;
        const height = rect ? rect.height : 260;
        const margin = 8;

        const maxLeft = Math.max(margin, window.innerWidth - width - margin);
        const maxTop = Math.max(margin, window.innerHeight - height - margin);

        return {
            left: Math.min(Math.max(left, margin), maxLeft),
            top: Math.min(Math.max(top, margin), maxTop)
        };
    },

    saveCurrentPosition: function() {
        const panel = this.panelEl;
        if (!panel) return;

        const rect = panel.getBoundingClientRect();

        const pos = {
            left: rect.left,
            top: rect.top
        };

        try {
            localStorage.setItem(this.positionStorageKey, JSON.stringify(pos));
        } catch (e) {
            console.warn("[VariableHistoryOptionsUI] failed to save position:", e);
        }
    },

    applySavedPosition: function() {
        const panel = this.panelEl;
        if (!panel) return;

        let raw = null;

        try {
            raw = localStorage.getItem(this.positionStorageKey);
        } catch (_) {
            raw = null;
        }

        if (!raw) return;

        try {
            const pos = JSON.parse(raw);

            const left = Number(pos.left);
            const top = Number(pos.top);

            if (!Number.isFinite(left) || !Number.isFinite(top)) return;

            const clamped = this.clampPanelPosition(left, top, panel);

            panel.style.left = `${clamped.left}px`;
            panel.style.top = `${clamped.top}px`;
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        } catch (e) {
            console.warn("[VariableHistoryOptionsUI] failed to restore position:", e);
        }
    },

    resetPosition: function() {
        try {
            localStorage.removeItem(this.positionStorageKey);
        } catch (_) {}

        const panel = this.panelEl;
        if (!panel) return;

        panel.style.top = "16px";
        panel.style.right = "16px";
        panel.style.left = "auto";
        panel.style.bottom = "auto";
    },

    addSection: function(parent, titleText, items) {
        const section = document.createElement("div");
        Object.assign(section.style, {
            marginTop: "8px"
        });

        const title = document.createElement("div");
        title.textContent = titleText;
        Object.assign(title.style, {
            fontWeight: "600",
            marginBottom: "4px",
            color: "#555"
        });
        section.appendChild(title);

        const row = document.createElement("div");
        Object.assign(row.style, {
            display: "flex",
            gap: "6px",
            flexWrap: "wrap"
        });

        for (const item of items) {
            const btn = this.createButton(item);
            row.appendChild(btn);
            this.buttons[item.key] = {
                el: btn,
                item
            };
        }

        section.appendChild(row);
        parent.appendChild(section);
    },

    createButton: function(item) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = item.label;

        Object.assign(btn.style, {
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: "999px",
            padding: "4px 9px",
            cursor: "pointer",
            fontSize: "12px"
        });

        if (item.title) {
            btn.title = item.title;
        }

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (btn.disabled) return;

            if (!window.VariableHistoryOptions) return;

            window.VariableHistoryOptions.setOption(
                item.optionName,
                item.value,
                { redraw: true }
            );

            this.render();
        };

        return btn;
    },
    getDisplayModeLabel: function(value) {
        if (value === "object") return "Object";
        return "Editor";
    },

    getGradientModeLabel: function(value) {
        if (value === "stack") return "Array index";
        return "Time";
    },

    getFadeModeLabel: function(value) {
        if (value === "recent5") return "Recent 5";
        return "All";
    },

    getStackShadeModeLabel: function(value) {
        if (value === "headDark") return "First Index Dark";
        return "Last Index Dark";
    },

    getSelectedLabel: function() {
        const displayMode = window.VariableHistoryOptions?.displayMode ?? "variable";

        let entries = [];

        if (
            displayMode === "object" &&
            window.VariableHistoryObjectSelection &&
            typeof window.VariableHistoryObjectSelection.getEntries === "function"
        ) {
            entries = window.VariableHistoryObjectSelection.getEntries();
        } else if (
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.getAll === "function"
        ) {
            entries = window.VariableHistorySelection.getAll();
        }

        if (!entries || entries.length === 0) {
            return "Selected variables: none";
        }

        return "Selected variables: " + entries
            .map(entry => `${entry.name}:${entry.paletteKey}`)
            .join(", ");
    },

    render: function() {
        const opts = window.VariableHistoryOptions;
        if (!opts || !this.panelEl) return;

        // 現在の選択変数に合わせて、stack が使えるかなどを整理
        if (typeof opts.normalizeState === "function") {
            opts.normalizeState();
        }

        const state = opts.getState();
        const availability =
            typeof opts.getAvailabilityState === "function"
                ? opts.getAvailabilityState()
                : {
                    hasArraySelection: false,
                    canUseStackMode: false,
                    canUseFadeMode: state.gradientMode === "time",
                    canUseStackShadeMode: state.gradientMode === "stack"
                };

        for (const key of Object.keys(this.buttons)) {
            const { el, item } = this.buttons[key];

            const isActive = state[item.optionName] === item.value;

            let isEnabled = true;

            if (item.forceDisabled) {
                isEnabled = false;
            }

            if (item.availabilityKey) {
                isEnabled = !!availability[item.availabilityKey];
            }

            el.disabled = !isEnabled;

            if (isActive) {
                el.style.background = "#fff0f6";
                el.style.borderColor = "#ff69b4";
                el.style.color = "#d63384";
                el.style.fontWeight = "700";
            } else {
                el.style.background = "#fff";
                el.style.borderColor = "#ddd";
                el.style.color = "#333";
                el.style.fontWeight = "400";
            }

            if (!isEnabled) {
                el.style.opacity = "0.38";
                el.style.cursor = "not-allowed";
            } else {
                el.style.opacity = "1";
                el.style.cursor = "pointer";
            }
        }

        const info = document.getElementById("variable-history-options-info");
        if (info) {
            const displayModeLabel = this.getDisplayModeLabel(state.displayMode);
            const gradientModeLabel = this.getGradientModeLabel(state.gradientMode);
            const fadeModeLabel = this.getFadeModeLabel(state.fadeMode);
            const stackShadeModeLabel = this.getStackShadeModeLabel(state.stackShadeMode);

            const arrayLabel = availability.hasArraySelection ? "yes" : "no";

            const indexLine =
                state.gradientMode === "stack"
                    ? `<div>Array index direction: ${stackShadeModeLabel}</div>`
                    : `<div>Array index direction: not used</div>`;

            info.innerHTML = `
                <div>${this.getSelectedLabel()}</div>
                <div>Selected from: ${displayModeLabel}</div>
                <div>Array variable: ${arrayLabel}</div>
                <div>Color mapping: ${gradientModeLabel}</div>
                <div>History range: ${fadeModeLabel}</div>
                ${indexLine}
            `;
        }
        // object mode 以外に切り替わったら、object 候補パネルは消す
        if (
            state.displayMode !== "object" &&
            window.VariableHistoryObjectPicker &&
            typeof window.VariableHistoryObjectPicker.hide === "function"
        ) {
            window.VariableHistoryObjectPicker.hide();
        }
    },

    debug: function() {
        const result = {
            state: window.VariableHistoryOptions?.getState?.(),
            availability: window.VariableHistoryOptions?.getAvailabilityState?.()
        };
        console.log("[VariableHistoryOptionsUI]", result);
        return result;
    }
};

window.VariableHistorySelection = {
    maxSelections: 3,

    // 新しい本体
    selectedEntries: [],

    // 互換用: 既存コードがこれを直接見ても壊れにくくする
    selectedVariableName: null,

    normalizeName: function(name) {
        return String(name ?? "").trim();
    },

    normalizePaletteKey: function(paletteKey) {
        const s = String(paletteKey ?? "pink").trim().toLowerCase();
        if (s === "green") return "green";
        if (s === "blue") return "blue";   // 将来用
        return "pink";
    },

    defaultLayerRoleForPalette: function(paletteKey) {
        const p = this.normalizePaletteKey(paletteKey);
        if (p === "green") return "outer-ring-1";
        if (p === "blue") return "outer-ring-2"; // 将来用
        return "main-fill"; // pink
    },

    slotNameAt: function(index) {
        if (index === 0) return "primary";
        if (index === 1) return "secondary";
        if (index === 2) return "tertiary";
        return `extra-${index}`;
    },

    syncLegacyField: function() {
        const first = this.selectedEntries[0] || null;
        this.selectedVariableName = first ? first.name : null;
    },

    rebuildSlots: function() {
        this.selectedEntries = this.selectedEntries.map((entry, index) => ({
            ...entry,
            slot: this.slotNameAt(index)
        }));
        this.syncLegacyField();
    },

    buildEntry: function(name, paletteKey = "pink", slotIndex = 0) {
        const s = this.normalizeName(name);
        const p = this.normalizePaletteKey(paletteKey);

        return {
            slot: this.slotNameAt(slotIndex),
            name: s,
            paletteKey: p,
            layerRole: this.defaultLayerRoleForPalette(p)
        };
    },

    get: function() {
        const first = this.selectedEntries[0] || null;
        return first ? first.name : null;
    },

    // 追加: primary entry 全体を返す
    getPrimaryEntry: function() {
        return this.selectedEntries[0] ? { ...this.selectedEntries[0] } : null;
    },

    // 追加: 全選択状態を返す
    getAll: function() {
        return this.selectedEntries.map(entry => ({ ...entry }));
    },

    hasAny: function() {
        return this.selectedEntries.length > 0;
    },

    findIndexByName: function(name) {
        const s = this.normalizeName(name);
        return this.selectedEntries.findIndex(entry => entry.name === s);
    },

    // 互換用:
    // 今まで通り「1個だけ選ぶ」動きにする
    set: function(name, paletteKey = "pink") {
        const s = this.normalizeName(name);
        if (!this.isSelectableVariableName(s)) {
            this.clear();
            return;
        }

        this.selectedEntries = [
            this.buildEntry(s, paletteKey, 0)
        ];
        this.syncLegacyField();
    },

    // 新規追加:
    // Step 2 以降で使う。今は console から確認用にも使える
    addOrUpdate: function(name, paletteKey = "pink") {
        const s = this.normalizeName(name);
        if (!this.isSelectableVariableName(s)) return false;

        const p = this.normalizePaletteKey(paletteKey);
        const idx = this.findIndexByName(s);

        if (idx >= 0) {
            this.selectedEntries[idx] = {
                ...this.selectedEntries[idx],
                paletteKey: p,
                layerRole: this.defaultLayerRoleForPalette(p)
            };
            this.rebuildSlots();
            return true;
        }

        if (this.selectedEntries.length >= this.maxSelections) {
            return false;
        }

        this.selectedEntries.push(
            this.buildEntry(s, p, this.selectedEntries.length)
        );
        this.syncLegacyField();
        return true;
    },

    remove: function(name) {
        const s = this.normalizeName(name);
        this.selectedEntries = this.selectedEntries.filter(entry => entry.name !== s);
        this.rebuildSlots();
    },

    clear: function() {
        this.selectedEntries = [];
        this.selectedVariableName = null;
    },

    isSelectableVariableName: function(name) {
        const s = String(name ?? "").trim();
        if (!s) return false;
        if (s === "this") return true;
        if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s)) return false;

        const reserved = new Set([
            "if", "else", "while", "for", "switch", "case", "break", "continue",
            "return", "function", "class", "new", "const", "let", "var",
            "try", "catch", "finally", "throw", "default", "do"
        ]);

        return !reserved.has(s);
    }
};
window.VariableHistoryView = {
    PALETTES: {
        pink: [
            { border: '#080808ff', background: '#FF1493' }, // 0: 現在
            { border: '#FF69B4', background: '#FF69B4' }, // 1: 1つ前
            { border: '#FFB6C1', background: '#FFB6C1' }, // 2: 2つ前
            { border: '#FFC0CB', background: '#FFC0CB' }, // 3: 3つ前
            { border: '#FFE4E1', background: '#FFE4E1' }  // 4: 4つ前
        ],
        green: [
            { border: '#050505ff', background: '#2F9E44' }, // 0: 現在
            { border: '#51CF66', background: '#51CF66' }, // 1: 1つ前
            { border: '#8CE99A', background: '#8CE99A' }, // 2: 2つ前
            { border: '#B2F2BB', background: '#B2F2BB' }, // 3: 3つ前
            { border: '#D3F9D8', background: '#D3F9D8' }  // 4: 4つ前
        ]
    },
        // ----------------------------
        // step4-7:
        // object mode の年輪サイズ調整用
        // ----------------------------
        OBJECT_RING_STYLE: {
            // base node よりどれくらい外側に広げるか
            baseOffset: 5,

            // 古い ring ほどどれくらい外へ広げるか
            stepOffset: 4,

            // 大きくなりすぎ防止
            maxOffset: 24
        },
    removeArrayNodes: function(visGraph) {
        const removalIds = new Set();
        const isArrayRootNode = (id) => {
            const s = String(id ?? "");
            return s.includes("arr") && !s.endsWith("-array");
        };

    // ノード削除
        visGraph.nodes = visGraph.nodes.filter(node => {
            const id = String(node.id ?? "");

        // box は消す
            if (node.shape === "box") {
                removalIds.add(id);
                return false;
            }

        // 配列本体は消す
        // 例: main-call24-FunctionExpression3-arr2
            if (isArrayRootNode(id)) {
                removalIds.add(id);
                return false;
            }

        // arr-slot は残す（見た目は一切いじらない）
        // 例: main-call24-FunctionExpression3-arr2-0-array
            return true;
        });

    // エッジ削除
        visGraph.edges = visGraph.edges.filter(edge => {
            const from = String(edge.from ?? "");
            const to = String(edge.to ?? "");

        // 消したノードにつながる edge は消える
        // これで
        //   変数 -> 配列本体
        //   配列本体 -> arr-slot
        // は消える
        // 一方
        //   arr-slot -> 実ノード
        // は残る
            return !removalIds.has(from) && !removalIds.has(to);
        });
    },

    getGraphAt: function(cpID, contextID) {
        const g = __$__.Context && __$__.Context.StoredGraph;
        if (!g) return null;
        const cp = g[cpID];
        if (!cp) return null;
        return cp[contextID] || cp[String(contextID)] || null;
    },

    getCurrentStoredGraph: function() {
        const snap = __$__.Context && __$__.Context.SnapshotContext;
        if (!snap) return null;
        return this.getGraphAt(snap.cpID, snap.contextSensitiveID);
    },

    // variableEdges から targetVariableName の参照先を取る
    // 参照先IDに arr が含まれていれば配列とみなす
    getTargetInfoFromStoredGraph: function(graphObj, targetName) {
        if (!graphObj || !Array.isArray(graphObj.variableEdges) || !targetName) {
            return {
                targetNodeId: null,
                isArray: false,
                arrayContentsSet: new Set()
            };
        }

        const target = String(targetName);
        const varKey1 = `__Variable-${target}`;
        const varKey2 = `Variable-${target}`;

        const e = graphObj.variableEdges.find(v =>
            v.from === varKey1 ||
            v.from === varKey2 ||
            v.label === target ||
            v.displayLabel === target
        );

        const targetNodeId = e && e.to ? String(e.to) : null;
        const isArray = !!targetNodeId && targetNodeId.includes("arr");

        return {
            targetNodeId,
            isArray,
            arrayContentsSet: isArray
                ? this.getArrayContentsSetFromStoredGraph(graphObj, targetNodeId)
                : new Set()
        };
    },

    // StoredGraph の 1 snapshot から配列要素集合を取る
    // 今の表現:
    //   arr2-0-array -> 要素ノード
    //   arr2-1-array -> 要素ノード
    // にまず対応
    // さらに以前の arr -> box/node 形式にも fallback で対応
    getArrayContentsSetFromStoredGraph: function(graphObj, arrayNodeID) {
        if (!graphObj || !Array.isArray(graphObj.edges) || !arrayNodeID) {
            return new Set();
        }

        const result = new Set();
        const arrayId = String(arrayNodeID);
        const nodesObj = graphObj.nodes || {};

        const isBox = (id) => {
            return nodesObj[id] && nodesObj[id].shape === "box";
        };

        // -------------------------
        // A. 今の構造:
        // arr2-0-array, arr2-1-array などの slot ノードから要素へ辺
        // -------------------------
        for (const e of graphObj.edges) {
            const from = String(e.from ?? "");
            const to = String(e.to ?? "");
            if (!from || !to) continue;

            if (from.startsWith(arrayId + "-") && from.includes("array")) {
                result.add(to);
            }
        }

        if (result.size > 0) {
            return result;
        }

        // -------------------------
        // B. 以前の構造への fallback:
        // arr -> box/node
        // -------------------------
        const outgoing = (fromId) => {
            const res = [];
            const fromIdStr = String(fromId);

            for (const e of graphObj.edges) {
                const from = String(e.from ?? "");
                const to = String(e.to ?? "");
                if (!from || !to) continue;

                if (from === fromIdStr) {
                    res.push(to);
                }
            }
            return res;
        };

        const first = outgoing(arrayId);

        for (const to1 of first) {
            if (isBox(to1)) {
                const second = outgoing(to1);
                for (const to2 of second) {
                    result.add(String(to2));
                }
            } else {
                result.add(String(to1));
            }
        }

        return result;
    },

    // ----------------------------
    // step2-1:
    // 配列要素を index 付きで取得する
    // ----------------------------

    // 例:
    // arrayNodeID = main-call24-FunctionExpression3-arr2
    // slotId      = main-call24-FunctionExpression3-arr2-0-array
    // => 0 を取り出す
    extractArrayIndexFromSlotId: function(slotId, arrayNodeID) {
        const slot = String(slotId ?? "");
        const arrayId = String(arrayNodeID ?? "");

        if (!slot || !arrayId) return null;
        if (!slot.startsWith(arrayId + "-")) return null;

        const rest = slot.slice(arrayId.length + 1);
        const m = rest.match(/^(\d+)-array/);

        if (!m) return null;

        const index = Number(m[1]);
        return Number.isFinite(index) ? index : null;
    },

    // StoredGraph の 1 snapshot から、配列要素を index 付きで取る
    // 返り値:
    // [
    //   { index: 0, nodeId: "...", slotNodeId: "..." },
    //   { index: 1, nodeId: "...", slotNodeId: "..." }
    // ]
    getArrayContentsEntriesFromStoredGraph: function(graphObj, arrayNodeID) {
        if (!graphObj || !Array.isArray(graphObj.edges) || !arrayNodeID) {
            return [];
        }

        const arrayId = String(arrayNodeID);
        const entries = [];

        // -------------------------
        // A. 今の構造:
        // arr2-0-array -> 要素ノード
        // arr2-1-array -> 要素ノード
        // -------------------------
        for (const e of graphObj.edges) {
            const from = String(e.from ?? "");
            const to = String(e.to ?? "");

            if (!from || !to) continue;

            const index = this.extractArrayIndexFromSlotId(from, arrayId);

            if (index !== null) {
                entries.push({
                    index,
                    nodeId: to,
                    slotNodeId: from,
                    edge: e
                });
            }
        }

        if (entries.length > 0) {
            entries.sort((a, b) => a.index - b.index);
            return entries;
        }

        // -------------------------
        // B. fallback:
        // もし arr -> node のような古い形式なら、
        // edge の label/displayLabel から index を取れる場合だけ拾う
        // -------------------------
        for (const e of graphObj.edges) {
            const from = String(e.from ?? "");
            const to = String(e.to ?? "");

            if (from !== arrayId || !to) continue;

            const label = String(e.label ?? e.displayLabel ?? "");
            const m = label.match(/\[?(\d+)\]?/);

            if (!m) continue;

            const index = Number(m[1]);
            if (!Number.isFinite(index)) continue;

            entries.push({
                index,
                nodeId: to,
                slotNodeId: null,
                edge: e
            });
        }

        entries.sort((a, b) => a.index - b.index);
        return entries;
    },

    // 現在の snapshot で、指定変数が配列なら index 付き要素を表示する
    debugArrayEntriesForVariable: function(variableName) {
        const name = String(variableName ?? "").trim();
        const graphObj = this.getCurrentStoredGraph();

        if (!name) {
            console.warn("[debugArrayEntriesForVariable] variableName is empty");
            return null;
        }

        if (!graphObj) {
            console.warn("[debugArrayEntriesForVariable] current graph not found");
            return null;
        }

        const info = this.getTargetInfoFromStoredGraph(graphObj, name);

        if (!info.targetNodeId) {
            console.warn("[debugArrayEntriesForVariable] target not found:", name);
            return {
                variableName: name,
                targetNodeId: null,
                isArray: false,
                entries: []
            };
        }

        if (!info.isArray) {
            console.warn("[debugArrayEntriesForVariable] target is not array:", {
                variableName: name,
                targetNodeId: info.targetNodeId
            });

            return {
                variableName: name,
                targetNodeId: info.targetNodeId,
                isArray: false,
                entries: []
            };
        }

        const entries = this.getArrayContentsEntriesFromStoredGraph(
            graphObj,
            info.targetNodeId
        );

        const rows = entries.map(entry => ({
            variableName: name,
            arrayNodeId: info.targetNodeId,
            index: entry.index,
            nodeId: entry.nodeId,
            slotNodeId: entry.slotNodeId
        }));

        console.table(rows);

        const result = {
            variableName: name,
            targetNodeId: info.targetNodeId,
            isArray: true,
            entries: rows
        };

        console.log("[debugArrayEntriesForVariable]", result);
        return result;
    },

    // 現在選択中の変数すべてについて、配列なら index 付き要素を表示する
    debugArrayEntriesForSelections: function() {
        const entries =
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.getAll === "function"
                ? window.VariableHistorySelection.getAll()
                : [];

        const results = [];

        for (const entry of entries) {
            const r = this.debugArrayEntriesForVariable(entry.name);
            results.push(r);
        }

        return results;
    },

    // ----------------------------
    // 指定した object node が、現在の main-call グループ内で
    // どの変数から参照された経験があるかを調べる
    // ----------------------------

    getVariableNameFromVariableEdge: function(edge) {
        if (!edge) return null;

        const label = String(edge.label ?? edge.displayLabel ?? "").trim();
        if (label) return label;

        const from = String(edge.from ?? "").trim();

        const prefixes = [
            "__Variable-",
            "Variable-"
        ];

        for (const prefix of prefixes) {
            if (from.startsWith(prefix)) {
                return from.slice(prefix.length);
            }
        }

        return from || null;
    },

    isArrayTargetId: function(id) {
        return String(id ?? "").includes("arr");
    },

    collectObjectVariableReferencesInGraph: function(graphObj, objectNodeId) {
        const targetObjectId = String(objectNodeId ?? "").trim();
        const refs = [];

        if (!graphObj || !targetObjectId) return refs;

        const variableEdges = Array.isArray(graphObj.variableEdges)
            ? graphObj.variableEdges
            : [];

        for (const edge of variableEdges) {
            const variableName = this.getVariableNameFromVariableEdge(edge);
            const targetId = edge && edge.to ? String(edge.to) : null;

            if (!variableName || !targetId) continue;

            // ----------------------------
            // A. 単一変数:
            // node -> objectNodeId
            // maxNode -> objectNodeId
            // this -> objectNodeId
            // ----------------------------
            if (!this.isArrayTargetId(targetId)) {
                if (targetId === targetObjectId) {
                    refs.push({
                        variableName,
                        accessLabel: variableName,
                        sourceKind: "scalar",
                        nodeId: targetObjectId,
                        arrayNodeId: null,
                        index: null,
                        slotNodeId: null
                    });
                }

                continue;
            }

            // ----------------------------
            // B. 配列変数:
            // current -> arr
            // arr[0] -> objectNodeId
            // ----------------------------
            const entries = this.getArrayContentsEntriesFromStoredGraph(
                graphObj,
                targetId
            );

            for (const entry of entries) {
                const nodeId = String(entry.nodeId ?? "");

                if (nodeId !== targetObjectId) continue;

                refs.push({
                    variableName,
                    accessLabel: `${variableName}[${entry.index}]`,
                    sourceKind: "array-element",
                    nodeId: targetObjectId,
                    arrayNodeId: targetId,
                    index: entry.index,
                    slotNodeId: entry.slotNodeId ?? null
                });
            }
        }

        // 同じ snapshot 内で重複しないようにする
        const seen = new Set();
        const unique = [];

        for (const r of refs) {
            const key = [
                r.variableName,
                r.accessLabel,
                r.sourceKind,
                r.index ?? "",
                r.arrayNodeId ?? ""
            ].join("::");

            if (seen.has(key)) continue;

            seen.add(key);
            unique.push(r);
        }

        unique.sort((a, b) => {
            return (
                String(a.variableName).localeCompare(String(b.variableName)) ||
                String(a.accessLabel).localeCompare(String(b.accessLabel))
            );
        });

        return unique;
    },

    buildObjectVariableHistory: function(objectNodeId) {
        const targetObjectId = String(objectNodeId ?? "").trim();

        if (!targetObjectId) {
            return {
                objectNodeId: targetObjectId,
                rawRows: [],
                eventRows: [],
                variableNames: [],
                accessLabels: []
            };
        }

        // 現在の main-callX グループ内の snapshot を使う
        const snaps = this.collectSnapshotsForCurrentTarget();

        const rawRows = [];
        const eventRows = [];

        // 直前 snapshot で参照されていた key
        // 「新しく参照され始めた瞬間」だけ eventRows に入れるために使う
        let prevActiveKeys = new Set();

        for (const snap of snaps) {
            const refs = this.collectObjectVariableReferencesInGraph(
                snap.g,
                targetObjectId
            );

            const currentActiveKeys = new Set();

            for (const ref of refs) {
                const refKey = [
                    ref.variableName,
                    ref.accessLabel,
                    ref.sourceKind,
                    ref.index ?? "",
                    ref.arrayNodeId ?? ""
                ].join("::");

                currentActiveKeys.add(refKey);

                const row = {
                    objectNodeId: targetObjectId,
                    cpID: snap.cpID,
                    contextID: snap.contextID,
                    timeCounter: snap.timeCounter,
                    variableName: ref.variableName,
                    accessLabel: ref.accessLabel,
                    sourceKind: ref.sourceKind,
                    index: ref.index,
                    arrayNodeId: ref.arrayNodeId,
                    slotNodeId: ref.slotNodeId
                };

                // rawRows は「その snapshot で参照されていた」全部
                rawRows.push(row);

                // eventRows は「直前までは参照されておらず、この snapshot で参照され始めた」もの
                if (!prevActiveKeys.has(refKey)) {
                    eventRows.push({
                        ...row,
                        eventKind: "start-reference"
                    });
                }
            }

            prevActiveKeys = currentActiveKeys;
        }

        const variableNames = Array.from(
            new Set(rawRows.map(r => r.variableName))
        ).sort();

        const accessLabels = Array.from(
            new Set(rawRows.map(r => r.accessLabel))
        ).sort();

        return {
            objectNodeId: targetObjectId,
            currentGroupKey: this.getHistoryGroupKey(
                __$__.Context?.SnapshotContext?.contextSensitiveID
            ),
            rawRows,
            eventRows,
            variableNames,
            accessLabels
        };
    },

    debugObjectVariableHistory: function(objectNodeId) {
        const result = this.buildObjectVariableHistory(objectNodeId);

        console.log("[debugObjectVariableHistory] objectNodeId =", result.objectNodeId);
        console.log("[debugObjectVariableHistory] variableNames =", result.variableNames);
        console.log("[debugObjectVariableHistory] accessLabels =", result.accessLabels);

        console.log("[debugObjectVariableHistory] eventRows: 参照され始めたタイミング");
        console.table(result.eventRows);

        console.log("[debugObjectVariableHistory] rawRows: 各 snapshot で参照されていた状態");
        console.table(result.rawRows);

        console.log("[debugObjectVariableHistory]", result);

        return result;
    },

    debugObjectVariableHistoryForSelectedNode: function() {
        const net = __$__?.ObjectGraphNetwork?.network;

        if (!net) {
            console.warn("[debugObjectVariableHistoryForSelectedNode] network not found");
            return null;
        }

        const selected = net.getSelectedNodes();

        if (!selected || selected.length === 0) {
            console.warn("[debugObjectVariableHistoryForSelectedNode] no node selected");
            return null;
        }

        const nodeId = String(selected[0]);
        return this.debugObjectVariableHistory(nodeId);
    },
    // ----------------------------
    // object mode の年輪描画用 event list を作る
    // ----------------------------

    getObjectSelectionEntries: function() {
        if (
            window.VariableHistoryObjectSelection &&
            typeof window.VariableHistoryObjectSelection.getEntries === "function"
        ) {
            return window.VariableHistoryObjectSelection.getEntries();
        }

        return [];
    },
    // ----------------------------
    // editor / object のどちらで選んだ変数でも、
    // object-ring 描画で使える共通 entry として取得する
    // ----------------------------
    getActiveRingSelectionEntries: function() {
        const displayMode = window.VariableHistoryOptions?.displayMode ?? "variable";

        // object mode のときは今まで通り ObjectSelection を使う
        if (displayMode === "object") {
            return this.getObjectSelectionEntries();
        }

        // editor mode のときは EditorSelection を使う
        if (
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.getAll === "function"
        ) {
            return window.VariableHistorySelection.getAll().map((entry, index) => ({
                slot: entry.slot || (index === 0 ? "primary" : "secondary"),
                name: String(entry.name ?? ""),
                paletteKey: entry.paletteKey || (index === 0 ? "pink" : "green"),
                layerRole: entry.layerRole || (index === 0 ? "main-fill" : "outer-ring-1"),
                sourceMode: "variable"
            })).filter(entry => entry.name);
        }

        const single = window.VariableHistorySelection?.get?.();

        if (!single) return [];

        return [{
            slot: "primary",
            name: String(single),
            paletteKey: "pink",
            layerRole: "main-fill",
            sourceMode: "variable"
        }];
    },
    // ----------------------------
    // object mode で選んだ object の履歴キャッシュを使ってよいか判定する
    // editor mode では古い object selection の履歴を混ぜない
    // ----------------------------
    shouldUseObjectSelectionHistoryForRing: function(objectNodeId, selectedEntries) {
        const displayMode = window.VariableHistoryOptions?.displayMode ?? "variable";

        if (displayMode !== "object") {
            return false;
        }

        const selection = window.VariableHistoryObjectSelection;

        if (!selection) {
            return false;
        }

        const selectedObjectNodeId = String(selection.selectedObjectNodeId ?? "");
        const targetObjectNodeId = String(objectNodeId ?? "");

        if (!selectedObjectNodeId || selectedObjectNodeId !== targetObjectNodeId) {
            return false;
        }

        if (!selection.selectedObjectHistory) {
            return false;
        }

        const entries = Array.isArray(selectedEntries) ? selectedEntries : [];

        if (entries.length === 0) {
            return false;
        }

        // object 側で選ばれた entry だけ、object history cache を使う
        return entries.some(entry => {
            return (
                entry.sourceMode === "object" ||
                String(entry.objectNodeId ?? "") === targetObjectNodeId
            );
        });
    },

    buildObjectRingEventList: function(options = {}) {
        const selection = window.VariableHistoryObjectSelection || null;

        const objectNodeId = String(
            options.objectNodeId ??
            selection?.selectedObjectNodeId ??
            ""
        ).trim();

        if (!objectNodeId) {
            return {
                objectNodeId,
                currentTime: this.getCurrentTimeCounter(),
                selectedEntries: [],
                events: []
            };
        }

        const selectedEntries =
            Array.isArray(options.selectedEntries)
                ? options.selectedEntries
                : this.getObjectSelectionEntries();

        const selectedNames = new Set(
            selectedEntries.map(entry => String(entry.name ?? "").trim()).filter(Boolean)
        );

        if (selectedNames.size === 0) {
            return {
                objectNodeId,
                currentTime: this.getCurrentTimeCounter(),
                selectedEntries,
                events: []
            };
        }

        const cachedHistory =
            this.shouldUseObjectSelectionHistoryForRing(
                objectNodeId,
                selectedEntries
            )
                ? selection.selectedObjectHistory
                : null;

        const history =
            options.history ||
            cachedHistory ||
            this.buildObjectVariableHistory(objectNodeId);

        const currentTime =
            options.currentTime !== undefined
                ? options.currentTime
                : this.getCurrentTimeCounter();

        const paletteByName = new Map();
        const layerRoleByName = new Map();

        for (const entry of selectedEntries) {
            const name = String(entry.name ?? "").trim();
            if (!name) continue;

            paletteByName.set(name, entry.paletteKey || "pink");
            layerRoleByName.set(name, entry.layerRole || "main-fill");
        }

        const rawEvents = Array.isArray(history?.eventRows)
            ? history.eventRows
            : [];

        const filtered = rawEvents
            .filter(row => {
                const name = String(row.variableName ?? "").trim();
                if (!selectedNames.has(name)) return false;

                // 現在 snapshot までの履歴だけを年輪候補にする
                if (
                    currentTime !== null &&
                    currentTime !== undefined &&
                    row.timeCounter !== null &&
                    row.timeCounter !== undefined &&
                    row.timeCounter > currentTime
                ) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                const at = a.timeCounter ?? 0;
                const bt = b.timeCounter ?? 0;

                return (
                    at - bt ||
                    String(a.cpID).localeCompare(String(b.cpID)) ||
                    String(a.variableName).localeCompare(String(b.variableName)) ||
                    String(a.accessLabel).localeCompare(String(b.accessLabel))
                );
            });

        const total = filtered.length;

        const events = filtered.map((row, index) => {
            const variableName = String(row.variableName ?? "").trim();

            return {
                objectNodeId,
                variableName,
                accessLabel: row.accessLabel,
                sourceKind: row.sourceKind,
                index: row.index,
                cpID: row.cpID,
                contextID: row.contextID,
                timeCounter: row.timeCounter,

                paletteKey: paletteByName.get(variableName) || "pink",
                layerRole: layerRoleByName.get(variableName) || "main-fill",

                // 古い順
                chronologicalIndex: index,

                // 外側から見た順番:
                // 0 が一番古い = 一番外側
                ringIndexFromOuter: index,

                // 内側から見た順番:
                // 0 が一番新しい = 一番内側
                ringIndexFromInner: total - 1 - index,

                isNewest: index === total - 1,
                isOldest: index === 0
            };
        });

        return {
            objectNodeId,
            currentTime,
            selectedEntries,
            selectedVariableNames: Array.from(selectedNames),
            history,
            events
        };
    },

    debugObjectRingEvents: function(options = {}) {
        const result = this.buildObjectRingEventList(options);

        const rows = result.events.map(event => ({
            objectNodeId: event.objectNodeId,
            variableName: event.variableName,
            accessLabel: event.accessLabel,
            sourceKind: event.sourceKind,
            timeCounter: event.timeCounter,
            paletteKey: event.paletteKey,
            ringIndexFromOuter: event.ringIndexFromOuter,
            ringIndexFromInner: event.ringIndexFromInner,
            isNewest: event.isNewest
        }));

        console.log("[debugObjectRingEvents] meta =", {
            objectNodeId: result.objectNodeId,
            currentTime: result.currentTime,
            selectedVariableNames: result.selectedVariableNames,
            eventCount: result.events.length
        });

        console.table(rows);
        console.log("[debugObjectRingEvents]", result);

        return result;
    },

    // ----------------------------
    // object mode の年輪 overlay 描画
    // ----------------------------

    getObjectRingOverlayNodeId: function(baseNodeId, ringIndexFromOuter, paletteKey, variableName) {
        const baseId = String(baseNodeId ?? "");
        const p = this.normalizePaletteKey(paletteKey);
        const v = String(variableName ?? "var");

        return `__vh_object_ring__${ringIndexFromOuter}__${p}__${v}__${baseId}`;
    },

    isObjectRingOverlayNodeId: function(id) {
        return String(id ?? "").startsWith("__vh_object_ring__");
    },

    getObjectRingSizeOffset: function(event, totalCount) {
        const innerIndex = Number(event?.ringIndexFromInner ?? 0);

        const style = this.OBJECT_RING_STYLE || {};
        const baseOffset = Number(style.baseOffset ?? 7);
        const stepOffset = Number(style.stepOffset ?? 6);
        const maxOffset = Number(style.maxOffset ?? 34);

        // ringIndexFromInner:
        // 0 = 最新 = base node 本体に塗るので、overlay には基本使わない
        // 1 = 1つ前 = 一番内側の外輪
        // 2 = 2つ前 = さらに外側
        const raw = baseOffset + Math.max(0, innerIndex - 1) * stepOffset;

        return Math.min(raw, maxOffset);
    },

    buildObjectRingOverlayNodeFromBase: function(baseNode, event, totalCount) {
        if (!baseNode || !event) return null;

        const paletteKey = event.paletteKey || "pink";
        const palette = this.getPalette(paletteKey);

        // object 内の新旧ではなく、必要なら全体時系列 age を使う
        const rawAge =
            event.displayAge !== undefined
                ? event.displayAge
                : event.globalAge !== undefined
                    ? event.globalAge
                    : Number(event.ringIndexFromInner ?? 0);

        const age =
            typeof this.normalizeAgeByFadeMode === "function"
                ? this.normalizeAgeByFadeMode(rawAge)
                : Math.min(Math.max(Number(rawAge), 0), 4);

        if (age === null) return null;

        const c = palette[age];
        if (!c) return null;
        const overlayId = this.getObjectRingOverlayNodeId(
            baseNode.id,
            event.ringIndexFromOuter,
            paletteKey,
            event.variableName
        );

        const baseLabel = String(baseNode.label ?? "");

        const baseFontSize =
            (typeof baseNode.font === "object" && baseNode.font && baseNode.font.size)
                ? Number(baseNode.font.size)
                : 14;

        const offset = this.getObjectRingSizeOffset(event, totalCount);
        const overlayFontSize = baseFontSize + offset;

        return {
            id: overlayId,
            label: baseLabel,
            shape: "ellipse",

            x: baseNode.x,
            y: baseNode.y,

            physics: false,
            fixed: { x: true, y: true },
            selectable: false,
            chosen: false,

            // label は見せないが、ellipse サイズ計算には使う
            font: {
                size: overlayFontSize,
                color: "rgba(0,0,0,0)"
            },

            color: {
                border: c.border,
                background: c.background,
                highlight: { border: c.border, background: c.background },
                hover: { border: c.border, background: c.background }
            },

            borderWidth: 1,
            hidden: !!baseNode.hidden,

            // debug 用
            vhObjectRing: {
                baseNodeId: String(baseNode.id),
                variableName: event.variableName,
                accessLabel: event.accessLabel,
                timeCounter: event.timeCounter,
                ringIndexFromOuter: event.ringIndexFromOuter,
                ringIndexFromInner: event.ringIndexFromInner,
                paletteKey
            }
        };
    },
    syncObjectRingOverlayPositions: function(visGraph) {
        if (!visGraph || !Array.isArray(visGraph.nodes)) return 0;

        const nodeMap = new Map(
            visGraph.nodes.map(node => [String(node.id), node])
        );

        let updatedCount = 0;

        for (const node of visGraph.nodes) {
            const id = String(node.id ?? "");

            if (!this.isObjectRingOverlayNodeId(id)) continue;

            const baseNodeId = String(node.vhObjectRing?.baseNodeId ?? "");
            if (!baseNodeId) continue;

            const baseNode = nodeMap.get(baseNodeId);
            if (!baseNode) continue;

            // base node の最終座標に overlay を合わせ直す
            if (
                baseNode.x !== undefined &&
                baseNode.y !== undefined &&
                baseNode.x !== null &&
                baseNode.y !== null
            ) {
                node.x = baseNode.x;
                node.y = baseNode.y;
                node.physics = false;
                node.fixed = { x: true, y: true };
                updatedCount++;
            }
        }

        return updatedCount;
    },

    paintBaseNodeWithObjectRingEvent: function(baseNode, event) {
        if (!baseNode || !event) return;

        const paletteKey = event.paletteKey || "pink";
        const palette = this.getPalette(paletteKey);

        // 最新イベントを中心ノード色に使うので age=0 相当の濃い色を使う
        const c = palette[0];
        if (!c) return;

        baseNode.color = {
            border: c.border,
            background: c.background,
            highlight: { border: c.border, background: c.background },
            hover: { border: c.border, background: c.background }
        };

        baseNode.borderWidth = 2;

        baseNode.vhObjectBasePaint = {
            variableName: event.variableName,
            accessLabel: event.accessLabel,
            timeCounter: event.timeCounter,
            paletteKey: paletteKey
        };
    },

    paintObjectRingEvents: function(visGraph, ringResult, options = {}) {
        if (!visGraph || !Array.isArray(visGraph.nodes)) return;
        if (!ringResult || !ringResult.objectNodeId) return;

        const objectNodeId = String(ringResult.objectNodeId);
        const events = Array.isArray(ringResult.events) ? ringResult.events : [];

        if (events.length === 0) return;

        const baseNode = visGraph.nodes.find(n => String(n.id) === objectNodeId);
        if (!baseNode) return;

        const ageMap = options.ageMap || null;

        const selectedEntries =
            Array.isArray(ringResult.selectedEntries)
                ? ringResult.selectedEntries
                : this.getActiveRingSelectionEntries();

        const selectionOrder = new Map();

        for (let i = 0; i < selectedEntries.length; i++) {
            const name = String(selectedEntries[i]?.name ?? "").trim();
            if (!name) continue;
            selectionOrder.set(name, i);
        }

        const getDisplayAge = (event) => {
            if (!event) return null;

            const key = this.getObjectRingEventIdentity(event);

            if (ageMap && ageMap.has(key)) {
                return ageMap.get(key);
            }

            return this.normalizeAgeByFadeMode(
                Number(event.ringIndexFromInner ?? 0)
            );
        };

        // ----------------------------
        // step4-9:
        // 中心・外輪の順番を、ringIndex ではなく displayAge で決める
        // displayAge が小さいほど内側
        // ----------------------------
        const drawableEvents = events
            .map(event => ({
                ...event,
                displayAge: getDisplayAge(event)
            }))
            .filter(event => event.displayAge !== null);

        if (drawableEvents.length === 0) return;

        // 内側に来る順に並べる
        // 1. displayAge が小さいもの
        // 2. 同じ age なら timeCounter が新しいもの
        // 3. それでも同じなら、選択順が早いもの
        drawableEvents.sort((a, b) => {
            const ageA = Number(a.displayAge ?? 999);
            const ageB = Number(b.displayAge ?? 999);

            if (ageA !== ageB) return ageA - ageB;

            const timeA = Number(a.timeCounter ?? -Infinity);
            const timeB = Number(b.timeCounter ?? -Infinity);

            if (timeA !== timeB) return timeB - timeA;

            const orderA = selectionOrder.has(a.variableName)
                ? selectionOrder.get(a.variableName)
                : 999;

            const orderB = selectionOrder.has(b.variableName)
                ? selectionOrder.get(b.variableName)
                : 999;

            if (orderA !== orderB) return orderA - orderB;

            return String(a.accessLabel ?? "").localeCompare(String(b.accessLabel ?? ""));
        });

        // 一番内側は中心ノードそのものに塗る
        const centerEvent = drawableEvents[0];

        this.paintNodeWithPalette(
            baseNode,
            centerEvent.paletteKey || "pink",
            centerEvent.displayAge
        );

        baseNode.borderWidth = 2;

        baseNode.vhObjectBasePaint = {
            variableName: centerEvent.variableName,
            accessLabel: centerEvent.accessLabel,
            timeCounter: centerEvent.timeCounter,
            paletteKey: centerEvent.paletteKey || "pink",
            displayAge: centerEvent.displayAge,
            reason: "center-by-displayAge"
        };

        // 2番目以降は外側リング
        // drawableEvents[1] が一番内側の外輪
        const ringEvents = drawableEvents.slice(1).map((event, index) => ({
            ...event,

            // 1 = 中心のすぐ外側
            // 2 = さらに外側
            ringIndexFromInner: index + 1,

            // debug 用
            ringIndexFromOuter: drawableEvents.length - 2 - index
        }));

        // 外側から先に入れる
        const overlayNodes = ringEvents
            .slice()
            .sort((a, b) => b.ringIndexFromInner - a.ringIndexFromInner)
            .map(event =>
                this.buildObjectRingOverlayNodeFromBase(
                    baseNode,
                    event,
                    drawableEvents.length
                )
            )
            .filter(Boolean);

        if (overlayNodes.length > 0) {
            visGraph.nodes.unshift(...overlayNodes);
        }
    },

        applyObjectRingHistory: function(visGraph) {
            if (!visGraph || !Array.isArray(visGraph.nodes)) return;

            const selectedEntries = this.getActiveRingSelectionEntries();

            if (!selectedEntries || selectedEntries.length === 0) return;

            // 現在表示中の visGraph に存在する node だけを対象にする
            // overlay node を後から追加しても影響しないように、先に Set 化しておく
            const visibleNodeIds = new Set(
                visGraph.nodes.map(n => String(n.id))
            );

            const targetInfo = this.collectObjectIdsReferencedByObjectSelection({
                selectedEntries
            });

        const currentTime = targetInfo.currentTime;

        // step4-8d:
        // 全 object をまたいだ時系列 age を作る
        const globalAgeResult = this.buildGlobalObjectRingAgeMap({
            targetInfo,
            selectedEntries,
            currentTime
        });

        const globalAgeMap = globalAgeResult.ageMap;

        let paintedCount = 0;

        for (const objectNodeId of targetInfo.objectIds) {
            const id = String(objectNodeId);

            // 現在画面に存在しない object は描画しない
            if (!visibleNodeIds.has(id)) continue;

            const ringResult = this.buildObjectRingEventList({
                objectNodeId: id,
                selectedEntries,
                currentTime
            });

            if (!ringResult.events || ringResult.events.length === 0) {
                continue;
            }

            this.paintObjectRingEvents(visGraph, ringResult, {
                ageMap: globalAgeMap
            });
            paintedCount++;
        }

        window.VariableHistoryOptions?.debugLog?.("[applyObjectRingHistory all objects]", {
            selectedVariableNames: targetInfo.selectedVariableNames,
            objectCount: targetInfo.objectIds.length,
            paintedCount,
            currentTime
        });
    },

    debugCurrentObjectRingResult: function() {
        const result = this.buildObjectRingEventList();

        console.log("[debugCurrentObjectRingResult]", result);
        console.table(result.events.map(e => ({
            variableName: e.variableName,
            accessLabel: e.accessLabel,
            timeCounter: e.timeCounter,
            paletteKey: e.paletteKey,
            ringIndexFromOuter: e.ringIndexFromOuter,
            ringIndexFromInner: e.ringIndexFromInner
        })));

        return result;
    },
    debugObjectRingOrder: function() {
        const result = this.buildObjectRingEventList();
        const events = result.events || [];

        const rows = events
            .slice()
            .sort((a, b) => a.ringIndexFromOuter - b.ringIndexFromOuter)
            .map(e => ({
                表示位置: e.ringIndexFromInner === 0
                    ? "中心ノード"
                    : `外側リング${e.ringIndexFromInner}`,
                新旧: e.ringIndexFromInner === 0
                    ? "最新"
                    : `${e.ringIndexFromInner}つ前`,
                variableName: e.variableName,
                accessLabel: e.accessLabel,
                timeCounter: e.timeCounter,
                paletteKey: e.paletteKey,
                ringIndexFromOuter: e.ringIndexFromOuter,
                ringIndexFromInner: e.ringIndexFromInner
            }));

        console.table(rows);

        console.log("[debugObjectRingOrder]", {
            objectNodeId: result.objectNodeId,
            currentTime: result.currentTime,
            eventCount: events.length,
            rows
        });

        return rows;
    },
    // ----------------------------
    // object mode で選択した変数が参照した全 object を集める
    // まだ描画には使わず debug 用
    // ----------------------------

    collectObjectIdsReferencedByObjectSelection: function(options = {}) {
        const selectedEntries =
            Array.isArray(options.selectedEntries)
                ? options.selectedEntries
                : this.getActiveRingSelectionEntries();

        const selectedNames = new Set(
            selectedEntries
                .map(entry => String(entry.name ?? "").trim())
                .filter(Boolean)
        );

        const currentTime =
            options.currentTime !== undefined
                ? options.currentTime
                : this.getCurrentTimeCounter();

        const snaps = this.collectSnapshotsForCurrentTarget();

        const objectIds = new Set();
        const rows = [];

        if (selectedNames.size === 0) {
            return {
                currentTime,
                selectedEntries,
                selectedVariableNames: [],
                objectIds: [],
                rows: []
            };
        }

        for (const snap of snaps) {
            const t = snap.timeCounter;

            // 現在 snapshot より未来は見ない
            if (
                currentTime !== null &&
                currentTime !== undefined &&
                t !== null &&
                t !== undefined &&
                Number(t) > Number(currentTime)
            ) {
                continue;
            }

            for (const entry of selectedEntries) {
                const variableName = String(entry.name ?? "").trim();
                if (!variableName) continue;

                const info = this.getTargetInfoFromStoredGraph(snap.g, variableName);

                if (!info || !info.targetNodeId) continue;

                // 単一変数
                if (!info.isArray) {
                    const nodeId = String(info.targetNodeId);
                    objectIds.add(nodeId);

                    rows.push({
                        cpID: snap.cpID,
                        contextID: snap.contextID,
                        timeCounter: snap.timeCounter,
                        variableName,
                        accessLabel: variableName,
                        sourceKind: "scalar",
                        objectNodeId: nodeId,
                        index: null
                    });

                    continue;
                }

                // 配列変数
                const arrayEntries = this.getArrayContentsEntriesFromStoredGraph(
                    snap.g,
                    info.targetNodeId
                );

                for (const arrayEntry of arrayEntries) {
                    const nodeId = String(arrayEntry.nodeId ?? "");
                    if (!nodeId) continue;

                    objectIds.add(nodeId);

                    rows.push({
                        cpID: snap.cpID,
                        contextID: snap.contextID,
                        timeCounter: snap.timeCounter,
                        variableName,
                        accessLabel: `${variableName}[${arrayEntry.index}]`,
                        sourceKind: "array-element",
                        objectNodeId: nodeId,
                        index: arrayEntry.index
                    });
                }
            }
        }

        const sortedObjectIds = Array.from(objectIds).sort();

        return {
            currentTime,
            selectedEntries,
            selectedVariableNames: Array.from(selectedNames),
            objectIds: sortedObjectIds,
            rows
        };
    },

    debugObjectRingTargetsForAllObjects: function(options = {}) {
        const targetInfo = this.collectObjectIdsReferencedByObjectSelection(options);
        const selectedEntries = targetInfo.selectedEntries || [];

        const currentVisNodeIds = new Set();

        try {
            const nodes = __$__?.ObjectGraphNetwork?.nodes?.get?.() || [];
            for (const node of nodes) {
                currentVisNodeIds.add(String(node.id));
            }
        } catch (_) {}

        const rows = [];

        for (const objectNodeId of targetInfo.objectIds) {
            const ringResult = this.buildObjectRingEventList({
                objectNodeId,
                selectedEntries,
                currentTime: targetInfo.currentTime
            });

            const events = ringResult.events || [];
            const newest =
                events.find(e => Number(e.ringIndexFromInner) === 0) ||
                events[events.length - 1] ||
                null;

            rows.push({
                objectNodeId,
                visibleNow: currentVisNodeIds.has(String(objectNodeId)),
                eventCount: events.length,
                newestVariable: newest ? newest.variableName : "",
                newestAccess: newest ? newest.accessLabel : "",
                newestTime: newest ? newest.timeCounter : "",
                variables: Array.from(
                    new Set(events.map(e => e.variableName))
                ).join(", ")
            });
        }

        console.log("[debugObjectRingTargetsForAllObjects] meta =", {
            currentTime: targetInfo.currentTime,
            selectedVariableNames: targetInfo.selectedVariableNames,
            objectCount: targetInfo.objectIds.length,
            referenceRowCount: targetInfo.rows.length
        });

        console.table(rows);

        console.log("[debugObjectRingTargetsForAllObjects]", {
            targetInfo,
            rows
        });

        return {
            targetInfo,
            rows
        };
    },
    getObjectRingEventIdentity: function(event) {
        if (!event) return "";

        return [
            event.objectNodeId ?? "",
            event.variableName ?? "",
            event.accessLabel ?? "",
            event.sourceKind ?? "",
            event.cpID ?? "",
            event.contextID ?? "",
            event.timeCounter ?? ""
        ].join("::");
    },
    // ----------------------------
    // step4-8e:
    // object mode 用。
    // 配列変数については、
    // 「現在配列内にいるノード = age 0」
    // 「配列から外れたノード = age 1,2,3...」
    // として扱う
    // ----------------------------

    buildObjectArrayMembershipAgeMap: function(selectedEntries = null) {
        const entries =
            Array.isArray(selectedEntries)
                ? selectedEntries
                : this.getActiveRingSelectionEntries();

        const ageMap = new Map();
        const rows = [];

        for (const entry of entries) {
            const variableName = String(entry.name ?? "").trim();
            if (!variableName) continue;

            const visibleTimeline = this.buildVisibleTimelineForTarget(variableName);
            if (!visibleTimeline || visibleTimeline.length === 0) continue;

            const last = visibleTimeline[visibleTimeline.length - 1];
            const lastState = last?.state;

            // 配列変数でないものはここでは扱わない
            if (!lastState || !lastState.isArray) continue;

            let nodeAgeMap;

            if (this.getGradientMode() === "stack") {
                // Array index:
                // 現在の配列内の位置によって濃淡を決める
                // 配列から外れた object は表示対象外になる
                nodeAgeMap = this.collectArrayStackNodeAgeMap(visibleTimeline);
            } else {
                // Time:
                // 現在配列内にいる object は age 0
                // 最近外れた object は age 1,2,3...
                nodeAgeMap = this.collectArrayNodeAgeMap(visibleTimeline);
            }

            for (const [nodeId, age] of nodeAgeMap.entries()) {
                const key = `${variableName}::${String(nodeId)}`;

                ageMap.set(key, age);

                rows.push({
                    variableName,
                    objectNodeId: String(nodeId),
                    age,
                    meaning: age === 0 ? "current array member" : "removed from array"
                });
            }
        }

        return {
            ageMap,
            rows
        };
    },

    getObjectArrayMembershipAge: function(event, arrayMembershipAgeMap) {
        if (!event || !arrayMembershipAgeMap) return undefined;

        // 配列由来の event だけ特別扱いする
        if (event.sourceKind !== "array-element") {
            return undefined;
        }

        const variableName = String(event.variableName ?? "").trim();
        const objectNodeId = String(event.objectNodeId ?? "").trim();

        if (!variableName || !objectNodeId) return null;

        const key = `${variableName}::${objectNodeId}`;

        // undefined: 配列変数ではない/判断しない
        // null: 配列変数だが recent5 などで表示対象外
        if (!arrayMembershipAgeMap.has(key)) {
            return null;
        }

        return arrayMembershipAgeMap.get(key);
    },

    debugObjectArrayMembershipAgeMap: function() {
        const result = this.buildObjectArrayMembershipAgeMap();

        console.table(result.rows);
        console.log("[debugObjectArrayMembershipAgeMap]", result);

        return result;
    },
    buildGlobalObjectRingAgeMap: function(options = {}) {
        const selectedEntries =
            Array.isArray(options.selectedEntries)
                ? options.selectedEntries
                : this.getActiveRingSelectionEntries();

        const currentTime =
            options.currentTime !== undefined
                ? options.currentTime
                : this.getCurrentTimeCounter();

        const targetInfo =
            options.targetInfo ||
            this.collectObjectIdsReferencedByObjectSelection({
                selectedEntries,
                currentTime
            });

        const allEvents = [];

        for (const objectNodeId of targetInfo.objectIds || []) {
            const ringResult = this.buildObjectRingEventList({
                objectNodeId,
                selectedEntries,
                currentTime
            });

            for (const event of ringResult.events || []) {
                allEvents.push(event);
            }
        }

        // ----------------------------
        // ここが重要：
        // arrayMembershipAgeMap / ageMap / debugRows は
        // for (const event of allEvents) より前に作る
        // ----------------------------
        const arrayMembershipResult =
            this.buildObjectArrayMembershipAgeMap(selectedEntries);

        const arrayMembershipAgeMap = arrayMembershipResult.ageMap;

        const ageMap = new Map();
        const debugRows = [];

        // 単一変数用。
        // 配列変数は arrayMembershipAgeMap 側で処理し、
        // 単一変数だけ groups に入れて全体時系列で age を決める。
        const groups = new Map();

        for (const event of allEvents) {
            const variableName = String(event.variableName ?? "");
            const paletteKey = String(event.paletteKey ?? "pink");

            // ----------------------------
            // A. 配列変数の場合:
            // 現在配列内なら age 0
            // 外れたものは age 1,2,3...
            // 表示対象外なら null
            // ----------------------------
            const arrayAge = this.getObjectArrayMembershipAge(
                event,
                arrayMembershipAgeMap
            );

            if (arrayAge !== undefined) {
                const key = this.getObjectRingEventIdentity(event);

                // null も入れる。
                // paint 側で fallback させず「表示しない」にするため。
                ageMap.set(key, arrayAge);

                debugRows.push({
                    groupKey: `${variableName}::${paletteKey}`,
                    ageSource: "array-membership",
                    objectNodeId: event.objectNodeId,
                    variableName: event.variableName,
                    accessLabel: event.accessLabel,
                    sourceKind: event.sourceKind,
                    timeCounter: event.timeCounter,
                    rawAge: arrayAge,
                    normalizedAge: arrayAge,
                    paletteKey: event.paletteKey
                });

                continue;
            }

            // ----------------------------
            // B. 単一変数の場合:
            // 全体時系列で古いほど薄くする
            // ----------------------------
            const groupKey = `${variableName}::${paletteKey}`;

            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }

            groups.get(groupKey).push(event);
        }

        for (const [groupKey, events] of groups.entries()) {
            events.sort((a, b) => {
                const at = Number(a.timeCounter ?? 0);
                const bt = Number(b.timeCounter ?? 0);

                return (
                    at - bt ||
                    String(a.cpID).localeCompare(String(b.cpID)) ||
                    String(a.objectNodeId).localeCompare(String(b.objectNodeId)) ||
                    String(a.accessLabel).localeCompare(String(b.accessLabel))
                );
            });

            for (let i = 0; i < events.length; i++) {
                const event = events[i];

                // 古いものほど age が大きい
                // 最新: age 0
                const rawAge = events.length - 1 - i;
                const age = this.normalizeAgeByFadeMode(rawAge);

                const key = this.getObjectRingEventIdentity(event);

                if (age !== null) {
                    ageMap.set(key, age);
                }

                debugRows.push({
                    groupKey,
                    ageSource: "global-time",
                    objectNodeId: event.objectNodeId,
                    variableName: event.variableName,
                    accessLabel: event.accessLabel,
                    sourceKind: event.sourceKind,
                    timeCounter: event.timeCounter,
                    rawAge,
                    normalizedAge: age,
                    paletteKey: event.paletteKey
                });
            }
        }

        return {
            ageMap,
            rows: debugRows,
            allEvents,
            targetInfo,
            arrayMembershipResult
        };
    },

    debugGlobalObjectRingAgeMap: function() {
        const result = this.buildGlobalObjectRingAgeMap();

        console.table(result.rows);

        console.log("[debugGlobalObjectRingAgeMap]", {
            eventCount: result.allEvents.length,
            ageMapSize: result.ageMap.size,
            result
        });

        return result;
    },

    setEquals: function(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        if (a.size !== b.size) return false;
        for (const x of a) {
            if (!b.has(x)) return false;
        }
        return true;
    },
    normalizePaletteKey: function(paletteKey) {
        const s = String(paletteKey ?? "pink").trim().toLowerCase();
        if (s === "green") return "green";
        return "pink";
    },

    // ----------------------------
    // 薄色化指定 fadeMode を読む
    // ----------------------------

    // ----------------------------
    // グラデーション方式を読む
    // ----------------------------
    getGradientMode: function() {
        const mode = window.VariableHistoryOptions?.gradientMode;
        if (mode === "stack") return "stack";
        return "time";
    },

    // ----------------------------
    // stack グラデーションの濃淡方向を読む
    // ----------------------------
    getStackShadeMode: function() {
        const mode = window.VariableHistoryOptions?.stackShadeMode;

        if (mode === "headDark") return "headDark";

        // default:
        // 末尾側、つまり最大 index 側を濃くする
        return "tailDark";
    },

    getFadeMode: function() {
        const mode = window.VariableHistoryOptions?.fadeMode;
        if (mode === "recent5") return "recent5";
        return "all";
    },

    normalizeAgeByFadeMode: function(age) {
        const n = Number(age);
        if (!Number.isFinite(n)) return null;

        const fadeMode = this.getFadeMode();

        // オプション2:
        // 現在 + 過去4つだけ表示する
        if (fadeMode === "recent5") {
            if (n < 0 || n > 4) return null;
            return n;
        }

        // オプション1:
        // 古いものも一番薄い色として残す
        if (n < 0) return null;
        return Math.min(n, 4);
    },

    getPalette: function(paletteKey) {
        const key = this.normalizePaletteKey(paletteKey);
        return this.PALETTES[key] || this.PALETTES.pink;
    },

    paintNodeWithPalette: function(node, paletteKey, idx) {
        const palette = this.getPalette(paletteKey);
        const c = palette[idx];
        if (!c) return;

        node.color = {
            border: c.border,
            background: c.background,
            highlight: { border: c.border, background: c.background },
            hover: { border: c.border, background: c.background }
        };
    },

    getOverlayNodeId: function(baseNodeId, paletteKey, layerRole = "outer-ring-1") {
        const baseId = String(baseNodeId ?? "");
        const palette = this.normalizePaletteKey
            ? this.normalizePaletteKey(paletteKey)
            : String(paletteKey ?? "pink").trim().toLowerCase();

        return `__vh_overlay__${layerRole}__${palette}__${baseId}`;
    },

    getOverlaySizeOffset: function(layerRole = "outer-ring-1") {
        const role = String(layerRole ?? "outer-ring-1");
        if (role === "outer-ring-2") return 12; // 将来3色目用
        if (role === "outer-ring-1") return 7;  // 今回の green 用
        return 0;
    },

    hasOverlayNode: function(visGraph, overlayId) {
        const id = String(overlayId ?? "");
        return visGraph.nodes.some(node => String(node.id) === id);
    },

    buildOverlayNodeFromBase: function(baseNode, paletteKey, idx, layerRole = "outer-ring-1") {
        if (!baseNode) return null;

        const palette = this.getPalette(paletteKey);
        const c = palette[idx];
        if (!c) return null;

        const overlayId = this.getOverlayNodeId(baseNode.id, paletteKey, layerRole);

        const baseLabel = String(baseNode.label ?? "");
        const baseFontSize =
            (typeof baseNode.font === "object" && baseNode.font && baseNode.font.size)
                ? Number(baseNode.font.size)
                : 14;

        // 外側リング用に本体より少し大きい font size にする
        const overlayFontSize = baseFontSize + 8;

        return {
            id: overlayId,
            label: baseLabel,
            shape: "ellipse",

            x: baseNode.x,
            y: baseNode.y,

            physics: false,
            fixed: { x: true, y: true },
            selectable: false,
            chosen: false,

            // 文字は見せないが、ellipse のサイズ計算には使う
            font: {
                size: overlayFontSize,
                color: "rgba(0,0,0,0)"
            },

            color: {
                border: c.border,
                background: c.background,
                highlight: { border: c.border, background: c.background },
                hover: { border: c.border, background: c.background }
            },

            borderWidth: 1,
            hidden: !!baseNode.hidden
        };
    },

    addOverlayNodeForBaseNode: function(visGraph, baseNode, paletteKey, idx, layerRole = "outer-ring-1") {
        if (!visGraph || !Array.isArray(visGraph.nodes) || !baseNode) return null;

        const overlayNode = this.buildOverlayNodeFromBase(baseNode, paletteKey, idx, layerRole);
        if (!overlayNode) return null;

        if (this.hasOverlayNode(visGraph, overlayNode.id)) {
            return overlayNode.id;
        }

        // overlay を先に入れて、本体がその上に描かれやすくする
        visGraph.nodes.unshift(overlayNode);
        return overlayNode.id;
    },

    addOverlayNodeForBaseNodeId: function(visGraph, baseNodeId, paletteKey, idx, layerRole = "outer-ring-1") {
        if (!visGraph || !Array.isArray(visGraph.nodes)) return null;

        const targetId = String(baseNodeId ?? "");
        const baseNode = visGraph.nodes.find(node => String(node.id) === targetId);
        if (!baseNode) return null;

        return this.addOverlayNodeForBaseNode(visGraph, baseNode, paletteKey, idx, layerRole);
    },

    getSelectionEntries: function() {
        if (typeof window.VariableHistorySelection?.getAll === "function") {
            return window.VariableHistorySelection.getAll();
        }
        return [];
    },

    buildVisibleTimelineForTarget: function(targetName) {
        if (!targetName) return [];

        const timeline = this.buildTargetTimeline(targetName);
        if (timeline.length === 0) return [];

        const currentTime = this.getCurrentTimeCounter();
        if (currentTime === null) return [];

        return timeline.filter(x => x.timeCounter <= currentTime);
    },

    collectScalarNodeAgeMap: function(timeline) {
        const result = new Map();

        const usable = this.compressScalarTimeline(timeline);
        if (usable.length === 0) return result;

        const lastState = timeline[timeline.length - 1].state;
        const hasCurrentTarget = lastState.exists;

        for (let i = 0; i < usable.length; i++) {
            const nodeId = String(usable[i].nodeId);

            const rawDiff = (usable.length - 1 - i) + (hasCurrentTarget ? 0 : 1);

            // step1-2:
            // secondary green 側でも fadeMode を反映する
            // - all     : 古いものも age 4 に丸めて残す
            // - recent5 : age 0..4 だけ残し、それより古いものは表示対象から外す
            const diff = this.normalizeAgeByFadeMode(rawDiff);

            if (diff === null) continue;

            result.set(nodeId, diff);
        }

        return result;
    },

    // ----------------------------
    // 配列について、
    // 「現在の中身 + 最近外れたノード順」のモデルを作る
    // ----------------------------
    buildArrayRecentRemovedModel: function(timeline) {
        let prevSet = null;
        let currentSet = new Set();

        // 最近外れた順。先頭ほど新しい。
        let removedHistory = [];

        for (const entry of timeline) {
            const nextSet = entry.state.exists
                ? new Set(entry.state.nodeIds)
                : new Set();

            if (prevSet !== null) {
                // 1. current に戻ってきたノードは removed 履歴から外す
                removedHistory = removedHistory.filter(id => !nextSet.has(id));

                // 2. 今回新しく current から外れたノードを集める
                const newlyRemoved = [];

                for (const id of prevSet) {
                    const s = String(id);
                    if (!nextSet.has(s)) {
                        newlyRemoved.push(s);
                    }
                }

                if (newlyRemoved.length > 0) {
                    const newlyRemovedSet = new Set(newlyRemoved);

                    // 3. 重複を避けるため、同じ id を古い履歴側から消す
                    removedHistory = removedHistory.filter(id => !newlyRemovedSet.has(id));

                    // 4. 新しく外れたノードを先頭に追加する
                    //    これにより「最近外れた順」に詰める
                    removedHistory = [
                        ...newlyRemoved,
                        ...removedHistory
                    ];
                }
            }

            prevSet = nextSet;
            currentSet = nextSet;
        }

        // 念のため、現在 current にいるノードは removed 側から消す
        removedHistory = removedHistory.filter(id => !currentSet.has(id));

        return {
            currentSet,
            removedHistory
        };
    },

    collectArrayNodeAgeMap: function(timeline) {
        const result = new Map();

        const model = this.buildArrayRecentRemovedModel(timeline);
        const currentSet = model.currentSet;
        const removedHistory = model.removedHistory;

        // 現在配列内にあるノードは age 0
        for (const id of currentSet) {
            const age = this.normalizeAgeByFadeMode(0);
            if (age !== null) {
                result.set(String(id), age);
            }
        }

        // 最近外れたノード順に age 1,2,3,4...
        for (let i = 0; i < removedHistory.length; i++) {
            const id = String(removedHistory[i]);
            const rawAge = i + 1;
            const age = this.normalizeAgeByFadeMode(rawAge);

            if (age === null) continue;

            result.set(id, age);
        }

        return result;
    },

    // ----------------------------
    // secondary green / overlay 判定用に、
    // 配列 index ベースの nodeAgeMap を作る
    // ----------------------------
    collectArrayStackNodeAgeMap: function(visibleTimeline) {
        const result = new Map();

        if (!visibleTimeline || visibleTimeline.length === 0) return result;

        const graphObj = this.getCurrentStoredGraph();
        if (!graphObj) return result;

        const lastEntry = visibleTimeline[visibleTimeline.length - 1];
        const targetName = String(lastEntry.targetName ?? "").trim();

        if (!targetName) return result;

        const info = this.getTargetInfoFromStoredGraph(graphObj, targetName);

        if (!info || !info.isArray || !info.targetNodeId) {
            return result;
        }

        const entries = this.getArrayContentsEntriesFromStoredGraph(
            graphObj,
            info.targetNodeId
        );

        if (!entries || entries.length === 0) return result;

        entries.sort((a, b) => a.index - b.index);

        const n = entries.length;

        for (let rank = 0; rank < entries.length; rank++) {
            const entry = entries[rank];
            const age = this.getStackAgeForRank(rank, n);

            if (age === null) continue;

            result.set(String(entry.nodeId), age);
        }
        return result;
    },

    applySecondaryGreenDecorations: function(visGraph, primaryTargetName) {
        const entries = this.getSelectionEntries();
        if (!entries || entries.length < 2) return;

        const secondary = entries[1];
        if (!secondary) return;

        if (secondary.paletteKey !== "green") return;
        if (secondary.layerRole !== "outer-ring-1") return;

        // secondary の visible timeline
        const secondaryVisibleTimeline = this.buildVisibleTimelineForTarget(secondary.name);
        if (secondaryVisibleTimeline.length === 0) return;

        const secondaryNodeAgeMap = this.collectNodeAgeMapFromVisibleTimeline(secondaryVisibleTimeline);

        // primary 側の nodeAgeMap も作る
        let primaryNodeAgeMap = new Map();
        if (primaryTargetName) {
            const primaryVisibleTimeline = this.buildVisibleTimelineForTarget(primaryTargetName);
            if (primaryVisibleTimeline.length > 0) {
                primaryNodeAgeMap = this.collectNodeAgeMapFromVisibleTimeline(primaryVisibleTimeline);
            }
        }

        for (const [nodeId, greenAge] of secondaryNodeAgeMap.entries()) {
            const hasPrimaryColor = primaryNodeAgeMap.has(nodeId);

            if (hasPrimaryColor) {
                // pink と green が両方ある → green は外側 overlay
                this.addOverlayNodeForBaseNodeId(
                    visGraph,
                    nodeId,
                    secondary.paletteKey,
                    greenAge,
                    secondary.layerRole
                );
            } else {
                // green だけ → 本体を green に塗る
                this.paintBaseNodeById(
                    visGraph,
                    nodeId,
                    secondary.paletteKey,
                    greenAge
                );
            }
        }
    },

    collectNodeAgeMapFromVisibleTimeline: function(visibleTimeline) {
        const result = new Map();
        if (!visibleTimeline || visibleTimeline.length === 0) return result;

        const lastState = visibleTimeline[visibleTimeline.length - 1].state;

        if (lastState.isArray) {
            // step2-4:
            // stack モードでは、secondary green 側も配列 index ベースで ageMap を作る
            if (this.getGradientMode() === "stack") {
                return this.collectArrayStackNodeAgeMap(visibleTimeline);
            }

            return this.collectArrayNodeAgeMap(visibleTimeline);
        }

        return this.collectScalarNodeAgeMap(visibleTimeline);
    },

    paintBaseNodeById: function(visGraph, nodeId, paletteKey, idx) {
        if (!visGraph || !Array.isArray(visGraph.nodes)) return;

        const targetId = String(nodeId ?? "");
        const node = visGraph.nodes.find(n => String(n.id) === targetId);
        if (!node) return;

        this.paintNodeWithPalette(node, paletteKey, idx);
    },

// ----------------------------
// 履歴グループキー
// 今回は main-callx でまとめる
// ----------------------------
    getHistoryGroupKey: function(contextID) {
        const s = String(contextID ?? "");
        const m = s.match(/^(main-call\d+)/);
        return m ? m[1] : s;
    },

// ----------------------------
// 現在 target が属する履歴グループの snapshot を集める
// ----------------------------
    collectSnapshotsForCurrentTarget: function() {
        const stored = __$__.Context && __$__.Context.StoredGraph;
        const snap = __$__.Context && __$__.Context.SnapshotContext;
        if (!stored || !snap) return [];

        const groupKey = this.getHistoryGroupKey(snap.contextSensitiveID);
        const snaps = [];

        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const ctxID of Object.keys(contexts)) {
                if (this.getHistoryGroupKey(ctxID) !== groupKey) continue;

                const graphObj = contexts[ctxID];
                if (!graphObj) continue;

                snaps.push({
                    cpID: String(cpID),
                    contextID: String(ctxID),
                    g: graphObj,
                    timeCounter: graphObj.timeCounter ?? null
                });
            }
        }

        snaps.sort((a, b) => (a.timeCounter ?? 0) - (b.timeCounter ?? 0));
        return snaps;
    },
// ----------------------------
// 1 snapshot から target の状態を共通形式で取り出す
// exists: その snapshot で target が存在するか
// isArray: 配列かどうか
// nodeIds: 現在 target が指している node 集合
// ----------------------------
    extractTargetState: function(graphObj, targetName) {
        const info = this.getTargetInfoFromStoredGraph(graphObj, targetName);

        if (!info.targetNodeId) {
            return {
                exists: false,
                isArray: false,
                nodeIds: new Set()
            };
        }

        if (info.isArray) {
            return {
                exists: true,
                isArray: true,
                nodeIds: new Set(info.arrayContentsSet)
            };
        }

        return {
            exists: true,
            isArray: false,
            nodeIds: new Set([String(info.targetNodeId)])
        };
    },

// ----------------------------
// target の timeline を作る
// ----------------------------
    buildTargetTimeline: function(targetName) {
        const snaps = this.collectSnapshotsForCurrentTarget();

        return snaps
            .map(s => ({
                cpID: s.cpID,
                contextID: s.contextID,
                timeCounter: s.timeCounter,
                targetName: String(targetName ?? ""),
                state: this.extractTargetState(s.g, targetName)
            }))
            .filter(x => x.timeCounter !== null);
    },

// ----------------------------
// 現在 snapshot の timeCounter を返す
// ----------------------------
    getCurrentTimeCounter: function() {
        const snap = __$__.Context && __$__.Context.SnapshotContext;
        if (!snap) return null;

        const g = this.getGraphAt(snap.cpID, snap.contextSensitiveID);
        return g ? (g.timeCounter ?? null) : null;
    },

// ----------------------------
// 単一変数用:
// 連続して同じ node を指している履歴は 1 つに圧縮する
// ----------------------------
    compressScalarTimeline: function(timeline) {
        const result = [];
        let prevNodeId = null;

        for (const entry of timeline) {
            if (!entry.state.exists) continue;

            const ids = [...entry.state.nodeIds];
            if (ids.length === 0) continue;

            const nodeId = String(ids[0]);
            if (nodeId === prevNodeId) continue;

            result.push({
                ...entry,
                nodeId
            });
            prevNodeId = nodeId;
        }

        return result;
    },

    // ----------------------------
    // step2-4:
    // stack 表示用の age 計算を共通化する
    // ----------------------------
    getStackAgeForRank: function(rank, totalCount) {
        const n = Number(totalCount);
        const r = Number(rank);

        if (!Number.isFinite(n) || !Number.isFinite(r) || n <= 0) {
            return null;
        }

        const stackShadeMode = this.getStackShadeMode();

        let rawAge;

        if (stackShadeMode === "headDark") {
            // 先頭、つまり最小 index 側を濃くする
            rawAge = r;
        } else {
            // 末尾、つまり最大 index 側を濃くする
            rawAge = (n - 1) - r;
        }

        return Math.min(Math.max(rawAge, 0), 4);
    },

    // ----------------------------
    // 配列を stack / 配列内位置ベースで塗る
    // まずは tailDark 固定:
    //   最大 index 側を濃くする
    // ----------------------------
    paintArrayStackTimeline: function(visGraph, visibleTimeline, paletteKey = "pink") {
        if (!visGraph || !Array.isArray(visGraph.nodes)) return;
        if (!visibleTimeline || visibleTimeline.length === 0) return;

        const nodeMap = new Map();
        visGraph.nodes.forEach(n => nodeMap.set(String(n.id), n));

        // 現在表示している snapshot の graph を使う
        const graphObj = this.getCurrentStoredGraph();
        if (!graphObj) return;

        const lastState = visibleTimeline[visibleTimeline.length - 1].state;

        // 配列でない場合は stack 表示できない
        if (!lastState || !lastState.isArray) return;

        // visibleTimeline の最後の snapshot から、
        // その変数が参照している arrayNodeID を取り直す
        const lastEntry = visibleTimeline[visibleTimeline.length - 1];
        const targetName = lastEntry.targetName || null;

        let arrayNodeId = null;

        // targetName が取れる場合は、それを使って arrayNodeID を取る
        if (targetName) {
            const info = this.getTargetInfoFromStoredGraph(graphObj, targetName);
            if (info && info.isArray) {
                arrayNodeId = info.targetNodeId;
            }
        }

        // fallback:
        // targetName がない場合は、現在選択中 primary から取る
        if (!arrayNodeId) {
            const primaryEntry =
                typeof window.VariableHistorySelection?.getPrimaryEntry === "function"
                    ? window.VariableHistorySelection.getPrimaryEntry()
                    : null;

            const primaryName = primaryEntry?.name || window.VariableHistorySelection?.get?.();

            if (primaryName) {
                const info = this.getTargetInfoFromStoredGraph(graphObj, primaryName);
                if (info && info.isArray) {
                    arrayNodeId = info.targetNodeId;
                }
            }
        }

        if (!arrayNodeId) return;

        const entries = this.getArrayContentsEntriesFromStoredGraph(graphObj, arrayNodeId);

        if (!entries || entries.length === 0) return;

        // index 昇順にする
        entries.sort((a, b) => a.index - b.index);

        const n = entries.length;
        const stackShadeMode = this.getStackShadeMode();

        for (let rank = 0; rank < entries.length; rank++) {
            const entry = entries[rank];
            const node = nodeMap.get(String(entry.nodeId));
            if (!node) continue;

            const age = this.getStackAgeForRank(rank, n);
            if (age === null) continue;

            this.paintNodeWithPalette(node, paletteKey, age);
        }
    },

// ----------------------------
// 配列用 painter
// ----------------------------
    paintArrayTimeline: function(visGraph, timeline, paletteKey = "pink") {
        if (this.getGradientMode() === "stack") {
            this.paintArrayStackTimeline(visGraph, timeline, paletteKey);
            return;
        }
        const nodeMap = new Map();
        visGraph.nodes.forEach(n => nodeMap.set(String(n.id), n));

        const model = this.buildArrayRecentRemovedModel(timeline);
        const currentSet = model.currentSet;
        const removedHistory = model.removedHistory;

        // 現在配列内にあるノードは一番濃くする
        for (const id of currentSet) {
            const node = nodeMap.get(String(id));
            if (!node) continue;

            const age = this.normalizeAgeByFadeMode(0);
            if (age !== null) {
                this.paintNodeWithPalette(node, paletteKey, age);
            }
        }

        // 最近外れたノード順に age 1,2,3,4...
        for (let i = 0; i < removedHistory.length; i++) {
            const id = String(removedHistory[i]);
            const node = nodeMap.get(id);
            if (!node) continue;

            const rawAge = i + 1;
            const age = this.normalizeAgeByFadeMode(rawAge);

            if (age !== null) {
                this.paintNodeWithPalette(node, paletteKey, age);
            }
        }
    },

// ----------------------------
// 単一変数用 painter
// 「今その snapshot で target が存在しないなら濃いピンクは出さない」
// ----------------------------
    paintScalarTimeline: function(visGraph, timeline, paletteKey = "pink") {
        const nodeMap = new Map();
        visGraph.nodes.forEach(node => nodeMap.set(String(node.id), node));

        const usable = this.compressScalarTimeline(timeline);
        if (usable.length === 0) return;

        const lastState = timeline[timeline.length - 1].state;
        const hasCurrentTarget = lastState.exists;

        for (let i = 0; i < usable.length; i++) {
            const node = nodeMap.get(String(usable[i].nodeId));
            if (!node) continue;

            const rawDiff = (usable.length - 1 - i) + (hasCurrentTarget ? 0 : 1);

            // step1-1:
            // fadeMode に応じて、
            // - all     : 古いものも age 4 に丸めて残す
            // - recent5 : age 0..4 だけ残し、それより古いものは塗らない
            const diff = this.normalizeAgeByFadeMode(rawDiff);

            if (diff === null) continue;

            this.paintNodeWithPalette(node, paletteKey, diff);
        }
    },

// ----------------------------
// 共通入口
// timeline を作って、現在 snapshot までに切り、
// 配列か単一変数かで painter を分ける
// ----------------------------
    highlightTargetHistory: function(visGraph, targetName, paletteKey = "pink") {
        if (!targetName) return;

        const timeline = this.buildTargetTimeline(targetName);
        if (timeline.length === 0) return;

        const currentTime = this.getCurrentTimeCounter();
        if (currentTime === null) return;

        const visibleTimeline = timeline.filter(x => x.timeCounter <= currentTime);
        if (visibleTimeline.length === 0) return;

        const lastState = visibleTimeline[visibleTimeline.length - 1].state;

        if (lastState.isArray) {
            this.paintArrayTimeline(visGraph, visibleTimeline, paletteKey);
        } else {
            this.paintScalarTimeline(visGraph, visibleTimeline, paletteKey);
        }
    },

// ----------------------------
// 旧 editor-style の色付け
// 現在の通常描画では使わない。
// editor / object 共通の描画は applyObjectRingHistory を使う。
// debug や fallback 用として残しておく。
// ----------------------------
    applyColorsToVisData: function(visGraph, targetName) {
        if (!__$__.Context || !targetName) return;

        const primaryEntry =
            (typeof window.VariableHistorySelection.getPrimaryEntry === "function")
                ? window.VariableHistorySelection.getPrimaryEntry()
                : null;

        const paletteKey = primaryEntry?.paletteKey || "pink";

        // まず primary は今まで通り本体に塗る
        this.highlightTargetHistory(visGraph, targetName, paletteKey);

        // secondary の green は
        // - primary と重なるなら overlay
        // - 重ならないなら base fill
        this.applySecondaryGreenDecorations(visGraph, targetName);
    },

    


   
};

// Hook処理
(function() {
    const hookInterval = setInterval(() => {
        if (
            typeof __$__ !== 'undefined' &&
            __$__.StoredGraphFormat &&
            __$__.StoredGraphFormat.Graph &&
            __$__.StoredGraphFormat.Graph.prototype.generateVisjsGraph
        ) {
            clearInterval(hookInterval);

            const GraphProto = __$__.StoredGraphFormat.Graph.prototype;
            const originalGenerateVisjsGraph = GraphProto.generateVisjsGraph;

            GraphProto.generateVisjsGraph = function() {
                const visGraph = originalGenerateVisjsGraph.apply(this, arguments);
                try {
                    if (window.VariableHistoryView) {
                        window.VariableHistoryView.removeArrayNodes(visGraph);

                        // editor / object のどちらで選択した場合も、
                        // 通常描画は object-ring style に統一する
                        window.VariableHistoryView.applyObjectRingHistory(visGraph);

                        // 旧 editor-style の色付けは fallback/debug 用として残す。
                        // 通常は呼ばない。
                        // const targetName = window.VariableHistorySelection.get();
                        // window.VariableHistoryView.applyColorsToVisData(visGraph, targetName);
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
    changedSnapshotKeys: [],
    changedSnapshotDebug: [],
    currentIndex: 0,
    interval: 800,

    baseSnapshotContext: null,
    callPrefix: null,
    fixedPositions: null,
    isPlaying: false,
    isPreparing: false,
    isPrepared: false,
    preparedCallPrefix: null,
    preparedTargetName: null,
    preparedSelectionKey: null,
    allSnapsSorted: [],
    playBtn: null,
    stopBtn: null,
    prevBtn: null,
    nextBtn: null,
    prepareOverlay: null,
    statusLabel: null,

    // 今画面に表示されている frame index
    // まだ何も表示していないときは -1
    displayedIndex: -1,
    editorFrameLineMarkerId: null,
    editorFrameColumnMarkerId: null,
    editorActiveLineWasEnabled: null,
    editorGutterLineWasEnabled: null,

    init: function() {
        this.createUI();
    },

    // ----------------------------
    // UI
    // ----------------------------
    showPrepareOverlay: function(message = "Preparing layout...") {
        if (!this.prepareOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'animation-prepare-overlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                inset: '0',
                background: '#ffffff',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '600',
                color: '#333',
                pointerEvents: 'auto'
            });
            document.body.appendChild(overlay);
            this.prepareOverlay = overlay;
        }
        this.prepareOverlay.innerText = message;
        this.prepareOverlay.style.display = 'flex';
    },

    updatePrepareOverlay: function(message) {
        if (this.prepareOverlay) {
            this.prepareOverlay.innerText = message;
        }
    },

    hidePrepareOverlay: function() {
        if (this.prepareOverlay) {
            this.prepareOverlay.style.display = 'none';
        }
    },

    ensureFrameIndicatorStyles: function() {
        if (document.getElementById("vh-frame-indicator-style")) return;

        const style = document.createElement("style");
        style.id = "vh-frame-indicator-style";
        style.textContent = `
            .ace_marker-layer .vh-frame-cp-line {
                position: absolute;
                background: rgba(120, 120, 120, 0.22);
                z-index: 2;
            }

            .ace_marker-layer .vh-frame-cp-column {
                position: absolute;
                border-left: 5px solid #ff3333;
                background: rgba(255, 0, 0, 0.08);
                z-index: 4;
            }
        `;
        document.head.appendChild(style);
    },

    getEditorForFrameIndicator: function() {
        if (typeof __$__ !== "undefined" && __$__.editor) {
            return __$__.editor;
        }

        const editorEl = document.querySelector(".ace_editor");
        if (editorEl && typeof ace !== "undefined") {
            return ace.edit(editorEl);
        }

        return null;
    },

    removeEditorFrameMarkers: function() {
        const editor = this.getEditorForFrameIndicator();
        if (!editor) return;

        const session = editor.getSession();

        if (this.editorFrameLineMarkerId !== null) {
            session.removeMarker(this.editorFrameLineMarkerId);
            this.editorFrameLineMarkerId = null;
        }

        if (this.editorFrameColumnMarkerId !== null) {
            session.removeMarker(this.editorFrameColumnMarkerId);
            this.editorFrameColumnMarkerId = null;
        }
    },

    clearEditorFrameIndicator: function() {
        const editor = this.getEditorForFrameIndicator();
        if (!editor) return;

        this.removeEditorFrameMarkers();

        if (this.editorActiveLineWasEnabled !== null) {
            editor.setHighlightActiveLine(this.editorActiveLineWasEnabled);
            this.editorActiveLineWasEnabled = null;
        }

        if (
            this.editorGutterLineWasEnabled !== null &&
            typeof editor.setHighlightGutterLine === "function"
        ) {
            editor.setHighlightGutterLine(this.editorGutterLineWasEnabled);
            this.editorGutterLineWasEnabled = null;
        }
    },

    getSourceLocationForKey: function(key) {
        if (!key) return null;

        const table = __$__.Context && __$__.Context.CheckPointTable;
        if (!table) {
            console.warn("[frame indicator] CheckPointTable not found");
            return null;
        }

        const cpID = String(key.cpID);

        const cpInfo =
            table[cpID] ||
            table[Number(cpID)] ||
            null;

        if (!cpInfo) {
            console.warn("[frame indicator] cp not found in CheckPointTable", {
                cpID,
                key
            });
            return null;
        }

        const line = Number(cpInfo.line);
        const column = Number(cpInfo.column ?? 0);

        if (!Number.isFinite(line)) {
            console.warn("[frame indicator] invalid checkpoint location", {
                cpID,
                cpInfo
            });
            return null;
        }

        return {
            cpID,
            line,
            column,
            row: Math.max(0, line - 1),   // Ace は 0-origin
            aceColumn: Math.max(0, Number.isFinite(column) ? column : 0),
            raw: cpInfo
        };
    },

    showEditorFrameIndicator: function(key) {
        this.ensureFrameIndicatorStyles();

        const editor = this.getEditorForFrameIndicator();
        if (!editor) return null;

        const loc = this.getSourceLocationForKey(key);

        // 前の frame の marker は消す
        this.removeEditorFrameMarkers();

        // current を選んだときなどに残る Ace の active line を消す
        if (this.editorActiveLineWasEnabled === null) {
            this.editorActiveLineWasEnabled = editor.getHighlightActiveLine();
        }
        editor.setHighlightActiveLine(false);

        if (
            this.editorGutterLineWasEnabled === null &&
            typeof editor.getHighlightGutterLine === "function"
        ) {
            this.editorGutterLineWasEnabled = editor.getHighlightGutterLine();
        }
        if (typeof editor.setHighlightGutterLine === "function") {
            editor.setHighlightGutterLine(false);
        }

        editor.clearSelection();
        editor.blur();

        if (!loc) return null;

        const Range = ace.require("ace/range").Range;
        const session = editor.getSession();

        const row = loc.row;
        const lineText = session.getLine(row) || "";

        const col = Math.max(
            0,
            Math.min(loc.aceColumn, lineText.length || loc.aceColumn)
        );

        // 行全体を薄いグレー
        this.editorFrameLineMarkerId = session.addMarker(
            new Range(row, 0, row, 1),
            "vh-frame-cp-line",
            "fullLine",
            false
        );

        // 該当文字位置に赤い縦線
        this.editorFrameColumnMarkerId = session.addMarker(
            new Range(row, col, row, Math.min(col + 1, lineText.length || col + 1)),
            "vh-frame-cp-column",
            "text",
            false
        );

        editor.renderer.scrollToLine(row, true, true, function() {});

        return loc;
    },

    createControlButton: function(label, onClick) {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.innerText = label;

        Object.assign(btn.style, {
            border: "1px solid #ddd",
            background: "#fff",
            borderRadius: "18px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px"
        });

        btn.onclick = onClick;
        return btn;
    },

    setPlaybackControlsEnabled: function(enabled) {
        const buttons = [this.stopBtn, this.prevBtn, this.nextBtn];

        for (const btn of buttons) {
            if (!btn) continue;
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? "1" : "0.45";
            btn.style.cursor = enabled ? "pointer" : "not-allowed";
        }
    },

    createUI: function() {
        const old = document.getElementById('animation-panel');
        if (old) old.remove();

        const container = document.createElement('div');
        container.id = 'animation-panel';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'white',
            padding: '10px 20px',
            borderRadius: '30px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            border: '1px solid #FF69B4'
        });

        this.statusLabel = document.createElement('span');
        this.statusLabel.innerText =
            window.VariableHistoryOptions &&
            typeof window.VariableHistoryOptions.buildAnimationStatusText === "function"
                ? window.VariableHistoryOptions.buildAnimationStatusText("ready")
                : "Ready (no variable selected)";

        // 1コマ戻す
        this.prevBtn = this.createControlButton("◀ Prev", () => {
            this.stepBackward();
        });

        // Prepare / Play
        this.playBtn = this.createControlButton("▶ Prepare Animation", () => {
            if (this.isPreparing) return;

            const entries =
                (typeof this.getAnimationSelectionEntries === "function")
                    ? this.getAnimationSelectionEntries()
                    : [];

            if (!entries || entries.length === 0) {
                this.statusLabel.innerText = "Ready (no variable selected)";
                return;
            }

            const currentSelectionKey = this.getAnimationSelectionKey(entries);

            const curCtx = String(__$__.Context.SnapshotContext?.contextSensitiveID ?? "");
            const m = curCtx.match(/^(main-call\d+)/);
            const currentCallPrefix = m ? m[1] : null;

            const needsPrepare =
                !this.isPrepared ||
                this.preparedCallPrefix !== currentCallPrefix ||
                this.preparedSelectionKey !== currentSelectionKey;

            if (needsPrepare) {
                this.beginPrepare();
            } else {
                this.startPlayback();
            }
        });

        // 停止
        this.stopBtn = this.createControlButton("⏸ Stop", () => {
            this.pausePlayback();
        });

        // 1コマ進める
        this.nextBtn = this.createControlButton("Next ▶", () => {
            this.stepForward();
        });

        container.appendChild(this.statusLabel);
        container.appendChild(this.prevBtn);
        container.appendChild(this.playBtn);
        container.appendChild(this.stopBtn);
        container.appendChild(this.nextBtn);

        document.body.appendChild(container);

        // 最初は Prepare 前なので Prev / Stop / Next は無効
        this.setPlaybackControlsEnabled(false);
    },

    // ----------------------------
    // 基本データ取得
    // ----------------------------
    getBaseLayoutFrame: function() {
        if (!this.allSnapsSorted || this.allSnapsSorted.length === 0) return null;
        return this.allSnapsSorted[0];
    },

    // StoredGraph の variableEdges から targetName の参照先を取る
    getVarTargetIdFromStoredGraph: function(graphObj, targetName) {
        if (!graphObj || !Array.isArray(graphObj.variableEdges)) return null;

        const varKey1 = `__Variable-${targetName}`;
        const varKey2 = `Variable-${targetName}`;

        const e = graphObj.variableEdges.find(v =>
            v.from === varKey1 ||
            v.from === varKey2 ||
            v.label === targetName ||
            v.displayLabel === targetName
        );

        return e && e.to ? String(e.to) : null;
    },

    // StoredGraph だけを使って target の情報を得る
    getTargetInfoFromStoredGraphForName: function(graphObj, targetName) {
        const targetNodeId = this.getVarTargetIdFromStoredGraph(graphObj, targetName);
        const isArray = !!targetNodeId && String(targetNodeId).includes("arr");

        return {
            targetNodeId,
            isArray,
            arrayContentsSet: isArray
                ? window.VariableHistoryView.getArrayContentsSetFromStoredGraph(graphObj, targetNodeId)
                : new Set()
        };
    },

    // 変化判定用 signature も StoredGraph ベース
    getSignature: function(graphObj, targetName) {
    const info = this.getTargetInfoFromStoredGraphForName(graphObj, targetName);

    if (!info.targetNodeId) return "VAR:null";

    // 単一ノード変数
    if (!info.isArray) {
        return `VAR:${info.targetNodeId}`;
    }

    const gradientMode = window.VariableHistoryOptions?.gradientMode || "time";

    // step2-5:
    // stack モードでは配列内の順序が色に影響するため、
    // 集合ではなく index 付きの順序を signature に入れる
    if (
        gradientMode === "stack" &&
        window.VariableHistoryView &&
        typeof window.VariableHistoryView.getArrayContentsEntriesFromStoredGraph === "function"
    ) {
        const entries = window.VariableHistoryView
            .getArrayContentsEntriesFromStoredGraph(graphObj, info.targetNodeId)
            .sort((a, b) => a.index - b.index);

        const ordered = entries
            .map(entry => `${entry.index}:${entry.nodeId}`)
            .join(",");

        return `ARRAY_ORDERED:${info.targetNodeId}:${ordered}`;
    }

    // time モードでは今まで通り集合として扱う
    const arr = Array.from(info.arrayContentsSet).sort();
    return `ARRAY:${info.targetNodeId}:${arr.join(",")}`;
},
    // ----------------------------
    // 複数選択 entry を取得する
    // ----------------------------
    getAnimationSelectionEntries: function() {
        if (
            window.VariableHistoryView &&
            typeof window.VariableHistoryView.getActiveRingSelectionEntries === "function"
        ) {
            return window.VariableHistoryView
                .getActiveRingSelectionEntries()
                .map((entry, index) => ({
                    slot: entry.slot || (index === 0 ? "primary" : "secondary"),
                    name: String(entry.name ?? ""),
                    paletteKey: entry.paletteKey || (index === 0 ? "pink" : "green"),
                    layerRole: entry.layerRole || (index === 0 ? "main-fill" : "outer-ring-1"),
                    sourceMode: entry.sourceMode || (
                        window.VariableHistoryOptions?.displayMode === "object"
                            ? "object"
                            : "variable"
                    ),
                    objectNodeId: entry.objectNodeId ?? null
                }))
                .filter(entry => entry.name);
        }

        return [];
    },

    // ----------------------------
    // animation 用: 現在の選択状態全体を key にする
    // 例:
    // primary:node:pink:main-fill|secondary:current:green:outer-ring-1
    // ----------------------------
    getAnimationSelectionKey: function(entries = null) {
        const es = entries || this.getAnimationSelectionEntries();
        if (!Array.isArray(es) || es.length === 0) return "";

        const selectionPart = es
            .map(entry => {
                const slot = String(entry.slot ?? "");
                const name = String(entry.name ?? "");
                const paletteKey = String(entry.paletteKey ?? "");
                const layerRole = String(entry.layerRole ?? "");
                return `${slot}:${name}:${paletteKey}:${layerRole}`;
            })
            .join("|");

        const optionPart =
            window.VariableHistoryOptions &&
            typeof window.VariableHistoryOptions.getAnimationOptionKey === "function"
                ? window.VariableHistoryOptions.getAnimationOptionKey()
                : "options:unknown";

        return `${selectionPart}||${optionPart}`;
    },

    // ----------------------------
    // UI 表示用
    // ----------------------------
    getAnimationSelectionLabel: function(entries = null) {
        const es = entries || this.getAnimationSelectionEntries();
        if (!Array.isArray(es) || es.length === 0) return "no target";

        return es
            .map(entry => `${entry.name}:${entry.paletteKey}`)
            .join(", ");
    },

    // ----------------------------
    // 1つの entry 用の signature を作る
    // 既存の getSignature(graphObj, targetName) を再利用する
    // ----------------------------
    getSignatureForEntry: function(graphObj, entry) {
        if (!entry || !entry.name) return "VAR:null";
        return this.getSignature(graphObj, entry.name);
    },

    // ----------------------------
    // 複数 entry をまとめた signature を作る
    // 例:
    // primary:node:VAR:xxx|secondary:current:ARRAY:yyy:a,b,c
    // ----------------------------
    getMergedSignature: function(graphObj, entries) {
        if (!graphObj) return "";
        if (!Array.isArray(entries) || entries.length === 0) return "";

        return entries
            .map(entry => {
                const slot = String(entry.slot ?? "");
                const name = String(entry.name ?? "");
                const sig = this.getSignatureForEntry(graphObj, entry);
                return `${slot}:${name}:${sig}`;
            })
            .join("|");
    },

    // ----------------------------
    // 確認用:
    // 現在の callPrefix 内の snapshot について mergedSignature を一覧表示
    // ----------------------------
    debugMergedSignatures: function() {
        const entries = this.getAnimationSelectionEntries();
        const stored = __$__.Context?.StoredGraph;
        if (!stored) return [];

        const rows = [];

        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const contextID of Object.keys(contexts)) {
                if (this.callPrefix && !String(contextID).startsWith(this.callPrefix)) continue;

                const snap = contexts[contextID];
                if (!snap) continue;

                rows.push({
                    cpID: String(cpID),
                    contextID: String(contextID),
                    timeCounter: snap.timeCounter ?? null,
                    mergedSignature: this.getMergedSignature(snap, entries)
                });
            }
        }

        rows.sort((a, b) => (a.timeCounter ?? 0) - (b.timeCounter ?? 0));
        return rows;
    },

    // ----------------------------
    // object mode animation prepare 状態の確認用
    // ----------------------------
    debugObjectAnimationPrepareState: function() {
        const entries =
            typeof this.getAnimationSelectionEntries === "function"
                ? this.getAnimationSelectionEntries()
                : [];

        const selectionKey =
            typeof this.getAnimationSelectionKey === "function"
                ? this.getAnimationSelectionKey(entries)
                : "";

        const rows = Array.isArray(this.changedSnapshotKeys)
            ? this.changedSnapshotKeys.map((key, index) => ({
                frameIndex: index,
                cpID: key.cpID,
                contextID: key.contextID,
                timeCounter: key.timeCounter ?? null
            }))
            : [];

        const result = {
            displayMode: window.VariableHistoryOptions?.displayMode,
            entries,
            selectionKey,
            isPreparing: this.isPreparing,
            isPrepared: this.isPrepared,
            preparedCallPrefix: this.preparedCallPrefix,
            currentCallPrefix: this.callPrefix,
            preparedSelectionKey: this.preparedSelectionKey,
            changedFrameCount: rows.length,
            firstFrame: rows[0] || null,
            lastFrame: rows[rows.length - 1] || null,
            statusText: this.statusLabel?.innerText ?? ""
        };

        console.log("[debugObjectAnimationPrepareState]", result);
        console.table(rows);

        return result;
    },
    // ----------------------------
    // step4-10c:
    // 再生状態の確認用
    // ----------------------------
    debugPlaybackState: function() {
        const entries =
            typeof this.getAnimationSelectionEntries === "function"
                ? this.getAnimationSelectionEntries()
                : [];

        const currentSelectionKey =
            typeof this.getAnimationSelectionKey === "function"
                ? this.getAnimationSelectionKey(entries)
                : "";

        const currentFrame =
            this.displayedIndex >= 0 && this.changedSnapshotKeys[this.displayedIndex]
                ? this.changedSnapshotKeys[this.displayedIndex]
                : null;

        const nextFrame =
            this.currentIndex >= 0 && this.changedSnapshotKeys[this.currentIndex]
                ? this.changedSnapshotKeys[this.currentIndex]
                : null;

        const result = {
            displayMode: window.VariableHistoryOptions?.displayMode,
            isPrepared: this.isPrepared,
            isPlaying: this.isPlaying,
            displayedIndex: this.displayedIndex,
            currentIndex: this.currentIndex,
            frameCount: this.changedSnapshotKeys?.length ?? 0,
            currentFrame,
            nextFrame,
            entries,
            preparedSelectionKey: this.preparedSelectionKey,
            currentSelectionKey,
            selectionStillCurrent: this.preparedSelectionKey === currentSelectionKey,
            statusText: this.statusLabel?.innerText ?? ""
        };

        console.log("[debugPlaybackState]", result);
        return result;
    },
    // ----------------------------
    // step4-10c:
    // Prepare 時の選択状態と、現在の選択状態が一致しているか確認する
    // ----------------------------
    isPreparedSelectionStillCurrent: function() {
        const entries =
            typeof this.getAnimationSelectionEntries === "function"
                ? this.getAnimationSelectionEntries()
                : [];

        const currentSelectionKey =
            typeof this.getAnimationSelectionKey === "function"
                ? this.getAnimationSelectionKey(entries)
                : "";

        const ok =
            !!this.preparedSelectionKey &&
            currentSelectionKey === this.preparedSelectionKey;

        if (!ok) {
            console.warn("[AnimationController] prepared selection mismatch", {
                preparedSelectionKey: this.preparedSelectionKey,
                currentSelectionKey,
                entries,
                displayMode: window.VariableHistoryOptions?.displayMode
            });
        }

        return ok;
    },

    preprocess: function(targetName) {
        // 複数選択 entry を取得
        const entries =
            (typeof this.getAnimationSelectionEntries === "function")
                ? this.getAnimationSelectionEntries()
                : [];

        // 互換用:
        // entries が空だが targetName がある場合は、primary 1件として扱う
        const effectiveEntries = entries.length > 0
            ? entries
            : (
                targetName
                    ? [{
                        slot: "primary",
                        name: String(targetName),
                        paletteKey: "pink",
                        layerRole: "main-fill"
                    }]
                    : []
            );

        if (effectiveEntries.length === 0) {
            this.allSnapsSorted = [];
            this.changedSnapshotKeys = [];
            this.changedSnapshotDebug = [];
            return;
        }

        const stored = __$__.Context.StoredGraph;

        const snaps = [];
        for (const cpID of Object.keys(stored)) {
            const contexts = stored[cpID];
            if (!contexts || typeof contexts !== "object") continue;

            for (const contextID of Object.keys(contexts)) {
                if (this.callPrefix && !String(contextID).startsWith(this.callPrefix)) continue;

                const snap = contexts[contextID];
                if (!snap) continue;

                snaps.push({
                    cpID,
                    contextID: String(contextID),
                    snap,
                    timeCounter: snap.timeCounter ?? 0
                });
            }
        }

        snaps.sort((a, b) => (a.timeCounter ?? 0) - (b.timeCounter ?? 0));
        this.allSnapsSorted = snaps;

        this.changedSnapshotKeys = [];
        this.changedSnapshotDebug = [];

        let lastSig = null;

        for (const { cpID, contextID, snap, timeCounter } of snaps) {
            // ここが Step 4-2 の本体:
            // 1変数 signature ではなく、複数変数 merged signature を使う
            const sig = this.getMergedSignature(snap, effectiveEntries);

            const changed = (lastSig === null) ? true : (sig !== lastSig);

            if (changed) {
                this.changedSnapshotKeys.push({ cpID, contextID });
            }

            this.changedSnapshotDebug.push({
                cpID,
                contextID,
                timeCounter,
                signature: sig,
                mergedSignature: sig,
                changed,

                // デバッグ用: 各変数ごとの signature も残す
                entrySignatures: effectiveEntries.map(entry => ({
                    slot: entry.slot,
                    name: entry.name,
                    paletteKey: entry.paletteKey,
                    signature: this.getSignatureForEntry(snap, entry)
                }))
            });

            lastSig = sig;
        }
    },

    // ----------------------------
    // StoredGraph のノード集合を直接使う
    // ----------------------------
    getVisibleNodeIdsFromStoredGraph: function(graphObj) {
        const ids = [];

        for (const [id, node] of Object.entries(graphObj?.nodes || {})) {
            if (!node) continue;
            if (node.shape === "box") continue; // removeArrayNodes と揃える
            ids.push(String(id));
        }

        for (const [id, node] of Object.entries(graphObj?.variableNodes || {})) {
            if (!node) continue;
            ids.push(String(id));
        }

        return ids;
    },

    isOverlayNodeId: function(id) {
        return String(id ?? "").startsWith("__vh_overlay__");
    },

    getBaseNodeIdFromOverlayId: function(overlayId) {
        const s = String(overlayId ?? "");
        const prefix = "__vh_overlay__";
        if (!s.startsWith(prefix)) return null;

        const rest = s.slice(prefix.length);
        const parts = rest.split("__");

        // 想定:
        // __vh_overlay__outer-ring-1__green__main-new4
        // => ["outer-ring-1", "green", "main-new4"]
        if (parts.length < 3) return null;

        return parts.slice(2).join("__");
    },
    


    // ----------------------------
    // 座標固定のための補助
    // ----------------------------
    applyFixedPositionsToVisGraph: function(visGraph) {
        if (!this.fixedPositions) return;

        for (const n of visGraph.nodes) {
            const id = String(n.id ?? "");

            // 通常ノードはそのまま
            let p = this.fixedPositions[id];

            // overlay ノードなら、対応する本体ノードの座標を使う
            if (!p && this.isOverlayNodeId(id)) {
                const baseId = this.getBaseNodeIdFromOverlayId(id);
                if (baseId) {
                    p = this.fixedPositions[String(baseId)] || null;
                }
            }

            if (p) {
                n.x = p.x;
                n.y = p.y;
                n.fixed = { x: true, y: true };
            }
        }
    },
    
    applyCallTreeHighlightForContext: function(contextID) {
        if (!__$__.CallTreeNetwork) return;

        if (typeof __$__.CallTreeNetwork.setAnimationHighlightedContext === "function") {
            __$__.CallTreeNetwork.setAnimationHighlightedContext(contextID);
            return;
        }

        __$__.CallTreeNetwork.animationContextSensitiveID = contextID
            ? String(contextID)
            : null;

        __$__.CallTreeNetwork.suppressSpecifiedContextHighlight = true;

        if (typeof __$__.CallTreeNetwork.updateHighlightCircles === "function") {
            __$__.CallTreeNetwork.updateHighlightCircles();
        }
    },

    clearCallTreeHighlight: function() {
        if (!__$__.CallTreeNetwork) return;

        if (typeof __$__.CallTreeNetwork.clearAnimationHighlightedContext === "function") {
            __$__.CallTreeNetwork.clearAnimationHighlightedContext();
            return;
        }

        __$__.CallTreeNetwork.animationContextSensitiveID = null;
        __$__.CallTreeNetwork.suppressSpecifiedContextHighlight = false;

        if (typeof __$__.CallTreeNetwork.updateHighlightCircles === "function") {
            __$__.CallTreeNetwork.updateHighlightCircles();
        }
    },


    registerNewNodePositions: function(ids) {
        const net = __$__.ObjectGraphNetwork.network;
        const pos = net.getPositions(ids);

        if (!this.fixedPositions) this.fixedPositions = {};

        for (const id of ids) {
            if (pos[id]) {
                this.fixedPositions[String(id)] = {
                    x: pos[id].x,
                    y: pos[id].y
                };
            }
        }

        console.log("[registerNewNodePositions] added", ids);
    },

    waitUntilPositionsStop: function(done, options = {}) {
        const net = __$__.ObjectGraphNetwork.network;
        const interval = options.interval ?? 100;
        const epsilon = options.epsilon ?? 0.5;
        const stableNeeded = options.stableNeeded ?? 3;
        const timeout = options.timeout ?? 4000;

        let prev = net.getPositions();
        let stableCount = 0;
        const start = Date.now();

        const tick = () => {
            const cur = net.getPositions();

            let maxMove = 0;
            for (const id of Object.keys(cur)) {
                if (!prev[id]) continue;
                const dx = cur[id].x - prev[id].x;
                const dy = cur[id].y - prev[id].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > maxMove) maxMove = dist;
            }

            if (maxMove < epsilon) stableCount++;
            else stableCount = 0;

            if (stableCount >= stableNeeded) {
                done && done();
                return;
            }

            if (Date.now() - start > timeout) {
                done && done();
                return;
            }

            prev = cur;
            setTimeout(tick, interval);
        };

        setTimeout(tick, interval);
    },

    // ----------------------------
    // 初期フレームの固定座標を作る
    // ----------------------------
    buildFixedLayout: function(done) {
        const net = __$__.ObjectGraphNetwork.network;
        const base = this.getBaseLayoutFrame();

        if (!base) {
            done && done();
            return;
        }

        const key = { cpID: base.cpID, contextID: base.contextID };

        __$__.Context.SnapshotContext = {
            cpID: String(key.cpID),
            contextSensitiveID: String(key.contextID),
            loopLabel: this.baseSnapshotContext?.loopLabel
        };

        __$__.Update.ContextUpdate('changed');

        this.waitUntilPositionsStop(() => {
            this.fixedPositions = net.getPositions();

            const updates = Object.keys(this.fixedPositions).map(id => ({
                id,
                x: this.fixedPositions[id].x,
                y: this.fixedPositions[id].y,
                fixed: { x: true, y: true }
            }));

            __$__.ObjectGraphNetwork.nodes?.update(updates);

            net.setOptions({ physics: { enabled: false } });
            net.stopSimulation();
            net.redraw();

            done && done();
        });
    },

    // ----------------------------
    // 各ノードの初登場フレームを StoredGraph から調べる
    // ----------------------------
    buildFirstAppearanceFrames: function() {
        const firstAppearance = new Map(); // nodeId -> frameIndex
        const keys = this.changedSnapshotKeys || [];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const snap = __$__.Context.StoredGraph[key.cpID][key.contextID];
            if (!snap) continue;

            const visibleIds = this.getVisibleNodeIdsFromStoredGraph(snap);

            for (const id of visibleIds) {
                if (!firstAppearance.has(id)) {
                    firstAppearance.set(id, i);
                }
            }
        }

        const frameToNodeIds = new Map();
        for (const [nodeId, frameIndex] of firstAppearance.entries()) {
            if (!frameToNodeIds.has(frameIndex)) {
                frameToNodeIds.set(frameIndex, []);
            }
            frameToNodeIds.get(frameIndex).push(nodeId);
        }

        return frameToNodeIds;
    },

    // ----------------------------
    // 初登場ノードだけ事前に座標回収
    // ----------------------------
    prepareAllNodePositions: function(done) {
        const frameToNodeIds = this.buildFirstAppearanceFrames();
        const frameIndices = Array.from(frameToNodeIds.keys()).sort((a, b) => a - b);

        const targets = frameIndices.filter(i => i !== 0);
        let idx = 0;

        const step = () => {
            if (idx >= targets.length) {
                console.log("[prepareAllNodePositions] done");
                this.statusLabel.innerText = `Prepared ${this.changedSnapshotKeys.length} frames`;
                this.updatePrepareOverlay(`Prepared ${this.changedSnapshotKeys.length}/${this.changedSnapshotKeys.length}`);
                done && done();
                return;
            }

            const frameIndex = targets[idx];
            const key = this.changedSnapshotKeys[frameIndex];
            const nodeIds = frameToNodeIds.get(frameIndex) || [];
            const missing = nodeIds.filter(id => !this.fixedPositions[String(id)]);

            this.statusLabel.innerText = `Preparing ${idx + 1}/${targets.length}`;
            this.updatePrepareOverlay(`Preparing ${idx + 1}/${targets.length}`);

            if (missing.length === 0) {
                idx++;
                setTimeout(step, 0);
                return;
            }

            console.log("[prepare] frame", frameIndex, "missing =", missing);

            __$__.Context.SnapshotContext = {
                cpID: String(key.cpID),
                contextSensitiveID: String(key.contextID),
                loopLabel: this.baseSnapshotContext?.loopLabel
            };

            __$__.Update.ContextUpdate('changed');

            this.waitUntilPositionsStop(() => {
                this.registerNewNodePositions(missing);

                const updates = missing
                    .filter(id => this.fixedPositions[String(id)])
                    .map(id => ({
                        id,
                        x: this.fixedPositions[String(id)].x,
                        y: this.fixedPositions[String(id)].y,
                        fixed: { x: true, y: true }
                    }));

                __$__.ObjectGraphNetwork.nodes?.update(updates);
                __$__.ObjectGraphNetwork.network.setOptions({ physics: { enabled: false } });
                __$__.ObjectGraphNetwork.network.stopSimulation();

                idx++;
                setTimeout(step, 0);
            }, {
                interval: 60,
                epsilon: 3.0,
                stableNeeded: 1,
                timeout: 500
            });
        };

        step();
    },

    // ----------------------------
    // prepare開始
    // ----------------------------
    beginPrepare: function() {
        const entries =
            (typeof this.getAnimationSelectionEntries === "function")
                ? this.getAnimationSelectionEntries()
                : [];

        if (!entries || entries.length === 0) {
            this.statusLabel.innerText = "Ready (no variable selected)";
            return;
        }

        const targetName = entries[0]?.name || window.VariableHistorySelection.get();
        const selectionKey = this.getAnimationSelectionKey(entries);
        const selectionLabel = this.getAnimationSelectionLabel(entries);

        this.baseSnapshotContext = { ...(__$__.Context.SnapshotContext || {}) };

        const cur = String(this.baseSnapshotContext.contextSensitiveID ?? "");
        const m = cur.match(/^(main-call\d+)/);
        this.callPrefix = m ? m[1] : null;

        // preprocess の中では複数 entry を読む
        // targetName は互換用として渡す
        this.preprocess(targetName);

        if (this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = `No frames (selections: ${selectionLabel})`;
            return;
        }

        this.isPreparing = true;
        this.isPrepared = false;
        this.fixedPositions = null;
        this.currentIndex = 0;
        this.displayedIndex = -1;

        this.clearCallTreeHighlight();

        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this.isPlaying = false;

        this.statusLabel.innerText =
            `Preparing 0/${this.changedSnapshotKeys.length} (selections: ${selectionLabel})`;

        this.showPrepareOverlay(`Preparing 0/${this.changedSnapshotKeys.length}`);

        if (this.playBtn) {
            this.playBtn.disabled = true;
            this.playBtn.innerText = "Preparing...";
            this.playBtn.style.opacity = "0.6";
            this.playBtn.style.cursor = "not-allowed";
        }
        this.setPlaybackControlsEnabled(false);

        this.buildFixedLayout(() => {
            this.prepareAllNodePositions(() => {
                this.isPreparing = false;
                this.isPrepared = true;
                this.preparedCallPrefix = this.callPrefix;

                // 互換用に残す
                this.preparedTargetName = targetName;

                // Step 4-3 の本体
                this.preparedSelectionKey = selectionKey;

                this.hidePrepareOverlay();
                this.statusLabel.innerText =
                    `Ready (${this.changedSnapshotKeys.length} frames; variables: ${selectionLabel})`;
                if (this.playBtn) {
                    this.playBtn.disabled = false;
                    this.playBtn.innerText = "▶ Play Animation";
                    this.playBtn.style.opacity = "1";
                    this.playBtn.style.cursor = "pointer";
                }
                this.setPlaybackControlsEnabled(true);

                if (this.baseSnapshotContext) {
                    __$__.Context.SnapshotContext = { ...this.baseSnapshotContext };
                }
            });
        });
    },

    // ----------------------------
    // 再生
    // ----------------------------
    clearPlaybackTimer: function() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    },

    pausePlayback: function() {
        this.isPlaying = false;
        this.clearPlaybackTimer();

        if (this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = "No frames";
            return;
        }

        if (this.displayedIndex >= 0) {
            this.statusLabel.innerText =
                `Paused at frame ${this.displayedIndex + 1}/${this.changedSnapshotKeys.length}`;
        } else {
            this.statusLabel.innerText =
                `Paused (${this.changedSnapshotKeys.length} frames ready)`;
        }

        if (this.playBtn) {
            this.playBtn.innerText = "▶ Play Animation";
        }
    },

    renderFrameAtIndex: function(index, done) {
        if (!this.changedSnapshotKeys || this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = "No frames";
            done && done();
            return;
        }

        const maxIndex = this.changedSnapshotKeys.length - 1;
        const safeIndex = Math.max(0, Math.min(index, maxIndex));

        const key = this.changedSnapshotKeys[safeIndex];
        const snap = __$__.Context.StoredGraph[key.cpID][key.contextID];

        this.displayedIndex = safeIndex;
        this.currentIndex = safeIndex + 1;

        // editor 上で cp の位置を示す
        this.showEditorFrameIndicator(key);

        // call graph 上で context を赤くする
        this.applyCallTreeHighlightForContext(key.contextID);

        this.statusLabel.innerText =
            `Frame ${safeIndex + 1}/${this.changedSnapshotKeys.length}`;

        this.applySnapshot(snap, key, () => {
            done && done();
        });
    },

    stepForward: function() {
        if (this.isPreparing) return;

        if (!this.isPrepared || this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = "Prepare animation first";
            return;
        }

        this.pausePlayback();

        const nextIndex =
            this.displayedIndex < 0
                ? 0
                : Math.min(this.displayedIndex + 1, this.changedSnapshotKeys.length - 1);

        this.renderFrameAtIndex(nextIndex);
    },

    stepBackward: function() {
        if (this.isPreparing) return;

        if (!this.isPrepared || this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = "Prepare animation first";
            return;
        }

        this.pausePlayback();

        const prevIndex =
            this.displayedIndex < 0
                ? 0
                : Math.max(this.displayedIndex - 1, 0);

        this.renderFrameAtIndex(prevIndex);
    },
    
    startPlayback: function() {
        if (!this.isPrepared || this.changedSnapshotKeys.length === 0) {
            this.statusLabel.innerText = "Prepare animation first";
            return;
        }

        // step4-10c:
        // Prepare 時と現在の選択・オプションが違う場合は再生しない
        if (!this.isPreparedSelectionStillCurrent()) {
            this.isPrepared = false;
            this.isPlaying = false;
            this.clearPlaybackTimer();

            this.statusLabel.innerText = "Selection/options changed. Prepare again.";

            if (this.playBtn) {
                this.playBtn.innerText = "▶ Prepare Animation";
                this.playBtn.disabled = false;
                this.playBtn.style.opacity = "1";
                this.playBtn.style.cursor = "pointer";
            }

            this.setPlaybackControlsEnabled(false);
            return;
        }

        this.clearPlaybackTimer();

        // 最後まで再生済みなら最初から
        if (this.currentIndex >= this.changedSnapshotKeys.length) {
            this.currentIndex = 0;
            this.displayedIndex = -1;
        }

        // まだ何も表示していないなら最初から
        if (this.currentIndex < 0) {
            this.currentIndex = 0;
        }

        this.isPlaying = true;

        if (this.playBtn) {
            this.playBtn.innerText = "▶ Playing...";
        }

        this.playCurrent();
    },

    playCurrent: function() {
        if (!this.isPlaying) return;

        // step4-10c:
        // 再生中に選択・オプションが変わった場合は止める
        if (!this.isPreparedSelectionStillCurrent()) {
            this.isPlaying = false;
            this.isPrepared = false;
            this.clearPlaybackTimer();

            this.statusLabel.innerText = "Selection/options changed. Prepare again.";

            if (this.playBtn) {
                this.playBtn.innerText = "▶ Prepare Animation";
                this.playBtn.disabled = false;
                this.playBtn.style.opacity = "1";
                this.playBtn.style.cursor = "pointer";
            }

            this.setPlaybackControlsEnabled(false);
            return;
        }

        if (this.currentIndex >= this.changedSnapshotKeys.length) {
            this.statusLabel.innerText = "Done";
            this.isPlaying = false;
            this.clearPlaybackTimer();

            if (this.playBtn) {
                this.playBtn.innerText = "▶ Play Animation";
            }
            return;
        }

        const i = this.currentIndex;

        this.renderFrameAtIndex(i, () => {
            if (!this.isPlaying) return;

            this.currentIndex = i + 1;
            this.timerId = setTimeout(() => this.playCurrent(), this.interval);
        });
    },

    // 実際の描画だけは visGraph を使う
    applySnapshot: function(_snap, key, done) {
        try {
            const net = __$__.ObjectGraphNetwork.network;
            const snap = __$__.Context.StoredGraph[key.cpID][key.contextID];

            __$__.Context.SnapshotContext = {
                cpID: String(key.cpID),
                contextSensitiveID: String(key.contextID),
                loopLabel: this.baseSnapshotContext?.loopLabel
            };

            const visGraph = snap.generateVisjsGraph(false);
            this.applyFixedPositionsToVisGraph(visGraph);

            // step4-10d:
            // animation 用の固定座標を base node に適用した後、
            // object ring overlay も base node の座標に合わせ直す
            if (
                window.VariableHistoryView &&
                typeof window.VariableHistoryView.syncObjectRingOverlayPositions === "function"
            ) {
                const syncedCount =
                    window.VariableHistoryView.syncObjectRingOverlayPositions(visGraph);
                    window.VariableHistoryOptions?.debugLog?.(
                        "[AnimationController] synced object ring overlays:",
                        syncedCount
                    );
            }

            net.setOptions({ physics: { enabled: false } });
            net.setData({
                nodes: __$__.ObjectGraphNetwork.nodes = new vis.DataSet(visGraph.nodes),
                edges: __$__.ObjectGraphNetwork.edges = new vis.DataSet(visGraph.edges)
            });

            net.stopSimulation();
            net.redraw();

            done && done();
        } catch (e) {
            console.error("applySnapshot error:", e);
            done && done();
        }
    },

    // ----------------------------
    // 停止
    // ----------------------------
    stop: function() {
        this.isPlaying = false;
        this.clearPlaybackTimer();

        this.clearEditorFrameIndicator();
        this.clearCallTreeHighlight();

        if (this.baseSnapshotContext) {
            __$__.Context.SnapshotContext = { ...this.baseSnapshotContext };
        }

        if (this.playBtn) {
            this.playBtn.innerText = this.isPrepared
                ? "▶ Play Animation"
                : "▶ Prepare Animation";
        }
    },
};

window.VariableHistoryContextMenu = {
    menuEl: null,
    rowEl: null,
    itemEl: null,
    submenuEl: null,
    selectedName: null,

    init: function() {
        this.createMenu();
        this.installListeners();
    },

    createMenu: function() {
        const old = document.getElementById("variable-history-context-menu");
        if (old) old.remove();

        const menu = document.createElement("div");
        menu.id = "variable-history-context-menu";
        Object.assign(menu.style, {
            position: "fixed",
            display: "none",
            zIndex: 30000,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            padding: "6px",
            minWidth: "180px"
        });

        // 親項目 + サブメニューをまとめる行
        const row = document.createElement("div");
        Object.assign(row.style, {
            position: "relative"
        });

        // 親項目
        const item = document.createElement("button");
        item.type = "button";
        Object.assign(item.style, {
            display: "block",
            width: "100%",
            border: "none",
            background: "transparent",
            textAlign: "left",
            padding: "8px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
        });

        // サブメニュー
        const submenu = document.createElement("div");
        Object.assign(submenu.style, {
            position: "absolute",
            left: "100%",
            top: "0",
            display: "none",
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "8px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            padding: "6px",
            minWidth: "120px"
        });

        const makeColorButton = (label, paletteKey, bgHover, textColor) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = label;
            Object.assign(btn.style, {
                display: "block",
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                color: textColor
            });

            btn.onmouseenter = () => {
                btn.style.background = bgHover;
            };
            btn.onmouseleave = () => {
                btn.style.background = "transparent";
            };

            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const name = this.selectedName;
                if (!name) return;

                this.applySelection(name, paletteKey);
            };

            return btn;
        };

        const pinkBtn = makeColorButton("pink", "pink", "#fff0f6", "#d63384");
        const greenBtn = makeColorButton("green", "green", "#eefcf3", "#2b8a3e");

        submenu.appendChild(pinkBtn);
        submenu.appendChild(greenBtn);

        // 親項目に hover したらサブメニュー表示
        row.onmouseenter = () => {
            item.style.background = "#fff0f6";
            submenu.style.display = "block";
        };
        row.onmouseleave = () => {
            item.style.background = "transparent";
            submenu.style.display = "none";
        };

        // 親項目をそのままクリックしたら pink
        item.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            const name = this.selectedName;
            if (!name) return;

            this.applySelection(name, "pink");
        };

        row.appendChild(item);
        row.appendChild(submenu);
        menu.appendChild(row);
        document.body.appendChild(menu);

        this.menuEl = menu;
        this.rowEl = row;
        this.itemEl = item;
        this.submenuEl = submenu;
    },

    applySelection: function(name, paletteKey) {
        const s = String(name ?? "").trim();
        if (!s) return;

                // editor から変数を選んだので、選択元を Editor に切り替える
        if (
            window.VariableHistoryOptions &&
            window.VariableHistoryOptions.displayMode !== "variable" &&
            typeof window.VariableHistoryOptions.setOption === "function"
        ) {
            window.VariableHistoryOptions.setOption(
                "displayMode",
                "variable",
                {
                    resetAnimation: false,
                    renderUI: false,
                    redraw: false
                }
            );
        }
        // editor 側の選択を使うので、古い object 側の選択は消す
        if (
            window.VariableHistoryObjectSelection &&
            typeof window.VariableHistoryObjectSelection.clearSilent === "function"
        ) {
            window.VariableHistoryObjectSelection.clearSilent();
        }
                // editor 側の選択に戻ったので、object 候補パネルは消す
        if (
            window.VariableHistoryObjectPicker &&
            typeof window.VariableHistoryObjectPicker.hide === "function"
        ) {
            window.VariableHistoryObjectPicker.hide();
        }
        if (typeof window.VariableHistorySelection.addOrUpdate === "function") {
            window.VariableHistorySelection.addOrUpdate(s, paletteKey);
        } else {
            window.VariableHistorySelection.set(s);
        }

                console.log(
            "[VariableHistorySelection] selections =",
            typeof window.VariableHistorySelection.getAll === "function"
                ? window.VariableHistorySelection.getAll()
                : window.VariableHistorySelection.get()
        );

        // step0-5:
        // 変数選択が変わったら、
        // option の整合性チェック・UI更新・animation reset・再描画をまとめて行う
        if (
            window.VariableHistoryOptions &&
            typeof window.VariableHistoryOptions.handleSelectionChanged === "function"
        ) {
            window.VariableHistoryOptions.handleSelectionChanged({
                reason: `selection changed: ${s}`,
                redraw: true
            });
        } else {
            // fallback
            this.resetAnimationState();

            if (
                window.VariableHistoryOptionsUI &&
                typeof window.VariableHistoryOptionsUI.render === "function"
            ) {
                window.VariableHistoryOptionsUI.render();
            }

            __$__.Update.ContextUpdate("changed");
        }

        this.hide();
    },

    resetAnimationState: function() {
        if (!window.AnimationController) return;

        window.AnimationController.stop();
        window.AnimationController.isPrepared = false;
        window.AnimationController.preparedCallPrefix = null;
        window.AnimationController.preparedTargetName = null;
        window.AnimationController.preparedSelectionKey = null;
        window.AnimationController.displayedIndex = -1;

        if (typeof window.AnimationController.setPlaybackControlsEnabled === "function") {
            window.AnimationController.setPlaybackControlsEnabled(false);
        }

        if (window.AnimationController.playBtn) {
            window.AnimationController.playBtn.innerText = "▶ Prepare Animation";
            window.AnimationController.playBtn.disabled = false;
            window.AnimationController.playBtn.style.opacity = "1";
            window.AnimationController.playBtn.style.cursor = "pointer";
        }

        if (window.AnimationController.statusLabel) {
            window.AnimationController.statusLabel.innerText = this.buildStatusText();
        }
    },

    buildStatusText: function() {
        const primary = window.VariableHistorySelection.get();
        const all = (typeof window.VariableHistorySelection.getAll === "function")
            ? window.VariableHistorySelection.getAll()
            : [];

        if (!primary && all.length === 0) {
            return "Ready (no target)";
        }

        if (all.length === 0) {
            return `Ready (target: ${primary})`;
        }

        const joined = all.map(entry => `${entry.name}:${entry.paletteKey}`).join(", ");
        return `Ready (primary: ${primary}; selections: ${joined})`;
    },

    installListeners: function() {
        document.addEventListener("contextmenu", (e) => {
            const name = this.getIdentifierFromEvent(e);

            if (!window.VariableHistorySelection.isSelectableVariableName(name)) {
                this.hide();
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            this.selectedName = name;
            this.itemEl.textContent = `variable-history: ${name}`;
            this.menuEl.style.left = `${e.clientX}px`;
            this.menuEl.style.top = `${e.clientY}px`;
            this.menuEl.style.display = "block";
            this.submenuEl.style.display = "none";
        }, true);

        document.addEventListener("click", (e) => {
            if (this.menuEl && this.menuEl.contains(e.target)) return;
            this.hide();
        });
        document.addEventListener("scroll", () => this.hide(), true);
        window.addEventListener("resize", () => this.hide());
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.hide();
        });
    },

    hide: function() {
        if (!this.menuEl) return;
        this.menuEl.style.display = "none";
        if (this.submenuEl) this.submenuEl.style.display = "none";
        this.selectedName = null;
    },

    getIdentifierFromEvent: function(e) {
        const editorRoot = e.target.closest(".ace_editor");
        if (!editorRoot) return null;
        if (typeof ace === "undefined") return null;

        try {
            const editor = ace.edit(editorRoot);

            // 1. まず Ace 上の選択文字列
            const selected = String(editor.getSelectedText() ?? "").trim();
            if (window.VariableHistorySelection.isSelectableVariableName(selected)) {
                return selected;
            }

            // 2. 右クリック位置の単語
            const pos = editor.renderer.screenToTextCoordinates(e.pageX, e.pageY);
            if (pos) {
                const range = editor.session.getWordRange(pos.row, pos.column);
                const word = String(editor.session.getTextRange(range) ?? "").trim();

                if (window.VariableHistorySelection.isSelectableVariableName(word)) {
                    return word;
                }
            }

            // 3. 最後の fallback: 現在カーソル位置の単語
            const cur = editor.getCursorPosition();
            if (cur) {
                const range = editor.session.getWordRange(cur.row, cur.column);
                const word = String(editor.session.getTextRange(range) ?? "").trim();

                if (window.VariableHistorySelection.isSelectableVariableName(word)) {
                    return word;
                }
            }

            return null;
        } catch (err) {
            console.error("[VariableHistoryContextMenu] getIdentifierFromEvent failed:", err);
            return null;
        }
    },

    pickWordFromTextNode: function(textNode, rawOffset) {
        const text = String(textNode.textContent ?? "");
        if (!text) return null;

        const isWordChar = (ch) => /[A-Za-z0-9_$]/.test(ch);

        let offset = Math.max(0, Math.min(rawOffset, text.length));

        if (offset < text.length && isWordChar(text[offset])) {
        } else if (offset > 0 && isWordChar(text[offset - 1])) {
            offset = offset - 1;
        } else {
            return null;
        }

        let start = offset;
        let end = offset + 1;

        while (start > 0 && isWordChar(text[start - 1])) start--;
        while (end < text.length && isWordChar(text[end])) end++;

        const word = text.slice(start, end).trim();
        return window.VariableHistorySelection.isSelectableVariableName(word) ? word : null;
    }
};
window.VariableHistoryObjectSelection = {
    selectedObjectNodeId: null,
    selectedObjectHistory: null,
    selectedVariableNames: [],

    // まずは pink / green の2変数まで扱う
    // 年輪描画が安定したら増やせる
    maxSelections: 2,

    paletteKeys: ["pink", "green"],

    normalizeName: function(name) {
        return String(name ?? "").trim();
    },

    setObject: function(objectNodeId, history = null) {
        const id = String(objectNodeId ?? "").trim();

        if (!id) {
            this.clear();
            return;
        }

        // 別 object を選んだら、選択変数はリセットする
        if (this.selectedObjectNodeId !== id) {
            this.selectedObjectNodeId = id;
            this.selectedObjectHistory = history;
            this.selectedVariableNames = [];
            return;
        }

        this.selectedObjectHistory = history || this.selectedObjectHistory;
    },

    isSelected: function(objectNodeId, variableName) {
        const id = String(objectNodeId ?? "").trim();
        const name = this.normalizeName(variableName);

        return (
            this.selectedObjectNodeId === id &&
            this.selectedVariableNames.includes(name)
        );
    },

    toggleVariable: function(objectNodeId, history, variableName) {
        const id = String(objectNodeId ?? "").trim();
        const name = this.normalizeName(variableName);

        if (!id || !name) return false;

                // object から変数を選んだので、選択元を Object に切り替える
        if (
            window.VariableHistoryOptions &&
            window.VariableHistoryOptions.displayMode !== "object" &&
            typeof window.VariableHistoryOptions.setOption === "function"
        ) {
            window.VariableHistoryOptions.setOption(
                "displayMode",
                "object",
                {
                    resetAnimation: false,
                    renderUI: false,
                    redraw: false
                }
            );
        }

        // object 側の選択を使うので、古い editor 側の選択は消す
        if (
            window.VariableHistorySelection &&
            typeof window.VariableHistorySelection.clear === "function"
        ) {
            window.VariableHistorySelection.clear();
        }
        this.setObject(id, history);

        const idx = this.selectedVariableNames.indexOf(name);

        // すでに選択済みなら解除
        if (idx >= 0) {
            this.selectedVariableNames.splice(idx, 1);
            this.notifyChanged(`object variable removed: ${name}`);
            return true;
        }

        // 最大数を超える場合は、いちばん古い選択を外して追加する
        if (this.selectedVariableNames.length >= this.maxSelections) {
            this.selectedVariableNames.shift();
        }

        this.selectedVariableNames.push(name);
        this.notifyChanged(`object variable selected: ${name}`);
        return true;
    },

    clear: function() {
        this.selectedObjectNodeId = null;
        this.selectedObjectHistory = null;
        this.selectedVariableNames = [];
        this.notifyChanged("object selection cleared");
    },
    clearSilent: function() {
        this.selectedObjectNodeId = null;
        this.selectedObjectHistory = null;
        this.selectedVariableNames = [];
    },

    hasAny: function() {
        return !!this.selectedObjectNodeId && this.selectedVariableNames.length > 0;
    },

    getEntries: function() {
        if (!this.selectedObjectNodeId) return [];

        return this.selectedVariableNames.map((name, index) => ({
            slot: index === 0 ? "primary" : "secondary",
            objectNodeId: this.selectedObjectNodeId,
            name,
            paletteKey: this.paletteKeys[index] || "pink",
            layerRole: index === 0 ? "main-fill" : "outer-ring-1"
        }));
    },

    getLabel: function() {
        if (!this.selectedObjectNodeId) {
            return "Object selection: none";
        }

        if (this.selectedVariableNames.length === 0) {
            return "Object selection: selected / variables: none";
        }

        const entries = this.getEntries();

        const vars = this.selectedVariableNames
            .map(name => {
                const entry = entries.find(e => e.name === name);
                return `${name}:${entry ? entry.paletteKey : "pink"}`;
            })
            .join(", ");

        return `Object selection: selected / variables: ${vars}`;
    },

    shortId: function(id) {
        const s = String(id ?? "");
        if (s.length <= 22) return s;
        return `${s.slice(0, 10)}...${s.slice(-8)}`;
    },

    notifyChanged: function(reason = "object selection changed") {
        console.log("[VariableHistoryObjectSelection] changed:", {
            reason,
            state: this.debug(false)
        });
        // object mode の選択が変わったら、古い animation prepare は使えないのでリセット
        if (
            window.VariableHistoryOptions &&
            typeof window.VariableHistoryOptions.resetAnimationState === "function"
        ) {
            window.VariableHistoryOptions.resetAnimationState(reason);
        }

        if (
            window.VariableHistoryOptionsUI &&
            typeof window.VariableHistoryOptionsUI.render === "function"
        ) {
            window.VariableHistoryOptionsUI.render();
        }

        // 今回はまだ描画に反映しないが、次 step 以降のために redraw だけ呼ぶ
        if (
            window.VariableHistoryOptions &&
            typeof window.VariableHistoryOptions.requestRedraw === "function"
        ) {
            window.VariableHistoryOptions.requestRedraw();
        }
    },

    debug: function(shouldLog = true) {
        const result = {
            selectedObjectNodeId: this.selectedObjectNodeId,
            selectedVariableNames: [...this.selectedVariableNames],
            entries: this.getEntries(),
            selectedObjectHistory: this.selectedObjectHistory
        };

        if (shouldLog) {
            console.log("[VariableHistoryObjectSelection]", result);
        }

        return result;
    }
};

window.VariableHistoryObjectPicker = {
    panelEl: null,
    installed: false,
    lastNodeId: null,
    lastHistory: null,
    

    init: function() {
        this.createPanel();
        this.installWhenReady();
    },

    createPanel: function() {
        const old = document.getElementById("variable-history-object-picker-panel");
        if (old) old.remove();

        const panel = document.createElement("div");
        panel.id = "variable-history-object-picker-panel";

        Object.assign(panel.style, {
            position: "fixed",
            display: "none",
            zIndex: 25000,
            background: "rgba(255, 255, 255, 0.98)",
            border: "1px solid #ddd",
            borderRadius: "12px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            padding: "10px",
            minWidth: "220px",
            maxWidth: "320px",
            fontSize: "12px",
            color: "#333",
            fontFamily: "sans-serif"
        });

        document.body.appendChild(panel);
        this.panelEl = panel;
    },

    installWhenReady: function() {
        const timer = setInterval(() => {
            const net = __$__?.ObjectGraphNetwork?.network;
            if (!net) return;

            clearInterval(timer);
            this.installNetworkListener(net);
        }, 100);
    },

    installNetworkListener: function(net) {
        if (!net) return;

        // 再読み込み・再実行時に click listener が重複しないようにする
        if (net.__vhObjectPickerClickHandler) {
            try {
                net.off("click", net.__vhObjectPickerClickHandler);
            } catch (_) {}
        }

        const handler = (params) => {
            this.handleNetworkClick(params);
        };

        net.on("click", handler);
        net.__vhObjectPickerClickHandler = handler;

        this.installed = true;

        console.log("[VariableHistoryObjectPicker] installed");
    },

    isObjectMode: function() {
        return window.VariableHistoryOptions?.displayMode === "object";
    },

    isIgnorableNodeId: function(nodeId) {
        const id = String(nodeId ?? "");

        if (!id) return true;

        // overlay node
        if (id.startsWith("__vh_overlay__")) return true;
        // object ring overlay node
        if (id.startsWith("__vh_object_ring__")) return true;

        // variable node
        if (id.startsWith("__Variable-") || id.startsWith("Variable-")) return true;

        // array infrastructure node
        // 例: main-call...-arr1, main-call...-arr1-0-array
        if (id.includes("arr")) return true;

        return false;
    },

    getClientPositionFromParams: function(params) {
        const ev = params?.event?.srcEvent || params?.event || null;

        if (
            ev &&
            Number.isFinite(Number(ev.clientX)) &&
            Number.isFinite(Number(ev.clientY))
        ) {
            return {
                x: Number(ev.clientX),
                y: Number(ev.clientY)
            };
        }

        return {
            x: Math.round(window.innerWidth / 2),
            y: Math.round(window.innerHeight / 2)
        };
    },

    handleNetworkClick: function(params) {
        // object mode 以外では何もしない
        if (!this.isObjectMode()) {
            this.hide();
            return;
        }

        const nodes = params?.nodes || [];

        if (!nodes || nodes.length === 0) {
            this.hide();
            return;
        }

        const nodeId = String(nodes[0]);

        if (this.isIgnorableNodeId(nodeId)) {
            this.hide();
            console.log("[VariableHistoryObjectPicker] ignored node:", nodeId);
            return;
        }

        if (
            !window.VariableHistoryView ||
            typeof window.VariableHistoryView.buildObjectVariableHistory !== "function"
        ) {
            console.warn(
                "[VariableHistoryObjectPicker] buildObjectVariableHistory is not available"
            );
            return;
        }

        const history = window.VariableHistoryView.buildObjectVariableHistory(nodeId);

        this.lastNodeId = nodeId;
        this.lastHistory = history;

        const pos = this.getClientPositionFromParams(params);

        this.showPanel(nodeId, history, pos.x, pos.y);

        console.log("[VariableHistoryObjectPicker] clicked object:", {
            nodeId,
            history
        });
    },

    buildCandidateGroups: function(history) {
        const allRows = history?.eventRows || [];

        // 候補パネルも「現在 snapshot までに参照された変数」だけ表示する。
        // 年輪描画側も currentTime で future event を除外しているため、
        // ここを揃えないと「選べるのに色がつかない」状態になる。
        const currentTime =
            window.VariableHistoryView &&
            typeof window.VariableHistoryView.getCurrentTimeCounter === "function"
                ? window.VariableHistoryView.getCurrentTimeCounter()
                : null;

        const rows = allRows.filter(row => {
            if (currentTime === null || currentTime === undefined) return true;
            if (row.timeCounter === null || row.timeCounter === undefined) return true;

            return Number(row.timeCounter) <= Number(currentTime);
        });

        const map = new Map();

        for (const row of rows) {
            const variableName = String(row.variableName ?? "").trim();
            if (!variableName) continue;

            if (!map.has(variableName)) {
                map.set(variableName, {
                    variableName,
                    accessLabels: new Set(),
                    sourceKinds: new Set(),
                    firstTimeCounter: row.timeCounter ?? null,
                    lastTimeCounter: row.timeCounter ?? null,
                    count: 0,
                    rows: []
                });
            }

            const g = map.get(variableName);

            g.count++;
            g.rows.push(row);

            if (row.accessLabel) {
                g.accessLabels.add(String(row.accessLabel));
            }

            if (row.sourceKind) {
                g.sourceKinds.add(String(row.sourceKind));
            }

            const t = row.timeCounter ?? null;

            if (t !== null) {
                if (g.firstTimeCounter === null || t < g.firstTimeCounter) {
                    g.firstTimeCounter = t;
                }

                if (g.lastTimeCounter === null || t > g.lastTimeCounter) {
                    g.lastTimeCounter = t;
                }
            }
        }

        return Array.from(map.values())
            .map(g => ({
                variableName: g.variableName,
                accessLabels: Array.from(g.accessLabels).sort(),
                sourceKinds: Array.from(g.sourceKinds).sort(),
                firstTimeCounter: g.firstTimeCounter,
                lastTimeCounter: g.lastTimeCounter,
                count: g.count,
                rows: g.rows
            }))
            .sort((a, b) => {
                const at = a.firstTimeCounter ?? Number.MAX_SAFE_INTEGER;
                const bt = b.firstTimeCounter ?? Number.MAX_SAFE_INTEGER;

                return (
                    at - bt ||
                    String(a.variableName).localeCompare(String(b.variableName))
                );
            });
    },
    showPanel: function(nodeId, history, clientX, clientY) {
        if (!this.isObjectMode()) {
            this.hide();
            return;
        }

        if (!this.panelEl) {
            this.createPanel();
        }

        const panel = this.panelEl;
        panel.innerHTML = "";

        const title = document.createElement("div");
        title.textContent = "Object Variable History";
        Object.assign(title.style, {
            fontWeight: "700",
            fontSize: "13px",
            marginBottom: "6px"
        });
        panel.appendChild(title);

        const groups = this.buildCandidateGroups(history);

        if (groups.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No variables referenced this object up to this point.";
            Object.assign(empty.style, {
                color: "#888",
                padding: "6px 0"
            });
            panel.appendChild(empty);
        } else {
            const subtitle = document.createElement("div");
            subtitle.textContent = "Candidate Variables";
            Object.assign(subtitle.style, {
                fontWeight: "600",
                marginBottom: "4px"
            });
            panel.appendChild(subtitle);

            for (const group of groups) {
                const btn = document.createElement("button");
                btn.type = "button";

                const accessText =
                    group.accessLabels.length > 0
                        ? group.accessLabels.join(", ")
                        : group.variableName;

                btn.innerHTML = `
                    <div style="font-weight:700;">${group.variableName}</div>
                    <div style="font-size:11px;color:#666;margin-top:2px;">
                        ${accessText}
                    </div>
                `;

                const isSelected =
                window.VariableHistoryObjectSelection &&
                typeof window.VariableHistoryObjectSelection.isSelected === "function"
                    ? window.VariableHistoryObjectSelection.isSelected(nodeId, group.variableName)
                    : false;

                Object.assign(btn.style, {
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    border: isSelected ? "2px solid #ff69b4" : "1px solid #eee",
                    background: isSelected ? "#fff0f6" : "#fff",
                    borderRadius: "8px",
                    padding: "7px 8px",
                    marginTop: "6px",
                    cursor: "pointer"
                });

                btn.onmouseenter = () => {
                    btn.style.background = "#fff0f6";
                    btn.style.borderColor = "#ffb6d5";
                };

                btn.onmouseleave = () => {
                btn.style.background = isSelected ? "#fff0f6" : "#fff";
                btn.style.borderColor = isSelected ? "#ff69b4" : "#eee";
            };

                // step4-3 ではまだ選択処理はしない。
                // step4-4 でここに「候補を選択する処理」を入れる。
                btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (
                    window.VariableHistoryObjectSelection &&
                    typeof window.VariableHistoryObjectSelection.toggleVariable === "function"
                ) {
                    window.VariableHistoryObjectSelection.toggleVariable(
                        nodeId,
                        history,
                        group.variableName
                    );
                }

                console.log("[VariableHistoryObjectPicker] candidate selected:", {
                    objectNodeId: nodeId,
                    candidate: group,
                    selection: window.VariableHistoryObjectSelection?.debug?.(false)
                });

                // 選択状態を反映するためにパネルを再描画する
                const rect = panel.getBoundingClientRect();
                this.showPanel(nodeId, history, rect.left - 12, rect.top - 12);
            };

                panel.appendChild(btn);
            }
        }

        const footer = document.createElement("div");
        footer.textContent = "Click a candidate to apply ring-based history visualization.";
        Object.assign(footer.style, {
            color: "#aaa",
            fontSize: "11px",
            marginTop: "8px",
            borderTop: "1px solid #eee",
            paddingTop: "6px"
        });
        panel.appendChild(footer);

        const left = Math.min(clientX + 12, window.innerWidth - 340);
        const top = Math.min(clientY + 12, window.innerHeight - 260);

        panel.style.left = `${Math.max(8, left)}px`;
        panel.style.top = `${Math.max(8, top)}px`;
        panel.style.display = "block";
    },

    hide: function() {
        if (!this.panelEl) return;
        this.panelEl.style.display = "none";
    },

    debugLast: function() {
        const result = {
            lastNodeId: this.lastNodeId,
            lastHistory: this.lastHistory,
            candidates: this.buildCandidateGroups(this.lastHistory)
        };

        console.log("[VariableHistoryObjectPicker] last =", result);
        return result;
    }
};
window.AnimationController.init();
window.VariableHistoryContextMenu.init();
window.VariableHistoryOptionsUI.init();
window.VariableHistoryObjectPicker.init();