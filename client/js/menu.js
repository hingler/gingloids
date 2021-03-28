(function() {

const colors = (["red", "yellow", "blue", "green"]);
window.addEventListener("load", main);

function main() {
  let items = document.querySelectorAll("#menu ul li");
  for (let item of items) {
    item.addEventListener("mouseenter", () => { item.classList.add("selected") });
    item.addEventListener("mouseleave", () => { item.classList.remove("selected") });
  }

  // save current color as cookie instead
  // set a default if the cookie does not exist
  if (!window.sessionStorage.getItem("color")) {
    window.sessionStorage.setItem("color", colors[Math.floor(Math.random() * colors.length)]);
  }

  document.querySelector("body").classList.add(window.sessionStorage.getItem("color"));

  let play = document.getElementById("play");
  play.addEventListener("click", function() {
    document.getElementById("joingame").classList.add("transition");
  });

  setTimeout(() => {
    // redirect the user to the "game" page
    // we'll get a game, send them to it, and then have them put in a name.
    fetch("/creategame").then(verifyConnection).then(async (resp) => { sendToGame(await resp.text()) });
  }, 2000);
}

function verifyConnection(resp) {
  if (resp.status < 200 || resp.status >= 400) {
    console.error("Failed to connect to host");
  }

  return resp;
}

function sendToGame(id) {
  window.location.href = ("/game.html?id=" + id);
}

})();