let timerId = null;
let allowedUrls = null;


async function startTimer() {
  clearTimeout(timerId);
  chrome.storage.sync.get({ urls: [] }, ({ urls }) => {
    allowedUrls = urls
  });
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

    const parsedUrl = URL.parse(tab.url);

    if (!allowedUrls.includes(parsedUrl?.hostname) || !parsedUrl){
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
    .then(({correctAnswers}) => {
      return chrome.storage.local.set({correctAnswers: correctAnswers + 1});
    })
    .then(() => {sendResponse({saved: true})})
    .catch((error) => {
      console.error('Failed to save progress:', error);
      sendResponse({saved: false});
    });
    return true;
  }

  if (message.action === "QUIZ_WRONG") {
    chrome.storage.local.get({ correctAnswers: 0 })
      .then(({ correctAnswers }) => {
        const QUESTIONS_PER_LEVEL = 3;
        const currLevel = Math.floor(correctAnswers / QUESTIONS_PER_LEVEL) + 1;
        const prevLevel = Math.max(1, currLevel - 1);
        const newScore = (prevLevel - 1) * QUESTIONS_PER_LEVEL;
        return chrome.storage.local.set({correctAnswers: newScore});
      })
      .then(() => {
        sendResponse({ saved: true });
      })
      .catch((error) => {
        console.error('Failed to apply level penalty:', error);
        sendResponse({ saved: false });
      });
  
    return true;
  }
});
