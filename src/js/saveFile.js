__$__.saveFile = function () {
	function download(filename, text) {
		const element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
	const content = __$__.editor.getValue();
	const fileExists = document.getElementById("readInput").value.replace(/^.*[\\\/]/, '');
	const filename = fileExists ? fileExists : "saveFile.js";
	download(filename, content);
};