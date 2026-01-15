const express = require("express");
const cors = require("cors");
const app = express();
const { v4: uuidv4 } = require("uuid");

const { spawn } = require("child_process");

// npm install uuid

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
  const jobID = uuidv4(); // Unique ID for this job
  res.status(202).json({ jobID });

  const converter = spawn("docker", [
    "run",
    "--rm",
    "-v",
    `${__dirname}/downloads:/app/downloads`, // maps output folder
    "yt-converter",
    "--url",
    link,
    "--outdir",
    "/app/downloads",
  ]);

  converter.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const msg = JSON.parse(line);
        console.log(`[${jobID}]`, msg);
        // Optionally: save msg to memory/Redis/db to let frontend poll it
      } catch (e) {
        console.error("Non-JSON output:", line);
      }
    }
  });

  converter.stderr.on("data", (data) => {
    console.error(`[${jobID}] ERROR:`, data.toString());
  });

  converter.on("close", (code) => {
    console.log(`[${jobID}] Docker exited with code ${code}`);
    // Mark job as done/failed depending on code
  });

  // IF the job is completed, send the confirmation to the front end to change reducer to completed
});

app.listen(8080);
