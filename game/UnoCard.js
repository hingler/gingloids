
// https://stackoverflow.com/questions/287903/what-is-the-preferred-syntax-for-defining-enums-in-javascript
const CardColor = Object.freeze({
  RED: {},
  BLUE: {},
  GREEN: {},
  YELLOW: {}
});

const CardValue = Object.freeze({
  ZERO: {},
  ONE: {},
  TWO: {},
  THREE: {},
  FOUR: {},
  FIVE: {},
  SIX: {},
  SEVEN: {},
  EIGHT: {},
  NINE: {},
  SKIP: {},
  REVERSE: {},
  DRAWTWO: {},
  PICK: {},
  PICKFOUR: {}
});

class UnoCard {
  constructor(color, value) {
    this.color = color;
    this.value = value;
  }

  get color() {
    return this.color;
  }

  get value() {
    return this.value;
  }
}

module.exports.UnoCard = UnoCard;
module.exports.CardColor = CardColor;
module.exports.CardValue = CardValue;