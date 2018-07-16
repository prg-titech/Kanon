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

    Array.prototype.indexOf = function(elem) {
        for (let i = 0; i < this.length; i++) {
            if (this[i] === elem)
                return i;
        }
        return -1;
    };
})();

var __$__ = {
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
