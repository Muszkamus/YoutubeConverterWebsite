// Get the information from reducer state and convert it into ffmpeg format

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// IMPORTANT: you forgot this
const jobs = new Map();

const DOWNLOADS_DIR = path.resolve(__dirname, "downloads");
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

function setJob(jobID, patch) {
  const prev = jobs.get(jobID) ?? {
    status: "queued",
    progress: 0,
    message: "Queued",
    downloadUrl: null,
    error: null,
    filePath: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const next = { ...prev, ...patch, updatedAt: Date.now() };
  jobs.set(jobID, next);
  return next;
}

// Basic allowlist to reduce abuse (adjust as needed)
function isAllowedYoutubeUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "music.youtube.com"
    );
  } catch {
    return false;
  }
}

// Polling endpoint
app.get("/api/jobs/:jobID", (req, res) => {
  const job = jobs.get(req.params.jobID);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json({ jobID: req.params.jobID, ...job });
});

// File download endpoint
app.get("/api/download/:jobID", (req, res) => {
  const job = jobs.get(req.params.jobID);
  if (!job || job.status !== "done" || !job.filePath) {
    return res.status(404).json({ error: "File not available" });
  }

  // Nice download name
  res.download(job.filePath, path.basename(job.filePath));
});

app.post("/api/convert", (req, res) => {
  const { link } = req.body;
  if (!link) return res.status(400).json({ error: "Link is required" });
  if (!isAllowedYoutubeUrl(link)) {
    return res.status(400).json({ error: "Only YouTube links are allowed" });
  }

  const jobID = uuidv4();

  const jobDirHost = path.join(DOWNLOADS_DIR, jobID);
  fs.mkdirSync(jobDirHost, { recursive: true });

  setJob(jobID, { status: "running", message: "Starting", progress: 0 });
  res.status(202).json({ jobID });

  // DO NOT try to hand-convert Windows paths. Give Docker the absolute path.
  // Docker Desktop understands normal Windows absolute paths.
  const mountArg = `${DOWNLOADS_DIR}:/app/downloads`;

  const converter = spawn(
    "docker",
    [
      "run",
      "--rm",
      "-v",
      mountArg,
      "yt-converter",
      "--url",
      link,
      "--outdir",
      `/app/downloads/${jobID}`,
    ],
    { windowsHide: true },
  );

  // Kill stuck jobs
  const JOB_TIMEOUT_MS = 10 * 60 * 1000; // 10 min
  const killTimer = setTimeout(() => {
    setJob(jobID, {
      status: "error",
      error: "Job timed out",
      message: "Timed out",
    });
    try {
      converter.kill("SIGKILL");
    } catch {}
  }, JOB_TIMEOUT_MS);

  function pickNewestMp3(folder) {
    const mp3s = fs
      .readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith(".mp3"))
      .map((f) => {
        const full = path.join(folder, f);
        const stat = fs.statSync(full);
        return { full, mtimeMs: stat.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    return mp3s.length ? mp3s[0].full : null;
  }

  function finalizeSuccessFromHostFolder() {
    const filePath = pickNewestMp3(jobDirHost);

    setJob(jobID, {
      status: filePath ? "done" : "error",
      progress: 100,
      message: filePath ? "Completed" : "Completed but no mp3 found",
      filePath,
      downloadUrl: filePath ? `/api/download/${jobID}` : null,
      error: filePath ? null : "No mp3 produced",
    });
  }

  // Only parse JSON from STDOUT (your Python emits JSON to stdout)
  function handleJsonLine(line) {
    if (!line) return;

    const msg = JSON.parse(line);

    if (msg.event === "progress") {
      setJob(jobID, {
        status: "running",
        progress: typeof msg.pct === "number" ? msg.pct : 0,
        message: msg.message ?? "",
      });
      return;
    }

    if (msg.event === "status") {
      setJob(jobID, { status: "running", message: msg.message ?? "" });
      return;
    }

    if (msg.event === "done") {
      finalizeSuccessFromHostFolder();
      return;
    }

    if (msg.event === "error") {
      setJob(jobID, {
        status: "error",
        error: msg.message ?? "Failed",
        message: msg.message ?? "Failed",
      });
      return;
    }
  }

  let stdoutTail = "";
  converter.stdout.on("data", (data) => {
    const text = stdoutTail + data.toString("utf8");
    const lines = text.split("\n");
    stdoutTail = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        handleJsonLine(trimmed);
      } catch {
        // If something prints non-JSON to stdout, keep it for debugging
        console.log(`[${jobID}] STDOUT: ${trimmed}`);
      }
    }
  });

  // Keep stderr as logs only; don't JSON-parse it
  converter.stderr.on("data", (data) => {
    const txt = data.toString("utf8").trim();
    if (txt) console.log(`[${jobID}] STDERR: ${txt}`);
  });

  converter.on("close", (code) => {
    clearTimeout(killTimer);
    console.log(`[${jobID}] Docker exited with code ${code}`);

    const job = jobs.get(jobID);
    if (job?.status === "done" || job?.status === "error") return;

    if (code === 0) finalizeSuccessFromHostFolder();
    else {
      setJob(jobID, {
        status: "error",
        error: `Docker exited with code ${code}`,
        message: "Conversion failed",
      });
    }
  });
});

app.listen(8080, () => {
  console.log("Backend listening on http://localhost:8080");
});
