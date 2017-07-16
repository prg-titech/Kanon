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
            Object.defineProperty(o, prop, {
                value: val,
                enumerable: false,
                writable: false
            });

            return val;
        }
    }

    Array.prototype.last = function() {
        return this[this.length - 1];
    };
})();