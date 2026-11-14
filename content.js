(function () {

  const DELAY_SECONDS = 5;
  if (window.doomstopperTimerSet) return;
  window.doomstopperTimerSet = true;

  let timerId = null;
  let quizzes = [];

  async function loadQuizzes() {
    try {
      const url = chrome.runtime.getURL('quiz.json');
      const response = await fetch(url);
      const data = await response.json();
      quizzes = data.quizzes || [];
    } catch (err) {
      console.error('Doomstopper failed to load quiz.json:', err);
    }
  }
  
  function startTimer() {
    clearTimeout(timerId);
    timerId = setTimeout(showOverlay, DELAY_SECONDS * 1000);
  }

  function showOverlay() {
    if (document.getElementById('my-ext-overlay-host')) return;

    const quiz = quizzes.length > 0
      ? quizzes[Math.floor(Math.random() * quizzes.length)]
      : { question: "Quizzes haven't loaded yet. Continue?", choices: ["Yes"], answer: 0 };

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

      startTimer();
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

    const choicesHTML = quiz.choices
      .map((choice, index) => `<button class="choice-btn" data-index="${index}">${choice}</button>`)
      .join('');

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
          .title {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a6adc8;
          margin-bottom: 8px;
        }
        .question {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .choices {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
          .choice-btn {
          background: #313244;
          border: 1px solid #45475a;
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.15s;
        }
        .choice-btn:hover {
          background: #45475a;
        }
        .choice-btn.wrong {
          background: #f38ba8;
          color: #11111b;
          border-color: #f38ba8;
        }
        .choice-btn.correct {
          background: #a6e3a1;
          color: #11111b;
          border-color: #a6e3a1;
        }
        .feedback {
          margin-top: 12px;
          font-size: 13px;
          min-height: 18px;
          color: #f38ba8;
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
        </div>
        <p style="margin: 0; font-size: 14px;">
          You've been on this page for ${DELAY_SECONDS} seconds.</p>
        <p>Answer the following question to continue:</p>
        <div class="question">${quiz.question}</div>
        <div class="choices">${choicesHTML}</div>
        <div class="feedback" id="feedback"></div>
      </div>
    `;

    const buttons = shadow.querySelectorAll('.choice-btn');
    const feedback = shadow.getElementById('feedback');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedIndex = Number(btn.getAttribute('data-index'));

        if (selectedIndex === quiz.answer) {
          btn.classList.add('correct');
          feedback.style.color = '#25b618';
          feedback.textContent = 'Correct! Resuming...';
          setTimeout(closeOverlay, 600);
        } else {
          btn.classList.add('wrong');
          feedback.textContent = 'Wrong answer — try again!';
        }
      });
    });

    document.body.appendChild(host);
  }

  loadQuizzes().then(startTimer);
})();