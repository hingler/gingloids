import * as WebSocket from "ws";
import { ConnectionManager } from "./ConnectionManager"
import generateId = require("../game/util/IDGenerator")
import { GingloidJoinGamePacket } from "../client/GingloidRequestFormat"

/**
 * When new sockets are created, this class stores them temporarily before
 * they can be associated with a game.
 */
class SocketBroker {
  // maps game tokens to the managers responsible for them
  games: Map<String, ConnectionManager>;

  // stores new sockets which have yet to be associated with a game
  sockets: Set<WebSocket>;

  constructor() {
    this.games = new Map();
    this.sockets = new Set();
  }

  /**
   * Creates a new game and returns the ID associated with it.
   * @returns ID.
   */
  createGame() : string {
    let id : string;
    do {
      id = generateId(8);
    } while (this.games.has(id));
    
    this.games.set(id, new ConnectionManager());
    console.log("Created new game with id " + id);
    return id;
  }

  /**
   * Adds a socket to this broker.
   * @param socket - the socket being added
   */
  addSocket(socket: WebSocket) {
    // add event which will handle sockets asynchronously when they appear
    socket.addEventListener("message", this.socketMessageCallback );
    socket.on("close", () => { this.sockets.delete(socket) });
    this.sockets.add(socket);
  }

  private socketMessageCallback(event) {
    (event.target as WebSocket).removeEventListener("message", this.socketMessageCallback);
    this.socketOnMessage(event.data, event.target as WebSocket);
  }

  /**
   * Callback function for sockets upon receiving a message.
   * @param data - the data sent to this socket.
   * @param socket - the socket itself.
   * @returns void.
   */
  private socketOnMessage(data: string, socket: WebSocket) {
    if (data.length > 131072) { // 128k -- should be a reasonable upper bound for requests
      socket.close(1009);
      this.sockets.delete(socket);
      return;
    }

    let result = JSON.parse(data);
    // we should prevent this from being too large
    if (result && result['game'] && result['name']) {
      let game = this.games.get(result['game']);
      if (game) {
        game.addSocket(socket, result['name']);
        this.sockets.delete(socket);
        return;
      }
    }
    
    // game is not valid
    socket.send("INVALID GAME CODE");
    socket.close(1011);
    this.sockets.delete(socket);
  }
}

export { SocketBroker };