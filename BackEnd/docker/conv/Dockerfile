FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir -U yt-dlp

COPY converter.py .
COPY worker.py .

ENV DOWNLOADS_DIR=/app/downloads

ENTRYPOINT ["python", "worker.py"]
