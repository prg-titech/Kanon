__$__.editor = ace.edit("editor");
if (window.localStorage["Kanon-Code"] && window.localStorage["Kanon-Code"].indexOf('__$__') === -1)
    __$__.editor.setValue(window.localStorage["Kanon-Code"]);
else
    __$__.editor.setValue('');

__$__.editor.getSession().setMode('ace/mode/javascript');
__$__.editor.getSession().setUseWorker(false);

__$__.editor.task = {PositionUpdate: [], ContextUpdate: []}
__$__.editor.executeTask = () => {
    if (__$__.editor.task.PositionUpdate.length > 0) {
        let arg;
        while (__$__.editor.task.PositionUpdate.length > 0) {
            a = __$__.editor.task.PositionUpdate.shift();
            if (arg === undefined) {
                arg = a
            } else {
                if (arg.start.column === a.end.column && arg.start.row === a.end.row) {
                    arg.start = a.start;
                    a.lines[a.lines.length-1] += arg.lines.shift();
                    Array.prototype.push.apply(a.lines, arg.lines)
                    arg.lines = a.lines;
                } else if (arg.end.column === a.start.column && arg.end.row === a.start.row) {
                    arg.end = a.end;
                    arg.lines[arg.lines.length-1] += a.lines.shift();
                    Array.prototype.push.apply(arg.lines, a.lines);
                }
            }
        }
        __$__.Update.PositionUpdate(arg);
    } else if (__$__.editor.task.ContextUpdate.length > 0) {
        __$__.editor.task.ContextUpdate = [];
        __$__.Update.ContextUpdate();
    }
}

__$__.editor.on('change', (e) => {
    __$__.editor.task.PositionUpdate.push(e);
    setTimeout(__$__.editor.executeTask, 0);
});
__$__.editor.getSelection().on('changeCursor', (e) => {
    __$__.editor.task.ContextUpdate.push(e);
    setTimeout(__$__.editor.executeTask, 0);
});

// shortcut command for changing context
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

// showing context
__$__.editor.session.on('changeScrollLeft', __$__.ShowContext.show);
__$__.editor.session.on('changeScrollTop', __$__.ShowContext.show);
