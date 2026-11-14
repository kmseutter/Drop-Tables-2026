const DELAY_SECONDS = 5;
let timerId = null;

function startTimer() {
  clearTimeout(timerId);
  timerId = setTimeout(async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });

    if (!tab?.id) {
      startTimer();
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "SHOW_DOOMSTOPPER"
      });
    } catch (error) {
      startTimer();
    }
  }, DELAY_SECONDS * 1000);
}

chrome.runtime.onInstalled.addListener(startTimer);
chrome.runtime.onStartup.addListener(startTimer);

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "RESET_TIMER") {
    startTimer();
  }
});
