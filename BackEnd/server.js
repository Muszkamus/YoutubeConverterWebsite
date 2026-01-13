const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  console.log("Connected");
});

app.post("/api/convert", (req, res) => {
  const { link } = req.body;
  console.log("Received link:", link);

  if (!link) {
    return res.status(400).json({ error: "Link is required" });
  }

  // 1. Do all types of safefuarding to verify the link sent

  // 2. After that send the job ID to the front end to notify the user the process is running,

  res.status(200).json({ jobID: "1234567" });

  // 3. Run the ffmpeg processing using the link and python script.

  //
});

app.listen(8080);
