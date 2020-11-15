"use strict";

// C library API
const ffi = require("ffi-napi");

// Express App (Routes)
const express = require("express");
const app = express();
const path = require("path");
const fileUpload = require("express-fileupload");

let sharedLib = ffi.Library('./libvcparser.so', {
  'createCard' :["int",['string', 'pointer']],
  'getFN' :["string", ["string"]],
  'getPropLen' : ["int", ["string"]],
  'getPropNames' :["string", ["string"]],
  'getPropValues' :["string", ["string"]],
  'paramLen' :["string", ["string"]],
})


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
  fs.readFile(path.join(__dirname + "/public/index.js"), "utf8", function (
    err,
    contents
  ) {
    const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {
      compact: true,
      controlFlowFlattening: true,
    });
    res.contentType("application/javascript");
    res.send(minimizedContents._obfuscatedCode);
  });
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
      if (checkExtension(file)) {
        array.push(file);
        names.push(sharedLib.getFN("uploads/" + file));
        lengths.push(sharedLib.getPropLen("uploads/" + file));
      }
    });
    res.send({
      filenames: array,
      names : names,
      sizes : lengths,
    });
  });
});

app.get("/properties", function(req, res){
  const namesArray = [];
  const valArray = [];
  const lenArray = [];

  let filename = req.query.fname;
  JSON.parse(sharedLib.getPropNames("uploads/" + filename)).forEach((name)=>{
    namesArray.push(name);
  })

  JSON.parse(sharedLib.getPropValues("uploads/" + filename)).forEach((val)=>{
    valArray.push(val);
  })

  JSON.parse(sharedLib.paramLen("uploads/" + filename)).forEach((length)=>{
    lenArray.push(length);
  })
  console.log(lenArray);
  res.send({
    names : namesArray,
    values : valArray,
    paramLengths : lenArray
  })
})

app.listen(portNum);
console.log("Running app at localhost: " + portNum);
