const expect = require("chai").expect;
const DiscardPile = require("../game/cardpile/DiscardPile");
const { GingloidCard, CardColor, CardValue } = require("../game/GingloidCard");

describe("Discard pile", function() {
  describe("Creating a discard pile", function() {
    it("Initializes properly", function() {
      let pile = new DiscardPile();
      expect(pile.getCards().length).to.equal(0);
    });
  });

  describe("Adding to discard pile", function() {
    it("Will accept a force-discarded card", function() {
      let pile = new DiscardPile();
      pile.forceDiscard(new GingloidCard(CardColor.BLUE, CardValue.FIVE, 1));
      expect(pile.getCards().length).to.equal(1);
      expect(pile.getCards()[0].color).to.equal(CardColor.BLUE);
      expect(pile.getCards()[0].value).to.equal(CardValue.FIVE);
    });

    it("Will only accept valid discards", function() {
      let pile = new DiscardPile();
      // initial discard
      pile.forceDiscard(new GingloidCard(CardColor.RED, CardValue.SIX, 1));

      // same color
      expect(pile.discard(new GingloidCard(CardColor.RED, CardValue.ONE, 2))).to.be.true;
      expect(pile.getCards().length).to.equal(2);

      // same value
      expect(pile.discard(new GingloidCard(CardColor.GREEN, CardValue.ONE, 3))).to.be.true;
      expect(pile.getCards().length).to.equal(3);

      // invalid discard
      expect(pile.discard(new GingloidCard(CardColor.RED, CardValue.TWO, 4))).to.be.false;
      expect(pile.getCards().length).to.equal(3);

      // change color to green
      expect(pile.discard(new GingloidCard(CardColor.BLUE, CardValue.PICK, 5), { color: CardColor.GREEN })).to.be.true;
      expect(pile.getCards().length).to.equal(4);

      // verify color change
      expect(pile.discard(new GingloidCard(CardColor.BLUE, CardValue.ZERO, 15))).to.be.false;
      expect(pile.getCards().length).to.equal(4);

      // verify color change
      expect(pile.discard(new GingloidCard(CardColor.RED, CardValue.ONE, 22))).to.be.false;
      expect(pile.getCards().length).to.equal(4);

      // verify color change
      expect(pile.discard(new GingloidCard(CardColor.GREEN, CardValue.ZERO, 6))).to.be.true;
      expect(pile.getCards().length).to.equal(5);
    });
  });
});