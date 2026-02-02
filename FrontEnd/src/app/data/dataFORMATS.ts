// To add later

// MP3 = "256", // "320"
// WAV = "24-bit/96kHz", // "24-bit/192kHz"
// MP4 = "1440p", // "2160p" ],

export const formats = {
  mp3: ["64", "96", "128", "160", "192"],
  wav: ["16-bit/44.1kHz", "16-bit/48kHz", "24-bit/48kHz"],
  mp4: ["360p", "480p", "720p", "1080p"],
} as const;

export type Format = keyof typeof formats;

export type Quality = (typeof formats)[Format][number];

export type QualityByFormat<F extends Format> = (typeof formats)[F][number];
