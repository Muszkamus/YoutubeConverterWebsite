const MP3_QUALITIES = new Set(["64", "96", "128", "160", "192", "256", "320"]);

const WAV_PRESETS = new Set([
  "16-bit/44.1kHz",
  "16-bit/48kHz",
  "24-bit/48kHz",
  "24-bit/96kHz",
  "24-bit/192kHz",
]);

const MP4_RES = new Set(["360p", "480p", "720p", "1080p", "1440p", "2160p"]);

module.exports = { MP3_QUALITIES, WAV_PRESETS, MP4_RES };
