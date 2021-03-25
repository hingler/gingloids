const expect = require("chai").expect;
const DrawPile = require("../game/cardpile/DrawPile");
const { GingloidCard, CardColor, CardValue } = require("../game/GingloidCard");

describe("Draw pile", function() {
  describe("Creating draw piles", function() {
    it("Initializes properly", function() {
      let pile = new DrawPile();
      expect(pile.empty()).to.equal(true);
      expect(pile.drawCard()).to.equal(null);
    });
  });

  describe("Modifying draw piles", function() {
    it("Can store and retrieve a card", function() {
      let pile = new DrawPile();
      pile.addCard(new GingloidCard(CardColor.RED, CardValue.ONE, 1));
      let card = pile.drawCard();
      expect(card.color).to.equal(CardColor.RED);
      expect(card.value).to.equal(CardValue.ONE);
      expect(card.id).to.equal(1);
    });

    it("Can store and retrieve multiple cards", function() {
      let pile = new DrawPile();
      pile.addCard(new GingloidCard(CardColor.RED, CardValue.ONE, 1));
      pile.addCard(new GingloidCard(CardColor.BLUE, CardValue.TWO, 2));
      pile.addCard(new GingloidCard(CardColor.YELLOW, CardValue.THREE, 3));
      
      let cardDraw = pile.drawCard();
      expect(cardDraw.color).to.equal(CardColor.YELLOW);
      expect(cardDraw.value).to.equal(CardValue.THREE);
      expect(cardDraw.id).to.equal(3);

      cardDraw = pile.drawCard();
      expect(cardDraw.color).to.equal(CardColor.BLUE);
      expect(cardDraw.value).to.equal(CardValue.TWO);
      expect(cardDraw.id).to.equal(2);

      cardDraw = pile.drawCard();
      expect(cardDraw.color).to.equal(CardColor.RED);
      expect(cardDraw.value).to.equal(CardValue.ONE);
      expect(cardDraw.id).to.equal(1);
    });
  });
});
