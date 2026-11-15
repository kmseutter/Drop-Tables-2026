const urlForm = document.getElementById('urlForm');
const urlInput = document.getElementById('urlInput');
const urlList = document.getElementById('urlList');

// Render the list of URLs to the DOM
function renderUrls(urls) {
  urlList.innerHTML = '';
  
  urls.forEach((url, index) => {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.textContent = url;
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => removeUrl(index));
    
    li.appendChild(span);
    li.appendChild(removeBtn);
    urlList.appendChild(li);
  });
}

// Add a new URL to storage
urlForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newUrl = new URL(urlInput.value.trim());
  if (!newUrl) return;

  chrome.storage.sync.get({ urls: [] }, ({ urls }) => {
    if (!urls.includes(newUrl.hostname)) {
      const updatedUrls = [...urls, newUrl.hostname];
      chrome.storage.sync.set({ urls: updatedUrls }, () => {
        urlInput.value = '';
        renderUrls(updatedUrls);
      });
    } else {
      urlInput.value = '';
    }
  });
});

// Remove a URL by its index
function removeUrl(indexToRemove) {
  chrome.storage.sync.get({ urls: [] }, ({ urls }) => {
    const updatedUrls = urls.filter((_, index) => index !== indexToRemove);
    chrome.storage.sync.set({ urls: updatedUrls }, () => {
      renderUrls(updatedUrls);
    });
  });
}

// Load saved URLs when the options page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({ urls: [] }, ({ urls }) => {
    renderUrls(urls);
  });
});
