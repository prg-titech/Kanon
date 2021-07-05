var kindvalue = 0;

__$__.createSelectBoxTheme = function () {
  // The list of themes files on the server is kept in .json format.

  const path_themes = 'json/themes.json'

  function jsonToArray(data) {
    var arr = [];
    for (var i = 0; i < data.length; i++) {
      arr.push(data[i]);
    }
    return arr;
  }

  // Delete all old elements in the select box
  let parentElement = document.getElementById("selectTheme");
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

    getJSONFrom(path_themes, function (data) {
      var arr = jsonToArray(data).reverse();
      makeNodes(arr);
    });

};

__$__.pasteTheme = function () {
  let selectedElement = jQuery("#selectTheme").val();

  if (selectedElement) {
      __$__.editor.setTheme('ace/theme/'+selectedElement);
  } 
  else {
    alert("Select one of the theme.");
  }
}