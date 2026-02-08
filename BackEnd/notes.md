Build converter docker

1: Build converter docker first

```bash
docker build -f docker/conv/Dockerfile -t yt-converter:latest .
```

To test if conv docker is running properly

```bash
docker run --rm -v "${PWD}\downloads:/app/downloads" yt-converter `
   --url "https://www.youtube.com/watch?v=Vk4t8wUKnbI" `
   --outdir /app/downloads/test `
   --codec mp3 `
   --quality 192
```

After it's done, delete the downloads folder where test file was created

to build backed docker

```bash
docker build -f docker/back/Dockerfile -t backend-api:latest .
```

Run the below from the root folder of the project

```bash
cd BackEnd\docker\back
docker compose down
docker compose up --build -d
docker compose logs -f api
```
