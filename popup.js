document.addEventListener('DOMContentLoaded', () => {
  const delayInput = document.getElementById('delayInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Guard check in case an ID is missing in hello.html
  if (!delayInput || !saveBtn) {
    console.error('Missing delayInput or saveBtn in hello.html');
    return;
  }

  chrome.storage.local.get({ delaySeconds: 5 }, (data) => {
    delayInput.value = data.delaySeconds;
  });

  saveBtn.addEventListener('click', () => {
    const newDelay = Math.max(1, Number(delayInput.value) || 5);
    delayInput.value = newDelay;

    chrome.storage.local.set({ delaySeconds: newDelay }, () => {
      chrome.runtime.sendMessage({ action: "RESET_TIMER" });
      if (statusDiv) {
        statusDiv.textContent = `Saved! Timer set to ${newDelay}s.`;
        setTimeout(() => (statusDiv.textContent = ''), 2000);
      }
    });
  });
});
