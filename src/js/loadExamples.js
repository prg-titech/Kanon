var kindvalue = 0;

__$__.createSelectBox = function (kind) {
  // The list of sample files on the server is kept in .json format.

  // If KIND is 0, then switch the select box options to BASIC EXAMPLES.
  // If KIND is 1, then switch the select box options to FIFA LAYOUT EXAMPLES.
  const path_basics = 'json/samples_basics.json'
  const path_FIFA = 'json/samples_for_FIFA_layout.json'

  function jsonToArray(data) {
    var arr = [];
    for (var i = 0; i < data.length; i++) {
      arr.push(data[i]);
    }
    return arr;
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
      op.value = arr[i];
      op.text = arr[i];
      parentElement.appendChild(op);
    }
  }

  function getJSONFrom(path, callback) {
    jQuery.getJSON(path, function (data) {
      callback(data);
    });
  }

  if (kind == 0) {
    kindvalue = 0;
    getJSONFrom(path_basics, function (data) {
      var arr = jsonToArray(data).reverse();
      makeNodes(arr);
    });
  } else if (kind == 1) {
    kindvalue = 1;
    getJSONFrom(path_FIFA, function (data) {
      var arr = jsonToArray(data).reverse();
      makeNodes(arr);
    });
  }
};

__$__.pasteExample = function () {
  let selectedElement = jQuery("#selectExample").val();
  if (selectedElement) {
    var path = 'samples/';
    if (kindvalue == 0) {
      path += 'basics/';
    } else if (kindvalue == 1) {
      path += 'for_FIFA_layout/';
    } 
    path += selectedElement + '.js';
    jQuery.get(path,
      function(data){
        __$__.editor.setValue(data);
        __$__.editor.selection.clearSelection();
      }
    )
  } else {
    alert("Select one the example categories.");
  }
}