// formats.js
const MP3_QUALITIES = {
  64: "64k",
  96: "96k",
  128: "128k",
  160: "160k",
  192: "192k",
  256: "256k",
  320: "320k",
};

const WAV_PRESETS = {
  "16-bit/44.1kHz": { codec: "pcm_s16le", ar: 44100 },
  "16-bit/48kHz": { codec: "pcm_s16le", ar: 48000 },
  "24-bit/48kHz": { codec: "pcm_s24le", ar: 48000 },
  "24-bit/96kHz": { codec: "pcm_s24le", ar: 96000 },
  "24-bit/192kHz": { codec: "pcm_s24le", ar: 192000 },
};

const MP4_RES = {
  "360p": 360,
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "1440p": 1440,
  "2160p": 2160,
};

function isAllowed(codec, quality) {
  const q = String(quality);

  if (codec === "mp3") return q in MP3_QUALITIES;
  if (codec === "wav") return q in WAV_PRESETS;
  if (codec === "mp4") return q in MP4_RES;

  return false;
}

module.exports = { MP3_QUALITIES, WAV_PRESETS, MP4_RES, isAllowed };
