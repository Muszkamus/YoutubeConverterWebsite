FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY converter.py .

RUN pip install yt-dlp

ENTRYPOINT ["python", "converter.py"]
