__$__.editor = ace.edit("editor");
if (window.localStorage["Kanon-Code"] && window.localStorage["Kanon-Code"].indexOf('__$__') === -1)
    __$__.editor.setValue(window.localStorage["Kanon-Code"]);
else
    __$__.editor.setValue('');

__$__.editor.getSession().setMode('ace/mode/javascript');
__$__.editor.getSession().setUseWorker(false);
__$__.editor.on('change', __$__.Update.PositionUpdate);
__$__.editor.getSelection().on('changeCursor', __$__.Update.ContextUpdate);


__$__.editor.commands.addCommand({
    name: 'NextContext',
    bindKey: {win: 'Ctrl-Shift-.', mac: 'Command-Shift-.'},
    exec: function(editor) {
        let isChanged = __$__.Context.MoveContextOnCursorPosition('next');
        if (isChanged)
            __$__.Context.Draw('redraw');
    }
});
__$__.editor.commands.addCommand({
    name: 'PreviousContext',
    bindKey: {win: 'Ctrl-Shift-,', mac: 'Command-Shift-,'},
    exec: function(editor) {
        let isChanged = __$__.Context.MoveContextOnCursorPosition('prev');
        if (isChanged)
            __$__.Context.Draw('redraw');
    }
});
