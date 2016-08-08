$(document).ready(function(){
  var myTempID = "";
  $("#inBox").click(function(){
      $(this).val("");
  });
  $(".gitBtn").click(function(){
    if($("#myUser").text() == ""){
       post();
    }else{
      myTempID ="#mySpan" + $(this).attr('id');
      console.log($("#"+$(this).attr('id')).css("background-color"));
      if($("#"+ $(this).attr('id')).css("background-color") === "rgba(220, 0, 60, 0.4)") {
        $("#"+ $(this).attr('id')).css("background-color","rgba(0, 220, 60, 0.4)");
        $(myTempID).text( parseInt($(myTempID).text())+1);
        $.post("/aksamanereyegitsem/register", {
        mekanId:  $(this).attr('id'),
        flag:1
    });
      }
      else{
        $(myTempID).text( parseInt($(myTempID).text())-1);
        $("#"+ $(this).attr('id')).css("background-color","rgba(220, 0, 60, 0.4)");
        $.post("/aksamanereyegitsem/register", {
        mekanId:  $(this).attr('id'),
        flag:0
    });
      }
    }
    
  });

    
});

function post() {
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/aksamanereyegitsem/auth");
    document.body.appendChild(form);
    form.submit();
}