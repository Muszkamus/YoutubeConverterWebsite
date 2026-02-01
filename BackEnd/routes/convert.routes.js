const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { isAllowed } = require("../utils/constants");
const { isAllowedYoutubeUrl } = require("../utils/youtubeAllowlist");
const { setJob } = require("../services/jobs.store");
const { runConversion } = require("../services/converter.service");

const router = express.Router();

router.get("/formats", (req, res) => {
  res.json({
    mp3: Object.keys(MP3_QUALITIES),
    wav: Object.keys(WAV_PRESETS),
    mp4: Object.keys(MP4_RES),
  });
});

router.post("/convert", (req, res) => {
  const { link, codec: codecRaw, format: formatRaw, quality } = req.body;

  const codec = String(codecRaw ?? formatRaw ?? "mp3").toLowerCase();
  const q = String(quality ?? (codec === "wav" ? "16-bit/44.1kHz" : "192")); // avoid invalid wav default

  if (!link) return res.status(400).json({ error: "Link is required" });
  if (!isAllowedYoutubeUrl(link)) {
    return res.status(400).json({ error: "Only YouTube links are allowed" });
  }

  if (!["mp3", "wav", "mp4"].includes(codec)) {
    return res.status(400).json({ error: "Unsupported codec" });
  }

  if (!isAllowed(codec, q)) {
    return res
      .status(400)
      .json({ error: `Invalid ${codec.toUpperCase()} option` });
  }

  const dockerArgsExtra = ["--codec", codec, "--quality", q];

  const jobID = uuidv4();
  setJob(jobID, { status: "running", message: "Starting", progress: 0 });

  res.status(202).json({ jobID });

  runConversion({ jobID, link, codec, dockerArgsExtra });
});

module.exports = router;
