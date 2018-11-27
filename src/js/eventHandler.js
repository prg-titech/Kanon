jQuery(window).on('resize' ,function() {
    if (__$__.CallTreeNetwork.whileDrawing !== true) {
        __$__.ObjectGraphNetwork.network.redraw();
        __$__.CallTreeNetwork.redraw();
    }
});

document.getElementById('pullDownViewMode').onchange = function() {
    let selectedValue = document.getElementById('pullDownViewMode').value;
    __$__.Context.SwitchViewMode(selectedValue === 'Snapshot');
    __$__.Update.ContextUpdate('changed');
};

document.getElementById('autoLayout').onchange = function() {
    __$__.Layout.switchEnabled();
};

(() => {
    var isDragging = false;
    jQuery('div.split-pane')
        .mousedown(function () {
            isDragging = true;
        })
        .mousemove(function () {
            if (isDragging) {
                __$__.ObjectGraphNetwork.network.redraw();
                __$__.CallTreeNetwork.redraw();
            }
        })
        .mouseup(() => {
            isDragging = false;
        });
})();

__$__.Testize.popup_addTest = document.getElementById('tooltip_1');
jQuery('#tooltip_1')
    .click(function () {
        __$__.Testize.selectedCallInfo = {
            label: __$__.Testize.hoveringCallInfo.label
        };
        __$__.Testize.openWin(false);
        __$__.Testize.removeTooltip(this);
    })
    .mouseover(function () {
        __$__.Testize.popup_addTest.style.cursor = 'pointer';
    })
    .mouseout(function () {
        __$__.Testize.popup_addTest.style.cursor = 'default';
    });

__$__.Testize.popup_removeTest = document.getElementById('tooltip_2');
jQuery('#tooltip_remove')
    .click(function () {
        __$__.Testize.removeTest(__$__.Testize.hoveringCallInfo.label);
        __$__.Testize.removeTooltip(__$__.Testize.popup_removeTest);
    })
    .mouseover(function() {
        __$__.Testize.popup_removeTest.style.cursor = 'pointer';
    })
    .mouseout(function () {
        __$__.Testize.popup_removeTest.style.cursor = 'default';
    });

jQuery('#tooltip_modify')
    .click(function () {
        __$__.Testize.selectedCallInfo = {
            label: __$__.Testize.hoveringCallInfo.label
        };
        __$__.Testize.openWin(true);
        __$__.Testize.removeTooltip(__$__.Testize.popup_removeTest);
    })
    .mouseover(function() {
        __$__.Testize.popup_removeTest.style.cursor = 'pointer';
    })
    .mouseout(function () {
        __$__.Testize.popup_removeTest.style.cursor = 'default';
    });

jQuery("#node-label")
    .keyup(function(event) {
        if (event.keyCode === 13) {
            jQuery("#saveButtonForTestize").click();
        }
    });
