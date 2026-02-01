import os
import sys
import json
import argparse
from typing import Any
from yt_dlp import YoutubeDL

def _ffmpeg_exists(ffmpeg_path: str | None) -> bool:
    if not ffmpeg_path:
        return False
    return os.path.isfile(ffmpeg_path) and os.access(ffmpeg_path, os.X_OK)


def emit(event: str, **data):
    payload = {"event": event, **data}
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--outdir", required=True)
    parser.add_argument("--ffmpeg-path", default="")
    parser.add_argument("--codec", default="mp3", choices=["mp3", "wav", "mp4"])
    parser.add_argument("--quality", default="192")
    args = parser.parse_args()

    url = args.url.strip()
    outdir = os.path.abspath(args.outdir)
    ffmpeg_path = args.ffmpeg_path.strip()
    codec = args.codec.strip().lower()
    quality = str(args.quality).strip()

    if not url:
        emit("error", message="Missing URL")
        return 1

    os.makedirs(outdir, exist_ok=True)

    WAV_MAP: dict[str, list[str]] = {
        "16-bit/44.1kHz": ["-acodec", "pcm_s16le", "-ar", "44100"],
        "16-bit/48kHz":  ["-acodec", "pcm_s16le", "-ar", "48000"],
        "24-bit/48kHz":  ["-acodec", "pcm_s24le", "-ar", "48000"],
        "24-bit/96kHz":  ["-acodec", "pcm_s24le", "-ar", "96000"],
        "24-bit/192kHz": ["-acodec", "pcm_s24le", "-ar", "192000"],
    }

    MP4_FORMAT_MAP = {
        "360p":  "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=360]+bestaudio/best[height<=360]/best",
        "480p":  "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best",
        "720p":  "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best",
        "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best",
        "1440p": "bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1440]+bestaudio/best[height<=1440]/best",
        "2160p": "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=2160]+bestaudio/best[height<=2160]/best",
    }




    MP3_ALLOWED = {"64", "96", "128", "160", "192", "256", "320"}

    def progress_hook(d: dict[str, Any]):
        status = d.get("status")

        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            downloaded = d.get("downloaded_bytes", 0)

            if total:
                pct = round(downloaded / total * 100, 1)
                emit("progress", pct=pct, message=f"Downloading {pct}%")
            else:
                emit("status", message="Downloading…")

        elif status == "finished":
            if codec == "mp4":
                emit("status", message="Merging to MP4…")
            elif codec == "wav":
                emit("status", message="Converting to WAV…")
            else:
                emit("status", message="Converting to MP3…")
            emit("progress", pct=100)

    ydl_opts: dict[str, Any] = {
        "outtmpl": os.path.join(outdir, "%(title).200s [%(id)s].%(ext)s"),
        "noplaylist": True,
        "restrictfilenames": True,
        "progress_hooks": [progress_hook],

        # Mitigations for modern YouTube behavior:
        "extractor_args": {"youtube": {"player_client": ["android", "web_embedded", "web", "tv"]}},
        # Only set js_runtimes if you actually installed it in the image.
        # If you installed Node in Dockerfile, keep this. Otherwise remove it.
        # "js_runtimes": {"node": {}},
    }

    if codec == "mp3":
        q = quality[:-1] if quality.lower().endswith("k") else quality
        if q not in MP3_ALLOWED:
            emit("error", message=f"Invalid mp3 quality: {quality}")
            return 1

        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": q,
        }]
        ydl_opts["postprocessor_args"] = {
            "extractaudio+ffmpeg": ["-b:a", f"{q}k"],
        }

    elif codec == "wav":
        if quality not in WAV_MAP:
            emit("error", message=f"Invalid wav preset: {quality}")
            return 1

        ydl_opts["format"] = "bestaudio/best"
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
        }]
        ydl_opts["postprocessor_args"] = {
            "extractaudio+ffmpeg": WAV_MAP[quality],
        }

    elif codec == "mp4":
        if quality not in MP4_FORMAT_MAP:
            emit("error", message=f"Invalid mp4 resolution: {quality}")
            return 1

        ydl_opts["format"] = MP4_FORMAT_MAP[quality]
        ydl_opts["merge_output_format"] = "mp4"

        ydl_opts["postprocessors"] = [
            {"key": "FFmpegVideoConvertor", "preferedformat": "mp4"},
        ]

        ydl_opts["postprocessor_args"] = {
            "videoconvertor+ffmpeg": [
                "-c:v", "libx264",
                "-crf", "23",
                "-preset", "veryfast",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
            ]
        }

    else:
        emit("error", message=f"Unsupported codec: {codec}")
        return 1

    if _ffmpeg_exists(ffmpeg_path):
        ydl_opts["ffmpeg_location"] = ffmpeg_path

    try:
        emit("status", message="Starting")
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        emit("done", message="Completed", outdir=outdir)
        return 0

    except Exception as e:
        emit("error", message=str(e))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
