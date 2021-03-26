import * as WebSocket from "ws";
import { ConnectionManager } from "./ConnectionManager"
import generateId = require("../game/util/IDGenerator")
import { GingloidGame } from "../game/GingloidGame";

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
    return id;
  }

  /**
   * Adds a socket to this broker.
   * @param socket - the socket being added
   */
  addSocket(socket: WebSocket) {
    // add event which will handle sockets asynchronously when they appear
    socket.on("message", (data: string) => { this.socketOnMessage(data, socket) });
    this.sockets.add(socket);
  }

  /**
   * Callback function for sockets upon receiving a message.
   * @param data - the data sent to this socket.
   * @param socket - the socket itself.
   * @returns void.
   */
  private socketOnMessage(data: string, socket: WebSocket) {
    let result = JSON.parse(data);
    if (result && result['game']) {
      let game = this.games.get(result['game']);
      if (game) {
        this.sockets.delete(socket);
        game.addSocket(socket);
        return;
      }
    }
    
    // game is not valid
    socket.send("INVALID GAME CODE");
    socket.close();
    this.sockets.delete(socket);
  }
}