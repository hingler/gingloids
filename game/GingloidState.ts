/**
 * Communicates complete state of the game.
 */
interface GingloidState {
  name: string;
  players: Array<PlayerInfo>;
  discard: Array<CardInfo>;
  draw: number;
  hand: Array<CardInfo>;
}

/**
 * Info on a player other than the client.
 */
interface PlayerInfo {
  name: string;
  cards: number;
}

/**
 * Info on a single card.
 */
interface CardInfo {
  color: string;
  value: string;
  id: number;
}

enum DataType {
  STATE = "state",
  TOKEN = "token",
  READYINFO = "readyinfo",
  GAMESTATE = "gamestate",
  ERROR = "error"
}

/**
 * Used to send messages to the client.
 */
interface DataPacket {
  type: string;
  content: any;
}

export { GingloidState, PlayerInfo, CardInfo, DataType, DataPacket };