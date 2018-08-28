const express = require('express');
const next = require('next');
const path = require('path');
const url = require('url');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const fetch = require('isomorphic-fetch');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 5000;

const peerUrl = process.env.HEALTH_CHECKER_PEER_URL;
const selfUrl = process.env.HEALTH_CHECKER_SELF_URL;
if ((peerUrl == null && selfUrl != null) || (peerUrl != null && selfUrl == null)) {
  throw new Error('HEALTH_CHECKER_PEER_URL & HEALTH_CHECKER_SELF_URL environment variables must be set together.');
}

// Multi-process to utilize all CPU cores.
if (!dev && cluster.isMaster) {
  console.log(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });

} else {
  const nextApp = next({ dir: '.', dev });
  const nextHandler = nextApp.getRequestHandler();

  nextApp.prepare()
    .then(() => {
      const server = express();
      
      // Static files
      // https://github.com/zeit/next.js/tree/4.2.3#user-content-static-file-serving-eg-images
      server.use('/static', express.static(path.join(__dirname, 'static'), {
        maxAge: dev ? '0' : '365d'
      }));

      // When URL's are set, use the origin routes
      if (peerUrl && selfUrl) {
        server.get('/health', (req, res, next) => {
          console.log('GET /health')

          var reqUrl = new url.URL(`${peerUrl}/peer-health`);
          var params = { "duplex-url": selfUrl };
          reqUrl.search = new url.URLSearchParams(params);

          fetch(reqUrl.toString())
          .then( peerResponse => {
            if (peerResponse.status != 200) {
              console.log('peerResponse not 200')
              res.json({
                "peer-status": peerResponse.status,
                "peer-identity": peerUrl,
                "peer-message": `Peer response error (${peerResponse.statusText})`,
                "duplex-status": 0,
                "duplex-identity": selfUrl
              });
              next();
            }
            return peerResponse;
          })
          .then( peerResponse => peerResponse.json() )
          .then( peerData => {
            console.log('peerResponse 200')
            res.json({
              "peer-status": 200,
              "peer-identity": peerUrl,
              "duplex-identity": selfUrl,
              ...peerData
            });
            next();
          })
          .catch( error => {
            console.log('peerResponse catch error', error.stack)
            res.json({
              "peer-status": 0,
              "peer-identity": peerUrl,
              "peer-message": `Peer connection failed (${error.message})`,
              "duplex-status": 0,
              "duplex-identity": selfUrl
            });
            next();
          });
        });

        server.get('/peer-duplex-health', (req, res) => {
          console.log('GET /peer-duplex-health')
          res.status(200).send();
        });

      // When URL's are not set, use the peer route
      } else {
        server.get('/peer-health', (req, res, next) => {
          console.log('GET /peer-health')

          const reqUrl = `${req.query['duplex-url']}/peer-duplex-health`;
          if (reqUrl == null) {
            res.json({
              "duplex-status": 0,
              "duplex-message": `Peer duplex URL is required (duplex-url param)`
            });
            next();
            return;
          }
          console.log('duplexUrl', reqUrl)

          fetch(reqUrl)
          .then( duplexResponse => {
            if (duplexResponse.status != 200) {
              console.log('duplexResponse not 200')
              res.json({
                "duplex-status": duplexResponse.status,
                "duplex-message": `Peer duplex response error (${duplexResponse.statusText})`
              });
            } else {
              console.log('duplexResponse 200')
              res.json({
                "duplex-status": 200
              });
            }
            next();
          })
          .catch( error => {
            console.log('duplexResponse catch error', error.stack)
            res.json({
              "duplex-status": 0,
              "duplex-message": `Peer duplex connection failed (${error.message})`
            });
            next();
          });
        });
      }

      // Default catch-all renders Next app
      server.get('*', (req, res) => {
        // res.set({
        //   'Cache-Control': 'public, max-age=3600'
        // });
        const parsedUrl = url.parse(req.url, true);
        nextHandler(req, res, parsedUrl);
      });

      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`Node worker ${process.pid}: listening on port ${port}`);
      });
    });
}