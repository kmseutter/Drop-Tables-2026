let timerId = null;

async function startTimer() {
  clearTimeout(timerId);
  const { delaySeconds } = await chrome.storage.local.get({ delaySeconds: 5 });

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
  }, delaySeconds  * 1000);
}

chrome.runtime.onInstalled.addListener(startTimer);
chrome.runtime.onStartup.addListener(startTimer);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "RESET_TIMER") {
    startTimer();
  }

  if (message.action == "QUIZ_CORRECT"){
    chrome.storage.local.get({correctAnswers: 0})
    .then(({correctAnswers}) =>
      chrome.storage.local.set({correctAnswers: correctAnswers + 1})
    )
    .then(() => sendResponse({saved: true}))
    .catch((error) => {
      console.error('Failed to save progress:', error);
      sendResponse({saved: false});
    });
  }
});
