import { default as generateId } from "./util/IDGenerator";
import { default as shuffle } from "./util/ShuffleArray";
import { default as GingloidPlayer } from "./GingloidPlayer";
import { CardColor, CardValue, GingloidCard } from "./GingloidCard";
import { default as GingloidState } from "./GingloidState";


class GingloidGame {
  constructor() {
    // this game's token
    this.token = generateId(8);

    // map between a token and a player
    /** @type {Map<String, GingloidPlayer>} */
    this.players = new Map();

    // array of player tokens
    this.tokens = [];

    // true if the game has started -- will reject players
    this.gameStarted = false;

    // list of cards to be drawn -- last card is top of pile.
    this.drawPile = [];

    // discard pile for this game -- last card is top of pile.
    this.discardPile = [];

    // the next player to go
    this.nextPlayer = 0;

    // true if we are going in reverse order -- false otherwise
    this.reversed = false;
  }

  /**
   * Called when a new player joins the game.
   * @param {String} name - the name of the new player
   * @returns {string} the id of the new player.
   */  
  generatePlayer(name) {
    // called when a player joins a game - returns their token, and adds their player to an internal list
    if (!this.gameStarted) {
      let playerToken;
      do {
        playerToken = generateId(16);
      } while (this.players.get(playerToken));
      this.players.set(playerToken, new GingloidPlayer(name));
      this.tokens.push(playerToken);
      return playerToken;
    }

    return null;
  }

  /**
   * Starts a game of Gingloids.
   */
  startGame() {
    this.gameStarted = true;
    // set up draw pile
      // generate cards
    let cardid = 0;
    for (let color in CardColor) {
      if (CardColor.hasOwnProperty(color)) {
        for (let value in CardValue) {
          if (CardValue.hasOwnProperty(value)) {
            this.drawPile.push(new GingloidCard(color, value, cardid++));
            if (value !== CardValue.ZERO
              && value !== CardValue.PICK
              && value !== CardValue.PICKFOUR) {
                this.drawPile.push(new GingloidCard(color, value, cardid++));
            }
          }
        }
      }
    }
    
    // shuffling cards
    shuffle(this.drawPile);

    // shuffle turn order
    shuffle(this.tokens);

    // give each player some number of cards
    // TODO: make card count a var
    for (let i = 0; i < 7; i++) {
      for (let player of this.players.values()) {
        player.addCard();
      }
    }

    // game is ready!
  }

  /**
   * Returns information on the state of this uno game for a given player.
   * @param {String} token - token of the player requesting info
   * @returns {GingloidState} - the current state of the game.
   */
  getGameInfo(token) {
    // verify that the token exists
    if (!this.players.get(token)) {
      return null;
    }
    
    let res = new GingloidState();
    res.name = this.players.get(token).name;
    for (let player of this.players.values()) {
      res.players.push({
        "player": player.name,
        "cardCount": player.cardCount
      });
    }

    res.discard = this.discardPile.slice();
    res.draw = this.drawPile.length;
    res.hand = this.players.get(token).getCards();
    return res;
    // players need names!
  }

  /**
   * @returns {Map.<String, GingloidPlayer>} - an map associating player tokens with players.
   */
  getPlayers() {
    return this.players;
  }

  /**
   * @returns {String} - the token of the player who is playing next
   */
  getNextPlayer() {
    return this.tokens[this.nextPlayer];
  }

  /**
   * Called whenever a player must draw a card.
   * @param {String} token - the token of the player drawing a card.
   */
  drawCard(token) {
    if (this.players.get(token)) {
      this.players.get(token).addCard(this.drawPile.pop());
    }
  }

  /**
   * Called when a player plays a card.
   * @param {String} token - the token of the player playing the card
   * @param {*} card - the card being played by the player
   */
  playCard(token, card) {
    // verify that the token is associated with the player which is going next
    // verify that the card is in that player's hand
    // play the card
    // handle its logic
    // advance to the next player
  }
}