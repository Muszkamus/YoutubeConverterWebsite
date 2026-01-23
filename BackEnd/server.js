const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");

import setJob from "../BackEnd/functions/setJob"

const app = express();
app.use(cors());
app.use(express.json());

const DOWNLOADS_DIR = path.resolve(__dirname, "downloads");
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });





// function setJob(jobID, patch) {
//   const prev = jobs.get(jobID) ?? {
//     status: "queued",
//     progress: 0,
//     message: "Queued",
//     downloadUrl: null,
//     error: null,
//     filePath: null,
//     createdAt: Date.now(),
//     updatedAt: Date.now(),
//   };

  const next = { ...prev, ...patch, updatedAt: Date.now() };
  jobs.set(jobID, next);
  return next;
}

// Polling endpoint
app.get("/api/jobs/:jobID", (req, res) => {
  const job = jobs.get(req.params.jobID);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json({ jobID: req.params.jobID, ...job });
});

// File download endpoint (simple, no auth)
app.get("/api/download/:jobID", (req, res) => {
  const job = jobs.get(req.params.jobID);
  if (!job || job.status !== "done" || !job.filePath) {
    return res.status(404).json({ error: "File not available" });
  }
  res.download(job.filePath);
});

app.post("/api/convert", (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: "Link is required" });

  const jobID = uuidv4();

  // Per-job output folder on host to avoid "newest mp3" bugs
  const jobDirHost = path.join(DOWNLOADS_DIR, jobID);
  fs.mkdirSync(jobDirHost, { recursive: true });

  setJob(jobID, { status: "running", message: "Starting", progress: 0 });
  res.status(202).json({ jobID });

  // Windows path -> docker mount safe form
  const dockerMountPath = DOWNLOADS_DIR.replace(/\\/g, "/");

  // Write into /app/downloads/<jobID> which maps to downloads/<jobID> on host
  const converter = spawn("docker", [
    "run",
    "--rm",
    "-v",
    `${dockerMountPath}:/app/downloads`,
    "yt-converter",
    "--url",
    link,
    "--outdir",
    `/app/downloads/${jobID}`,
  ]);

  function finalizeSuccessFromHostFolder() {
    const mp3s = fs
      .readdirSync(jobDirHost)
      .filter((f) => f.toLowerCase().endsWith(".mp3"));

    const filePath = mp3s.length ? path.join(jobDirHost, mp3s[0]) : null;

    setJob(jobID, {
      status: filePath ? "done" : "error",
      progress: 100,
      message: filePath ? "Completed" : "Completed but no mp3 found",
      filePath,
      downloadUrl: filePath ? `/api/download/${jobID}` : null,
      error: filePath ? null : "No mp3 produced",
    });
  }

  function handleLine(line, streamName) {
    if (!line) return;

    try {
      const msg = JSON.parse(line);
      console.log(`[${jobID}]`, msg);

      if (msg.event === "progress") {
        setJob(jobID, {
          status: "running",
          progress: typeof msg.pct === "number" ? msg.pct : 0,
          message: msg.message ?? "",
        });
      } else if (msg.event === "status") {
        setJob(jobID, { status: "running", message: msg.message ?? "" });
      } else if (msg.event === "done") {
        // Python says done; confirm file exists on host and set downloadUrl

        // Once it has been done, set a timer for the download link to be deleted within 2 minutes.

        // Also, try to gather the IP of the person to make only one request per 10 seconds
        finalizeSuccessFromHostFolder();
      } else if (msg.event === "error") {
        setJob(jobID, { status: "error", error: msg.message ?? "Failed" });
      }
    } catch {
      // Do not suppress non-JSON output; it contains the real ffmpeg/yt-dlp logs
      console.log(`[${jobID}] ${streamName}: ${line}`);
    }
  }

  const bufferStdout = { tail: "" };
  converter.stdout.on("data", (data) => {
    const text = bufferStdout.tail + data.toString();
    const lines = text.split("\n");
    bufferStdout.tail = lines.pop() ?? "";
    for (const line of lines) handleLine(line.trim(), "STDOUT");
  });

  const bufferStderr = { tail: "" };
  converter.stderr.on("data", (data) => {
    const text = bufferStderr.tail + data.toString();
    const lines = text.split("\n");
    bufferStderr.tail = lines.pop() ?? "";
    for (const line of lines) handleLine(line.trim(), "STDERR");
  });

  converter.on("close", (code) => {
    console.log(`[${jobID}] Docker exited with code ${code}`);

    const job = jobs.get(jobID);
    // If python already marked done/error, don’t override
    if (job?.status === "done" || job?.status === "error") return;

    if (code === 0) {
      // If we didn't get a JSON "done" event, still finalize from folder
      finalizeSuccessFromHostFolder();
    } else {
      setJob(jobID, {
        status: "error",
        error: `Docker exited with code ${code}`,
      });
    }
  });
});

app.listen(8080, () => {
  console.log("Backend listening on http://localhost:8080");
});
