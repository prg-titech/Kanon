__$__.ShowContext = {
    on: true,
    infLoopMessage: 'Infinite Loop? ',
    editorSize: setTimeout(function timeout() {
        try {
            let elem = $('#editor');
            __$__.ShowContext.editorSize = {
                h: parseInt(elem.css('height').slice(0, -2)),
                w: parseInt(elem.css('width').slice(0, -2))
            };
        } catch (e) {
            setTimeout(timeout, 1);
        }
    }, 1),
    contextDictionary: {},

    /**
     * this function displays the context of the loop or the function.
     */
    show: function() {
        let checked_arr = [];
        let show_div = $('#show_context');
        let divs = show_div.children();

        for (let i = 0; i < divs.length; i++) {
            let id = divs[i].id;
            let elem = $('#' + id);

            if (!__$__.Context.LabelPos.Loop[id])
                elem.remove();
            else {
                let pos = __$__.ShowContext.position(id);

                elem.css('top', '' + pos.y + 'px');
                elem.css('left', '' + pos.x + 'px');

                if (__$__.ShowContext.on && __$__.ShowContext.inEditor(pos))
                    elem.css('display', 'block');
                else
                    elem.css('display', 'none');

                __$__.ShowContext.update(id);
                checked_arr.push(id);
            }
        }

        Object.keys(__$__.Context.LabelPos.Loop).forEach(id => {
            if (checked_arr.indexOf(id) >= 0)
                return;

            let pos = __$__.ShowContext.position(id);
            let content = __$__.Context.LoopContext[id];
            let display = (content !== undefined && __$__.ShowContext.on && __$__.ShowContext.inEditor(pos)) ? 'block' : 'none';

            // '<div id={id} style="display: {display}; top: {top}px; left: {left}px;">{content}</div>'
            let div = __$__.ShowContext.makeDivElement(id, display, pos.y, pos.x, content);
            show_div.append(div);
        });
    },


    /**
     * @params id {string} : div's id
     *
     * this function calculates where the context of the loop or the function should be displayed.
     */
    position: function(id) {
        let coord = __$__.editor.renderer.textToScreenCoordinates(
            __$__.Context.LabelPos.Loop[id].start.line-1,
            __$__.Context.LabelPos.Loop[id].start.column
        );
        return {x: coord.pageX - 5 + $(window).scrollLeft(), y: coord.pageY - 40 + $(window).scrollTop()};
    },


    /**
     * @param pos {Object} : this has x and y property.
     *
     * this function judges whether the argument that represents position is included in the editor.
     */
    inEditor: function(pos) {
        return 40 <= pos.x && pos.x <= __$__.ShowContext.editorSize.w
           && -30 <= pos.y && pos.y <= -20 + __$__.ShowContext.editorSize.h;
    },


    /**
     * @param label {string}
     *
     * This function updates the displayed context.
     * If the type of the argument is Array, the contexts of the all element of the Array are updated.
     */
    update: function(label) {
        if (label !== 'noLoop' && __$__.Context.InfLoop !== label) {
            document.getElementById(label).textContent = (__$__.ShowContext.contextDictionary[label]) ? __$__.ShowContext.contextDictionary[label][__$__.Context.LoopContext[label]] : __$__.Context.LoopContext[label];
        } else {
            document.getElementById(label).textContent = __$__.ShowContext.infLoopMessage + (__$__.ShowContext.contextDictionary[label]) ? __$__.ShowContext.contextDictionary[label][__$__.Context.LoopContext[label]] : __$__.Context.LoopContext[label];
        }
    },

    /**
     * @param id      {string}           : the id of returned div element
     * @param display {string}           : the returned div element is 
     * @param top     {number}           : determine the position of the returned div element
     * @param left    {number}           : determine the position of the returned div element
     * @param content {string or number} : the displayed content
     */
    makeDivElement(id, display, top, left, content) {
        if (__$__.Context.InfLoop !== id)
            return '<div id=' + id + ' style="display: ' + display + '; top: ' + top + 'px; left: ' + left + 'px;">' + content + '</div>';
        else
            return '<div id=' + id + ' style="display: ' + display + '; top: ' + top + 'px; left: ' + left + 'px;">' + __$__.ShowContext.infLoopMessage + content + '</div>';
    },

    switchOnOff() {
        if (__$__.ShowContext.on) {
            __$__.ShowContext.on = false;
            document.getElementById('showingContext').textContent = 'OFF';
        } else {
            __$__.ShowContext.on = true;
            document.getElementById('showingContext').textContent = 'ON';
        }
        __$__.ShowContext.show();
    },

    updateEditorSize() {
        let elem = $('#editor');
        __$__.ShowContext.editorSize = {
            h: parseInt(elem.css('height').slice(0, -2)),
            w: parseInt(elem.css('width').slice(0, -2))
        };
    },

    makeDictionary() {
        Object.keys(__$__.Context.ParentAndChildrenLoop).forEach(label => {
            let parentLabel = __$__.Context.ParentAndChildrenLoop[label].parent;
            __$__.ShowContext.contextDictionary[label] = {};
            if (label === 'noLoop' || parentLabel === 'noLoop') {
                if (__$__.Context.StartEndInLoop[label])
                    for (let i = 0; i < __$__.Context.StartEndInLoop[label].length; i++) {
                        __$__.ShowContext.contextDictionary[label][i+1] = i+1;
                    }
                return;
            }

            let count = 1;
            let idx = 0;
            if (__$__.Context.StartEndInLoop[label].length) {
                for (let i = 0; i < __$__.Context.StartEndInLoop[label].length; i++) {
                    let SE = __$__.Context.StartEndInLoop[label][i];
                    let parentIndex = __$__.Context.StartEndInLoop[parentLabel].map(parentSE => parentSE.start < SE.start && SE.end < parentSE.end).indexOf(true);
                    if (idx === parentIndex) {
                        __$__.ShowContext.contextDictionary[label][i+1] = count++;
                    } else {
                        count = 1;
                        __$__.ShowContext.contextDictionary[label][i+1] = count++;
                        idx = parentIndex;
                    }
                }
            }
        });
    }
};
