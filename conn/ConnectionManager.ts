import * as WebSocket from "ws";
import { GingloidGame } from "../game/GingloidGame";
import { GingloidState, CardInfo, PlayerInfo } from "../game/GingloidState";
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

  constructor() {
    this.game = new GingloidGame();
    this.sockets = new Map();
  }

  addSocket(socket: WebSocket, name: string) {
    let token = this.game.generatePlayer(name);
    this.sockets.set(socket, token);
    // return the token to the user
    socket.send(JSON.stringify({ "token": token }));
    // configure the socket so that messages are handled correctly :)
    socket.on("message", (data: string) => { this.socketOnMessage(data, socket); })
    socket.on("close", () => { this.socketOnClose(socket); });
  }

  socketOnMessage(data: string, socket: WebSocket) {
    // parse message
    // play it
    // if valid: communicate game state to all clients
    if (data.length > 262144) {
      socket.close(1009);
      let token = this.sockets.get(socket);
      this.game.removePlayer(token);
      this.sockets.delete(socket);
      this.updateClients();
    }

    // the socket is playing some card
    let res = JSON.parse(data);
    // handle ready signal
    if (res && res['play']) {
      switch(res['play']) {
        case "play":
          // user plays a card
          if (res['card'] && res['opts']) {
            let id = Number.parseInt(res['card']);
            if (this.game.playCard(this.sockets.get(socket), id, res['opts'])) {
              this.updateClients();
            } else {
              // formatting was valid, but it is not the user's turn
              socket.send("it's not your turn :(");
            }
          } else {
            // invalid format
            socket.send("invalid input");
          }

          return;
        case "draw":

          if (this.game.drawCard(this.sockets.get(socket))) {
            this.updateClients();
          } else {
            // not the player's turn to draw.
            socket.send("it's not your turn :(")
          }
          
          return;
      }
    }

    socket.send("invalid input");
  }

  socketOnClose(socket: WebSocket) {
    let token = this.sockets.get(socket);
    this.game.removePlayer(token);
    this.sockets.delete(socket);
    this.updateClients();
  }

  updateClients() {
    for (let socket of this.sockets) {
      socket[0].send(JSON.stringify(this.getGameState(socket[1])));
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