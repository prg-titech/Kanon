__$__.beautify = ace.require("ace/ext/beautify");

__$__.beautifyEnable = function(){
    __$__.beautify.beautify(__$__.editor.getSession());
}