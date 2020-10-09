///<reference path="example.ts" />
///<reference path="setGraphLocation.ts" />

//import sgl = require('./app');
//sgl.setGraphLocation(grp);

////グラフの描画をするための変数
var canvas = <HTMLCanvasElement>document.getElementById("cv");
var context = canvas.getContext("2d");
context.font = "italic 50px Arial";

setGraphLocation(grp);
grp.draw(context);

console.log(grp);