/**
 * Shuffles an array in place.
 * @param {Array.<*>} arr - the array we want to shuffle 
 */
function shuffle(arr) {
  let ind = arr.length - 1;
  while (ind > 0) {
    let swapIndex = Math.floor(Math.random() * ind);
    ind--;
    
    if (ind !== swapIndex) {
      [arr[ind], arr[swapIndex]] = [arr[swapIndex], arr[ind]];
    }

  }
}

module.exports = shuffle;