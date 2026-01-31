const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const { DOWNLOADS_DIR, setJob, getJob } = require("./jobs.store");

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

function runConversion({ jobID, link, codec, dockerArgsExtra }) {
  const jobDirHost = path.join(DOWNLOADS_DIR, jobID);
  fs.mkdirSync(jobDirHost, { recursive: true });

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

  const JOB_TIMEOUT_MS = 10 * 60 * 1000;
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

  function finalizeSuccessFromHostFolder() {
    const ext = codec === "mp4" ? ".mp4" : codec === "wav" ? ".wav" : ".mp3";
    const filePath = pickNewestByExt(jobDirHost, ext);
    const extLabel = codec.toUpperCase();

    setJob(jobID, {
      status: filePath ? "done" : "error",
      progress: 100,
      message: filePath ? "Completed" : `Completed but no ${extLabel} found`,
      filePath,
      downloadUrl: filePath ? `/api/downloads/${jobID}` : null,
      error: filePath ? null : `No ${extLabel} produced`,
    });
  }

  function handleJsonLine(line) {
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
        console.log(`[${jobID}] STDOUT: ${trimmed}`);
      }
    }
  });

  converter.stderr.on("data", (data) => {
    const txt = data.toString("utf8").trim();
    if (txt) console.log(`[${jobID}] STDERR: ${txt}`);
  });

  converter.on("close", (code) => {
    clearTimeout(killTimer);

    const job = getJob(jobID);
    if (job?.status === "done" || job?.status === "error") return;

    if (code === 0) finalizeSuccessFromHostFolder();
    else
      setJob(jobID, {
        status: "error",
        error: `Docker exited with code ${code}`,
        message: "Conversion failed",
      });
  });
}

module.exports = { runConversion };
