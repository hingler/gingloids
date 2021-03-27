(function() {

const colors = (["red", "yellow", "blue", "green"]);
window.addEventListener("load", main);

function main() {
  let items = document.querySelectorAll("ul li");
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
}

})();