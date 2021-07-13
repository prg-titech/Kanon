var errors_list = "";

window.addEventListener('load', 
  function() { 
    __$__.getErrors();
  }, false);


__$__.goToLine = function(row,column){
  __$__.editor.getSession().documentToScreenPosition(row,column);
}

if(__$__.editor){
  __$__.editor.on('change', function(e){
    __$__.getErrors(e);
  },false);
}

setInterval(__$__.getErrors,100);

__$__.getErrors = function(){

    var annotations = __$__.editor.getSession().getAnnotations();
    document.getElementById("problem-ball").innerHTML = annotations.length;
  
    for(var i=0; i<annotations.length; i++){
      errors_list +=
      "<div>" + annotations[i].type.toUpperCase() + "<div style='color:#ff2424'>" + annotations[i].text + "</div>" + "<button style='background-color:#FFFFFF; border:1px solid #000000;margin-top:4px'> Line No:" + annotations[i].row + " Column No." + annotations[i].column +  "</button> <br></br>";
    }
  
    document.getElementById("all-errors").innerHTML = errors_list;
    
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