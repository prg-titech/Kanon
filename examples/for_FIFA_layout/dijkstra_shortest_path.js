class CostedEdge {
  constructor(from, to, cost) {
      this.from = from;
      this.to = to;
      this.cost = cost;
  }
}

// Number of vertices & edges in the graph
let V = 8, E = 12;

// List of station names
const stations = [
"Nagoya",
"International Center",
"Fushimi",
"Marunouchi",
"Asama Town",
"Meijo Park",
"City Hall",
"Hisaya Odori",
"Sakae"
];

// List of edges with their respective costs
const edges = [
  { from: stations[0], to: stations[1], cost: 2 },
  { from: stations[0], to: stations[2], cost: 3 },
  { from: stations[1], to: stations[3], cost: 1 },
  { from: stations[2], to: stations[3], cost: 2 },
  { from: stations[2], to: stations[8], cost: 2 },
  { from: stations[8], to: stations[7], cost: 1 },
  { from: stations[3], to: stations[7], cost: 2 },
  { from: stations[3], to: stations[6], cost: 5 },
  { from: stations[6], to: stations[7], cost: 2 },
  { from: stations[3], to: stations[4], cost: 2 },
  { from: stations[4], to: stations[5], cost: 6 },
  { from: stations[6], to: stations[5], cost: 2 }
];

// Create the graph by mapping the edge objects to CostedEdge instances
const graph = edges.map(edge => new CostedEdge(edge.from, edge.to, edge.cost));

// Dijkstra's algorithm to find the shortest path from start to goal
function dijkstra(start, goal) {
  const distances = new Array(V).fill(Number.MAX_VALUE); // Array to store the shortest distance from start to each vertex
  const used = new Array(V).fill(false); // Array to track visited vertices

  distances[stations.indexOf(start)] = 0; // Distance to the start vertex is 0

  while (true) {
      let v = -1; // Vertex to be processed next

      // Find the unvisited vertex with the smallest distance
      for (let u = 0; u < V; u++) {
          if (!used[u] && (v === -1 || distances[u] < distances[v])) {
              v = u;
          }
      }

      if (v === -1) break; // All vertices have been visited, exit the loop

      used[v] = true; // Mark the vertex as visited

      // Update the distances to the neighboring vertices
      for (let u = 0; u < V; u++) {
          let cost = Number.MAX_VALUE;

          // Find the cost of the edge between vertices u and v
          for (let i = 0; i < graph.length; i++) {
              if ((stations.indexOf(graph[i].from) === u && stations.indexOf(graph[i].to) === v) ||
                  (stations.indexOf(graph[i].from) === v && stations.indexOf(graph[i].to) === u)) {
                  cost = graph[i].cost;
                  break;
              }
          }

          // Update the distance to vertex u if a shorter path is found
          distances[u] = Math.min(distances[u], distances[v] + cost);
      }
  }

  return distances[stations.indexOf(goal)]; // Return the shortest distance to the goal
}

// alert(dijkstra("Nagoya", "Meijo Park")); // 9
