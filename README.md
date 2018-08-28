# Peer Health Checker


## Requires

* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [Node.js](https://nodejs.org)

## Development

`git clone` this repo to your local machine, and then:

```bash
cd peer-health-checker/
npm install
```

**This app is run twice; once for each side of a peered connection.** In development, both apps will be run on the local computer.

Start up the **Health app** in the terminal:

```bash
PORT=5000 \
HEALTH_CHECKER_PEER_URL=http://localhost:5001 \
HEALTH_CHECKER_SELF_URL=http://localhost:5000 \
  npm run dev
```

Then, start up the **Health Checker app** in a second terminal in the same directory:

```bash
PORT=5001 \
  npm run dev
```

### Manual Docker build

✏️ *In these commands replace `$DOCKER_USERNAME` with your **docker.com** account name, and `$LOCAL_IP` with your external network address. (Discover with `ipconfig getifaddr en0`.)*

```bash
docker build -t $DOCKER_USERNAME/peer-health-checker .
docker run \
  -p 8000:80 \
  -e HEALTH_CHECKER_PEER_URL=http://$LOCAL_IP:8001 \
  -e HEALTH_CHECKER_SELF_URL=http://$LOCAL_IP:8000 \
  -d $DOCKER_USERNAME/peer-health-checker
docker run \
  -p 8001:80 \
  -d $DOCKER_USERNAME/peer-health-checker
```

### Manual Heroku build

```bash
npm install
npm run build
mkdir -p heroku-slug/app
cp -r !(heroku-slug) heroku-slug/app/
cd heroku-slug/app
curl http://nodejs.org/dist/v10.9.0/node-v10.9.0-linux-x64.tar.gz | tar xzv
cd ..
tar czfv heroku-slug.tgz ./app
```

The resulting slug archive `heroku-slug.tgz` has a **web** process of `node-v10.9.0-linux-x64/bin/npm start`.
