import * as WebSocket from "ws";
import { GingloidGame } from "../game/GingloidGame";
import { GingloidState, CardInfo, PlayerInfo, DataType, DataPacket } from "../game/GingloidState";
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

  constructor(token: string) {
    this.game = new GingloidGame();
    this.sockets = new Map();
    this.ready = new Map();
    this.token = token;
  }

  addSocket(socket: WebSocket, name: string) {
    if (this.game.gameStarted) {
      socket.send(JSON.stringify({
        type: DataType.ERROR,
        "content": "game already started"
      } as DataPacket));
      return;
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
        socket.send({
          type: DataType.ERROR,
          content: "game already started"
        } as DataPacket);
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
            if (this.game.playCard(token, id, res['opts'])) {
              console.log("temporary");
              this.updateClients();
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
    console.log("socket closed :(");
    let token = this.sockets.get(socket);
    this.game.removePlayer(token);
    this.ready.delete(this.sockets.get(socket));
    this.sockets.delete(socket);
    if (!this.game.gameStarted) {
      this.sendReadyState();
    } else {
      this.updateClients();
    }
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

  updateClients() {
    console.log("updating clients!");
    for (let socket of this.sockets) {
      let packet = {} as DataPacket;
      packet.type = DataType.GAMESTATE;
      packet.content = this.getGameState(socket[1]);
      socket[0].send(JSON.stringify(packet));
    }
  }

  getGameState(token: string) : GingloidState {
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
    for (let player of this.game.getPlayers()) {
      if (player[0] === token) {
        continue;
      }

      let playerInfo = {} as PlayerInfo;
      playerInfo.cards = player[1].cardCount;
      playerInfo.name = player[1].name;
      playerInfo.playing = (player[0] === this.game.getNextPlayer());
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