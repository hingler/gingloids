/**
 * Communicates complete state of the game.
 */
interface GingloidState {
  name: string;
  players: Array<PlayerInfo>;
  discard: Array<CardInfo>;
  draw: number;
  hand: Array<CardInfo>;
  myturn: boolean;
}

/**
 * Info on a player other than the client.
 */
interface PlayerInfo {
  name: string;
  cards: number;
  playing: boolean;
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
  ERROR = "error",
  WARN = "warning",
  GAMESTART = "gamestart",
  GAMEEND = "gameend"
}

interface PlayResult {
  win: string,     // contains winner msg if player one on last turn -- else, empty
  global: string,   // global notification
  local: {          // local notification for a single player
    affectedToken: string,
    result: string
  }
}

/**
 * Used to send messages to the client.
 */
interface DataPacket {
  type: string;
  content: any;
}

export { GingloidState, PlayerInfo, CardInfo, DataType, DataPacket, PlayResult };