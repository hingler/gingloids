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
    let token = this.game.generatePlayer(name);
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
      this.sockets.delete(socket);
      console.warn(playerToken + " closed for weird messages");
      this.updateClients();
    }

    // when a player joins, communicate the complete list of players which have joined.


    // the socket is playing some card
    let res = JSON.parse(data);
    // handle ready signal

    if (!res) {
      socket.send({
        type: DataType.ERROR,
        content: "invalid request sent to server"
      } as DataPacket);
      console.warn("err: invalid request from " + playerToken);
    }

    if (res && res['ready']) {
      if (!this.game.gameStarted) {
        // mark this player as ready
        console.log("player " + playerToken + " readied up in game " + this.token);
        // should pass this its own token
        this.ready.set(playerToken, res['ready']);
        this.sendReadyState();
        if (this.ready.size < 2) {
          // don't start the game if we have less than two players
          return;
        }
        for (let r of this.ready.values()) {
          if (!r) {
            // bail if not everyone is ready
            return;
          }
        }

        // start the game if everyone is ready and...
        this.game.startGame();
        // send everyone the game state
        this.updateClients();
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
          if (res['card'] && res['opts']) {
            let id = Number.parseInt(res['card']);
            if (this.game.playCard(this.sockets.get(socket), id, res['opts'])) {
              this.updateClients();
            } else {
              // formatting was valid, but it is not the user's turn
              socket.send({
                type: DataType.ERROR,
                content: "it's not your turn :("
              } as DataPacket);
            }
          } else {
            // invalid format
            socket.send({
              type: DataType.ERROR,
              content: "invalid input"
            } as DataPacket);
          }

          return;
        case "draw":
          if (this.game.drawCard(this.sockets.get(socket))) {
            this.updateClients();
          } else {
            // not the player's turn to draw.
            socket.send({
              type: DataType.ERROR,
              content: "it's not your turn :("
            } as DataPacket);
          }

          return;
      }
    }

    socket.send({
      type: DataType.ERROR,
      content: "invalid input"
    } as DataPacket);
  }

  socketOnClose(socket: WebSocket) {
    // TODO: don't instantly delete the player, give the client some time to refresh
    let token = this.sockets.get(socket);
    this.game.removePlayer(token);
    this.sockets.delete(socket);
    this.updateClients();
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
    console.log("oops");
    packet.type = DataType.READYINFO;
    packet.content = playerReadyState;

    for (let conn of this.sockets) {
      conn[0].send(JSON.stringify(packet));
    }
  }

  updateClients() {
    for (let socket of this.sockets) {
      let packet : DataPacket;
      packet.type = DataType.GAMESTATE;
      packet.content = this.getGameState(socket[1]);
      socket[0].send(JSON.stringify(packet));
    }
  }

  getGameState(token: string) : GingloidState {
    let res : GingloidState;
    let player = this.game.getPlayer(token);
    if (!player) {
      // invalid token -- skip out
      return null;
    }

    // name
    res.name = player.name;

    // hand
    for (let card of player.cards) {
      let cardInfo : CardInfo;
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

      let playerInfo : PlayerInfo;
      playerInfo.cards = player[1].cardCount;
      playerInfo.name = player[1].name;
      res.players.push(playerInfo);
    }

    // discard
    for (let card of this.game.getDiscardPile().cards) {
      let cardInfo : CardInfo;
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