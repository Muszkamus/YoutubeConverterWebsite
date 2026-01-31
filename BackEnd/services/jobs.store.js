const path = require("path");
const fs = require("fs");
const { safeRmDir } = require("../utils/fsSafe");

const DOWNLOADS_DIR = path.resolve(__dirname, "../downloads");
fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

const jobs = new Map();
// To be changed later on to 3 minute expiry time
const JOB_TTL_MS = 1 * 60 * 1000; // 1 min link TTL
const CLEANUP_EVERY_MS = 30 * 1000; // sweep every 30s

function isExpired(job) {
  return !job?.expiresAt || Date.now() > job.expiresAt;
}

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
    expiresAt: Date.now() + JOB_TTL_MS,
  };

  const next = {
    ...prev,
    ...patch,
    expiresAt: prev.expiresAt, // don’t extend TTL on updates
    updatedAt: Date.now(),
  };

  jobs.set(jobID, next);
  return next;
}

function getJob(jobID) {
  return jobs.get(jobID);
}

function deleteJob(jobID) {
  const jobDirHost = path.join(DOWNLOADS_DIR, jobID);
  safeRmDir(jobDirHost);
  jobs.delete(jobID);
}

function startCleanupLoop() {
  setInterval(() => {
    const now = Date.now();
    for (const [jobID, job] of jobs.entries()) {
      if (job.expiresAt && now > job.expiresAt) deleteJob(jobID);
    }
  }, CLEANUP_EVERY_MS).unref();
}

module.exports = {
  jobs,
  DOWNLOADS_DIR,
  isExpired,
  setJob,
  getJob,
  deleteJob,
  startCleanupLoop,
};
