const Range = require("ace/range").Range;
const topRow = __$__.editor.selection.lead.row;



function readFile() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		document.getElementById('readFile').addEventListener('change', readSingleFile, false);
	} else {
		console.error("The File APIs are not fully supported in this browser.")
	}
}

function readSingleFile(evt) {
	//Retrieve the first (and only!) File from the FileList object
	const f = evt.target.files[0];

	if (f) {
		const r = new FileReader();
		r.onload = function(e) {
			const contents = e.target.result;
			alert( "Got the file.\n"
				+"name: " + f.name + "\n"
				+"type: " + f.type + "\n"
				+"size: " + f.size + " bytes\n"
			);
			__$__.editor.setValue(contents);
			__$__.editor.selection.clearSelection();
		};
		r.readAsText(f);

	} else {
		alert("Failed to load file");
	}
}


