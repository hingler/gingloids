
// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const CardColor = Object.freeze({
  RED: "red",
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow"
});

const CardValue = Object.freeze({
  ZERO: "0",
  ONE: "1",
  TWO: "2",
  THREE: "3",
  FOUR: "4",
  FIVE: "5",
  SIX: "6",
  SEVEN: "7",
  EIGHT: "8",
  NINE: "9",
  SKIP: "skip",
  REVERSE: "rev",
  DRAWTWO: "+2",
  PICK: "pick",
  PICKFOUR: "+4",
  WILD: "wild"  // only relevant after a pick
});

class GingloidCard {
  /**
   * 
   * @param {string} color 
   * @param {string} value 
   * @param {Number} id - a unique identifier which can be used to differentiate the card.
   */
  constructor(color, value, id) {
    this.color = color;
    this.value = value;
    this.id = id;
  }
}

module.exports.GingloidCard = GingloidCard;
module.exports.CardColor = CardColor;
module.exports.CardValue = CardValue;