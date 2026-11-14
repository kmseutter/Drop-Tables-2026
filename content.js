(function() {
  if (document.getElementById('my-ext-overlay-host')) return;

  const originalHtmlOverflow = document.documentElement.style.overflow;
  const originalBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  function closeOverlay() {
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
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
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        width: 260px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        margin-bottom: 8px;
      }
      button {
        background: none;
        border: none;
        color: #aaa;
        cursor: pointer;
        font-size: 16px;
      }
      button:hover { color: #fff; }
    </style>

    <div class="overlay-box">
      <div class="header">
        <span>Doomstopper</span>
        <button id="close-btn">&times;</button>
      </div>
      <p style="margin: 0; font-size: 14px;">
        Go touch grass!
      </p>
    </div>
  `;

  shadow.getElementById('close-btn').addEventListener('click', closeOverlay);

  document.body.appendChild(host);
})();
