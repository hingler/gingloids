const getRandomValues = require("get-random-values");

/**
 * 
 * @param {Number} len - number of hex chars to generate.
 * @returns {String} randomly generated string of {len} hex chars.
 */
function generateId(len) {
  return getRandomValues(new Uint8Array(len)).reduce((acc, prev) => {
    return acc.concat((prev & 15).toString(16));
  }, "");
}

module.exports = generateId;