const express = require("express");
const path = require("path");
const { getJob, isExpired, deleteJob } = require("../services/jobs.store");

const router = express.Router();

router.get("/downloads/:jobID", (req, res) => {
  const jobID = req.params.jobID;
  const job = getJob(jobID);

  if (!job) return res.status(410).json({ error: "Job not found" });

  if (isExpired(job)) {
    deleteJob(jobID);
    return res.status(410).json({ error: "Download link expired" });
  }

  if (job.status !== "done" || !job.filePath) {
    return res.status(404).json({ error: "File not available" });
  }

  return res.download(job.filePath, path.basename(job.filePath));
});

module.exports = router;
