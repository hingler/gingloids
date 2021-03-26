const expect = require("chai").expect;
const GingloidPlayer = require("../game/GingloidPlayer");
const { GingloidCard, CardColor, CardValue } = require("../game/GingloidCard");

describe("Gingloid player", function() {
  describe("Creating a new player", function() {
    it("Should initialize properly", function() {
      let player = new GingloidPlayer("myname");
      expect(player.cards.length).to.equal(0);
      expect(player.name).to.equal("myname");
    });
  });

  describe("Checking the player's hand", function() {
    it("Will return properly when checking for cards in hand by ID", function() {
      let player = new GingloidPlayer("dingus");
      player.addCard(new GingloidCard(CardColor.RED, CardValue.ONE, 1));
      let card = player.findCardById(1);
      expect(card).is.not.null;
      expect(card.color).to.equal(CardColor.RED);
      expect(card.value).to.equal(CardValue.ONE);
      expect(card.id).to.equal(1);

      card = player.findCardById(14641);
      expect(card).is.null;

      player.addCard(new GingloidCard(CardColor.RED, CardValue.ONE, 2));
      card = player.findCardById(2);
      expect(card).is.not.null;
      expect(card.color).to.equal(CardColor.RED);
      expect(card.value).to.equal(CardValue.ONE);
      expect(card.id).to.equal(2);
    });

    it("Removes cards from hand", function() {
      let player = new GingloidPlayer("bingus");
      player.addCard(new GingloidCard(CardColor.RED, CardValue.ONE, 1));
      player.addCard(new GingloidCard(CardColor.GREEN, CardValue.DRAWTWO, 2));
      let card = player.findCardById(1);
      expect(card).is.not.null;
      expect(card.color).to.equal(CardColor.RED);
      expect(card.value).to.equal(CardValue.ONE);
      expect(card.id).to.equal(1);

      expect(player.removeCard(1)).is.true;
      card = player.findCardById(1);
      expect(card).is.null;

      expect(player.removeCard(3)).is.false;
    });
  });
});