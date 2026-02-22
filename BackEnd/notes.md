### Build converter docker

Build converter docker first

```bash
docker build -f docker/conv/Dockerfile -t yt-converter:latest .
```

### Build backed docker

```bash
docker build -f docker/back/Dockerfile -t backend-api:latest .
```

Run the below from the BackEnd folder to rebuild and start the docker

```bash
cd docker/back
docker compose down
docker compose up --build -d
```

# AWS setup

```bash
sudo apt update
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

```

Build and run the dockers from the Bckend Directory

```bash
docker build -f docker/conv/Dockerfile -t yt-converter:latest .
docker build -f docker/back/Dockerfile -t backend-api:latest .

```

Run the below from the BackEnd to rebuild and start the docker

```bash
cd docker/back
docker compose down
docker compose up --build -d
```

# Debugging

View logs:

```bash
docker compose logs -f
```

Or for API only:

```bash
docker compose logs -f api
```

If container crashes immediately:

```bash
docker ps -a
```

Then:

```bash
docker logs backend-api
```

# Removing dockers

To stop all the dockers on AWS

```bash
docker stop $(docker ps -aq)
```

To remove all the dockers

```bash
docker rm $(docker ps -aq)
```
