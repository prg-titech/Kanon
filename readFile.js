function readFile() {
	if (window.File && window.FileReader && window.FileList && window.Blob) {

	} else {
		console.error("The File APIs are not fully supported in this browser.")
	}
}



