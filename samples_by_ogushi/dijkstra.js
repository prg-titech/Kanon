class costedEdge {
    constructor(from, to, cost) {
        this.from = from;
        this.to = to;
        this.cost = cost;
    }
}

let V = 8, E = 12;
let stations = [
    "名古屋",
    "国際センター",
    "伏見",
    "丸の内",
    "浅間町",
    "名城公園",
    "市役所",
    "久屋大通",
    "栄"
];

let graph = new Array();
graph.push(new costedEdge(stations[0], stations[1], 2));
graph.push(new costedEdge(stations[0], stations[2], 3));
graph.push(new costedEdge(stations[1], stations[3], 1));
graph.push(new costedEdge(stations[2], stations[3], 2));
graph.push(new costedEdge(stations[2], stations[8], 2));
graph.push(new costedEdge(stations[8], stations[7], 1));
graph.push(new costedEdge(stations[3], stations[7], 2));
graph.push(new costedEdge(stations[3], stations[6], 5));
graph.push(new costedEdge(stations[6], stations[7], 2));
graph.push(new costedEdge(stations[3], stations[4], 2));
graph.push(new costedEdge(stations[4], stations[5], 6));
graph.push(new costedEdge(stations[6], stations[5], 2));

function dijkstra(start, goal) {
    let d = new Array(V);
    let used = new Array(V);
    d.fill(Number.MAX_VALUE);
    used.fill(false);

    d[stations.indexOf(start)] = 0;
    while(true) {
        let v = -1;
        for(let u = 0; u < V; u++) {
            if(!used[u] && (v == -1 || d[u] < d[v])) v = u;
        }
        if(v == -1) break;
        used[v] = true;
        for(let u = 0; u < V; u++) {
            let cost = Number.MAX_VALUE;
            for(let i = 0; i < E; i++) {
                if((stations.indexOf(graph[i].from) == u && stations.indexOf(graph[i].to) == v) ||
                (stations.indexOf(graph[i].from) == v && stations.indexOf(graph[i].to) == u)) {
                    cost = graph[i].cost;
                    break;
                }
            }
            d[u] = Math.min(d[u], d[v] + cost);
        }
    }

    return d[stations.indexOf(goal)];
}

alert(dijkstra("名古屋", "名城公園"));