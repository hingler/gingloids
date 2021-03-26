
interface GingloidState {
  name: string;
  players: Array<PlayerInfo>;
  discard: Array<CardInfo>;
  draw: Number;
  hand: Array<CardInfo>;
}

interface PlayerInfo {
  name: string;
  cards: number;
}

interface CardInfo {
  color: string;
  value: string;
  id: number;
}

export { GingloidState, PlayerInfo, CardInfo };