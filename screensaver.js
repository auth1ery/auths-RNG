// screensaver.js

(function() {
  const messages = [
    "wake up",
    "theres more to come",
    "its not over yet",
    "come back",
    "it's okay",
    "you can rest for now",
    "hey loser wake up",
    "you're idle bro",
    "sfvszfhjksdhkshjsd",
    "such an asshole",
    "player please just wake up"
  ];

  let screensaver, textElem, idleTimer, messageTimer;

  function createScreensaver() {
    screensaver = document.createElement("div");
    screensaver.id = "screensaver";
    screensaver.style.position = "fixed";
    screensaver.style.top = 0;
    screensaver.style.left = 0;
    screensaver.style.width = "100%";
    screensaver.style.height = "100%";
    screensaver.style.display = "flex";
    screensaver.style.alignItems = "center";
    screensaver.style.justifyContent = "center";
    screensaver.style.background = "radial-gradient(circle at center, rgba(0,0,0,0.8), rgba(0,0,0,0.95))";
    screensaver.style.zIndex = 9999;
    screensaver.style.opacity = 0;
    screensaver.style.transition = "opacity 1.5s ease";
    screensaver.style.pointerEvents = "none";

    textElem = document.createElement("div");
    textElem.style.fontFamily = "monospace";
    textElem.style.fontSize = "2rem";
    textElem.style.color = "white";
    textElem.style.textShadow = "0 0 15px rgba(255,255,255,0.6)";
    textElem.style.whiteSpace = "pre";
    screensaver.appendChild(textElem);

    document.body.appendChild(screensaver);

    // psychedelic background animation
    let hue = 0;
    setInterval(() => {
      hue = (hue + 1) % 360;
      screensaver.style.background = `radial-gradient(circle at center, hsla(${hue},70%,40%,0.5), rgba(0,0,0,0.95))`;
    }, 50);
  }

  function typeWriter(text) {
    textElem.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      textElem.textContent += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 80);
  }

  function randomMessage() {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    typeWriter(msg);
  }

  function showScreensaver() {
    screensaver.style.pointerEvents = "auto";
    screensaver.style.opacity = 1;
    randomMessage();
    messageTimer = setInterval(randomMessage, 5000);
  }

  function hideScreensaver() {
    screensaver.style.opacity = 0;
    screensaver.style.pointerEvents = "none";
    clearInterval(messageTimer);
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showScreensaver, 120000); // 2 minutes
    if (screensaver && screensaver.style.opacity === "1") hideScreensaver();
  }

  // init
  createScreensaver();
  ["mousemove", "keydown", "mousedown", "touchstart"].forEach(evt =>
    document.addEventListener(evt, resetIdleTimer)
  );
  resetIdleTimer();
})();
