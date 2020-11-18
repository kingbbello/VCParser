// Put all onload AJAX calls here, and event listeners
$(document).ready(function () {
  $('[data-toggle="popover"]').popover({trigger: "hover"}); 
  
  $("#fileLog").click(function () {
    $("#first").slideToggle("slow");
  });

  $("#cardView").click(function () {
    $("#second").slideToggle("slow");
  });

  $("#upload_button").on("click", function (event) {
    event.preventDefault();
    let file = $("#upload_filename")[0].files[0];
    let data = new FormData();
    data.append("uploadFile", file);

    $.ajax({
      type: "post", //Request type
      url: "/upload", //The server endpoint we are connecting to
      data: data,
      contentType: false,
      processData: false,
      success: function(){
        let text = $('#upload_filename').val()
        console.log(text)
        alert(text + " has been uploaded")
      },
      failure: function(){
        alert("File failed to upload")
      }
    });
    // location.reload();
  });

  
  $.ajax({
    type: "get", 
    datatype: 'json',
    url: "/getFiles", 
    success: function (data) {
      let fileArray = data.filenames;
      let names = data.names;
      let lengths = data.sizes;

      if(fileArray.length === 0){
        let element = $('#filelogTable')[0];
        element.parentNode.removeChild(element);
        $('#filelogDiv').removeClass('my-custom-scrollbar');
        $('#filelogDiv').append("<h3 style= 'text-align: center'> No files </h3>")
      }

      if(fileArray.length > 5){
        $('.my-custom-scrollbar').css('height', '330px')
      }
    

      for(let i = 0; i < fileArray.length; i++){
        let tableRow = '<tr>'

        tableRow += '<td> <a href=' + fileArray[i] + ' download ">' + fileArray[i] + '</a></td>'
        tableRow += '<td>' + names[i] + '</td>'
        tableRow += '<td>' + lengths[i] + '</td>'

        tableRow += '</tr>'
        $('#tableBody1').append(tableRow)
        
        let menuitem = `<button class='dropdown-item menuitem'>` + fileArray[i] + "</button>"
        $('#dropdown').append(menuitem);
      }
      $('button.menuitem').click(function(){
        funct($(this)[0].innerHTML)
      })
    },
    fail: function (error) {
      console.log(error);
    },
  });

  // Event listener form example , we can use this instead explicitly listening for events
  // No redirects if possible
  $("#someform").submit(function (e) {
    $("#blah").html("Form has data: " + $("#entryBox").val());
    e.preventDefault();
    //Pass data to the Ajax call, so it gets passed to the server
    $.ajax({
      //Create an object for connecting to another waypoint
    });
  });



  //Functions get called here
  function funct(filename){
    
    $.ajax({
      type : 'get',
      datatype : 'json',
      url : '/properties', 
      data : {fname : filename},
      success : function(data){
        if($('#propBody').children().length > 0){
          $('#propBody').children().empty()
        }

        let propNames = data.names;
        let values = data.values;
        let paramLengths = data.paramLengths;
        let bday = data.bday;
        let ann = data.ann;

        let bdayRow = "";
        let annRow = "";
        
        if(bday !== "NULL"){
          let value = "";
          if(bday.isText){
            value += bday.text
          }else{
            if(bday.date.length > 0){
              value += '<div>Date: ' + bday.date + '</div>'
            }

            if(bday.time.length > 0){
              value += '</div>Time: ' + bday.time + ' '

              if(bday.isUTC){
                value += "(UTC)"
              }

              value += "</div>"
            }
          }

          bdayRow += "<tr>"

          bdayRow += '<td>' + (propNames.length+1) + '</td>'
          bdayRow += '<td> BDAY </td>'
          bdayRow += '<td>' + value + '</td>'
          bdayRow += '<td> 0 </td>'

          bdayRow += "<tr>"
        }

        if(ann !== "NULL"){
          let value = "";
          if(ann.isText){
            value += ann.text
          }else{
            if(ann.date.length > 0){
              value += '<div>Date: ' + ann.date + '</div>'
            }

            if(ann.time.length > 0){
              value += '<div>Time: ' + ann.time
              if(ann.isUTC){
                value += "(UTC)"
              }
              value += '</div>'
            }
          }
          let len = bdayRow.length > 0 ? 2 : 1;
          annRow += "<tr>"

          annRow += '<td>' + (propNames.length + len) + '</td>'
          annRow += '<td> ANN </td>'
          annRow += '<td>' + value + '</td>'
          annRow += '<td> 0 </td>'

          annRow += "<tr>"
        }

        console.log(ann)

        if(propNames.length < 10){
          $('.my-custom-scrollbar2').css('height', '150px')
        }else{
          $('.my-custom-scrollbar2').css('height', '620px')
          $('.my-custom-scrollbar2').css('overflow', 'auto')
          $('.my-custom-scrollbar2').css('overflow', 'scroll')
        }
        
        for(let i = 0; i < propNames.length; i++){
          let row = '<tr>'

          row += '<td>' + (i+1) + '</td>'
          row += '<td>' + propNames[i] + '</td>'
          row += '<td style="width: 100%; white-space:nowrap">' + values[i].filter((v)=>v.length>0) + '</td>'
          row += '<td data-toggle="popover" data-content = ' + '>' + paramLengths[i] + '</td>'

          row += '</tr>'
          $('#propBody').append(row)
        }
        if(bdayRow.length > 0){
          $('#propBody').append(bdayRow)
        }
        if(annRow.length > 0){
          $('#propBody').append(annRow)
        }
      }
    })
  }
});


