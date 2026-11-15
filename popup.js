document.addEventListener('DOMContentLoaded', () => {
  const delayInput = document.getElementById('delayInput');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  
  const progressBar = document.getElementById('progressBar');
  const progressBarTrack = document.getElementById('progressBarTrack');
  const progressText = document.getElementById('progressText');
  const levelText = document.getElementById('levelText');
  const totalText = document.getElementById('totalText');
  const QUESTIONS_PER_LEVEL = 3;

  //Calculate and display level and progress bar width
  function updateProgress(correctAnswers) {
    const level = Math.floor(correctAnswers / QUESTIONS_PER_LEVEL) + 1;
    const completed = correctAnswers % QUESTIONS_PER_LEVEL;

    progressBar.style.width = `${(completed / QUESTIONS_PER_LEVEL) * 100}%`;
    progressBarTrack.setAttribute('aria-valuenow', String(completed));
    levelText.textContent = `Level ${level}`;
    progressText.textContent = `${completed} / ${QUESTIONS_PER_LEVEL} to next level`;
    totalText.textContent = `${correctAnswers} correct answers total`;
  }

  //Get num of correct answers when extension popup opened
  chrome.storage.local.get(
    {correctAnswers: 0},
    ({correctAnswers}) => {updateProgress(correctAnswers)}
  );

  //Updates progress bar if saved score changes while toolbar popup open
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.correctAnswers) {
      updateProgress(changes.correctAnswers.newValue ?? 0);
    }
  });

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
