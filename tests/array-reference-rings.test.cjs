const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = process.env.KANON_JS_DIR || path.resolve(__dirname, '../src/js');
const baseSource = process.env.KANON_BASE_JS_DIR || source;

function harness(specs, options = {}) {
    const app = { Context: { StoredGraph: {}, SnapshotContext: { contextSensitiveID: 'main-call1' } } };
    const ctx = vm.createContext({
        window: {}, __$__: app, console,
        setInterval() { return 1; }, clearInterval() {}
    });
    for (const file of ['object2graph/graph.js', 'object2graph/traverse.js']) {
        vm.runInContext(fs.readFileSync(path.join(baseSource, file), 'utf8'), ctx);
    }
    vm.runInContext(fs.readFileSync(path.join(source, 'variable-history-view.js'), 'utf8')
        .replace(/^window\.\w+\.init\(\);$/gm, ''), ctx);
    vm.runInContext(`
        Object.setProperty = (object, key, value) => Object.defineProperty(object, key, { value });
        class Node { constructor(id) { Object.setProperty(this, '__id', id); } }
        var nodes = Object.fromEntries(['C', 'D', 'E', ...Array.from({length: 12}, (_, i) => 'N' + i)]
            .map(id => [id, new Node(id)]));
        var queue = []; Object.setProperty(queue, '__id', 'arr-queue');
        var members = new Set(); Object.setProperty(members, '__id', 'members');
        var holder = {}; Object.setProperty(holder, '__id', 'holder');
        function capture(spec, time) {
            queue.splice(0, queue.length, ...(spec.queue || []).map(id => nodes[id]));
            const variables = { queue };
            if (spec.current) variables.current = nodes[spec.current];
            if (spec.members) {
                members.clear();
                for (const id of spec.members) members.add(nodes[id]);
                variables.members = members;
            }
            if (spec.properties) {
                for (const key of Object.keys(holder)) delete holder[key];
                for (const [key, id] of Object.entries(spec.properties)) holder[key] = nodes[id];
                variables.holder = holder;
            }
            return __$__.Traverse.traverse([...Object.values(nodes), queue, members, holder], variables, time);
        }
    `, ctx);
    const view = ctx.window.VariableHistoryView;
    const selectedEntries = options.selectedEntries || [{ name: 'queue', paletteKey: 'green', layerRole: 'main-fill' }];
    const snapshots = specs.map((spec, i) => ({
        cpID: String(i + 1), contextID: 'main-call1', timeCounter: i + 1,
        g: ctx.capture(spec, i + 1)
    }));
    let current = snapshots[snapshots.length - 1];
    const show = index => {
        current = snapshots[index];
        app.Context.SnapshotContext = { cpID: current.cpID, contextSensitiveID: current.contextID };
    };
    view.collectSnapshotsForCurrentTarget = () => snapshots;
    view.getCurrentTimeCounter = () => current.timeCounter;
    view.getCurrentStoredGraph = () => current.g;
    view.getActiveRingSelectionEntries = () => selectedEntries;
    view.getHistoryGroupKey = () => 'main-call1';
    Object.assign(ctx.window.VariableHistoryOptions, {
        displayMode: 'variable', gradientMode: options.gradientMode || 'stack',
        stackShadeMode: options.stackShadeMode || 'tailDark', fadeMode: 'all'
    });
    show(snapshots.length - 1);
    function render(nodeId = 'C') {
        const ringResult = view.buildObjectRingEventList({ objectNodeId: nodeId, selectedEntries });
        const { ageMap } = view.buildGlobalObjectRingAgeMap({ selectedEntries });
        const graph = { nodes: [{ id: nodeId, label: 'Node', x: 100, y: 200 }], edges: [] };
        view.paintObjectRingEvents(graph, ringResult, { ageMap });
        const base = graph.nodes.find(node => node.id === nodeId);
        const rings = graph.nodes.filter(node => node.vhObjectRing);
        return { graph, base, rings, ringResult, ageMap };
    }
    return { view, snapshots, show, render };
}

function starts(h, nodeId = 'C', variableName = 'queue') {
    return h.view.buildObjectVariableHistory(nodeId).eventRows.filter(row => row.variableName === variableName);
}

test('Appending a duplicate queue reference preserves the light outer ring and dark center', () => {
    const h = harness([{ queue: ['C', 'D', 'E'] }, { queue: ['C', 'D', 'E', 'C'] }]);
    assert.equal(starts(h).length, 2);
    const { base, rings } = h.render();
    const palette = h.view.getPalette('green');
    assert.equal(base.color.background, palette[0].background);
    assert.equal(base.vhObjectBasePaint.accessLabel, 'queue[3]');
    assert.equal(rings.length, 1);
    assert.equal(rings[0].color.background, palette[3].background);
    assert.equal(rings[0].vhObjectRing.accessLabel, 'queue[0]');
    assert.equal(rings[0].vhObjectRing.ringIndexFromInner, 1);
    for (const [id, age] of [['D', 2], ['E', 1]]) {
        assert.equal(h.render(id).base.color.background, palette[age].background);
    }
});

test('Shifting and repeated static frames keep surviving references without inventing starts', () => {
    const h = harness([
        { queue: ['C', 'D', 'E'] },
        { queue: ['C', 'D', 'E', 'C'] },
        { queue: ['D', 'E', 'C'] },
        { queue: ['D', 'E', 'C'] }
    ]);
    assert.equal(starts(h).length, 2);
    assert.equal(starts(h, 'D').length, 1);
    assert.equal(starts(h, 'E').length, 1);
    const { base } = h.render();
    assert.equal(base.color.background, h.view.getPalette('green')[0].background);
    h.show(1);
    assert.equal(h.render().rings.length, 1);
    h.show(0);
    assert.equal(h.render().rings.length, 0);
});

test('Duplicate references in an initially populated array remain distinct across static snapshots', () => {
    const h = harness([
        { queue: ['C', 'D', 'E', 'C'] },
        { queue: ['C', 'D', 'E', 'C'] },
        { queue: ['C', 'D', 'E', 'C'] }
    ]);
    assert.equal(starts(h).length, 2);
    assert.equal(h.render().rings.length, 1);
});

test('First Index Dark assigns each duplicate its own current array-position shade', () => {
    const h = harness([{ queue: ['C', 'D', 'E'] }, { queue: ['C', 'D', 'E', 'C'] }], { stackShadeMode: 'headDark' });
    const { base, rings } = h.render();
    const palette = h.view.getPalette('green');
    assert.equal(rings.length, 1);
    assert.deepEqual([base.color.background, rings[0].color.background].sort(),
        [palette[0].background, palette[3].background].sort());
});

test('Time mode retains duplicate reference starts and their separate rings', () => {
    const h = harness([{ queue: ['C', 'D', 'E'] }, { queue: ['C', 'D', 'E', 'C'] }], { gradientMode: 'time' });
    assert.equal(starts(h).length, 2);
    const { base, rings } = h.render();
    assert.equal(rings.length, 1);
    assert.equal(base.color.background, h.view.getPalette('green')[0].background);
    assert.equal(rings[0].color.background, h.view.getPalette('green')[1].background);
});

test('Scalar and Set references retain their existing continuity semantics', () => {
    const h = harness([
        { queue: [], current: 'C', members: ['C', 'D'] },
        { queue: [], current: 'C', members: ['D', 'C'] },
        { queue: [], current: 'C', members: ['C', 'D'] }
    ], { selectedEntries: [{ name: 'current', paletteKey: 'pink' }, { name: 'members', paletteKey: 'green' }] });
    assert.equal(starts(h, 'C', 'current').length, 1);
    assert.equal(starts(h, 'C', 'members').length, 1);
    assert.equal(starts(h, 'D', 'members').length, 1);
});

test('A scalar reference between array episodes remains visible in the rings', () => {
    const h = harness([
        { queue: ['C'] },
        { queue: [], current: 'C' },
        { queue: ['C'], current: 'C' }
    ], { selectedEntries: [{ name: 'current', paletteKey: 'pink' }, { name: 'queue', paletteKey: 'green' }] });
    assert.equal(starts(h).length, 2);
    assert.equal(starts(h, 'C', 'current').length, 1);
    const { base, rings } = h.render();
    assert.equal(rings.length, 2);
    assert.equal(base.color.background, h.view.getPalette('green')[0].background);
    assert.ok(rings.some(node => node.vhObjectRing.variableName === 'current'));
    assert.ok(rings.some(node => node.vhObjectRing.variableName === 'queue'));
});

test('Array indexes 2 and 10 are ordered numerically and keep their own shades', () => {
    const queue = Array.from({ length: 11 }, (_, i) => i === 2 || i === 10 ? 'C' : 'N' + i);
    const h = harness([{ queue }]);
    assert.deepEqual(Array.from(starts(h), row => row.index), [2, 10]);
    const { base, rings } = h.render();
    assert.equal(base.vhObjectBasePaint.accessLabel, 'queue[10]');
    assert.equal(rings.length, 1);
    assert.equal(rings[0].vhObjectRing.accessLabel, 'queue[2]');
    assert.equal(rings[0].color.background, h.view.getPalette('green')[4].background);
});

test('Multiple properties of one ordinary object keep their existing single-start history', () => {
    const h = harness([
        { queue: [], properties: { left: 'C', right: 'C' } },
        { queue: [], properties: { right: 'C', left: 'C' } }
    ], { selectedEntries: [{ name: 'holder', paletteKey: 'green' }] });
    assert.equal(starts(h, 'C', 'holder').length, 1);
});

test('Time mode orders simultaneous array references numerically beyond index 9', () => {
    const queue = Array.from({ length: 11 }, (_, i) => i === 2 || i === 10 ? 'C' : 'N' + i);
    const h = harness([{ queue }], { gradientMode: 'time' });
    const { base, rings } = h.render();
    assert.equal(base.vhObjectBasePaint.accessLabel, 'queue[10]');
    assert.equal(rings.length, 1);
    assert.equal(rings[0].vhObjectRing.accessLabel, 'queue[2]');
});

test('Removing the latest occurrence leaves the surviving array reference inside its historical ring', () => {
    for (const queue of [['C', 'D'], ['N0', 'N1', 'N2', 'N3', 'C', 'D']]) {
        const h = harness([
            { queue },
            { queue: [...queue, 'C'] },
            { queue }
        ], { stackShadeMode: 'headDark' });
        assert.equal(starts(h).length, 2);
        const { base, rings } = h.render();
        const index = queue.indexOf('C');
        assert.equal(base.vhObjectBasePaint.accessLabel, `queue[${index}]`);
        assert.equal(base.color.background, h.view.getPalette('green')[index].background);
        assert.equal(rings.length, 1);
        assert.equal(rings[0].vhObjectRing.accessLabel, `queue[${queue.length}]`);
        assert.equal(rings[0].color.background, h.view.getPalette('green')[Math.min(index + 1, 4)].background);
    }
});
