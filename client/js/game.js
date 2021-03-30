(function() {
  const colors = (["red", "yellow", "blue", "green"]);

  let socket;
  let timeout = -1;
  let errbit = false;
  let globalPlayerToken = "";
  let globalGame = "";
  let globalName = "";

  window.addEventListener("load", main);

  function main() {
    if (!window.sessionStorage.getItem("color")) {
      window.sessionStorage.setItem("color", colors[Math.floor(Math.random() * colors.length)]);
    }
  
    document.querySelector("body").classList.add(window.sessionStorage.getItem("color"));
    document.querySelector("#name-entry-container button").addEventListener("click", createWebSocket);
  
    let game = getId();
    document.getElementById("game-id").textContent = game;
    document.getElementById("draw-pile").addEventListener("click", drawCard);
  }

  function getId() {
    let game = "";
    window.location.search.substr(1)
      .split("&")
      .forEach(function(e) {
        let arg = e.split("=");
        if (arg[0] === "id") {
          game = arg[1];
        }
    });

    return game;
  }

  function createSocket() {
    let socketUrl = "";
    if (window.location.protocol === "https:") {
      socketUrl += "wss://";
    } else {
      socketUrl += "ws://";
    }

    socketUrl += window.location.host;
    console.log(socketUrl);
    socket = new WebSocket(socketUrl);
  }

  /**
   * Creates the web socket used to communicate with the game server.
   */
  function createWebSocket() {
    document.querySelector("#name-entry-container button").removeEventListener("click", createWebSocket);
    createSocket();
    let name = document.getElementById("name-entry").value;
    if (!name || name.length <= 0) {
      name = "Default Daniel";
    }

    globalName = name;

    let game = getId();
    globalGame = game;

    if (game.length === 0) {
      console.error("no game id found!");
    } else {
      let packet = {
        "name": name,
        "game": game
      };

      socket.onopen = () => {
        socket.send(JSON.stringify(packet));
      };

      socket.addEventListener("message", socketHandleEvent);
      socket.addEventListener("close", recoverSocket);
      document.getElementById("ready-screen-container").classList.remove("hidden");
      document.getElementById("name-entry-container").classList.add("hidden");
      // add event listener to button
      document.getElementById("ready-button").addEventListener("click", readyUp);
    }
  }

  function recoverSocket() {
    if (!errbit) {
      // socket closed by chance
      // attempt to recreate socket
      console.warn("Disconnected from host. Attempting to reconnect...");
      socket.removeEventListener("message", socketHandleEvent);
      socket.removeEventListener("close", recoverSocket);
      socket.close();

      createSocket();

      let packet = {
        "name": globalName,
        "game": globalGame,
        "token": globalPlayerToken
      }

      socket.onopen = () => {
        socket.send(JSON.stringify(packet));
        console.log("Reconnected to host!");
      };

      socket.addEventListener("message", socketHandleEvent);
      socket.addEventListener("close", recoverSocket);
      console.log("hello!");
    }
  }

  function readyUp() {
    this.classList.toggle("readied");
    if (this.classList.contains("readied")) {
      this.textContent = "unready";
    } else {
      this.textContent = "ready";
    }

    let packet = {};
    packet.ready = this.classList.contains("readied");

    // send ready packet on socket
    socket.send(JSON.stringify(packet));
  }

  /**
   * Called whenever our socket receives an event.
   * @param {MessageEvent} event - event generated by a socket message. 
   */
  function socketHandleEvent(event) {
    let packet = JSON.parse(event.data);
    console.log(packet);
    switch (packet.type) {
      case "token":
        globalPlayerToken = packet.content;
        break;
      case "readyinfo":
        console.log("READYINFO");
        updateReadyState(packet.content);
        break;
      case "gamestart":
        document.getElementById("ready-button").removeEventListener("click", readyUp);
        document.getElementById("game-window").classList.add("reveal");
        break;
      case "gamestate":
        updateGameState(packet.content);
        break;
      case "error":
        handleError(packet.content);
        break;
      case "warning":
        console.warn("WARNING: " + packet.content);
        warn(packet.content);
        break;
      case "gameend":
        console.log("GAME OVER");
        handleGameEnding(packet.content);
    }
  }

  function handleGameEnding(content) {
    document.getElementById("win-msg").textContent = content;
    document.getElementById("win-container").classList.add("reveal");
    // place content in win text
    // start transition to reveal win screen
  }

  function warn(content) {
    // display a warning message
    // hide it in 5 seconds
    // note: we want to cancel the hide function if we come back again
    clearTimeout(timeout);
    let warn = document.getElementById("warn");
    const removeFunc = () => {
      warn.classList.add("hidden");
    }

    warn.textContent = content;
    warn.classList.remove("hidden");
    timeout = setTimeout(removeFunc, 5000);

  }

  function updateGameState(content) {
    if (content.myturn) {
      document.getElementById("game-window").classList.add("myturn");
    } else {
      document.getElementById("game-window").classList.remove("myturn");
    }

    for (let i = 0; i < content.players.length; i++) {
      let opponentElem = document.getElementById("opp" + (i + 1));
      if (content.players[i].playing) {
        opponentElem.classList.add("playing");
      } else {
        opponentElem.classList.remove("playing");
      }
      // remove all cards
      let cards = opponentElem.querySelectorAll(".card-ext");
      for (let card of cards) {
        opponentElem.removeChild(card);
      }

      // for adding style later
      let playerCards = [];
      for (let j = 0; j < content.players[i].cards; j++) {
        let card = createCard();
        opponentElem.appendChild(card);
        playerCards.push(card);
      }

      if (content.players[i].cards > 0) {
        let cardWidth = playerCards[0].clientWidth;
        let step = (opponentElem.clientWidth - cardWidth) / (content.players[i].cards - 1);
        for (let j = 0; j < playerCards.length; j++) {
          playerCards[j].style = "left: " + Math.round(step * j) + "px;";
        }
      }

      let opponentTitle = opponentElem.querySelector(".player-name");
      opponentTitle.textContent = content.players[i].name;
    }

    for (let j = content.players.length + 1; j <= 7; j++) {
      document.getElementById("opp" + (j)).classList.add("hidden");
    }

    // add my cards
    let myCardsElem = document.getElementById("my-cards");
    while (myCardsElem.children.length > 0) {
      myCardsElem.removeChild(myCardsElem.children[0]);
    }

    for (let card of content.hand) {
      if (card.value === "pick" || card.value === "+4") {
        card.color = undefined;
      }

      let cardElem = createCard(card.value, card.color);
      cardElem.addEventListener("mouseenter", () => {
        cardElem.classList.add("hover");
      });

      cardElem.addEventListener("mouseleave", () => {
        cardElem.classList.remove("hover");
      });

      cardElem.addEventListener("click", playCard);

      cardElem.id = "card-" + card.id;

      myCardsElem.appendChild(cardElem);
    }

    if (content.hand.length > 0) {
      // lay out cards
      let cardWidth = myCardsElem.children[0].clientWidth;
      let step = (myCardsElem.clientWidth - cardWidth) / (content.hand.length - 1);
      console.log(step);
      console.log(myCardsElem.clientWidth);
      for (let i = 0; i < content.hand.length; i++) {
        myCardsElem.children[i].style = "left: " + Math.round(step * i) + "px;";
      }
    }

    let discardPile = document.getElementById("discard-pile");
    while (discardPile.hasChildNodes()) {
      discardPile.removeChild(discardPile.firstChild);
    }

    let topDiscard = content.discard[content.discard.length - 1];
    discardPile.appendChild(createCard(topDiscard.value, topDiscard.color));
  }

  function createCard(value, color) {
    let cardExt = document.createElement("div");
    cardExt.classList.add("card-ext");
    let cardInt = document.createElement("div");
    cardInt.classList.add("card-int");
    if (value !== undefined) {
      let digitContainer = document.createElement("div");
      let tr = document.createElement("div");
      let ct = document.createElement("div");
      let bl = document.createElement("div");
      tr.classList.add("card-digit-tr");
      ct.classList.add("card-digit-ct");
      bl.classList.add("card-digit-bl");
      digitContainer.classList.add("digit-container");

      tr.appendChild(getCardValue(value));
      bl.appendChild(getCardValue(value));
      ct.appendChild(getCardValue(value));
      digitContainer.appendChild(tr);
      digitContainer.appendChild(ct);
      digitContainer.appendChild(bl);
      cardInt.appendChild(digitContainer);

      if (value === "pick" || value === "+4" && color === undefined) {
        // create our div shit
        let red = document.createElement("div");
        red.classList.add("card-portion", "red");
        let blue = document.createElement("div");
        blue.classList.add("card-portion", "blue");
        let yellow = document.createElement("div");
        yellow.classList.add("card-portion", "yellow");
        let green = document.createElement("div");
        green.classList.add("card-portion", "green");
        let colorHolder = document.createElement("div");
        colorHolder.classList.add("card-color-container");
        colorHolder.appendChild(red);
        colorHolder.appendChild(blue);
        colorHolder.appendChild(yellow);
        colorHolder.appendChild(green);
        cardInt.appendChild(colorHolder);
        cardExt.classList.add("pick-card")
      }
    }

    cardExt.appendChild(cardInt);
    if (color !== undefined) {
      cardExt.classList.add(color);
    }

    return cardExt;
  }

  /**
   * Called by a card when clicked.
   * Sends a message to the socket indicating that the card was clicked.
   */
  function playCard() {
    let id = Number.parseInt(this.id.split("-")[1], 10);
    if (!id) {
      console.error("INVALID CARD ID :sade:");
    }

    console.log(this.querySelector(".card-color-container"));
    
    // if its a pick card. add a listener which displays color value, and plays once that's selected
    if (this.classList.contains("pick-card")) {
      console.log("good!");
      // picker card
      // do picker animation
      // if we click outside the window, then ignore
      
      let colorWindow = document.getElementById("color-picker");
      colorWindow.classList.remove("hidden");
      let colors = colorWindow.querySelectorAll("#colors div");
      // click on a color, that's the color
      // click elsewhere, we're done.
      let outsideClickFunc = (e) => {
        let target = e.target;
        if (!colorWindow.contains(target) && !colorWindow.classList.contains("hidden")) {
          colorWindow.classList.add("hidden");
          document.removeEventListener("mousedown", outsideClickFunc);
          for (let color of colors) {
            color.removeEventListener("mousedown", colorClickFunc);
          }
        }
      };

      let colorClickFunc = (e) => {
        let col = e.target.id.split("-")[1];
        socket.send(JSON.stringify({
          play: "play",
          card: id,
          opts: {
            color: col
          }
        }));
        document.removeEventListener("mousedown", outsideClickFunc);
        for (let color of colors) {
          color.removeEventListener("mousedown", colorClickFunc);
        }

        colorWindow.classList.add("hidden");
      }

      document.addEventListener("mousedown", outsideClickFunc);
      for (let color of colors) {
        color.addEventListener("mousedown", colorClickFunc);
      }
    } else {
      console.log("played card ID " + id);
      // if card is a pick card, request a color from the user
  
      socket.send(JSON.stringify({
        play: "play",
        card: id
      }));
    }
  }

  function drawCard() {
    socket.send(JSON.stringify({
      play: "draw"
    }));
  }

  function getCardValue(value) {
    let elem = document.createElement("span");
    switch(value) {
      case "rev":
        '<i class="fas fa-undo-alt"></i>'
        elem.classList.add("fas", "fa-undo-alt");
        return elem;
      case "skip":
        elem.classList.add("fas", "fa-forward");
        return elem;
      case "pick":
          return elem;
      default:
        elem.textContent = value;
        return elem;
    }
  }

  /**
   * Called whenever the socket receives an update pertaining to the ready state of players.
   * @param {Array} content - an array of user names and their ready states.
   */
  function updateReadyState(content) {
    console.log(content);
    console.log("i was called");
    let playercount = 0;
    // create new elements somewhere
    // update player count
    let playerlist = document.getElementById("player-list");
    while (playerlist.children.length) {
      playerlist.removeChild(playerlist.children[0]);
    }

    let itemsInBox = 0;
    let itemBox = document.createElement("div");
    itemBox.classList.add("ready-state-pair");
    for (let item of content) {
      if (itemsInBox >= 2) {
        playerlist.appendChild(itemBox);
        itemBox = document.createElement("div");
        itemBox.classList.add("ready-state-pair");
        itemsInBox = 0;
      }

      let box = document.createElement("div");
      let name = document.createElement("p");
      box.classList.add("ready-state");
      name.textContent = item.name;
      box.appendChild(name);
      itemBox.appendChild(box);
      if (item.ready) {
        playercount++;
        box.classList.add("ready");
      }

      itemsInBox++;
    }

    playerlist.appendChild(itemBox);
    document.getElementById("player-count").textContent = "ready: " + playercount.toString(10) + "/" + content.length;
  }

  function handleError(content) {
    errbit = true;
    console.error(content);
    socket.close();
    document.querySelector("#error-container p").textContent = content;
    for (let divider of document.querySelectorAll(".bg-black")) {
      divider.classList.add("hidden");
    }

    document.getElementById("error-container").classList.remove("hidden");
  }
})();