// startanim.js
window.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `
    .entry-container {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: black;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      opacity: 1;
      transition: opacity 1s ease;
    }

    .tap-text {
      position: absolute;
      bottom: 5%;
      color: white;
      font-size: 1.2em;
      font-family: sans-serif;
      opacity: 0;
      animation: fadein 2s forwards, blink 1.2s infinite alternate 2s;
      white-space: nowrap;
      user-select: none;
    }

    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes blink {
      from { opacity: 1; }
      to { opacity: 0.4; }
    }

    .white-line {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 3px;
      background: white;
      filter: blur(2px);
      transform: translateY(-50%);
      transition: all 1s ease-in-out;
    }

    .wipe {
      height: 100%;
      filter: blur(0);
    }

    .fadeout-line {
      animation: fadeout-line 1s forwards;
    }

    @keyframes fadeout-line {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement("div");
  container.className = "entry-container";
  container.innerHTML = `
    <div class="white-line"></div>
    <div class="tap-text">tap/click to start...</div>
  `;
  document.body.appendChild(container);

  const line = container.querySelector(".white-line");
  const text = container.querySelector(".tap-text");

  function startWipe() {
    text.style.display = "none";
    line.classList.add("wipe");

    setTimeout(() => {
      line.classList.add("fadeout-line");
      // after the line fades, fade out the whole container
      setTimeout(() => {
        container.style.opacity = "0";
        setTimeout(() => container.remove(), 1000);
      }, 1000);
    }, 1000);
  }

  container.addEventListener("click", startWipe, { once: true });
  container.addEventListener("touchstart", startWipe, { once: true });
});
