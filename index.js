const express = require('express');
const ws = require("ws");

const app = express();
const port = 8080;

// communicate via websocket
// send game state
// receive actions
//  - draw card
//  - play card
// send state updates
//  - to all players in a game, after receiving an action

// specifications for ws server
const wss = new ws.Server({ noServer: true });
wss.on("connection", (ws, req) => {
  console.log("new connection: " + req.headers['user-agent']);
  // pass the web socket to another function where we set up events, etc.
  //  - message: parse
  //  - close: handle
});


app.get("/", (req, res) => {
  res.send("hello:)");
});

const server = app.listen(port, () => {
  console.log("fuck you");
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});