import {default as generateId } from "./util/IDGenerator.js";


class UnoGame {
  constructor() {
    this.token = generateId(8);
  }

  generatePlayer() {
    // called when a player joins a game - returns their token
  }

  // game starts (set up draw pile, discard pile, and give all players cards)
  // obfuscate draw pile
  // player draws a card (verify turn order is correct, etc)
  // player plays a card (verify turn order is correct, etc)

  // generate some game state output once these turns are played
    // use a player token, return only what that player can know (their hand, plus size of opponents' hands)
    // all draw logic can be handled server side
}