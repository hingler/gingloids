import * as WebSocket from "ws";
import { GingloidGame } from "../game/GingloidGame";
import { GingloidState, CardInfo, PlayerInfo, DataType, DataPacket, PlayResult } from "../game/GingloidState";
import { GingloidJoinGamePacket } from "../client/GingloidRequestFormat"

enum GameState {
  WAITING,    // still allowing new players
  INPROGRESS, // no new players -- game in progress
  COMPLETED   // game ended, you're free to remove it
};

/**
 * ConnectionManager handles sockets relating to a single Gingloids game.
 */
class ConnectionManager {
  game: GingloidGame;
  sockets: Map<WebSocket, string>;
  ready: Map<string, boolean>;
  token: string;
  creationTime: number;
  disconnectedPlayers: Map<string, NodeJS.Timeout>;

  constructor(token: string) {
    this.game = new GingloidGame();
    this.sockets = new Map();
    this.ready = new Map();
    this.token = token;
    this.creationTime = Date.now();
    this.disconnectedPlayers = new Map();
  }

  /**
   * @returns The number of seconds elapsed since this game was created.
   */
  getLifetime() : number {
    return (Date.now() - this.creationTime) / 1000;
  }

  addSocket(socket: WebSocket, name: string, playerToken?: string) {
    if (playerToken) {
      // check our token list to see if the token we want still exists
      let socketOld : WebSocket;
      for (let entry of this.sockets) {
        if (entry[1] === playerToken) {
          // old record for this socket
          socketOld = entry[0];
        }
      }

      if (socketOld) {
        this.sockets.delete(socketOld);
        clearTimeout(this.disconnectedPlayers.get(playerToken));
        this.disconnectedPlayers.delete(playerToken);
        this.sockets.set(socket, playerToken);
        console.log("token " + playerToken + " reconnected!");
        socket.on("message", (data: string) => { this.socketOnMessage(data, socket); })
        socket.on("close", () => { this.socketOnClose(socket); });
        this.updateClients();
        // if the player token is invalid, we'll try to squeeze them in the normal way
        return;
      }

    }

    if (this.game.gameStarted) {
      socket.send(JSON.stringify({
        type: DataType.ERROR,
        "content": "game already started"
      } as DataPacket));
      socket.close();
      return;
    }

    if (this.sockets.size >= 8) {
      socket.send(JSON.stringify({
        type: DataType.ERROR,
        content: "player cap reached (8)"
      } as DataPacket));
      socket.close();
    }

    let token = this.game.generatePlayer(name);
    if (token === null) {
      console.error("this should be caught by the above :sade:");
    }

    this.sockets.set(socket, token);
    this.ready.set(token, false);
    // return the token to the user
    socket.send(JSON.stringify({
      type: DataType.TOKEN,
      "content": token 
    } as DataPacket));
    // configure the socket so that messages are handled correctly :)
    socket.on("message", (data: string) => { this.socketOnMessage(data, socket); })
    socket.on("close", () => { this.socketOnClose(socket); });
    console.log("new socket configured for " + name + ":" + token);
    this.sendReadyState();
  }

  socketOnMessage(data: string, socket: WebSocket) {
    // parse message
    // play it
    // if valid: communicate game state to all clients

    let playerToken = this.sockets.get(socket);
    console.log("received message from " + playerToken);
    if (!playerToken) {
      // what
      console.error("we have a socket which is not attached to a player token!!!");
    }
    
    // handle the ready signal
    if (data.length > 262144) {
      socket.close(1009);
      this.game.removePlayer(playerToken);
      this.ready.delete(this.sockets.get(socket));
      this.sockets.delete(socket);
      console.warn(playerToken + " closed for weird messages");
      this.updateClients();
    }

    // when a player joins, communicate the complete list of players which have joined.

    // the socket is playing some card
    let res = JSON.parse(data);
    console.log(res);
    // handle ready signal

    if (!res) {
      socket.send({
        type: DataType.ERROR,
        content: "invalid request sent to server"
      } as DataPacket);
      console.warn("err: invalid request from " + playerToken);
    }

    if (res && res.ready !== undefined) {
      if (!this.game.gameStarted) {
        // mark this player as ready
        console.log("player " + playerToken + (res.ready ? " readied" : " unreadied") + " in game " + this.token);
        // should pass this its own token
        this.ready.set(playerToken, res['ready']);
        this.sendReadyState();
        if (this.ready.size < 2) {
          // don't start the game if we have less than two players
          console.log("not enough players");
          return;
        }

        for (let r of this.ready) {
          if (!r[1]) {
            // bail if not everyone is ready
            console.log("not all players in " + this.token + " are ready");
            console.log("player " + r[0]);
            return;
          }
        }

        console.log("game " + this.token + " starting!");
        // start the game if everyone is ready and...
        this.game.startGame();
        for (let conn of this.sockets.keys()) {
          conn.send(JSON.stringify({
            type: DataType.GAMESTART,
            content: "Game is beginning"
          } as DataPacket));
        }
        // send everyone the game state
        this.updateClients();
        // TODO: fix this logic -- these returns are a mess
        return;
      } else {
        socket.send(JSON.stringify({
          type: DataType.ERROR,
          content: "game already started"
        } as DataPacket));
      }
    } else if (res && res['play']) {
      switch(res['play']) {
        case "play":
          // user plays a card
          if (res['card'] !== undefined) {
            let id = Number.parseInt(res['card']);
            // assert that it is the player's turn
            let token = this.sockets.get(socket);
            if (this.game.getNextPlayer() !== token) {
              console.log("out of order");
              socket.send(JSON.stringify({
                type: DataType.WARN,
                content: "it's not your turn!"
              } as DataPacket));
              return;
            }
            // go!
            let packet = this.game.playCard(token, id, res['opts']);
            if (packet) {
              console.log("temporary");
              this.updateClients(packet as PlayResult);
              // how do we notify the player that received cards from a draw two or draw four?
            } else {
              // formatting was valid, but it is not the user's turn
              console.log("invalid play");
              socket.send(JSON.stringify({
                type: DataType.WARN,
                content: "invalid play :("
              } as DataPacket));
            }
          } else {
            // invalid format
            console.log("invalid format");
            socket.send(JSON.stringify({
              type: DataType.WARN,
              content: "invalid input"
            } as DataPacket));
          }

          return;
        case "draw":
          if (this.game.drawCard(this.sockets.get(socket))) {
            this.updateClients();
          } else {
            // not the player's turn to draw.
            socket.send(JSON.stringify({
              type: DataType.WARN,
              content: "it's not your turn :("
            } as DataPacket));
          }

          return;
      }
    }

    console.error("bad input from player " + this.sockets.get(socket));
    console.error(res);
    socket.send(JSON.stringify({
      type: DataType.ERROR,
      content: "invalid input"
    } as DataPacket));
  }

  socketOnClose(socket: WebSocket) {
    // TODO: don't instantly delete the player, give the client some time to refresh
    let token = this.sockets.get(socket);
    let oldName = this.game.getPlayer(token).name;
    console.log("socket for player " + oldName + ":" + token + " closed!");
    let handle = setTimeout(() => {
      // remove record of this player
      this.disconnectedPlayers.delete(token);
      this.game.removePlayer(token);
      this.ready.delete(this.sockets.get(socket));
      this.sockets.delete(socket);
      
      if (!this.game.gameStarted) {
        this.sendReadyState();
      } else {
        this.updateClients({
          global: "Player " + oldName + " disconnected :(",
          local: {
            affectedToken: "",
            result: ""
          }
        } as PlayResult);
      }

      console.log("player " + oldName + ":" + token + " disconnected");

    }, 15000);

    this.disconnectedPlayers.set(token, handle);
  }

  sendReadyState() {
    // send an array associating player names with their ready state
    let playerReadyState = [];
    for (let conn of this.sockets) {
      let token = conn[1];
      let player = this.game.getPlayer(token);
      playerReadyState.push({ name: player.name, ready: this.ready.get(token) });
    }

    let packet = {} as DataPacket;
    packet.type = DataType.READYINFO;
    packet.content = playerReadyState;

    for (let conn of this.sockets) {
      conn[0].send(JSON.stringify(packet));
    }
  }

  updateClients(infoPacket?: PlayResult) {
    console.log("updating clients!");
    for (let socket of this.sockets) {
      console.log("player this one: " + socket[1]);
      // warn first
      let warnmsg = "";
      if (infoPacket && infoPacket.global.length > 0) {
        warnmsg += infoPacket.global;
      }

      if (infoPacket && infoPacket.local.affectedToken === socket[1]) {
        warnmsg += "\n" + infoPacket.local.result;
      }

      // warn clients of possible byproducts before sending update
      socket[0].send(JSON.stringify({
        type: DataType.WARN,
        content: warnmsg
      } as DataPacket));
      
      let packet = {} as DataPacket;
      packet.type = DataType.GAMESTATE;
      packet.content = this.getGameState(socket[1]);
      socket[0].send(JSON.stringify(packet));
    }

    console.log("finished updating clients");
  }

  getGameState(token: string) : GingloidState {
    // todo: order player list s.t. the list starts immediately after the client whose state is being fetched.
    let res = {} as GingloidState;
    let player = this.game.getPlayer(token);
    if (!player) {
      // invalid token -- skip out
      return null;
    }

    // name
    res.name = player.name;
    res.hand = [];
    res.players = [];
    res.discard = [];

    res.myturn = (token === this.game.getNextPlayer());

    // hand
    for (let card of player.cards) {
      let cardInfo = {} as CardInfo;
      cardInfo.color = card.color;
      cardInfo.value = card.value;
      cardInfo.id = card.id;
      res.hand.push(cardInfo);
    }

    // players
    let start : number;
    for (let i = 0; i < this.game.tokens.length; i++) {
      if (this.game.tokens[i] === token) {
        start = i;
      }
    }

    for (let i = ((start + 1) % this.game.tokens.length); i !== start; i = ((i + 1) % this.game.tokens.length)) {
      let player = this.game.getPlayers().get(this.game.tokens[i]);
      console.log(this.game.tokens[i]);
      let playerInfo = {} as PlayerInfo;
      playerInfo.cards = player.cardCount;
      playerInfo.name = player.name;
      playerInfo.playing = (this.game.tokens[i] === this.game.getNextPlayer());
      res.players.push(playerInfo);
    }

    // discard
    for (let card of this.game.getDiscardPile().cards) {
      let cardInfo = {} as CardInfo;
      cardInfo.color = card.color;
      cardInfo.value = card.value;
      cardInfo.id = card.id;
      res.discard.push(cardInfo);
    }

    res.draw = this.game.drawPile.cards.length;
    return res;
  }
}

export { ConnectionManager };