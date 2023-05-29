const express = require("express");
const multer = require("multer");
const app = express();
const upload = multer({ dest: "uploads/" }); // Destination folder for file uploads
const csv = require("csv-parser");
const fs = require("fs");
const prettier = require('prettier');


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.single("csvFile"), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).send("No file uploaded");
    return;
  }

  // process csv file
  const kpis_format = {
    "# prospects": 0,
    "# QLs": 0,
    "# meetings": 0,
    "# won": 0,
  };

  const kpis = {};
  const records = [];

  fs.createReadStream(file.path)
    .pipe(csv())
    .on("data", (row) => {
      records.push(row);
    })
    .on("end", () => {
      fs.unlinkSync(file.path);

      for (let row of records) {
        if (
          row["list"] !== "Partner/Referral Won 🥂" &&
          row["list"] !== "Partner & Referral Leads"
        ) {
          const date = row["QL Date"];
          if (date !== null && date !== "" && date !== undefined) {
            const month = date.substring(0, date.lastIndexOf("-"));
            if (month === "2022-07") {
              continue;
            }

            if (!kpis[month]) {
              kpis[month] = JSON.parse(JSON.stringify(kpis_format));
            }

            if (row["list"] === "UW/Website Prospects 🛎️") {
              kpis[month]["# prospects"]++;
            }
            if (row["QL"] === "true") {
              kpis[month]["# QLs"]++;
            }
            if (row["Won 🎉"] === "true") {
              kpis[month]["# won"]++;
            }
            if (row["Meeting"] === "true") {
              kpis[month]["# meetings"]++;
            }
          }
        }
      }
      const formattedKPIS = prettier.format(JSON.stringify(kpis), { parser: 'json' });

      // Send the formatted JSON response
      res.setHeader('Content-Type', 'application/json');
      res.send(formattedKPIS);
    });
});

const port = 3000; // Port number to listen on

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
