__$__.readFile = function () {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		document.getElementById('readFile').addEventListener('change', __$__.readSingleFile, false);
	} else {
		console.error("The File APIs are not fully supported in this browser.")
	}
};

__$__.readSingleFile = function (evt) {
	//Retrieve the first (and only!) File from the FileList object
	const f = evt.target.files[0];

	if (f) {
		const r = new FileReader();
		r.onload = function(e) {
			const contents = e.target.result;
			__$__.editor.setValue(contents);
			__$__.editor.selection.clearSelection();
		};
		r.readAsText(f);

	} else {
		alert("Failed to load file");
	}
};
