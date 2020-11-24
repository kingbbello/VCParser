// Put all onload AJAX calls here, and event listeners
$(document).ready(function () {
  $("#fileLog").click(function () {
    $("#first").slideToggle("slow");
  });

  $("#cardView").click(function () {
    $("#second").slideToggle("slow");
  });

  $("#createCard").click(function () {
    $("#createCardForm").slideToggle("slow");
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
      success: function () {
        $.ajax({
          type: "get",
          url: "/verify",
          datatype: "json",
          data: { name: file.name },
          success: function (data) {
            set = data.stat;
            if (set === 0) {
              alert(file.name + " has been uploaded");
              location.reload();
            } else {
              alert("The file you uploaded is not a valid vCard");
              $.ajax({
                type: "post",
                url: "/deleteFile",
                datatype: "json",
                data: { filename: file.name },
              });
            }
          },
        });
      },
      failure: function () {
        alert("File failed to upload");
      },
    });
  });

  $.ajax({
    type: "get",
    datatype: "json",
    url: "/getFiles",
    success: function (data) {
      let fileArray = data.filenames;
      let names = data.names;
      let lengths = data.sizes;

      if (fileArray.length === 0) {
        let element = $("#filelogTable")[0];
        element.parentNode.removeChild(element);
        $("#filelogDiv").removeClass("my-custom-scrollbar");
        $("#filelogDiv").append(
          "<h3 style= 'text-align: center'> No files </h3>"
        );
      }

      if (fileArray.length > 5) {
        $(".my-custom-scrollbar").css("height", "330px");
      }

      for (let i = 0; i < fileArray.length; i++) {
        let tableRow = "<tr>";

        tableRow +=
          "<td> <a href=" +
          fileArray[i] +
          ' download ">' +
          fileArray[i] +
          "</a></td>";
        tableRow += "<td>" + names[i] + "</td>";
        tableRow += "<td>" + lengths[i] + "</td>";

        tableRow += "</tr>";
        $("#tableBody1").append(tableRow);

        let menuitem =
          `<button class='dropdown-item menuitem'>` +
          fileArray[i] +
          "</button>";
        $("#dropdown").append(menuitem);
      }
      $("button.menuitem").click(function () {
        funct($(this)[0].innerHTML);
      });
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

  $("#createCustomCard").click(function (event) {
    event.preventDefault();
    if (
      $("#validationFileName")[0].value.length > 0 &&
      $("#fnValue")[0].value.length > 0
    ) {
      $.ajax({
        type: "post",
        datatype: "json",
        url: "/customCard",
        data: {
          filename: $("#validationFileName")[0].value + ".vcf",
          value: $("#fnValue")[0].value,
        },
        success: function () {
          alert("File has been successfully uploaded");
        },
        fail: function () {
          alert("An error occurred");
        },
      });
    } else {
      alert("Please fill the filename and fullname fields");
    }
  });

  //Functions get called here
  function funct(filename) {
    $("#viewPanelFileName")[0].innerHTML = filename;
    $("#propGroup")[0].disabled = false;
    $("#propValue")[0].disabled = false;
    $("#propSubmit")[0].disabled = false;
    $("#addPropertySelect")[0].disabled = false;

    let names = [
      "SOURCE",
      "KIND",
      "XML",
      "N",
      "NICKNAME",
      "PHOTO",
      "GENDER",
      "ADR",
      "TEL",
      "EMAIL",
      "IMPP",
      "LANG",
      "TZ",
      "GEO",
      "TITLE",
      "ROLE",
      "LOGO",
      "ORG",
      "MEMBER",
      "RELATED",
      "CATEGORIES",
      "NOTE",
      "PRODID",
      "REV",
      "SOUND",
      "UID",
      "CLIENTPIDMAP",
      "URL",
      "KEY",
      "FBURL",
      "CALADRURI",
      "CALURI",
    ];

    names.forEach(function (name) {
      let option = "<option>";
      option += name;
      option += "</option>";
      $("#addPropertySelect").append(option);
    });

    $.ajax({
      type: "get",
      datatype: "json",
      url: "/properties",
      data: { fname: filename },
      success: function (data) {
        if ($("#propBody").children().length > 0) {
          $("#propBody").children().empty();
        }

        let propNames = data.names;
        let values = data.values;
        let paramLengths = data.paramLengths;
        let bday = data.bday;
        let ann = data.ann;
        let param = data.param;

        let bdayRow = "";
        let annRow = "";

        if (bday !== "NULL") {
          let value = "";
          if (bday.isText) {
            value += bday.text;
          } else {
            if (bday.date.length > 0) {
              value += "<div>Date: " + bday.date + "</div>";
            }

            if (bday.time.length > 0) {
              value += "</div>Time: " + bday.time + " ";

              if (bday.isUTC) {
                value += "(UTC)";
              }

              value += "</div>";
            }
          }

          bdayRow += "<tr>";

          bdayRow += "<td>" + (propNames.length + 1) + "</td>";
          bdayRow += "<td> BDAY </td>";
          bdayRow +=
            '<td onwheel="changeBday()" onclick="changeBday2()">' +
            value +
            "</td>";
          bdayRow += "<td> 0 </td>";

          bdayRow += "<tr>";
        }

        if (ann !== "NULL") {
          let value = "";
          if (ann.isText) {
            value += ann.text;
          } else {
            if (ann.date.length > 0) {
              value += "<div>Date: " + ann.date + "</div>";
            }

            if (ann.time.length > 0) {
              value += "<div>Time: " + ann.time;
              if (ann.isUTC) {
                value += "(UTC)";
              }
              value += "</div>";
            }
          }
          let len = bdayRow.length > 0 ? 2 : 1;
          annRow += "<tr>";

          annRow += "<td>" + (propNames.length + len) + "</td>";
          annRow += "<td> ANN </td>";
          annRow += "<td>" + value + "</td>";
          annRow += "<td> 0 </td>";

          annRow += "<tr>";
        }

        if (propNames.length < 10) {
          $(".my-custom-scrollbar2").css("height", "600px");
          // $('.my-custom-scrollbar2').css('overflow', 'hidden')
        } else {
          $(".my-custom-scrollbar2").css("height", "620px");
          $(".my-custom-scrollbar2").css("overflow", "auto");
          $(".my-custom-scrollbar2").css("overflow", "scroll");
        }

        for (let i = 0; i < propNames.length; i++) {
          let row = "<tr>";

          let paramString = "";
          param[i].forEach((param) => {
            paramString += "{" + param + "} ";
          });

          let map = values[i].map((val) => " " + val);

          console.log(values[i]);
          row += "<td>" + (i + 1) + "</td>";
          row += "<td>" + propNames[i] + "</td>";
          row +=
            '<td style="width: 100%; white-space:nowrap" onclick=' +
            `"change('${filename}', ${i}, ${values[i].length})"` +
            ">" +
            map.filter((v) => v.length > 1) +
            "</td>";
          row +=
            '<td id="popover4" data-content="' +
            paramString +
            '" data-toggle="popover">' +
            paramLengths[i] +
            "</td>";

          row += "</tr>";
          $("#propBody").append(row);
        }
        if (bdayRow.length > 0) {
          $("#propBody").append(bdayRow);
        }
        if (annRow.length > 0) {
          $("#propBody").append(annRow);
        }
        $('[data-toggle="popover"]').popover({ trigger: "hover" });
      },
    });
  }
});

function change(filename, index, size) {
  if (size === 1 && index > 0) {
    let value = prompt("Please enter a new value");

    if (value !== null) {
      $.ajax({
        type: "get",
        datatype: "json",
        url: "/changeValues",
        data: { filename: filename, index: index - 1, value: value },
        success: function (data) {
          if (data.act === 0) {
            alert("Successfully changed Value");
            location.reload();
          } else {
            alert("Sorry! You've entered an invalid value");
          }
        },
      });
    }
  }
}

function changeBday() {
  let value = prompt(
    "Please enter the new bday text \n *Note: to change to non-text, click the date value field"
  );
  if (value !== null) {
    $.ajax({
      type: "post",
      datatype: "json",
      url: "/changeDate",
      data: {
        filename: $("#viewPanelFileName")[0].innerHTML,
        type: "bday",
        istext: true,
        date: "",
        time: "",
        text: value,
        utc: false,
      },
      success: function () {
        alert("done");
        location.reload();
      },
    });
  }
}

function changeBday2() {
  let date = prompt(
    "Please enter a value for the date\n *Note: to change to text, double click the date value field"
  );

  let time = prompt("Please enter a value for the time");
  let utc = prompt(
    "Please type 'yes' for UTC \n All other inputs sets UTC to false"
  );

  let UTC = utc === "yes" ? true : false;
  if (date !== null && time !== null && utc !== null) {
    $.ajax({
      type: "post",
      datatype: "json",
      url: "/changeDate",
      data: {
        filename: $("#viewPanelFileName")[0].innerHTML,
        type: "bday",
        istext: false,
        date: date,
        time: time,
        text: "",
        utc: UTC,
      },
      success: function () {
        alert("done");
        location.reload();
      },
    });
  } else {
    alert("Please fill all prompted fields");
  }
  return false;
}

$("#propSubmit").click(function () {
  let propName = $("#addPropertySelect")[0].selectedOptions[0].innerHTML;
  let propValue = $("#propValue")[0].value;
  let groupName = $("#propGroup")[0].value;

  if (propValue.length > 0) {
    $.ajax({
      type: "post",
      datatype: "json",
      url: "/addProp",
      data: {
        filename: $("#viewPanelFileName")[0].innerHTML,
        value: propValue,
        group: groupName,
        name: propName,
      },
      success: function () {
        alert("Property has been added");
        location.reload();
      },
    });
  } else {
    alert("Please enter a value for the property");
  }
});
