const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const source=process.env.KANON_JS_DIR || path.resolve(__dirname,'../src/js');
const base=process.env.KANON_BASE_JS_DIR || source;
const clone=v=>JSON.parse(JSON.stringify(v));
function setup({ installHook = false } = {}) {
    const events=new Map();
    const intervals=[];
    const state={positions:{},scale:1,moves:[],queries:[]};
    class DataSet {
        constructor(items){this.items=items.map(n=>({...n}));}
        forEach(fn){this.items.forEach(fn);}
        update(items){for(const n of items)Object.assign(this.items.find(x=>x.id===n.id),n);}
    }
    const app={Context:{StoredGraph:{}},Animation:{cancelMoves(){}},StorePositions:{registerPositions(){}}};
    const net={
        on(name,fn){if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},
        getPositions(ids){
            state.queries.push(ids);
            const wanted=ids || app.ObjectGraphNetwork.nodes.items.filter(n=>!n.hidden).map(n=>n.id);
            return Object.fromEntries(wanted.filter(id=>state.positions[id]).map(id=>[id,{x:Math.round(state.positions[id].x),y:Math.round(state.positions[id].y)}]));
        },
        getBoundingBox(id){const p=state.positions[id];return p&&{left:p.x-30,right:p.x+30,top:p.y-20,bottom:p.y+20};},
        getScale:()=>state.scale,
        getViewPosition:()=>({x:0,y:0}), moveTo(){},
        moveNode(id,x,y){state.positions[id]={x,y};state.moves.push(id);},
        setData(data){app.ObjectGraphNetwork.nodes=data.nodes;state.positions=Object.fromEntries(data.nodes.items.map(n=>[n.id,{x:n.x,y:n.y}]));},
        stopSimulation(){},setOptions(){},redraw(){for(const fn of events.get('beforeDrawing')||[])fn();}
    };
    app.ObjectGraphNetwork={network:net,nodes:new DataSet([]),edges:new DataSet([])};
    const ctx=vm.createContext({window:{},__$__:app,console,setInterval(fn){intervals.push(fn);return intervals.length;},clearInterval(){},vis:{DataSet}});
    for(const f of ['object2graph/graph.js','object2graph/traverse.js'])vm.runInContext(fs.readFileSync(path.join(base,f),'utf8'),ctx);
    vm.runInContext(fs.readFileSync(path.join(source,'variable-history-view.js'),'utf8').replace(/^window\.\w+\.init\(\);$/gm,''),ctx);
    const view=ctx.window.VariableHistoryView, ac=ctx.window.AnimationController;
    if (installHook) intervals.forEach(fn=>fn());
    ac.fixedPositions={A:{x:100,y:200},B:{x:400,y:200}};ac.fixedLayoutGraphStore=app.Context.StoredGraph;
    const load=g=>{net.setData({nodes:new DataSet(g.nodes),edges:new DataSet(g.edges)});net.redraw();};
    return {state,view,ac,app,net,ctx,load,DataSet,events};
}
function graph() {
    return {nodes:[{id:'A',x:100,y:200},{id:'B',x:400,y:200},{id:'__Variable-start',x:2000,y:50,hidden:true},{id:'arr1-0-array',x:3000,y:50}],edges:[
        {from:'__Variable-start',to:'A',color:'seagreen',label:'start'},
        {from:'arr1-0-array',to:'A',color:'seagreen',label:'visited[0]'},
        {from:'A',to:'B',color:'skyblue',label:'next',smooth:true}
    ]};
}
function checkLength(h,node) {
    const {targetId,angle}=node.vhVariableArrow;
    const p=h.state.positions[node.id],target=h.state.positions[targetId];
    const radius=1/Math.sqrt((Math.cos(angle)/30)**2+(Math.sin(angle)/20)**2);
    const distance=(Math.hypot(p.x-target.x,p.y-target.y)-radius)*h.state.scale;
    assert.ok(Math.abs(distance-60)<2,`screen distance ${distance}`);
}
test('Scalar and array references become short straight arrows; real nodes and blue edges remain unchanged',()=>{
    const h=setup(),g=graph(),before=clone(g);h.view.prepareShortVariableArrows(g);h.load(g);
    assert.equal(g.edges[0].from,'__Variable-start');assert.equal(g.edges[1].from,'arr1-0-array');
    const anchors=g.nodes.filter(n=>n.vhVariableArrow);assert.equal(anchors.length,2);
    assert.notEqual(anchors[0].vhVariableArrow.angle,anchors[1].vhVariableArrow.angle);
    for(const n of anchors)checkLength(h,n);
    assert.deepEqual(g.edges[2],before.edges[2]);
    assert.equal(g.edges[0].physics,false);assert.equal(g.edges[0].smooth,false);
    assert.deepEqual(h.state.positions.A,{x:100,y:200});assert.deepEqual(h.state.positions.B,{x:400,y:200});
    const ids=g.nodes.map(n=>n.id);h.view.prepareShortVariableArrows(g);assert.deepEqual(g.nodes.map(n=>n.id),ids);
});
test('Zoom and dragging reposition only hidden arrow anchors without a perpetual redraw loop',()=>{
    const h=setup(),g=graph();h.view.prepareShortVariableArrows(g);h.load(g);
    const anchors=g.nodes.filter(n=>n.vhVariableArrow);
    for(const scale of [0.5,1,2]){h.state.scale=scale;h.state.positions.A={x:222,y:333};h.net.redraw();for(const n of anchors)checkLength(h,n);}
    const moved=h.state.moves.length;h.net.redraw();assert.equal(h.state.moves.length,moved);
    assert.ok(h.state.queries.every(ids=>Array.isArray(ids)));
    assert.ok(h.state.moves.every(id=>h.view.isVariableArrowSourceId(id)));
});
test('Selected references stay hidden; leftover invisible sources do not create far-right fixed positions',()=>{
    const h=setup(),g=graph();h.view.getActiveRingSelectionEntries=()=>[{name:'start'},{name:'visited'}];
    const stored={nodes:{},variableEdges:[{from:'__Variable-visited',to:'arr1'}],edges:[{from:'arr1-0-array',to:'A'}]};
    h.view.hideSelectedVariableEdges(g,stored);h.view.prepareShortVariableArrows(g);h.ac.applyFixedPositionsToVisGraph(g);
    assert.equal(g.edges.length,1);assert.equal(g.nodes.length,2);
    assert.deepEqual(clone(h.ac.fixedPositions),{A:{x:100,y:200},B:{x:400,y:200}});
});
test('Retargeted, disappearing and newly created references never move the fixed target nodes',()=>{
    const h=setup(),g=graph();h.view.prepareShortVariableArrows(g);h.load(g);
    const oldIds=g.nodes.filter(n=>n.vhVariableArrow).map(n=>n.id);
    const next=graph();next.edges[0].to='B';next.edges=next.edges.filter(e=>e.from!=='arr1-0-array');
    h.view.prepareShortVariableArrows(next);h.load(next);const n=next.nodes.find(n=>n.vhVariableArrow);checkLength(h,n);
    h.state.moves=[];h.net.redraw();assert.ok(h.state.moves.every(id=>id!=='arr1-0-array'));assert.equal(h.state.positions['arr1-0-array'],undefined);
    h.ac.buildFixedLayout();assert.equal(Object.keys(h.ac.fixedPositions).length,2);
    const later={nodes:[...next.nodes,{id:'C'}],edges:next.edges};h.ac.applyFixedPositionsToVisGraph(later);
    assert.equal(h.ac.fixedPositions.C.x,520);assert.deepEqual(clone(h.ac.fixedPositions.A),{x:100,y:200});
});
test('Many incoming references have stable distinct angles, preserving labels and identities',()=>{
    const h=setup();const g={nodes:[{id:'A',x:100,y:200}],edges:[]};
    for(let i=0;i<12;i++){g.nodes.push({id:`arr2-${i}-array`});g.edges.push({from:`arr2-${i}-array`,to:'A',label:`visited[${i}]`});}
    h.view.prepareShortVariableArrows(g);h.load(g);const angles=g.nodes.filter(n=>n.vhVariableArrow).map(n=>n.vhVariableArrow.angle);
    assert.equal(new Set(angles).size,12);for(const n of g.nodes.filter(n=>n.vhVariableArrow))checkLength(h,n);
    assert.equal(g.edges[11].label,'visited[11]');
    const invalid=h.view.getVariableArrowPosition({angle:0},{x:0,y:0},{left:0,right:0,top:0,bottom:0},0);
    assert.ok(Number.isFinite(invalid.x)&&Number.isFinite(invalid.y));
});
test('The actual array graph and fixed renderer retain history and near-target references',()=>{
    const h=setup();vm.runInContext(`
        Object.setProperty=(o,k,v)=>Object.defineProperty(o,k,{value:v});
        class Node{constructor(id){this.__id=id;}}
        var a=new Node('A'),b=new Node('B'),visited=[a,b];Object.setProperty(visited,'__id','arr3');
        var stored=__$__.Traverse.traverse([a,b,visited],{visited,start:a},1);
        var g=stored.generateVisjsGraph();window.VariableHistoryView.removeArrayNodes(g,stored);
    `,h.ctx);
    const g=h.ctx.g;h.ac.renderFixedVisGraph(g);
    assert.equal(h.ctx.stored.edges.length,2);assert.equal(g.nodes.filter(n=>n.vhVariableArrow).length,3);
    assert.deepEqual(Object.keys(h.ac.fixedPositions).sort(),['A','B']);
    for(const n of g.nodes.filter(n=>n.vhVariableArrow))checkLength(h,n);
});

function arrayFixture(h) {
    vm.runInContext(`
        Object.setProperty=(o,k,v)=>Object.defineProperty(o,k,{value:v});
        class Node { constructor(id) { Object.setProperty(this,'__id',id); } }
        var a=new Node('A'),b=new Node('B');a.next=b;
        function array(id,values) { Object.setProperty(values,'__id',id);return values; }
    `,h.ctx);
}

test('Repeated loop allocations keep only current array arrows and preserve stored history',()=>{
    const h=setup({installHook:true});arrayFixture(h);
    vm.runInContext(`
        var visited=array('arr-visited',[a,b]),objects=[a,b,visited],snapshots=[];
        for (var i=0;i<8;i++) {
            var neighbors=array('arr-neighbors-'+i,[a,b]);objects.push(neighbors);
            snapshots.push(__$__.Traverse.traverse(objects,{visited,neighbors,start:a},i));
        }
        var finished=__$__.Traverse.traverse(objects,{visited,start:a},8);
    `,h.ctx);
    for (const stored of h.ctx.snapshots) {
        const before=JSON.stringify(stored),g=stored.generateVisjsGraph();
        const slots=g.edges.filter(e=>e.from.endsWith('-array'));
        assert.equal(slots.length,4);
        assert.deepEqual(Array.from(slots,e=>e.label).sort(),['neighbors[0]','neighbors[1]','visited[0]','visited[1]']);
        assert.equal(JSON.stringify(stored),before);
        assert.ok(g.edges.some(e=>e.from==='A'&&e.to==='B'&&e.label==='next'));
    }
    const finished=h.ctx.finished,g=finished.generateVisjsGraph();
    assert.equal(finished.edges.filter(e=>e.from.endsWith('-array')).length,18);
    assert.deepEqual(Array.from(g.edges.filter(e=>e.from.endsWith('-array')),e=>e.label),['visited[0]','visited[1]']);
    // Rewinding must restore that frame's neighbors without retaining later arrows.
    const earlier=h.ctx.snapshots[2].generateVisjsGraph();
    h.ac.renderFixedVisGraph(earlier);h.ac.renderFixedVisGraph(g);
    assert.equal(h.app.ObjectGraphNetwork.nodes.items.filter(n=>n.vhVariableArrow).length,3);
    assert.deepEqual(Object.keys(h.ac.fixedPositions).sort(),['A','B']);
    assert.equal(h.view.getArrayContentsEntriesFromStoredGraph(h.ctx.snapshots[2],'arr-neighbors-2').length,2);
});

test('Reachable unnamed nested arrays survive through object and Set references, including cycles',()=>{
    const h=setup({installHook:true});arrayFixture(h);
    vm.runInContext(`
        var inner=array('arr-inner',[a]),outer=array('arr-outer',[inner]);
        inner.push(outer);inner['extra-key']=b;
        var holder={items:outer};Object.setProperty(holder,'__id','holder');
        var members=new Set([holder]);Object.setProperty(members,'__id','members');
        a.members=members;
        var orphan=array('arr-orphan',[b]);orphan.push(orphan);
        var stored=__$__.Traverse.traverse([a,b,outer,inner,holder,members,orphan],{start:a},1);
        var g=stored.generateVisjsGraph();
    `,h.ctx);
    const slots=Array.from(h.ctx.g.edges.filter(e=>e.from.endsWith('-array')));
    assert.equal(slots.length,2); // Array-valued targets are hidden, real elements remain.
    assert.ok(slots.some(e=>e.from==='arr-inner-0-array'&&e.label==='[0]'&&e.to==='A'));
    assert.ok(slots.some(e=>e.from==='arr-inner-extra-key-array'&&e.to==='B'));
    assert.ok(!h.ctx.g.nodes.some(n=>n.id.startsWith('arr-orphan')));
    assert.ok(h.ctx.g.edges.some(e=>e.from==='A'&&e.to==='members'));
});

test('Array reassignment, aliases and leaving scope use only the displayed snapshot roots',()=>{
    const h=setup({installHook:true});arrayFixture(h);
    vm.runInContext(`
        var old=array('arr-old',[a]),next=array('arr-next',[b]),objects=[a,b,old,next];
        var aliased=__$__.Traverse.traverse(objects,{items:next,backup:old},1);
        var replaced=__$__.Traverse.traverse(objects,{items:next},2);
        var leftScope=__$__.Traverse.traverse(objects,{},3);
    `,h.ctx);
    // An unrelated global SnapshotContext must never supply the filter's roots.
    h.view.getCurrentStoredGraph=()=>h.ctx.leftScope;
    const labels=g=>Array.from(g.generateVisjsGraph().edges.filter(e=>e.from.endsWith('-array')),e=>e.label).sort();
    assert.deepEqual(labels(h.ctx.aliased),['backup[0]','items[0]']);
    assert.deepEqual(labels(h.ctx.replaced),['items[0]']);
    assert.deepEqual(labels(h.ctx.leftScope),[]);
    assert.deepEqual(labels(h.ctx.aliased.duplicate()),['backup[0]','items[0]']);
});

test('Selected variables stay hidden after stale array filtering without erasing color-history inputs',()=>{
    const h=setup({installHook:true});arrayFixture(h);
    vm.runInContext(`
        var old=array('arr-old',[a]),current=array('arr-current',[b]),visited=array('arr-visited',[a,b]);
        var stored=__$__.Traverse.traverse([a,b,old,current,visited],{worklist:current,visited},1);
    `,h.ctx);
    h.view.getActiveRingSelectionEntries=()=>[{name:'worklist',paletteKey:'green'}];
    const before=JSON.stringify(h.ctx.stored),g=h.ctx.stored.generateVisjsGraph();
    assert.deepEqual(Array.from(g.edges.filter(e=>e.from.endsWith('-array')),e=>e.label),['visited[0]','visited[1]']);
    assert.equal(JSON.stringify(h.ctx.stored),before);
    assert.equal(h.view.getTargetInfoFromStoredGraph(h.ctx.stored,'worklist').arrayContentsSet.has('B'),true);
});
