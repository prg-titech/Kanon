# Kanon

__Kanon__ is a live programming environment.
If you write JavaScript code in left side editor,
data structures that are got by executing your code are rendered in right side as a graph.

## How to use

### How to build

__Kanon__ is using other some libraries to implement.
Then, when you use __Kanon__ in your local environment, 
execute the following command:
```
git clone --recursive https://github.com/prg-titech/Kanon.git
```
If finished, go to Kanon directory and open [index.html](https://github.com/prg-titech/Kanon/blob/master/index.html).

## NOTE

__Kanon__ use some other libraries.

- [vis.js](http://visjs.org) (https://github.com/almende/vis)

- [Ace Editor](https://ace.c9.io) (https://github.com/ajaxorg/ace)

- [esprima](http://esprima.org) (https://github.com/jquery/esprima/tree/3.1.1)

- escodegen (https://github.com/estools/escodegen)

I would like to use [esprima](http://esprima.org) and looked for esprima.js,
but I couldn't find it. So, I use [external/esprima.js](https://github.com/prg-titech/Kanon/blob/master/external/esprima.js)
which copied https://unpkg.com/esprima@3.1.1/dist/esprima.js

## Reference

- live-editor (https://github.com/Khan/live-editor)
