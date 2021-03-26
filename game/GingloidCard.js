
// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const CardColor = Object.freeze({
  RED: "red",
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow"
});

const CardValue = Object.freeze({
  ZERO: "zero",
  ONE: "one",
  TWO: "two",
  THREE: "three",
  FOUR: "four",
  FIVE: "five",
  SIX: "six",
  SEVEN: "seven",
  EIGHT: "eight",
  NINE: "nine",
  SKIP: "skip",
  REVERSE: "reverse",
  DRAWTWO: "+2",
  PICK: "pick",
  PICKFOUR: "pick+4",
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