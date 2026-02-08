const path = require("path");
const fs = require("fs");

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
  const jobDir = path.join(DOWNLOADS_DIR, jobID);
  fs.mkdirSync(jobDir, { recursive: true });

  // create initial job state
  setJob(jobID, { status: "queued", progress: 0, message: "Queued" });

  // write job request for converter worker
  const jobFile = path.join(jobDir, "job.json");
  fs.writeFileSync(
    jobFile,
    JSON.stringify(
      {
        jobID,
        url: link,
        codec,
        args: dockerArgsExtra ?? [],
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  // optional: watch for status updates written by converter
  const statusFile = path.join(jobDir, "status.json");

  const JOB_TIMEOUT_MS = 10 * 60 * 1000;
  const start = Date.now();

  const timer = setInterval(() => {
    // timeout
    if (Date.now() - start > JOB_TIMEOUT_MS) {
      clearInterval(timer);
      setJob(jobID, {
        status: "error",
        error: "Job timed out",
        message: "Timed out",
      });
      return;
    }

    // if converter wrote status.json, ingest it
    if (fs.existsSync(statusFile)) {
      try {
        const raw = fs.readFileSync(statusFile, "utf8");
        const s = JSON.parse(raw);

        if (s.status === "running") {
          setJob(jobID, {
            status: "running",
            progress: typeof s.progress === "number" ? s.progress : 0,
            message: s.message ?? "",
          });
        }

        if (s.status === "error") {
          clearInterval(timer);
          setJob(jobID, {
            status: "error",
            error: s.error ?? "Failed",
            message: s.message ?? "Failed",
          });
        }

        if (s.status === "done") {
          clearInterval(timer);

          const ext =
            codec === "mp4" ? ".mp4" : codec === "wav" ? ".wav" : ".mp3";
          const filePath = pickNewestByExt(jobDir, ext);
          const extLabel = codec.toUpperCase();

          setJob(jobID, {
            status: filePath ? "done" : "error",
            progress: 100,
            message: filePath
              ? "Completed"
              : `Completed but no ${extLabel} found`,
            filePath,
            downloadUrl: filePath ? `/api/downloads/${jobID}` : null,
            error: filePath ? null : `No ${extLabel} produced`,
          });
        }
      } catch {
        // ignore partial writes
      }
    }
  }, 500);
}

module.exports = { runConversion };
