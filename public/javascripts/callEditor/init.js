$(document).ready(function(){


var pathname=document.location.pathname
var paths=pathname.split("/").splice(1)

  scriptName=[
    'saveEdits','loader',
  ]

  if(paths[1]=="targets"){
    scriptName=[
    ]
  }



  scriptTarget = $('script#actions')[0];
  for (s in scriptName){
    let url="/javascripts/callEditor/"+scriptName[s]+".js";
    let script = document.createElement('script');
    script.src = url;
    scriptTarget.parentNode.insertBefore(script, scriptTarget);
  }



});