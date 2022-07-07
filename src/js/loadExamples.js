window.addEventListener('DOMContentLoaded', function () {
  // Process to be evaluated when the page loads
  // If KIND == 0, then switch the options to ALL EXAMPLES.
  // If KIND == 1, then switch the options to BASIC EXAMPLES.
  // If KIND == 2, then switch the options to FIFA LAYOUT EXAMPLES.
  __$__.createSelectBox(0);
})

__$__.createSelectBox = function (kind) {
  // The list of example files on the server is kept in .json format.
  const path_all    = 'json/examples.json'
  const path_basics = 'json/examples_basics.json'
  const path_FIFA   = 'json/examples_for_FIFA_layout.json'

  function jsonToArray(data) {
    var arr = [];
    for (var i = 0; i < data.length; i++) {
      arr.push(data[i]);
    }
    return arr;
  }

  // Compare func, dictionary order
  function compareByFilename(obj_a, obj_b) {
    const fn_a = obj_a.filename.toLowerCase();
    const fn_b = obj_b.filename.toLowerCase();
    var bool = 0;
    if (fn_a > fn_b) { bool = 1; }
    else if (fn_a < fn_b) { bool = -1; }
    return bool;
  }

  // Generate a list of {filename,filepath} sorted by file name in dictionary order
  // json = [ "./examples/foo/bool.js", "./examples/bar/array.js" ]
  // sortedFileList = [ {"array.js", "./examples/bar/array.js"},
  //                    {"bool.js",  "./examples/foo/bool.js"} ]
  function jsonToFileList(json) {
    const mapArr = []
    const arr = jsonToArray(json);
    for (var i = 0; i < arr.length; i++) {
      const path = arr[i];
      const fn = path.split('/').pop();
      mapArr.push({filename:fn, filepath:path});
    }
    console.log(mapArr);
    const sorted = mapArr.sort(compareByFilename);
    console.log(sorted);
    return sorted;
  }

  // Delete all old elements in the select box
  let parentElement = document.getElementById("selectExample");
  while (parentElement.firstChild) {
    parentElement.removeChild(parentElement.firstChild);
  }

  // Insert new nodes to the select box
  function makeNodes(arr) {
    for (var i = 0; i < arr.length; i++) {
      let op = document.createElement("option");
      op.value = arr[i].filepath;
      op.text = arr[i].filename;
      parentElement.appendChild(op);
    }
  }

  function makeSelectBox(kind) {
    var path = path_all;
    if (kind == 0) { path = path_all; }
    if (kind == 1) { path = path_basics; }
    if (kind == 2) { path = path_FIFA; }

    jQuery.getJSON(path, function (data) {
      var arr = jsonToFileList(data);
      makeNodes(arr);
    });
  }

  makeSelectBox(kind);
};

// Paste the file contents of the selected element into the editor.
__$__.pasteExample = function () {
  let path = jQuery("#selectExample").val();
  if (path) {
    jQuery.get(path,
      function (data) {
        __$__.editor.setValue(data);
        __$__.editor.selection.clearSelection();
      },
      "text"
    );
  } else {
    alert("Select one the example categories.");
  }
}