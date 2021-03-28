(function() {
  const colors = (["red", "yellow", "blue", "green"]);
  window.addEventListener("load", main);

  function main() {
    if (!window.sessionStorage.getItem("color")) {
      window.sessionStorage.setItem("color", colors[Math.floor(Math.random() * colors.length)]);
    }

    console.log("hello!");
  
    document.getElementById("name-entry-container").classList.add(window.sessionStorage.getItem("color"));
    console.log("test");
  }
})();