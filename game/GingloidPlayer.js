// uno players contain some number of cards
// players draw cards
// players have cards
// players play cards :)

// check if the user has a particular card
// remove a card from the user
// add a card to the user
// get the number of cards held by the user

import { GingloidCard, CardColor, CardValue } from "./GingloidCard";
import { default as generateId } from "./util/IDGenerator";

/**
 * A single player in uno.
 */
class GingloidPlayer {
  /**
   * Creates a new GingloidPlayer.
   * @param {String} name - name of the new player. 
   */
  constructor(name) {
    this.cards = [];
    this.token = generateId(16);
    this.name = name;
    // token is 16 hex value
  }
  
  /**
   * 
   * @param {CardColor} color - color of the card we are looking for in the user's hand.
   * @param {CardValue} value - value of the card we are looking for in the user's hand.
   * @returns {GingloidCard} the card if it could be found, and null otherwise.
   */
  findCardByFields(color, value) {
    if (color.constructor.name != CardColor.name || value.constructor.name != CardValue.name) {
      return null;
    }

    for (let card of this.cards) {
      if (card.color === color && card.value === value) {
        return card;
      }
    }

    return false;
  }

  /**
   * Finds a card by its identifier.
   * @param {Number} id - the identifier of our desired card 
   * @returns {GingloidCard} the card if it exists, and null otherwise.
   */
  findCardById(id) {
    for (let card of this.cards) {
      if (card.id === id) {
        return card;
      }
    }

    return null;
  }

  getToken() {
    return this.token;
  }

  /**
   * Adds a card to this player's hand/
   * @param {CardColor} color - color of the card we are looking for in the user's hand.
   * @param {CardValue} value - value of the card we are looking for in the user's hand.
   */
  addCard(color, value) {
    if (color.constructor.name == CardColor.name && value.constructor.name == CardValue.name) {
      this.cards.push(new GingloidCard(color, value));
    }
  }

  removeCard(id) {
    for (let i = 0; i < this.cards.length; i++) {
      let card = this.cards[i];
      if (card.id === id) {
        this.cards.splice(i, 1);
        return true;
      }
    }
  }

  

  /**
   * 
   * @returns a copy of all cards currently in this player's hand.
   */
  getCards() {
    return [...this.cards];
  }

  /**
   * 
   * @param {Number} i the index of the card we want.
   * @returns the card desired, or null if it does not exist.
   */
  getCard(i) {
    if (i >= this.cards.length || i < 0) {
      return null;
    }

    return this.cards[i];
  }

  /**
   * @returns the number of cards in this player's hand.
   */
  get cardCount() {
    return this.cards.length;
  } 
}

export default GingloidPlayer;