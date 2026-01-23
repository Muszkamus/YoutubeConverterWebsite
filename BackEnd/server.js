// Get the information from reducer state and convert it into ffmpeg format

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { spawn } = require("child_process");

const MP3_QUALITIES = new Set(["64", "96", "128", "160", "192", "256", "320"]);

const WAV_PRESETS = new Set([
  "16-bit/44.1kHz",
  "16-bit/48kHz",
  "24-bit/48kHz",
  "24-bit/96kHz",
  "24-bit/192kHz",
]);

const MP4_RES = new Set(["360p", "480p", "720p", "1080p", "1440p", "2160p"]);

const app = express();
app.use(cors());
app.use(express.json());

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
  const {
    link,
    codec: codecRaw,
    format: formatRaw,
    quality = "192",
  } = req.body;

  const codec = codecRaw ?? formatRaw ?? "mp3";

  if (!link) return res.status(400).json({ error: "Link is required" });
  if (!isAllowedYoutubeUrl(link)) {
    return res.status(400).json({ error: "Only YouTube links are allowed" });
  }

  let dockerArgsExtra = [];

  if (codec === "mp3") {
    if (!MP3_QUALITIES.has(quality)) {
      return res.status(400).json({ error: "Invalid MP3 quality" });
    }
    dockerArgsExtra = ["--codec", "mp3", "--quality", quality];
  } else if (codec === "wav") {
    if (!WAV_PRESETS.has(quality)) {
      return res.status(400).json({ error: "Invalid WAV preset" });
    }
    dockerArgsExtra = ["--codec", "wav", "--quality", quality];
  } else if (codec === "mp4") {
    if (!MP4_RES.has(quality)) {
      return res.status(400).json({ error: "Invalid MP4 resolution" });
    }
    dockerArgsExtra = ["--codec", "mp4", "--quality", quality];
  } else {
    return res.status(400).json({ error: "Unsupported codec" });
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
      ...dockerArgsExtra,
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

  function pickNewestByExt(folder, ext) {
    const files = fs
      .readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith(ext))
      .map((f) => {
        const full = path.join(folder, f);
        const stat = fs.statSync(full);
        return { full, mtimeMs: stat.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    return files.length ? files[0].full : null;
  }

  function finalizeSuccessFromHostFolder() {
    const ext = codec === "mp4" ? ".mp4" : codec === "wav" ? ".wav" : ".mp3";
    const filePath = pickNewestByExt(jobDirHost, ext);
    const extLabel = codec.toUpperCase();
    setJob(jobID, {
      status: filePath ? "done" : "error",
      progress: 100,
      message: filePath ? "Completed" : `Completed but no ${extLabel} found`,
      filePath,
      downloadUrl: filePath ? `/api/download/${jobID}` : null,
      error: filePath ? null : `No ${extLabel} produced`,
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
