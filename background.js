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

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "RESET_TIMER") {
    startTimer();
  }
});
