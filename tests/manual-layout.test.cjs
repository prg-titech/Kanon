const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const source = process.env.KANON_JS_DIR || path.resolve(__dirname, '../src/js');
const baseSource = process.env.KANON_BASE_JS_DIR || source;
const clone = value => JSON.parse(JSON.stringify(value));

function harness() {
    let time = 0, nextTimer = 0;
    const timers = new Map(), handlers = new Map();
    class DataSet {
        constructor(nodes) { this._data = Object.fromEntries(nodes.map(n => [n.id, {...n}])); }
        forEach(fn) { Object.values(this._data).forEach(fn); }
        get() { return Object.values(this._data); }
        update(nodes) { for (const node of Array.isArray(nodes) ? nodes : [nodes]) Object.assign(this._data[node.id], node); }
    }
    const state = { positions: {A:{x:310,y:120},B:{x:0,y:-80}}, scale:1.7, center:{x:15,y:40}, physics:true, dataCalls:0, layoutCalls:0 };
    const net = {
        getPositions(ids) { return clone(Object.fromEntries(Object.entries(state.positions).filter(([id])=>!ids || ids.includes(id)))); },
        moveNode(id,x,y) { state.positions[id]={x,y}; },
        setOptions(options) { if(options.physics) state.physics=options.physics.enabled; },
        setData(data) { state.dataCalls++; state.positions=Object.fromEntries(data.nodes.get().map(n=>[n.id,{x:n.x,y:n.y}])); },
        stopSimulation() {}, redraw() { handlers.get('beforeDrawing')?.(); },
        getScale:()=>state.scale, getViewPosition:()=>({...state.center}),
        moveTo(view) { state.scale=view.scale; state.center={...view.position}; },
        on(event,fn) { handlers.set(event,fn); }, once() {}
    };
    const sandbox = { window:{}, console:{log(){},warn(){},error(e){throw e;}},
        Date:class { getTime(){return time;} static now(){return time;} },
        setInterval(fn) { const id=++nextTimer;timers.set(id,fn);return id; },
        clearInterval(id) { timers.delete(id); }, setTimeout(){}, clearTimeout(){},
        vis:{DataSet}, __$__:{
            ObjectGraphNetwork:{network:net,nodes:new DataSet([{id:'A'},{id:'B'}]),edges:new DataSet([]),options:{nodes:{},edges:{color:{}},physics:{enabled:true}},colorRGB:{skyblue:'135,206,235'}},
            Update:{useBoxToVisualizeArray:false,updateArrayPosition(){},isChange:()=>true},
            Layout:{enabled:true,setLocation(){state.layoutCalls++;}},
            editor:{getCursorPosition:()=>({row:0,column:0})},
            CallTree:{rootNode:{}},SummarizedViewColor:{AddNode:'orange',AddEdge:'orange',RemoveEdge:'green'}
        }
    };
    const ctx=vm.createContext(sandbox);
    vm.runInContext('Array.prototype.last=function(){return this[this.length-1]};',ctx);
    for(const [name,folder] of [['context.js',source],['storePositions.js',baseSource],['animation.js',source],['variable-history-view.js',source]]) {
        vm.runInContext(fs.readFileSync(path.join(folder,name),'utf8').replace(/^window\.\w+\.init\(\);$/gm,''),ctx);
    }
    const ac=ctx.window.AnimationController, c=ctx.__$__.Context;
    c.SnapshotContext={cpID:'1',contextSensitiveID:'main-call1',loopLabel:'L'};
    ac.statusLabel={};ac.setPlaybackControlsEnabled=()=>{};
    ac.clearCallTreeHighlight=()=>{};ac.clearEditorFrameIndicator=()=>{};
    ac.showPrepareOverlay=()=>{};ac.hidePrepareOverlay=()=>{};
    ac.getAnimationSelectionEntries=()=>[{name:'current',paletteKey:'pink'}];
    ac.getAnimationSelectionKey=()=> 'current';ac.getAnimationSelectionLabel=()=> 'current';
    ac.preprocess=function(){this.changedSnapshotKeys=[{cpID:'1',contextID:'main-call1'}];};
    return {ctx,ac,c,state,net,timers,setTime:t=>{time=t;},DataSet};
}
function frame(h,id,nodes) {
    const g={nodes:Object.fromEntries(nodes.map(n=>[n.id,{...n}])),variableNodes:{},edges:[],variableEdges:[],
        setLocation(id,x,y){this.nodes[id].x=x;this.nodes[id].y=y;},
        generateVisjsGraph(){return {nodes:Object.values(this.nodes).map(n=>({...n})),edges:[]};},
        duplicate(){return this;}
    };
    h.c.StoredGraph[id]={'main-call1':g};return g;
}
function render(h,id) { h.ac.applySnapshot(null,{cpID:id,contextID:'main-call1'}); }

test('Prepare captures moved and unmoved nodes, including zero coordinates, before preprocessing',()=>{
    const h=harness();const before=clone(h.state.positions);const contextBefore=clone(h.c.SnapshotContext);
    h.ac.preprocess=function(){assert.deepEqual(clone(this.fixedPositions),before);this.changedSnapshotKeys=[{}];};
    h.ac.beginPrepare();
    assert.deepEqual(clone(h.ac.fixedPositions),before);assert.deepEqual(clone(h.c.SnapshotContext),contextBefore);
    assert.equal(h.state.dataCalls,0);assert.equal(h.state.layoutCalls,0);assert.equal(h.ac.isPrepared,true);
    assert.equal(h.ctx.__$__.ObjectGraphNetwork.nodes._data.B.fixed.x,true);
});
test('Frames, missing/reappearing nodes and rings reuse captured coordinates and preserve viewport',()=>{
    const h=harness();h.ac.beginPrepare();
    frame(h,'1',[{id:'A',x:-999,y:-999},{id:'B',x:999,y:999},{id:'__vh_object_ring__A',x:888,y:888,vhObjectRing:{baseNodeId:'A'}}]);
    render(h,'1');assert.deepEqual(h.state.positions.A,{x:310,y:120});assert.deepEqual(h.state.positions.B,{x:0,y:-80});
    assert.deepEqual(h.state.positions.__vh_object_ring__A,h.state.positions.A);
    frame(h,'2',[{id:'B',x:5,y:5},{id:'C'}]);render(h,'2');const c=clone(h.state.positions.C);
    assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));
    frame(h,'3',[{id:'A',x:1,y:2},{id:'C',x:-500,y:-500}]);render(h,'3');
    assert.deepEqual(h.state.positions.C,c);assert.deepEqual(h.state.positions.A,{x:310,y:120});
    assert.equal(h.state.physics,false);assert.equal(h.state.scale,1.7);assert.deepEqual(h.state.center,{x:15,y:40});
});
test('Cancelled normal movement cannot overwrite captured coordinates, even at its final tick',()=>{
    const h=harness(),animation=h.ctx.__$__.Animation;
    animation.moveWithAnimation('A',{x:900,y:900},animation.nowAnimationID,500);
    const timer=[...animation.moveTimers][0],callback=h.timers.get(timer);
    h.ac.beginPrepare();assert.equal(h.timers.has(timer),false);assert.equal(animation.moveTimers.size,0);
    h.setTime(600);callback();assert.deepEqual(h.state.positions.A,{x:310,y:120});
});
test('Normal redraw uses the same fixed positions without layout or move timers',()=>{
    const h=harness();const g=frame(h,'1',[{id:'A',x:123,y:456},{id:'B',x:123,y:456}]);
    h.ac.beginPrepare();
    h.c.FindCPIDNearCursorPosition=()=>vm.runInContext('({beforeIds:["1"],afterIds:["1"]})',h.ctx);
    h.c.CheckPointTable={'1':{column:0,line:1}};
    h.c.CheckPointID2LoopLabel={'1':'L'};h.c.SpecifiedContext={L:'main-call1'};
    h.c.Draw('changed');
    assert.equal(h.state.layoutCalls,0);assert.equal(h.ctx.__$__.Animation.moveTimers.size,0);
    assert.deepEqual(h.state.positions.A,{x:310,y:120});assert.deepEqual(h.state.positions.B,{x:0,y:-80});
    // Summary view must use the same protection.
    h.c.Snapshot=false;h.c.LastGraph=g;h.c.CallTreeNodesOfEachLoop={L:[]};
    h.c.Draw('changed');assert.equal(h.state.layoutCalls,0);assert.deepEqual(h.state.positions.A,{x:310,y:120});
});
test('Changing selection retains layout; a new Prepare captures subsequent manual edits',()=>{
    const h=harness();h.ac.beginPrepare();h.ctx.window.VariableHistoryOptions.resetAnimationState();
    assert.equal(h.ac.hasFixedLayout(),true);assert.equal(h.ac.isPrepared,false);
    h.net.moveNode('A',1000,200);h.ac.beginPrepare();
    assert.deepEqual(clone(h.ac.fixedPositions.A),{x:1000,y:200});assert.deepEqual(clone(h.ac.fixedPositions.B),{x:0,y:-80});
});
test('Rebuilt program and reload cannot reuse positions belonging to different objects',()=>{
    const h=harness();h.ac.beginPrepare();h.c.StoredGraph={};
    assert.equal(h.ac.hasFixedLayout(),false);assert.equal(h.ac.isPreparedSelectionStillCurrent(),false);
    for (const method of ['stepFrameForward','stepFrameBackward','stepChangeForward','stepChangeBackward']) {
        h.ac[method]();
        assert.equal(h.ac.statusLabel.innerText,'Prepare animation first');
    }
    assert.equal(h.state.dataCalls,0);
    assert.equal(harness().ac.hasFixedLayout(),false);
});
test('Without Prepare, normal movement still works and completes at target',()=>{
    const h=harness(),a=h.ctx.__$__.Animation;
    a.setData({nodes:[{id:'A',x:600,y:700},{id:'B',x:0,y:-80}],edges:[]});
    const callbacks=[...a.moveTimers].map(id=>h.timers.get(id));h.setTime(500);callbacks.forEach(fn=>fn());
    assert.deepEqual(h.state.positions.A,{x:600,y:700});assert.equal(a.moveTimers.size,0);
});
