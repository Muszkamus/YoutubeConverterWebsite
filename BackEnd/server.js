const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log("Connected");
  // res.sendStatus(400);
});

app.listen(8080);
