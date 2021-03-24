import { default as generateId } from "./util/IDGenerator";
import { default as shuffle } from "./util/ShuffleArray";
import { default as GingloidPlayer } from "./GingloidPlayer";
import { CardColor, CardValue, GingloidCard } from "./GingloidCard";
import { default as GingloidState } from "./GingloidState";

import { default as DiscardPile } from "./cardpile/DiscardPile";
import { default as DrawPile } from "./cardpile/DrawPile";


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
    /** @type {DrawPile} */
    this.drawPile = new DrawPile();

    /** @type {DiscardPile} */
    this.discardPile = new DiscardPile();

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
            if (value === CardValue.WILD) {
              // only relevant after a pick
              continue;
            }

            this.drawPile.addCard(new GingloidCard(color, value, cardid++));
            if (value !== CardValue.ZERO
              && value !== CardValue.PICK
              && value !== CardValue.PICKFOUR) {
                this.drawPile.addCard(new GingloidCard(color, value, cardid++));
            }
          }
        }
      }
    }
    
    this.drawPile.shuffleDeck();

    // shuffle turn order
    shuffle(this.tokens);

    // give each player some number of cards
    // TODO: make card count a var
    for (let i = 0; i < 7; i++) {
      for (let player of this.players.values()) {
        player.addCard();
      }
    }

    this.prepareDiscardPile();
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

    res.discard = this.discardPile.getCards();
    res.draw = this.drawPile.length;
    res.hand = this.players.get(token).getCards();
    return res;
    // players need names!
  }

  /**
   * Prepares the discard pile.
   */
  prepareDiscardPile() {
    let discard = this.drawPile.drawCard();
    while (discard.value === CardValue.PICK || discard.value === CardValue.PICKFOUR) {
      this.discardPile.forceDiscard(discard);
      discard = this.drawPile.drawCard();
    }

    this.discardPile.forceDiscard(discard);
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
      if (this.drawPile.empty()) {
        for (let card in this.discardPile.getCards()) {
          this.drawPile.addCard(card);
        }

        this.discardPile.clear();
        this.drawPile.shuffleDeck();
        this.prepareDiscardPile();
      }

      this.players.get(token).addCard(this.drawPile.drawCard());
    }
  }

  advancePlayer() {
    this.nextPlayer += (this.reversed ? -1 : 1);
    while (this.nextPlayer < 0) {
      this.nextPlayer += this.players.length;
    } 
    
    while (this.nextPlayer >= this.players.length) {
      this.nextPlayer -= this.players.length;
    }
  }

  /**
   * Called when a player plays a card.
   * @param {String} token - the token of the player playing the card
   * @param {GingloidCard} card - the card being played by the player
   * @param {Object} opts - additional options for cards.
   * @param {CardColor} opts.color - if a color pick card is played, specifies which color should be used next.
   * @returns true if the card played is considered valid, false otherwise.
   */
  playCard(token, card, opts) {
    // verify that the token is associated with the player which is going next
    if (this.getNextPlayer() !== token) {
      return;
    }

    // verify that the card is in that player's hand
    let player = this.players.get(token);
    let cardHand = player.findCardById(card.id);
    if (!cardHand || cardHand.color !== card.color || cardHand.value != card.value) {
      // user claimed to have a card they don't have.
      return false;
    }

    // user has the card -- confirm that it can be discarded
    if (this.discardPile.discard(card, opts)) {
      // card can be discarded -- play is valid!
      player.removeCard(card.id);
  
      // handle its logic
      switch (card.value) {
        case CardValue.SKIP:
          this.nextPlayer += (this.reversed ? -1 : 1);
          break;
        case CardValue.REVERSE:
          this.reversed = !this.reversed;
          break;
        case CardValue.DRAWTWO:
          this.nextPlayer += (this.reversed ? -1 : 1);
          this.drawCard(this.players.get(this.nextPlayer).token);
          this.drawCard(this.players.get(this.nextPlayer).token);
          // can you combo off of a draw two?
          // i think its natural
        case CardValue.PICKFOUR:
          advancePlayer();
          this.drawCard(this.players.get(this.nextPlayer).token);
          this.drawCard(this.players.get(this.nextPlayer).token);
          this.drawCard(this.players.get(this.nextPlayer).token);
          this.drawCard(this.players.get(this.nextPlayer).token);
          break;
      }
      
      advancePlayer();
      return true;
    }
  
    // card could not be discarded -- invalid play
    return false;
  }
}