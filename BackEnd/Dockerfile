FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app


RUN pip install --no-cache-dir -U yt-dlp

COPY converter.py .

ENTRYPOINT ["python", "converter.py"]
