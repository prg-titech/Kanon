__$__.editor = ace.edit("editor");
if (window.localStorage["Kanon-Code"] && window.localStorage["Kanon-Code"].indexOf('__$__') === -1)
    __$__.editor.setValue(window.localStorage["Kanon-Code"]);
else
    __$__.editor.setValue('');

__$__.editor.getSession().setMode('ace/mode/javascript');
__$__.editor.getSession().setUseWorker(false);

__$__.editor.task = {PositionUpdate: [], ContextUpdate: []};
__$__.editor.executeTask = () => {
    if (__$__.editor.task.PositionUpdate.length > 0) {
        let arg = [];
        while (__$__.editor.task.PositionUpdate.length > 0) {
            let act = __$__.editor.task.PositionUpdate.shift();
            let lst = arg.last();
            if (arg.length === 0 || arg.last().action !== act.action) {
                arg.push(act);
            } else {
                if (lst.start.column === act.end.column && lst.start.row === act.end.row) {
                    lst.start = act.start;
                    act.lines[act.lines.length-1] += lst.lines.shift();
                    Array.prototype.push.apply(act.lines, lst.lines);
                    lst.lines = act.lines;
                } else if (lst.end.column === act.start.column && lst.end.row === act.start.row) {
                    lst.end = act.end;
                    lst.lines[lst.lines.length-1] += act.lines.shift();
                    Array.prototype.push.apply(lst.lines, act.lines);
                }
            }
        }
        __$__.Update.PositionUpdate(arg);
    } else if (__$__.editor.task.ContextUpdate.length > 0) {
        __$__.editor.task.ContextUpdate = [];
        __$__.Update.ContextUpdate();
    }
};

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
    exec: function() {
        let isChanged = __$__.Context.MoveContextOnCursorPosition('next');
        if (isChanged)
            __$__.Context.Draw();
    }
});
__$__.editor.commands.addCommand({
    name: 'PreviousContext',
    bindKey: {win: 'Ctrl-Shift-,', mac: 'Command-Shift-,'},
    exec: function() {
        let isChanged = __$__.Context.MoveContextOnCursorPosition('prev');
        if (isChanged)
            __$__.Context.Draw();
    }
});

// showing context
__$__.editor.getSession().on('changeScrollLeft', __$__.ShowContext.show);
__$__.editor.getSession().on('changeScrollTop', __$__.ShowContext.show);
__$__.editor.getSession().on('changeFold', __$__.ShowContext.show);
