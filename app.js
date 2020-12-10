"use strict";

// C library API
const ffi = require("ffi-napi");

// Express App (Routes)
const express = require("express");
const app = express();
const path = require("path");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise");
let login = false;

let connection;

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
  changeFN: ["int", ["string", "string"]],
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

app.get("/changeFNValues", function (req, res) {
  let stat = sharedLib.changeFN(
    "uploads/" + req.query.filename,
    req.query.value
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
  let stat = sharedLib.changeDate(
    "uploads/" + filename,
    JSON.stringify(dateString),
    type
  );

  res.send({
    act: stat,
  });
});

app.post("/deleteFile", function (req, res) {
  let filename = req.body.filename;
  fs.unlink("uploads/" + filename, function (err) {
    if (err) throw err;
    console.log("File deleted!");
  });
  res.send("hey");
});

//***********************DATABASE PART ************************************** */
app.get("/login", async function (req, res) {
  let username = req.query.data;
  let password = req.query.pass;
  let database = req.query.data;
  login = true;

  // console.log(username + " " + password + " " + database);

  try {
    connection = await mysql.createConnection({
      host: "dursley.socs.uoguelph.ca",
      user: username,
      password: password,
      database: database,
    });

    let fileTable = `CREATE TABLE IF NOT EXISTS FILE (file_id INT AUTO_INCREMENT PRIMARY KEY, file_Name VARCHAR(60) NOT NULL, num_props INT NOT NULL, name VARCHAR(256) NOT NULL,birthday DATETIME,anniversary DATETIME,creation_time DATETIME NOT NULL);`;
    let downloadTable = `CREATE TABLE IF NOT EXISTS DOWNLOAD (download_id INT AUTO_INCREMENT PRIMARY KEY, d_descr VARCHAR(256), file_id INT NOT NULL, download_time DATETIME NOT NULL, FOREIGN KEY(file_id) REFERENCES FILE(file_id) ON DELETE CASCADE);`;

    await connection.execute(fileTable);
    await connection.execute(downloadTable);

    res.send(true);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get('/checklogin', function(req, res){
  res.send(login)
})

app.get("/storeFiles", async function (req, res) {
  try {
    let [rows] = await connection.execute("SELECT file_Name from FILE");

    let fileNameRow = [];
    for (let row of rows) {
      fileNameRow.push(row.file_Name);
    }

    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() <= 9 ? "0" : "") + (date.getMonth() + 1);
    let day = (date.getDate() <= 9 ? "0" : "") + date.getDate();
    let hour = (date.getHours() <= 9 ? "0" : "") + date.getHours();
    let min = (date.getMinutes() <= 9 ? "0" : "") + date.getMinutes();
    let secs = (date.getSeconds() <= 9 ? "0" : "") + date.getSeconds();
    let dateString = "" + year + month + day + hour + min + secs;

    const array = [];
    const names = [];
    const lengths = [];
    const bday = [];
    const ann = [];

    fs.readdir("uploads/", async (err, files) => {
      files.forEach(async (file) => {
        if (
          checkExtension(file) &&
          sharedLib.validateCardII("uploads/" + file) === 0
        ) {
          array.push(file);
          names.push(sharedLib.getFN("uploads/" + file));
          lengths.push(sharedLib.getPropLen("uploads/" + file));
          bday.push(sharedLib.getBDAY("uploads/" + file));
          ann.push(sharedLib.getAnn("uploads/" + file));
        }
      });

      for (let i = 0; i < array.length; i++) {
        let bdayText =
          bday[i].length === 0
            ? ""
            : `${JSON.parse(bday[i]).date}${JSON.parse(bday[i]).time}`;
        let annText =
          ann[i].length === 0
            ? ""
            : `${JSON.parse(ann[i]).date}${JSON.parse(ann[i]).time}`;

        bdayText = isNaN(Number(bdayText)) || bdayText.length === 0 ? "NULL" : Number(bdayText);
        console.log(`${array[i]} -> ${bdayText}`)
        annText = isNaN(Number(annText)) || annText.length === 0 ? "NULL" : Number(annText);
        if (!fileNameRow.includes(array[i])) {
          // console.log(`INSERT INTO FILE VALUES (NULL, '${array[i]}', ${lengths[i]}, ${names[i]}, ${bdayText}, ${annText}, ${Number(dateString)})`)

          await connection.execute(
            `INSERT INTO FILE VALUES ('NULL', '${array[i]}', ${lengths[i]}, '${
              names[i]
            }', ${bdayText}, ${annText}, ${Number(dateString)})`
          );
        }
      }

      res.send(true);
    });
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/updateFiles", async function (req, res) {
  try {
    let file = req.query.filename;

    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() <= 9 ? "0" : "") + (date.getMonth() + 1);
    let day = (date.getDate() <= 9 ? "0" : "") + date.getDate();
    let hour = (date.getHours() <= 9 ? "0" : "") + date.getHours();
    let min = (date.getMinutes() <= 9 ? "0" : "") + date.getMinutes();
    let secs = (date.getSeconds() <= 9 ? "0" : "") + date.getSeconds();
    let dateString = "" + year + month + day + hour + min + secs;

    let name = "";
    let length = "";
    let bday = "";
    let ann = "";

    if (
      checkExtension(file) &&
      sharedLib.validateCardII("uploads/" + file) === 0
    ) {
      name = sharedLib.getFN("uploads/" + file);
      length = sharedLib.getPropLen("uploads/" + file);
      bday = sharedLib.getBDAY("uploads/" + file);
      ann = sharedLib.getAnn("uploads/" + file);
    } else {
      res.send(false);
    }

    let bdayText =
      bday.length === 0
        ? ""
        : `${JSON.parse(bday).date}${JSON.parse(bday).time}`;
    let annText =
      ann.length === 0 ? "" : `${JSON.parse(ann).date}${JSON.parse(ann).time}`;

    bdayText = isNaN(Number(bdayText)) ? "NULL" : Number(bdayText);
    annText = isNaN(Number(annText)) ? "NULL" : Number(annText);

    // console.log(`INSERT INTO FILE VALUES (NULL, '${array[i]}', ${lengths[i]}, ${names[i]}, ${bdayText}, ${annText}, ${Number(dateString)})`)
    await connection.execute(`DELETE FROM FILE WHERE file_Name='${file}'`);

    await connection.execute(
      `INSERT INTO FILE VALUES ('NULL', '${file}', ${length}, '${name}', ${bdayText}, ${annText}, ${Number(
        dateString
      )})`
    );

    res.send(true);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/clear", async function (req, res) {
  try {
    await connection.execute("DELETE FROM DOWNLOAD");
    await connection.execute("DELETE FROM FILE");
    res.send(true);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/displayDB", async function (req, res) {
  try {
    let downloadCount = await connection.execute(
      "select COUNT(*) as count from DOWNLOAD;"
    );
    let fileCount = await connection.execute(
      "select COUNT(*) as count from FILE;"
    );

    res.send(
      `Database has ${fileCount[0][0].count} files and ${downloadCount[0][0].count} downloads`
    );
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/trackDownload", async function (req, res) {
  try {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() <= 9 ? "0" : "") + (date.getMonth() + 1);
    let day = (date.getDate() <= 9 ? "0" : "") + date.getDate();
    let hour = (date.getHours() <= 9 ? "0" : "") + date.getHours();
    let min = (date.getMinutes() <= 9 ? "0" : "") + date.getMinutes();
    let secs = (date.getSeconds() <= 9 ? "0" : "") + date.getSeconds();
    let dateString = "" + year + month + day + hour + min + secs;

    let filename = req.query.filename;
    let descr = fs.statSync('uploads/' + filename).size;
    let d_descr = descr.toString();
    d_descr = d_descr.slice(0,3)
    d_descr += ' bytes'

    let [row] = await connection.execute(
      `SELECT file_id  FROM FILE WHERE file_Name = '${filename}';`
    );

    if (row.length > 0) {
      let id = row[0].file_id;
      await connection.execute(
        `INSERT INTO DOWNLOAD VALUES('NULL', '${d_descr}', ${id}, ${Number(
          dateString
        )})`
      );
    } else {
      res.send(false);
    }

    res.send(true);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/execute1", async function (req, res) {
  try {
    let order = req.query.sort === "individual" ? "name" : "file_Name";

    let [rows] = await connection.execute(
      `SELECT file_Name, num_props, name, birthday, anniversary, creation_time from FILE ORDER BY ${order}`
    );
    let string = "";

    if (rows.length === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }

    for (let row of rows) {
      string += "<tr>";
      string += `<td>${row.file_Name}</td> `;
      string += `<td>${row.num_props}</td> `;
      string += `<td>${row.name}</td> `;
      string += `<td>${row.birthday}</td> `;
      string += `<td>${row.anniversary}</td> `;
      string += `<td>${row.creation_time}</td> `;
      string += "</tr>";
    }
    res.send(string);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/execute2", async function (req, res) {
  try {
    let [rows] = await connection.execute(
      `SELECT name, birthday from FILE ORDER BY birthday`
    );
    let string = "";

    if (rows.length === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }

    for (let row of rows) {
      string += "<tr>";
      string += `<td>${row.name}</td> `;
      string += `<td>${row.birthday}</td> `;
      string += "</tr>";
    }
    res.send(string);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/execute3", async function (req, res) {
  try {
    let order = req.query.sort === "individual" ? "name" : "anniversary";
    let string = "";
    let [rows] = await connection.execute(
      `SELECT name, anniversary from FILE WHERE anniversary IN (SELECT anniversary from FILE GROUP BY anniversary HAVING COUNT(*) > 1) ORDER BY ${order}`
    );

    if (rows.length === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }

    for (let row of rows) {
      string += "<tr>";
      string += `<td>${row.name}</td> `;
      string += `<td>${row.anniversary}</td> `;
      string += "</tr>";
    }

    res.send(string);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/execute5", async function (req, res) {
  try {
    let order = req.query.sort;
    let limit = isNaN(req.query.count) ? 0 : Number(req.query.count);
    if (limit === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }

    await connection.execute(`DROP TABLE IF EXISTS TEST`);
    await connection.execute(
      `CREATE TABLE TEST AS SELECT file_Name, name, d_descr, download_time FROM (DOWNLOAD INNER JOIN FILE ON DOWNLOAD.file_id=FILE.file_id)`
    );

    await connection.execute(`DROP TABLE IF EXISTS TEST2`);
    await connection.execute(
      `CREATE TABLE TEST2 AS SELECT file_Name, name, count(file_Name) as count, d_descr, MAX(download_time) as max FROM (SELECT * FROM TEST) AS SUB GROUP BY file_Name ORDER BY COUNT desc`
    );

    let [countArray] = await connection.execute(`SELECT DISTINCT count from TEST2`)
    let min = limit > countArray.length ? countArray[countArray.length - 1].count : countArray[limit - 1].count;

    let [rows] = await connection.execute(
      `SELECT * FROM TEST2 WHERE count >= ${min} ORDER BY ${order}`
    );
    
    let string = "";
    
    if (rows.length === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }

    for (let row of rows) {
      string += "<tr>";
      string += `<td>${row.file_Name}</td> `;
      string += `<td>${row.name}</td> `;
      string += `<td>${row.count}</td> `;
      string += `<td>${row.d_descr}</td> `;
      string += `<td>${row.max}</td> `;
      string += "</tr>";
    }
    res.send(string)

  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.get("/execute4", async function (req, res) {
  try {
    let order = req.query.sort;
    
    let [rows] = await connection.execute(
      `SELECT file_Name, num_props, name, birthday, anniversary, creation_time from FILE WHERE creation_time BETWEEN '${req.query.start}' AND '${req.query.end}' ORDER BY ${order}`
    );
    let string = "";

    if (rows.length === 0) {
      res.send("<tr><td>No query found</td></tr>");
      return;
    }
    for (let row of rows) {
      string += "<tr>";
      string += `<td>${row.file_Name}</td> `;
      string += `<td>${row.num_props}</td> `;
      string += `<td>${row.name}</td> `;
      string += `<td>${row.birthday}</td> `;
      string += `<td>${row.anniversary}</td> `;
      string += `<td>${row.creation_time}</td> `;
      string += "</tr>";
    }

    res.send(string);
  } catch (e) {
    console.log("Query error: " + e);
    res.send(false);
  }
});

app.listen(portNum);
console.log("Running app at localhost: " + portNum);
