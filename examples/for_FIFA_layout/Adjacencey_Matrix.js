let inf = Number.MAX_VALUE;
let graph = [
    [0, 2, 5, inf, inf, inf, inf],
    [2, 0, 4, 6, 10, inf, inf],
    [5, 4, 0, 2, inf, inf, inf],
    [inf, 6, 2, 0, inf, 1, inf],
    [inf, 10, inf, inf, 0, 3, 5],
    [inf, inf, inf, 1, 3, 0, 9],
    [inf, inf, inf, inf, 5, 9, 0]
];