(function () {

  const DELAY_SECONDS = 5;

  function showOverlay() {
    if (document.getElementById('my-ext-overlay-host')) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    function preventScroll(e) {
      e.preventDefault();
    }
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    function closeOverlay() {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      host.remove();
    }

    const host = document.createElement('div');
    host.id = 'my-ext-overlay-host';

    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '2147483647'
    });

    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        .overlay-box {
          background: #1e1e2e;
          color: #ffffff;
          font-family: system-ui, sans-serif;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          width: 300px;
          text-align: center;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 12px;
        }
        button {
          background: none;
          border: none;
          color: #aaa;
          cursor: pointer;
          font-size: 20px;
        }
        button:hover { color: #fff; }
      </style>

      <div class="overlay-box">
        <div class="header">
          <span>Doomstopper</span>
          <button id="close-btn">&times;</button>
        </div>
        <p style="margin: 0; font-size: 14px;">
          You've been on this page for ${DELAY_SECONDS} seconds.</p>
        <p>Answer the following question to continue:</p>
        <p>What is your favourite colour?</p>
      </div>
    `;

    shadow.getElementById('close-btn').addEventListener('click', closeOverlay);
    document.body.appendChild(host);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "SHOW_DOOMSTOPPER") {
      showOverlay();
    }
  });
})();