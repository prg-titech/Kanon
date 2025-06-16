/*
 * Dijkstra's algorithm
 * Find the shortest path between stations in the Nagoya area.
 * - Node objects: stations
 * - Eedge objects: the routes between stations with associated travel costs
 * - dijkstra function: Calculates the shortest path and distance from a starting station to a destination
 */

class Node {
  constructor(name) {
    this.name = name;
    this.edges = [];
  }

  addEdge(edge) {
    this.edges.push(edge);
  }
}

class WeightedEdge {
  constructor(from, to, cost) {
    this.from = from;
    this.to = to;
    this.cost = cost;
    from.addEdge(this);
    to.addEdge(this);
  }
}

// Nodes
const nagoya = new Node("Nagoya");
const internationalCenter = new Node("International Center");
const fushimi = new Node("Fushimi");
const marunouchi = new Node("Marunouchi");
const asamaTown = new Node("Asama Town");
const meijoPark = new Node("Meijo Park");
const cityHall = new Node("City Hall");
const hisayaOdori = new Node("Hisaya Odori");
const sakae = new Node("Sakae");

// Edges
new WeightedEdge(nagoya, internationalCenter, 2);
new WeightedEdge(nagoya, fushimi, 3);
new WeightedEdge(internationalCenter, marunouchi, 1);
new WeightedEdge(fushimi, marunouchi, 2);
new WeightedEdge(fushimi, sakae, 2);
new WeightedEdge(sakae, hisayaOdori, 1);
new WeightedEdge(marunouchi, hisayaOdori, 2);
new WeightedEdge(marunouchi, cityHall, 5);
new WeightedEdge(cityHall, hisayaOdori, 2);
new WeightedEdge(marunouchi, asamaTown, 2);
new WeightedEdge(asamaTown, meijoPark, 6);
new WeightedEdge(cityHall, meijoPark, 2);

// Helper function to find the toBeVisited node with the smallest distance
function getMinDistanceNode(toBeVisited, distances) {
  let minNode = null;
  toBeVisited.forEach(node => {
    if (minNode === null || distances[node.name] < (distances[minNode.name] || Infinity)) {
      minNode = node;
    }
  });
  return minNode;
}

// Helper function to update distances to the neighboring nodes
function updateNeighborDistances(currentNode, distances, previousNodes, toBeVisited) {
  currentNode.edges.forEach(edge => {
    const neighbor = edge.from === currentNode ? edge.to : edge.from;
    const newDistance = distances[currentNode.name] + edge.cost;

    if (distances[neighbor.name] === undefined || newDistance < distances[neighbor.name]) {
      distances[neighbor.name] = newDistance;
      previousNodes[neighbor.name] = currentNode;
      toBeVisited.add(neighbor);
    }
  });
}

// Dijkstra's algorithm to find the shortest path from start to goal
function dijkstra(start, goal) {
  const distances = {}; // Object to store the shortest distance from start to each node
  const previousNodes = {}; // Object to store the previous node in the shortest path
  const toBeVisited = new Set(); // Set to store toBeVisited nodes

  // Initialize distances and toBeVisited set
  distances[start.name] = 0;
  toBeVisited.add(start);

  let currentNode;

  while (toBeVisited.size > 0) {
    // Find the toBeVisited node with the smallest distance
    currentNode = getMinDistanceNode(toBeVisited, distances);

    // If the smallest distance node is the goal, we can stop
    if (currentNode === goal) break;

    // Remove the current node from the toBeVisited set
    toBeVisited.delete(currentNode);

    // Update distances to the neighboring nodes
    updateNeighborDistances(currentNode, distances, previousNodes, toBeVisited);
  }

  // Retrieve the shortest path
  const path = [];
  let node = goal;
  while (node) {
    path.unshift(node.name);
    node = previousNodes[node.name];
  }

  return {
    distance: distances[goal.name],
    path: path
  };
}

// Display the result
// const result = dijkstra(nagoya, meijoPark);
// alert(`Distance: ${result.distance}, Path: ${result.path.join(" -> ")}`);
