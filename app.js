"use strict";

// C library API
const ffi = require("ffi-napi");

// Express App (Routes)
const express = require("express");
const app = express();
const path = require("path");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

let sharedLib = ffi.Library("./libvcparser.so", {
  createCard: ["int", ["string", "pointer"]],
  getFN: ["string", ["string"]],
  getPropLen: ["int", ["string"]],
  getPropNames: ["string", ["string"]],
  getPropValues: ["string", ["string"]],
  paramLen: ["string", ["string"]],
  validateCardII: ["int", ["string"]],
  getBDAY: ["string", ["string"]],
  getAnn: ["string", ["string"]],
  getParamValues: ["string", ["string"]],
  createNewCard: ["int", ["string", "string", "int"]],
  uploadCard: ["int", ["string", "string"]],
  addPropToCard: ["int", ["string", "string", "string", "string"]],
  changeDate: ["int", ["string", "string", "string"]],
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(express.static(path.join(__dirname + "/uploads")));

// Minimization
const fs = require("fs");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Important, pass in port as in `npm run dev 1234`, do not change
const portNum = process.argv[2];

// Send HTML at root, do not change
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

// Send Style, do not change
app.get("/style.css", function (req, res) {
  //Feel free to change the contents of style.css to prettify your Web app
  res.sendFile(path.join(__dirname + "/public/style.css"));
});

// Send obfuscated JS, do not change
app.get("/index.js", function (req, res) {
  fs.readFile(
    path.join(__dirname + "/public/index.js"),
    "utf8",
    function (err, contents) {
      const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {
        compact: true,
        controlFlowFlattening: true,
      });
      res.contentType("application/javascript");
      res.send(minimizedContents._obfuscatedCode);
    }
  );
});

//Respond to POST requests that upload files to uploads/ directory
app.post("/upload", function (req, res) {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  let uploadFile = req.files.uploadFile;

  // Use the mv() method to place the file somewhere on your server
  uploadFile.mv("uploads/" + uploadFile.name, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    res.redirect("/");
  });
});

//Respond to GET requests for files in the uploads/ directory
app.get("/uploads/:name", function (req, res) {
  fs.stat("uploads/" + req.params.name, function (err, stat) {
    if (err == null) {
      res.sendFile(path.join(__dirname + "/uploads/" + req.params.name));
    } else {
      console.log("Error in file downloading route: " + err);
      res.send("");
    }
  });
});

//******************** Your code goes here ********************

//functions
function checkExtension(file) {
  if (file.slice(file.length - 3, file.length) !== "vcf") {
    return false;
  }
  return true;
}

//Sample endpoint
app.get("/endpoint1", function (req, res) {
  let retStr = req.query.stuff + " " + req.query.junk;
  res.send({
    stuff: retStr,
  });
});

app.get("/getFiles", function (req, res) {
  const array = [];
  const names = [];
  const lengths = [];

  fs.readdir("uploads/", (err, files) => {
    files.forEach((file) => {
      if (
        checkExtension(file) &&
        sharedLib.validateCardII("uploads/" + file) === 0
      ) {
        array.push(file);
        names.push(sharedLib.getFN("uploads/" + file));
        lengths.push(sharedLib.getPropLen("uploads/" + file));
      }
    });
    res.send({
      filenames: array,
      names: names,
      sizes: lengths,
    });
  });
});

app.get("/properties", function (req, res) {
  const namesArray = [];
  const valArray = [];
  const lenArray = [];
  const paramArray = [];

  let filename = req.query.fname;
  JSON.parse(sharedLib.getPropNames("uploads/" + filename)).forEach((name) => {
    namesArray.push(name);
  });

  JSON.parse(sharedLib.getPropValues("uploads/" + filename)).forEach((val) => {
    valArray.push(val);
  });

  JSON.parse(sharedLib.paramLen("uploads/" + filename)).forEach((length) => {
    lenArray.push(length);
  });

  JSON.parse(sharedLib.getParamValues("uploads/" + filename)).forEach(
    (param) => {
      paramArray.push(param);
    }
  );

  res.send({
    names: namesArray,
    values: valArray,
    paramLengths: lenArray,
    param: paramArray,
    bday:
      sharedLib.getBDAY("uploads/" + filename).length > 0
        ? JSON.parse(sharedLib.getBDAY("uploads/" + filename))
        : "NULL",
    ann:
      sharedLib.getAnn("uploads/" + filename).length > 0
        ? JSON.parse(sharedLib.getAnn("uploads/" + filename))
        : "NULL",
  });
});

app.get("/changeValues", function (req, res) {
  let stat = sharedLib.createNewCard(
    "uploads/" + req.query.filename,
    req.query.value,
    req.query.index
  );

  res.send({
    act: stat,
  });
});

app.get("/exist", function (req, res) {
  let filename = req.query.name;

  fs.readdir("uploads/", (err, files) => {
    files.forEach((file) => {
      if (file === filename) {
        stat = 1;
        res.send({
          stat: stat,
        });
      }
    });
  });
});

app.get("/verify", function (req, res) {
  let filename = req.query.name;
  let stat = sharedLib.validateCardII("uploads/" + filename);

  res.send({
    stat: stat,
  });
});

app.post("/customCard", function (req, res) {
  let filename = req.body.filename;
  let value = req.body.value;

  let fn = { FN: value };
  sharedLib.uploadCard(JSON.stringify(fn), "uploads/" + filename);

  res.send({
    data: "hello",
  });
});

app.post("/addProp", function (req, res) {
  let filename = req.body.filename;
  let value = req.body.value;
  let group = req.body.group;
  let name = req.body.name;

  sharedLib.addPropToCard("uploads/" + filename, name, group, value);

  res.send("hello");
});

app.get("/changeDate", function (req, res) {
  let isText = req.query.istext;
  let date = req.query.date;
  let time = req.query.time;
  let text = req.query.text;
  let isUTC = req.query.utc;

  let filename = req.query.filename;
  let type = req.query.type;

  let dateString = {
    isText: isText === "true" ? true : false,
    date: date,
    time: time,
    text: text,
    isUTC: isUTC === "true" ? true : false,
  };
  // console.log(JSON.stringify(dateString));
  let stat = sharedLib.changeDate("uploads/" + filename, JSON.stringify(dateString), type);

  res.send({
    act: stat,
  });
});

app.post('/deleteFile', function(req, res){
  let filename = req.body.filename;
  fs.unlink('uploads/'+filename, function(err){
    if(err) throw err;
    console.log('File deleted!');
  })
  res.send('hey')
})

app.listen(portNum);
console.log("Running app at localhost: " + portNum);
