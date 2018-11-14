__$__.Testize = {
    callParenthesisPos: {},
    focusingCallLabel: undefined,
    enable: false,


    initialize() {
        __$__.Testize.callParenthesisPos = {};
    },


    createWindow(width, height, title) {
        __$__.win = new Window({className: 'mac_os_x', width: width, height: height, zIndex: 100, title: title});
        __$__.win.getContent().update('<div id="window-for-manipulation"></div>');
        // document.getElementById('window-for-manipulation').style['background-color'] = 'blue';
        let windowSelection = __$__.d3.select('#window-for-manipulation');

        windowSelection.append('div')
            .attr('id', 'window-header')
            .append('text')
            .attr('id', 'acceptButton')
            .text('accept')
            .on('click', function (e) {
                // this function is invoked when this button is clicked.
                console.log(e, this);
            })
            .on('mouseover', function (e) {
                this.style.cursor = 'pointer';
            })
            .on('mouseout', function (e) {
                this.style.cursor = 'default';
            });

        windowSelection.append('div')
            .attr('id', 'window-body');
    },


    cursorIsInFunctionCall() {
        let compare = __$__.UpdateLabelPos.ComparePosition;
        let cPos = __$__.editor.getCursorPosition();
        cPos.line = cPos.row + 1;

        let infoOfMostNearCall = {label: undefined};
        Object.keys(__$__.Testize.callParenthesisPos).forEach(callLabel => {
            let pos = __$__.Testize.callParenthesisPos[callLabel];

            if (compare(pos.start, '<=', cPos) && compare(cPos, '<=', pos.end)) {
                if (!infoOfMostNearCall.label || compare(infoOfMostNearCall.pos.start, '<=', pos.start)) {
                    infoOfMostNearCall = {
                        label: callLabel,
                        pos: pos
                    };
                }
            }
        });

        return infoOfMostNearCall.label;
    },

    /**
     * @param e
     *
     * this function is callback when the mouse moves over the editor.
     */
    mousemove(e) {
        let position = e.getDocumentPosition();
        let cursorPos = {line: position.row + 1, column: position.column};
        let compare = __$__.UpdateLabelPos.ComparePosition;
        if (cursorPos) {
            let label = Object.keys(__$__.Testize.callParenthesisPos).reduceNative((accLabel, currentLabel) => {
                let callPos = __$__.Testize.callParenthesisPos[currentLabel];
                if (compare(callPos.start, '<=', cursorPos) && compare(cursorPos, '<=', callPos.end)) {
                    if (!currentLabel || compare(__$__.Testize.callParenthesisPos[currentLabel].start, '<=', callPos.start)) {
                        return currentLabel;
                    }
                }
                return accLabel;
            }, undefined);

            // if the popup is already displayed.
            if (__$__.Testize.focusingCallLabel) {
                // check whether Kanon should remove the popup
                let div = __$__.Testize.divPopup;
                let divRect = div.getBoundingClientRect();
                let pixelPosition = __$__.editor.renderer.textToScreenCoordinates({
                    row: __$__.Testize.callParenthesisPos[__$__.Testize.focusingCallLabel].start.line - 1,
                    column: __$__.Testize.callParenthesisPos[__$__.Testize.focusingCallLabel].start.column
                });
                let lineHeight = __$__.editor.renderer.lineHeight;

                // if Kanon should continue to display the same popup
                if (Math.abs((__$__.mouse.pageX - pixelPosition.pageX) * 2) <= divRect.width
                    && pixelPosition.pageY - divRect.height - lineHeight/2 <= __$__.mouse.pageY
                    && __$__.mouse.pageY <= pixelPosition.pageY + lineHeight) {
                } else { // if Kanon should display newly popup
                    if (label) {
                        __$__.Testize.updateTooltip(__$__.editor.renderer.textToScreenCoordinates({
                            row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                            column: __$__.Testize.callParenthesisPos[label].start.column
                        }), 'set test', label);
                    } else {
                        __$__.Testize.updateTooltip(__$__.editor.renderer.textToScreenCoordinates(position));
                    }
                }
            } else { // any popups aren't displayed
                // if Kanon should display newly popup
                if (label) {
                    __$__.Testize.updateTooltip(__$__.editor.renderer.textToScreenCoordinates({
                        row: __$__.Testize.callParenthesisPos[label].start.line - 1,
                        column: __$__.Testize.callParenthesisPos[label].start.column
                    }), 'set test', label);
                } else {
                    __$__.Testize.updateTooltip(__$__.editor.renderer.textToScreenCoordinates(position));
                }
            }
        }
    },


    openWin() {
        let split_pane_size = document.getElementById('split-pane-frame').getBoundingClientRect();
        if (!__$__.win) {
            __$__.Testize.createWindow(split_pane_size.width/2, split_pane_size.height/2, '');
        } else {
            __$__.win.setSize(split_pane_size.width / 2, split_pane_size.height / 2);
        }
        __$__.win.show();
    },


    /**
     * @param node
     *
     * If the function call which the node represents is written by the following style,
     * f ( a )
     *
     * the registered position is as follows.
     * start => {line: 1, column: 1}
     * end   => {line: 1, column: 7}
     */
    registerParenthesisPos(node) {
        try {
            if (node.label) {
                __$__.Testize.callParenthesisPos[node.label] = {
                    start: {
                        line: node.callee.loc.end.line,
                        column: node.callee.loc.end.column
                    },
                    end: {
                        line: node.loc.end.line,
                        column: node.loc.end.column
                    }
                };
            }
        } catch (e) {
            console.log(node, e);
        }
    },


    updateTooltip(position, text, callLabel) {
        let div = document.getElementById('tooltip_0');

        if (text) {
            div.style.left = position.pageX + 'px';
            div.style.top  = position.pageY + 'px';

            div.style.display = "block";
            div.innerText = text;
        } else {
            div.style.display = "none";
            div.innerText = "";
        }
        __$__.Testize.focusingCallLabel = callLabel;
    }
};