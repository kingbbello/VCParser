// Put all onload AJAX calls here, and event listeners
$(document).ready(function () {
  $.ajax({
    type: 'get',
    datatype: 'json',
    url: 'checklogin',
    success: function(status){
      if(status){
        enableAll(false);
        fileLogPanel();
      }else{
        console.log('here')
        enableAll(true);
      }
    }
  })

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

    if ($("#upload_filename")[0].value.length > 0) {
      let file = $("#upload_filename")[0].files[0];
      // console.log(file.name);
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
    } else {
      alert(
        "Please click the 'Browse' button to select the file you wish to upload"
      );
    }
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
          storeFileFunction();
          location.reload();
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

  $("#modal-submit").click(function () {
    if ($("#modal-username")[0].value === "") {
      alert("Please enter a username");
    } else if ($("#modal-password")[0].value === "") {
      alert("Please enter a password");
    } else if ($("#modal-database")[0].value === "") {
      alert("Please enter a database");
    } else {
      let username = $("#modal-username")[0].value;
      let password = $("#modal-password")[0].value;
      let database = $("#modal-database")[0].value;

      $.ajax({
        type: "get",
        datatype: "json",
        url: "/login",
        data: {
          user: username,
          pass: password,
          data: database,
        },
        success: function (stat) {
          if (stat === true) {
            alert("Successfully logged in as " + username);
            fileLogPanel();
            enableAll();
            $("#modal-submit")[0].disabled = true;
          } else {
            alert("Sorry, an error occurred");
          }
        },
      });
    }
  });
});

$("#clearData").click(function () {
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/clear",
    success: function (stat) {
      if (stat === true) {
        alert("Successfully cleared all data");
      } else {
        alert("Sorry, an error occurred");
      }
    },
  });
});

$("#displayDBStatusButton").click(function () {
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/displayDB",
    success: function (stat) {
      if (stat) {
        alert(stat);
      } else {
        alert("Sorry, an error occurred");
      }
    },
  });
});

$("#sortByIndividual").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute1",
    data: { sort: "individual" },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModalTableBody").length > 0) {
          $("#displayModalTableBody").children().empty();
        }
        $("#displayModalTableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByFile").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute1",
    data: { sort: "file" },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModalTableBody").length > 0) {
          $("#displayModalTableBody").children().empty();
        }
        $("#displayModalTableBody").append(`${data}`);
      }
    },
  });
});

$("#executeQuery2").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute2",
    data: { sort: "file" },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal2TableBody").length > 0) {
          $("#displayModal2TableBody").children().empty();
        }
        $("#displayModal2TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByIndividual3").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute3",
    data: { sort: "individual" },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal3TableBody").length > 0) {
          $("#displayModal3TableBody").children().empty();
        }
        $("#displayModal3TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByCount").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute5",
    data: { sort: "count", count: $("#frequency")[0].value },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal5TableBody").length > 0) {
          $("#displayModal5TableBody").children().empty();
        }
        $("#displayModal5TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByFile5").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute5",
    data: { sort: "file_Name", count: $("#frequency")[0].value },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal5TableBody").length > 0) {
          $("#displayModal5TableBody").children().empty();
        }
        $("#displayModal5TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByIndividual4").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute4",
    data: {
      sort: "name",
      start: $("#startDateTime")[0].value,
      end: $("#endDateTime")[0].value,
    },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal4TableBody").length > 0) {
          $("#displayModal4TableBody").children().empty();
        }
        $("#displayModal4TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByFile4").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute4",
    data: {
      sort: "file_Name",
      start: $("#startDateTime")[0].value,
      end: $("#endDateTime")[0].value,
    },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal4TableBody").length > 0) {
          $("#displayModal4TableBody").children().empty();
        }
        $("#displayModal4TableBody").append(`${data}`);
      }
    },
  });
});

$("#sortByCreation").click(function () {
  $("#executeClose").trigger("click");
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/execute4",
    data: {
      sort: "creation_Date",
      start: $("#startDateTime")[0].value,
      end: $("#endDateTime")[0].value,
    },
    success: function (data) {
      if (!data) {
        alert("Sorry! Something went wrong");
      } else {
        if ($("#displayModal4TableBody").length > 0) {
          $("#displayModal4TableBody").children().empty();
        }
        $("#displayModal4TableBody").append(`${data}`);
      }
    },
  });
});

$("#storeFiles").click(storeFileFunction);

function enableAll(state) {
  $("#createCustomCard")[0].disabled = state;
  $("#upload_button")[0].disabled = state;
  $("#upload_filename")[0].disabled = state;
  $("#executeQuery")[0].disabled = state;
  $("#displayDBStatusButton")[0].disabled = state;
  $("#clearData")[0].disabled = state;
}

function fileLogPanel() {
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

      if (fileArray.length > 0) {
        $("#storeFiles")[0].disabled = false;
      }

      if (fileArray.length > 5) {
        $(".my-custom-scrollbar").css("height", "330px");
      }

      for (let i = 0; i < fileArray.length; i++) {
        let tableRow = "<tr>";

        tableRow +=
          "<td> <a onclick=" +
          `"trackDownload('${fileArray[i]}')"` +
          "href=" +
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
}

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
            value += "<div>Date: " + parseDate(bday.date) + "</div>";
          }

          if (bday.time.length > 0) {
            value += "</div>Time: " + parseTime(bday.time) + " ";

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
            value += "<div>Date: " + parseDate(ann.date) + "</div>";
          }

          if (ann.time.length > 0) {
            value += "<div>Time: " + parseTime(ann.time);
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
        annRow +=
          '<td onwheel="changeAnn()" onclick="changeAnn2()">' + value + "</td>";
        annRow += "<td> 0 </td>";

        annRow += "<tr>";
      }

      if (propNames.length < 10) {
        $(".my-custom-scrollbar2").css("height", "690px");
        // $('.my-custom-scrollbar2').css('overflow', 'hidden')
      } else {
        $(".my-custom-scrollbar2").css("height", "690px");
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

        // console.log(values[i]);
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

function change(filename, index, size) {
  if (index === 0) {
    let value = prompt("Please enter a new FN value");

    if (value !== "" && value !== null) {
      $.ajax({
        type: "get",
        datatype: "json",
        url: "/changeFNValues",
        data: { filename: filename, value: value},
        success: function (data) {
          if (data.act === 0) {
            alert("Successfully changed Value");
            updateDB(filename);
            location.reload();
          } else {
            alert("Sorry! You've entered an invalid value");
          }
        },
      });
    }
  }

  if (size === 1 && index > 0) {
    let value = prompt("Please enter a new value");

    if (value !== "" && value !== null) {
      $.ajax({
        type: "get",
        datatype: "json",
        url: "/changeValues",
        data: { filename: filename, index: index - 1, value: value },
        success: function (data) {
          if (data.act === 0) {
            alert("Successfully changed Value");
            updateDB(filename);
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

  if (value !== "" && value !== null) {
    $.ajax({
      type: "get",
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
    "Please enter a value for the date\n *Note: to change to text,  scroll on the date value field"
  );

  let time = prompt("Please enter a value for the time");
  let utc = prompt(
    "Please type 'yes' for UTC \n All other inputs sets UTC to false"
  );
  let regExp = /[a-zA-Z]/g;
  let bool = regExp.test(date) || regExp.test(time) ? true : false;

  let UTC = utc === "yes" ? true : false;
  if (
    bool === false &&
    date !== "" &&
    time !== "" &&
    utc !== "" &&
    date !== null &&
    time !== null &&
    utc !== null
  ) {
    $.ajax({
      type: "get",
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
      success: function (data) {
        if (data.act === 0) {
          alert("You've successfully changed the date value");
          updateDB($("#viewPanelFileName")[0].innerHTML);
          location.reload();
        } else {
          alert("The value(s), you've entered is not valid. Please try again!");
        }
      },
    });
  } else {
    if (bool === false) {
      alert("Please fill all prompted fields");
    } else {
      alert("You've entered a letter in one of the fields. Please try again!");
    }
  }
}

function changeAnn() {
  let value = prompt(
    "Please enter the new bday text \n *Note: to change to non-text, click the date value field"
  );
  if (value !== null && value !== "") {
    $.ajax({
      type: "get",
      datatype: "json",
      url: "/changeDate",
      data: {
        filename: $("#viewPanelFileName")[0].innerHTML,
        type: "ann",
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

function changeAnn2() {
  let date = prompt(
    "Please enter a value for the date\n *Note: to change to text, scroll on the date value field"
  );
  let time = prompt("Please enter a value for the time");
  let utc = prompt(
    "Please type 'yes' for UTC \n All other inputs sets UTC to false"
  );

  let regExp = /[a-zA-Z]/g;
  let bool = regExp.test(date) || regExp.test(time) ? true : false;

  let UTC = utc === "yes" ? true : false;

  if (
    bool === false &&
    date !== "" &&
    time !== "" &&
    utc !== "" &&
    date !== null &&
    time !== null &&
    utc !== null
  ) {
    $.ajax({
      type: "get",
      datatype: "json",
      url: "/changeDate",
      data: {
        filename: $("#viewPanelFileName")[0].innerHTML,
        type: "ann",
        istext: false,
        date: date,
        time: time,
        text: "",
        utc: UTC,
      },
      success: function (data) {
        if (data.act === 0) {
          alert("You've successfully changed the date value");
          updateDB($("#viewPanelFileName")[0].innerHTML);
          location.reload();
        } else {
          alert("The value(s), you've entered is not valid. Please try again!");
        }
      },
    });
  } else {
    if (bool === false) {
      alert("Please fill all prompted fields");
    } else {
      alert("You've entered a letter in one of the fields. Please try again!");
    }
  }
}

function parseDate(date) {
  if (date.length === 8) {
    let day = date.slice(6, 8);
    let year = date.slice(0, 4);
    let month = getMonth(date.slice(4, 6));

    day = day[0] === "0" ? day[1] : day;
    return `${month} ${day}, ${year}`;
  }

  return date;
}

function parseTime(time) {
  // if (time[0] === "-") {
  //   if (time[1] === "-") {
  //     let min = time.slice(2, 4);

  //     return `00:00:${sec}`;
  //   } else {
  //     let min = time.slice(1, 3);
  //     let sec = time.slice(3, 5);

  //     return `00:${min}:${sec}`;
  //   }
  // }

  if (time.length == 6) {
    let hour = time.slice(0, 2);
    let min = time.slice(2, 4);
    let sec = time.slice(4, 6);

    return hour + ":" + min + ":" + sec;
  }

  if (time.length == 4) {
    let hour = time.slice(0, 2);
    let min = time.slice(2, 4);

    return hour + ":" + min;
  }

  return time;
}

function getMonth(month) {
  switch (month) {
    case "01":
      return "January";
    case "02":
      return "February";
    case "03":
      return "March";
    case "4":
      return "April";
    case "05":
      return "May";
    case "06":
      return "June";
    case "07":
      return "July";
    case "08":
      return "August";
    case "09":
      return "September";
    case "10":
      return "October";
    case "11":
      return "November";
    case "12":
      return "December";
    default:
      return " ";
  }
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
        updateDB($("#viewPanelFileName")[0].innerHTML);
        location.reload();
      },
    });
  } else {
    alert("Please enter a value for the property");
  }
});

function trackDownload(name) {
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/trackDownload",
    data: {
      filename: name,
    },
    success: function (status) {
      if (status) {
        alert("Download has been tracked!");
      } else {
        alert("Sorry, an error occured!");
      }
    },
  });
}

function storeFileFunction() {
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/storeFiles",
    success: function (status) {
      if (status) {
        alert("Files have been stored");
      } else {
        alert("Sorry, an error occured!");
      }
    },
  });
}

function updateDB(filename) {
  $.ajax({
    type: "get",
    datatype: "json",
    url: "/updateFiles",
    data: {
      filename: filename,
    },
    success: function (status) {
      if (status) {
        alert("Files have been updated");
      } else {
        alert("Sorry, an error occured!");
      }
    },
  });
}
