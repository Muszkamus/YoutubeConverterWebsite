import json
import os
import time
import subprocess
from pathlib import Path

DOWNLOADS_DIR = Path(os.environ.get("DOWNLOADS_DIR", "/app/downloads"))

def read_json(p: Path):
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return None

def write_json_atomic(p: Path, data: dict):
    tmp = p.with_suffix(p.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
    tmp.replace(p)

def has_terminal_status(status_path: Path) -> bool:
    s = read_json(status_path)
    return bool(s) and s.get("status") in ("done", "error")

def claim_lock(job_dir: Path) -> bool:
    lock_path = job_dir / ".lock"
    try:
        fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        os.write(fd, str(time.time()).encode("utf-8"))
        os.close(fd)
        return True
    except FileExistsError:
        return False
    except Exception:
        return False

def release_lock(job_dir: Path):
    try:
        (job_dir / ".lock").unlink()
    except Exception:
        pass

def run_one_job(job_dir: Path):
    job_path = job_dir / "job.json"
    status_path = job_dir / "status.json"

    job = read_json(job_path)
    if not job:
        return

    if has_terminal_status(status_path):
        return

    if not claim_lock(job_dir):
        return

    write_json_atomic(status_path, {"status": "running", "progress": 0, "message": "Starting"})

    url = job.get("url")
    codec = (job.get("codec") or "mp3").lower()
    extra = job.get("args") or []
    if not isinstance(extra, list):
        extra = []

    # Run your existing converter.py as a subprocess and parse its JSON-line output
    cmd = [
        "python", "/app/converter.py",
        "--url", url,
        "--outdir", str(job_dir),
        "--codec", codec,
        *extra,
    ]

    try:
        p = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
    except Exception as e:
        write_json_atomic(status_path, {"status": "error", "message": "Failed to start converter", "error": str(e)})
        release_lock(job_dir)
        return

    # Parse JSON lines from converter.py stdout if it emits them
    try:
        if p.stdout:
            for line in p.stdout:
                line = line.strip()
                if not line:
                    continue
                try:
                    msg = json.loads(line)
                except Exception:
                    continue

                ev = msg.get("event")
                if ev == "progress":
                    write_json_atomic(status_path, {
                        "status": "running",
                        "progress": msg.get("pct", 0),
                        "message": msg.get("message", ""),
                    })
                elif ev == "status":
                    write_json_atomic(status_path, {
                        "status": "running",
                        "progress": msg.get("pct", 0),
                        "message": msg.get("message", ""),
                    })
                elif ev == "done":
                    write_json_atomic(status_path, {"status": "done", "progress": 100, "message": "Completed"})
                elif ev == "error":
                    write_json_atomic(status_path, {
                        "status": "error",
                        "message": msg.get("message", "Failed"),
                        "error": msg.get("message", "Failed"),
                    })
    finally:
        code = p.wait(timeout=600)
        # If converter didn't write done/error, decide based on exit code
        if not has_terminal_status(status_path):
            if code == 0:
                write_json_atomic(status_path, {"status": "done", "progress": 100, "message": "Completed"})
            else:
                stderr = (p.stderr.read().strip() if p.stderr else "")
                write_json_atomic(status_path, {
                    "status": "error",
                    "message": "Conversion failed",
                    "error": f"exit {code}: {stderr[:400]}",
                })

        release_lock(job_dir)

def scan_loop():
    print(f"Worker watching {DOWNLOADS_DIR}", flush=True)
    while True:
        try:
            for job_dir in DOWNLOADS_DIR.iterdir():
                if not job_dir.is_dir():
                    continue
                job_path = job_dir / "job.json"
                if not job_path.exists():
                    continue
                status_path = job_dir / "status.json"
                if has_terminal_status(status_path):
                    continue
                run_one_job(job_dir)
                break  # one job at a time
        except Exception:
            pass

        time.sleep(0.5)

if __name__ == "__main__":
    scan_loop()
