/**
 * Shuffles an array in place.
 * @param {Array.<*>} arr - the array we want to shuffle 
 */
function shuffle(arr) {
  let ind = arr.length;
  while (ind > 0) {
    let swapIndex = Math.floor(Math.random() * ind);
    [arr[ind], arr[swapIndex]] = [arr[swapIndex], arr[ind]];
    ind--;
  }
}

export default shuffle;