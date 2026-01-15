## 1: Start backend >

Where the server.js file is

```bash
npm run devStart
```

Docker file execution from Ba/ckend pwd>

```bash
docker run --rm -v ${PWD}/downloads:/app/downloads yt-converter --url "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --outdir /app/downloads
```
