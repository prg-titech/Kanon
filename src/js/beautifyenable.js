__$__.beautify = ace.require("ace/ext/beautify");
__$__.js_beautify = require("js-beautify").js;

__$__.beautifyEnable = function(){
    // __$__.beautify.beautify(__$__.editor.getSession());
    __$__.val = editor.session.getValue();

    __$__.array = __$__.val.split(/\n/);
    __$__.array[0] = __$__.array[0].trim();
    __$__.val = __$__.array.join("\n"); 

    //Actual beautify (prettify) 
    __$__.val = __$__.js_beautify(__$__.val);
    __$__.editor.getSession().setValue(__$__.val);
}