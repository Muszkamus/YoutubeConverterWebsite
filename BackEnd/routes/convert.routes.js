const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { MP3_QUALITIES, WAV_PRESETS, MP4_RES } = require("../utils/constants");
const { isAllowedYoutubeUrl } = require("../utils/youtubeAllowlist");
const { setJob } = require("../services/jobs.store");
const { runConversion } = require("../services/converter.service");

const router = express.Router();

router.post("/convert", (req, res) => {
  const { link, codec: codecRaw, format: formatRaw, quality } = req.body;

  const codec = String(codecRaw ?? formatRaw ?? "mp3").toLowerCase();

  const defaultQuality =
    codec === "wav" ? "16-bit/44.1kHz" : codec === "mp4" ? "720p" : "192";

  const q = String(quality ?? defaultQuality);

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
  setJob(jobID, { status: "running", message: "Starting", progress: 0 });

  res.status(202).json({ jobID });

  runConversion({ jobID, link, codec, dockerArgsExtra });
});

module.exports = router;
