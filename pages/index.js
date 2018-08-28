import React from 'react'
import Head from 'next/head'
import fetch from 'isomorphic-fetch'

const IndexPage = (props) => (
  <div className="root">
    <Head>
      <meta charSet="utf-8"/>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Peer Health</title>
    </Head>
    <style jsx global>{`
      body {
        background-color: cornsilk;
      }
    `}</style>
    <style jsx>{`
      .root {
        font-family: sans-serif;
        margin: 10vh 0;
      }
      @media (min-width: 600px) {
        .root {
          margin-left: 21vw;
          margin-right: 21vw;
        }
      }
      .status-display {
        display: flex;
        justify-content: space-between;
      }
      .name {}
      .identity {}
      .status {}
      .message {

      }
    `}</style>

    <h1>Peer Health</h1>

    <div className="status-display">
      <div>
        <h2 className="name">Origin/Duplex</h2>
        <div className="identity">{props.health["duplex-identity"]}</div>
        <div className="status">{props.health["duplex-status"]}</div>
        <div className="message">{props.health["duplex-message"]}</div>
      </div>
      <div>
        <h2 className="name">Peer</h2>
        <div className="identity">{props.health["peer-identity"]}</div>
        <div className="status">{props.health["peer-status"]}</div>
        <div className="message">{props.health["peer-message"]}</div>
      </div>
    </div>

  </div>
)

IndexPage.getInitialProps = async ({ req }) => {
  let baseUrl;
  if (req != null) {
    baseUrl = process.env.HEALTH_CHECKER_SELF_URL;
  } else {
    baseUrl = `${window.location.protocol}://${window.location.hostname}`;
  }
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  return { health: data };
}

export default IndexPage;
