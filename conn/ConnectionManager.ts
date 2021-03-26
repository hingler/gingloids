import * as WebSocket from "ws";
import { GingloidGame } from "../game/GingloidGame";
import { GingloidState, CardInfo, PlayerInfo } from "../game/GingloidState";

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
  sockets: Set<WebSocket>;

  constructor() {
    this.game = new GingloidGame();
    this.sockets = new Set();
  }

  addSocket(socket: WebSocket) {
    this.sockets.add(socket);
    // configure the socket so that messages are handled correctly :)
    // 
  }
}

export { ConnectionManager };