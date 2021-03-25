/**
 * 
 * @param {Number} len - number of hex chars to generate.
 * @returns {String} randomly generated string of {len} hex chars.
 */
function generateId(len) {
  return crypto.getRandomValues(new Int8Array(len)).reduce((prev, acc) => {
    acc = acc.concat(acc, (prev & 15).toString(16));
  }, "");
}

modules.export = generateId;