const ALARM_NAME = "doomstopper-interruption";

async function createAlarm() {
  const existingAlarm = await chrome.alarms.get(ALARM_NAME);

  if (!existingAlarm) {
    await chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 5 / 60,
      periodInMinutes: 5 / 60
    });
  }
}

chrome.runtime.onInstalled.addListener(createAlarm);
chrome.runtime.onStartup.addListener(createAlarm);

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (!tab?.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action: "SHOW_DOOMSTOPPER"
    });
  } catch (error) {
    // The active tab may not have our content script.
    console.log("Doomstopper is not active on this tab.");
  }
});
