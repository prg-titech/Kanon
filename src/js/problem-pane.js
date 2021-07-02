var errors_list = "";
var num_errors = 0;

window.addEventListener('load', 
  function() { 
    if(num_errors){
      document.getElementById("problem-ball").style.display = "inline-block";
    }
    else{
      document.getElementById("problem-ball").style.display = "none";
    }
  
    document.getElementById("problems-all").innerHTML = errors_list;
    document.getElementById("problem-ball").innerHTML = num_errors;
  }, false);



uncaught.start();
uncaught.addListener(function (error) {
    errors_list +=
      "<div>" + error.message + "</div>";
    num_errors++;
    document.getElementById("problems-all").innerHTML = errors_list;
    document.getElementById("problem-ball").innerHTML = num_errors;
});


function openPanel() {
    document.getElementById("problem-panel").style.display = "block";
    document.getElementById("callTree").style.display = "none";
    document.getElementById("close-button").style.display = "block";
    document.getElementById("problems-all").style.display = "block";
  }
  
function closePanel() {
    document.getElementById("problem-panel").style.display = "none";
    document.getElementById("callTree").style.display = "block";
    document.getElementById("close-button").style.display = "none";
    document.getElementById("problems-all").style.display = "none";
  }