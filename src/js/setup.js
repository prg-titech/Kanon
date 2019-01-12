(function() {
    if (typeof Object.id === "undefined") {
        let id = 0;

        Object.id = function(o) {
            if (typeof o.__uniqueid === "undefined") {
                Object.defineProperty(o, "__uniqueid", {
                    value: ++id,
                    enumerable: false,
                    writable: false
                });
            }

            return o.__uniqueid;
        };

        Object.setProperty = function(o, prop, val) {
            if (o[prop] === undefined) {
                Object.defineProperty(o, prop, {
                    value: val,
                    enumerable: false,
                    writable: false
                });

                return val;
            } else {
                return false;
            }
        }
    }

    Array.prototype.last = function() {
        return this[this.length - 1];
    };

    Array.prototype.reduceNative = Array.prototype.reduce;

    Array.prototype.indexOf = function(elem) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === elem)
                return i;
        }
        return -1;
    };

    Set.prototype.union = function(setB) {
        var union = new Set(this);
        for (var elem of setB) {
            union.add(elem);
        }
        return union;
    };

    Set.prototype.intersection = function(setB) {
        var intersection = new Set();
        for (var elem of setB) {
            if (this.has(elem)) {
                intersection.add(elem);
            }
        }
        return intersection;
    };

    Set.prototype.difference = function(setB) {
        var difference = new Set(this);
        for (var elem of setB) {
            difference.delete(elem);
        }
        return difference;
    };
})();

var __$__ = {
    mouse: {
        pageX: undefined,
        pageY: undefined
    },

    SummarizedViewColor: {
        AddNode: 'orange',
        AddEdge: 'orange',
        RemoveEdge: 'seagreen'
    },

    FontSizeUpdate: function() {
        let font = document.getElementById('fontSize').value;
        if (font === '')
            __$__.editor.setFontSize(12);
        else
            __$__.editor.setFontSize(parseInt(font));
    }
};

window.onload=function(){
    document.body.addEventListener("mousemove", function(e){
        __$__.mouse.pageX = e.pageX;
        __$__.mouse.pageY = e.pageY;
    });
};
