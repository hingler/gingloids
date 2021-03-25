const { CardColor, CardValue, GingloidCard } = require("../GingloidCard");

/**
 * Abstraction of our discard pile.
 * Contains some number of discarded piles, and ensures that only valid cards are discarded.
 */

class DiscardPile {
  /**
   * Creates a new DiscardPile.
   */
  constructor() {
    /** @type {Array.<GingloidCard>} */
    this.cards = [];

    this.nextColor = CardColor.BLUE;
    this.nextValue = CardValue.WILD;
  }

  /**
   * Discards the provided card, if it is a valid discard.
   * @param {GingloidCard} card - the card being discarded.
   * @param {Object} opts - additional options depending on the card being discarded.
   * @param {CardColor} opts.color - if the card is a pick, the color to be set.
   * @returns {Boolean} true if the card could be discarded, and false otherwise.
   */
  discard(card, opts) {
    if (card.value !== CardValue.PICK && card.value !== CardValue.PICKFOUR) {
      if (card.color !== this.nextColor && card.value !== this.nextValue) {
        return false;
      }
    }

    this.cards.push(card);
    if (card.value === CardValue.PICK || card.value === CardValue.PICKFOUR) {
      this.nextColor = opts.color;
      this.nextValue = CardValue.WILD;
    } else {
      this.nextColor = card.color;
      this.nextValue = card.value;
    }
    return true;
  }

  /**
   * Discards a card irrespective of its validity, and places it atop the pile.
   * @param {GingloidCard} card - the card being discarded.
   */
  forceDiscard(card) {
    this.cards.push(card);
    this.nextColor = card.color;
    this.nextValue = card.value;
  }

  /**
   * Erases all cards in this discard pile.
   */
  clear() {
    this.cards = [];
  }

  getCards() {
    return this.cards.slice();
  }
};

module.exports = DiscardPile;