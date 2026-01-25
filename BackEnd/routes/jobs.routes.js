const express = require("express");
const path = require("path");
const {
  DOWNLOADS_DIR,
  getJob,
  isExpired,
  deleteJob,
} = require("../services/jobs.store");

const router = express.Router();

router.get("/jobs/:jobID", (req, res) => {
  const job = getJob(req.params.jobID);
  if (!job) return res.status(404).json({ error: "Job not found" });

  if (isExpired(job)) {
    deleteJob(req.params.jobID);
    return res.status(410).json({ error: "Job expired" });
  }

  res.json({ jobID: req.params.jobID, ...job });
});

module.exports = router;
