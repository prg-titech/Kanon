__$__.ShowContext = {
    /**
     * this function displays the context of the loop or the function.
     */
    show: function() {
        let checked_arr = [];
        let divs = $('#show_context').children();

        for (var i = 0; i < divs.length; i++) {
            let div = divs[i];
            let id = div.id;

            if (Object.keys(__$__.Context.LoopLabelPosition).indexOf(id) === -1)
                $('#' + id).remove();
            else {
                let pos = __$__.ShowContext.position(id);

                $('#' + id).css('top', '' + pos.y + 'px');
                $('#' + id).css('left', '' + pos.x + 'px');

                if (__$__.ShowContext.inEditor(pos))
                    $('#' + id).css('display', 'block');
                else
                    $('#' + id).css('display', 'none');

                checked_arr.push(id);
            }
        }

        Object.keys(__$__.Context.LoopLabelPosition).forEach(id => {
            if (checked_arr.indexOf(id) >= 0)
                return;

            let pos = __$__.ShowContext.position(id);
            let display = (__$__.ShowContext.inEditor(pos)) ? 'block' : 'none'
            let content = __$__.Context.LoopContext[id];

            // '<div id={id} style="display: {display}; top: {top}px; left: {left}px;">{content}</div>'
            let div = this.makeDivElement(id, display, pos.y, pos.x, content);
            $('#show_context').append(div);
        });
    },


    /**
     * @params id {string} : div's id
     *
     * this function calculates where the context of the loop or the function should be displayed.
     */
    position: function(id) {
        let pos = {
            column: __$__.Context.LoopLabelPosition[id].start.column,
            row: __$__.Context.LoopLabelPosition[id].start.line-1
        }
        let coord = __$__.editor.renderer.textToScreenCoordinates(pos.row, pos.column);
        return {x: coord.pageX - 5 + $(window).scrollLeft(), y: coord.pageY - 40 + $(window).scrollTop()};
    },


    /**
     * @param pos {Object} : this has x and y property.
     *
     * this function judges whether the argument that represents position is included in the editor.
     */
    inEditor: function(pos) {
        let editor = {
            h: parseInt($('#editor').css('height').slice(0, -2)),
            w: parseInt($('#editor').css('width').slice(0, -2))
        }

        return 40 <= pos.x && pos.x <= 40 + editor.w && -30 <= pos.y && pos.y <= -20 + editor.h;
    },


    /**
     * @param label_s {string or Array of string}
     *
     * This function updates the displayed context.
     * If the type of the argument is Array, the contexts of the all element of the Array are updated.
     */
    update: function(label_s) {
        if (label_s.constructor === 'Array') {
            let labels = label_s;

            labels.forEach(label => {
                if (label !== 'noLoop')
                    document.getElementById(label).textContent = __$__.Context.LoopContext[label];
            })
        } else {
            let label = label_s;

            if (label !== 'noLoop')
                document.getElementById(label).textContent = __$__.Context.LoopContext[label];
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
        return '<div id=' + id + ' style="display: ' + display + '; top: ' + top + 'px; left: ' + left + 'px;">' + content + '</div>';
    }
};
