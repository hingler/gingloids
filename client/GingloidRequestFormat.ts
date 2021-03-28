interface GingloidJoinGamePacket {
  game: string; // token associated with the game.
  name: string; // name of the new player.
};

interface GingloidPlayCardPacket {
  play: string; // the action performed by the client (typically: draw/play)
  card: number; // the ID of the card which was played by the client (if play).
  opts: {
    color: string;  // if a pick card is played, this specifies its color.
  }
}

interface GingloidReadyPacket {
  ready: boolean;
}

export { GingloidJoinGamePacket, GingloidPlayCardPacket };