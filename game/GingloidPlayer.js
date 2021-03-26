const { GingloidCard, CardColor, CardValue } = require("./GingloidCard");

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
    this.name = name;
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

  /**
   * Adds a card to this player's hand
   * @param {GingloidCard} card - the card being added.
   */
  addCard(card) {
    this.cards.push(card);
  }

  /**
   * Removes a card from this player's hand, if it exists.
   * @param {Number} id - the ID of the card being removed.
   * @returns {Boolean} true if the card could be removed, false otherwise.
   */
  removeCard(id) {
    for (let i = 0; i < this.cards.length; i++) {
      let card = this.cards[i];
      if (card.id === id) {
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

module.exports = GingloidPlayer;