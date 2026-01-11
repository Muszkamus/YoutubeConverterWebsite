const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.use(express.json());

// Now your routes
app.get("/", (req, res) => {
  console.log("Connected");
});

app.post("/api/convert", (req, res) => {
  console.log(req);
  const { link } = req.body;
  console.log("Received link:", link);

  if (!link) {
    return res.status(400).json({ error: "Link is required" });
  }

  res.status(200).json({ jobID: "1234" });
});

app.listen(8080);
