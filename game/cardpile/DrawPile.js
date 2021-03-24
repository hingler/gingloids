import { CardColor, CardValue, GingloidCard } from "../GingloidCard"
import { default as shuffle } from "../util/ShuffleArray"

/**
 *  Abstraction of a pile of cards.
 *  Contains some number of cards.
 */
class DrawPile {
  constructor() {
    /** @type {Array.<GingloidCard>} */
    this.cards = [];
  }

  /**
   * Add a card to this draw pile.
   * @param {GingloidCard} card - the card being added to this pile.
   */
  addCard(card) {
    this.cards.push(card);
  }

  /**
   * Shuffles this DrawPile.
   */
  shuffleDeck() {
    shuffle(this.cards);
  }

  /**
   * Draws a single card from the draw pile.
   * @returns {GingloidCard} - the card just drawn from the draw pile. If the pile is empty, returns null.
   */
  drawCard() {
    if (this.cards.length <= 0) {
      return null;
    }

    return this.cards.pop();
  }

  /**
   * @returns {Boolean} true if this card pile is empty, false otherwise.
   */
  empty() {
    return this.cards.length === 0;
  }
};

export default DrawPile;