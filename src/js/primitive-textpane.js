__$__.editor.on('click', (e) => {
	const keyword = retrieveKeyWord(e);
	defineType(keyword);
	console.log(keyword);
});


/***
 * Returns an object with keyword selected and information about its location in the editor.
 * @param e event
 */
function retrieveKeyWord(e) {
	const pos = e.getDocumentPosition();
	const wordRange = __$__.editor.getSelection().getWordRange(pos);
	__$__.editor.getSelection().setSelectionRange(wordRange, false);
	const str = __$__.editor.getCopyText();
	__$__.editor.clearSelection();
	__$__.editor.moveCursorToPosition(pos);

	try{
		return {
			val: eval(str),
			location: wordRange,
		};
	} catch(e){
		return {
			val: str,
			location: wordRange,
		};
	}


}

function defineType(keyword){
	keyword.type = typeof keyword.val;
}
