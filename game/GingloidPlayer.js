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
   * @returns true if the card could be found, false otherwise.
   */
  findCard(color, value) {
    if (color.constructor.name != CardColor.name || value.constructor.name != CardValue.name) {
      return false;
    }

    for (let card of this.cards) {
      if (card.color === color && card.value === value) {
        return true;
      }
    }

    return false;
  }

  findCard(id) {
    for (let card of this.cards) {
      if (card.id === id) {
        return true;
      }
    }

    return false;
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

  /**
   * Removes the desired card from the hand.
   * @param {CardColor} color - color of the card we are looking for in the user's hand.
   * @param {CardValue} value - value of the card we are looking for in the user's hand.
   * @returns true if the card could be removed, false otherwise.
   */
  removeCard(color, value) {
    if (color.constructor.name != CardColor.name || value.constructor.name != CardValue.name) {
      return false;
    }
    
    for (let i = 0; i < this.cards.length; i++) {
      let card = this.cards[i];
      // future problem: distinguishing between cards with the same content
      // ideally, we would get a card at a particular index, see if it passes,
      // and then specifically remove that index.
      if (card.color === color && card.value === value) {
        this.cards.splice(i, 1);
        return true;
      }
    }

    return false;
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