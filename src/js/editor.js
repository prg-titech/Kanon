__$__.langTools = ace.require('ace/ext/language_tools');
__$__.Range = ace.require('ace/range').Range;
__$__.editor = ace.edit("editor");
__$__.editor.setOption('enableBasicAutocompletion', true);
__$__.startAutocomplete = __$__.editor.keyBinding.$handlers[0].commands.startAutocomplete.exec;

try {
    let code = window.localStorage.getItem('Kanon-Code');
    if (code && code.indexOf('__$__') === -1)
        __$__.editor.setValue(code);
    else
        __$__.editor.setValue('');
} catch (e) {
    __$__.editor.setValue('');
}

__$__.editor.getSession().setMode('ace/mode/javascript');
// __$__.editor.getSession().setUseWorker(false);

__$__.editor.task = {PositionUpdate: [], ContextUpdate: []};
__$__.editor.executeTask = () => {
    if (__$__.editor.task.PositionUpdate.length > 0) {
        __$__.Update.onlyMoveCursor = false;
        let arg = [];
        while (__$__.editor.task.PositionUpdate.length > 0) {
            let act = __$__.editor.task.PositionUpdate.shift();
            if (act.lines && act.lines.length === 0)
                continue;
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
        __$__.Update.onlyMoveCursor = true;
        __$__.editor.task.ContextUpdate = [];
        __$__.Update.ContextUpdate();
    }
};

__$__.editor.on('change', (e) => {
    __$__.editor.task.PositionUpdate.push(e);
    setTimeout(__$__.editor.executeTask, 0);
});

// adding a tooltip
__$__.editor.on('mousemove', __$__.Testize.mousemove);

__$__.editor.getSelection().on('changeCursor', (e) => {
    __$__.editor.task.ContextUpdate.push(e);
    setTimeout(__$__.editor.executeTask, 0);
});

// shortcut command for changing context
__$__.editor.commands.addCommand({
    name: 'NextContext',
    bindKey: {win: 'Ctrl-Shift-.', mac: 'Command-Shift-.'},
    exec: function() {
        let isChanged = __$__.Context.MoveContextOnCursorPosition(1);
        if (isChanged) {
            __$__.Context.Draw();
            __$__.CallTreeNetwork.updateHighlightCircles();
            __$__.Testize.updateMarker();
        }
    }
});
__$__.editor.commands.addCommand({
    name: 'PreviousContext',
    bindKey: {win: 'Ctrl-Shift-,', mac: 'Command-Shift-,'},
    exec: function() {
        let isChanged = __$__.Context.MoveContextOnCursorPosition(-1);
        if (isChanged) {
            __$__.Context.Draw();
            __$__.CallTreeNetwork.updateHighlightCircles();
            __$__.Testize.updateMarker();
        }
    }
});

