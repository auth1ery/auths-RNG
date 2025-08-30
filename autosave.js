const autosaveMsg = document.getElementById("autosaveMessage");

function showAutosave() {
  autosaveMsg.textContent = "data saved!";
  autosaveMsg.style.opacity = "1";
  setTimeout(() => {
    autosaveMsg.style.opacity = "0";
  }, 1000); // fades out after 1 second
}

// Show message every 5 seconds
setInterval(showAutosave, 5000);
