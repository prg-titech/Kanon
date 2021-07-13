var errors_list = "";
var annotations;

window.addEventListener('load', 
  function(e) { 
    setInterval(__$__.getErrors,100);
  }, false);


if(__$__.editor){
  __$__.editor.on('change', function(e){
    setInterval(__$__.getErrors,100);
  },false);
}


__$__.getErrors = function(e){
      annotations = __$__.editor.getSession().getAnnotations();
      document.getElementById("problem-ball").innerText = annotations.length;

      for(var i=0; i<annotations.length; i++){
        errors_list +=
          "<div>" + annotations[i].type.toUpperCase() + "<div style='color:#ff2424'>" + annotations[i].text + "</div>" + 
          `<button id=${`btn-${i}`} style='background-color:#FFFFFF; border:1px solid #000000;margin-top:4px'> Line No:` + 
          annotations[i].row + 1 + " Column No." + annotations[i].column +  "</button> <br></br>";
      }
    
      document.getElementById("all-errors").innerHTML = errors_list;   
      
      
      for(var i=0; i<annotations.length; i++){
        document.getElementById(`btn-${i}`).onclick = function(){__$__.editor.moveCursorToPosition(annotations[i].row, annotations[i].column)};
      }
      
      errors_list = "";
}

__$__.openPanel = function() {
    document.getElementById("problem-panel").style.display = "block";
    document.getElementById("callTree").style.display = "none";
    document.getElementById("close-button").style.display = "block";
    document.getElementById("all-errors").style.display = "block";
  }
  
__$__.closePanel = function() {
    
    document.getElementById("problem-panel").style.display = "none";
    document.getElementById("callTree").style.display = "block";
    document.getElementById("close-button").style.display = "none";
    document.getElementById("all-errors").style.display = "none";
  }