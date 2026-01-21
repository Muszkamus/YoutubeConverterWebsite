# Run this python code with ffmpeg in docker environment to execute 
import os
import sys
import json
import argparse
from yt_dlp import YoutubeDL
from typing import Any

def _ffmpeg_exists(ffmpeg_path: str | None) -> bool:
    if not ffmpeg_path:
        return False
    return os.path.isfile(ffmpeg_path) and os.access(ffmpeg_path, os.X_OK)

def emit(event: str, **data):
    payload = {"event": event, **data}
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--outdir", required=True)
    parser.add_argument("--ffmpeg-path", default="")
    args = parser.parse_args()

    url = args.url.strip()
    outdir = os.path.abspath(args.outdir)
    ffmpeg_path = args.ffmpeg_path.strip()

    if not url:
        emit("error", message="Missing URL")
        return 1

    os.makedirs(outdir, exist_ok=True)

    def progress_hook(d):
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
            emit("status", message="Converting to MP3…")
            emit("progress", pct=100)

    ydl_opts: dict[str, Any] = {
    "format": "bestaudio/best",
    "outtmpl": os.path.join(outdir, "%(title).200s [%(id)s].%(ext)s"),
    "noplaylist": True,
    "restrictfilenames": True,
    "progress_hooks": [progress_hook],
    "postprocessors": [
        {
            # Here we need to accept values from the front end so we can manipulate quality
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }
    ],
}

    if _ffmpeg_exists(ffmpeg_path):
        ydl_opts["ffmpeg_location"] = ffmpeg_path

    try:
        emit("status", message="Starting")
        with YoutubeDL(ydl_opts) as ydl:  # pyright: ignore[reportArgumentType]
            ydl.download([url])


        emit("done", message="Completed", outdir=outdir)
        return 0

    except Exception as e:
        emit("error", message=str(e))
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
