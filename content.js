(function () {

  if (window.doomstopperTimerSet) return;
  window.doomstopperTimerSet = true;

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

  function showOverlay() {
    if (document.getElementById('my-ext-overlay-host')) return;

    const quiz = quizzes.length > 0
      ? quizzes[Math.floor(Math.random() * quizzes.length)]
      : { question: "Quizzes haven't loaded yet. Continue?", choices: ["Yes"], answer: 0 };

    const scrollY = window.scrollY;
    const originalBodyStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      overflowY: document.body.style.overflowY
    };

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflowY = 'scroll';

    function preventScroll(e) {
      e.preventDefault();
    }
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });

    function closeOverlay() {
      document.body.style.position = originalBodyStyle.position;
      document.body.style.top = originalBodyStyle.top;
      document.body.style.left = originalBodyStyle.left;
      document.body.style.right = originalBodyStyle.right;
      document.body.style.overflowY = originalBodyStyle.overflowY;

      window.removeEventListener('wheel', preventScroll);
      window.removeEventListener('touchmove', preventScroll);
      host.remove();

      window.scrollTo({ top: scrollY, behavior: 'instant' });
      
      chrome.runtime.sendMessage({ action: "RESET_TIMER" });
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
          justify-content: center;
          align-items: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #a6adc8;
        }
        .quiz-progress {
          width: 100%;
          margin-bottom: 18px;
        }
        .quiz-progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
          color: #a6adc8;
        }
        .quiz-progress-track {
          width: 100%;
          height: 10px;
          background: #45475a;
          border-radius: 999px;
          overflow: hidden;
        }
        .quiz-progress-fill {
          width: 0%;
          height: 100%;
          background: #a6e3a1;
          border-radius: 999px;
          transition: width 0.3s ease;
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
          <h1 class="title">Doomstopper</h1>
        </div>

        <div class="quiz-progress">
          <div class="quiz-progress-info">
            <span id="quiz-level">Level 1</span>
            <span id="quiz-progress-text">0 / 3</span>
          </div>
          <div class="quiz-progress-track">
            <div
              id="quiz-progress-fill"
              class="quiz-progress-fill">
            </div>
          </div>
        </div>

        <p>Answer the following question to continue:</p>
        <div class="question">${quiz.question}</div>
        <div class="choices">${choicesHTML}</div>
        <div class="feedback" id="feedback"></div>
      </div>
    `;

    const buttons = shadow.querySelectorAll('.choice-btn');
    const feedback = shadow.getElementById('feedback');

    //Shows progress bar in page overlay
    const QUESTIONS_PER_LEVEL = 3;
    async function updateOverlayProgress(showCompletion = false){
      const {correctAnswers = 0} = await chrome.storage.local.get("correctAnswers");
      let level = Math.floor(correctAnswers / QUESTIONS_PER_LEVEL) + 1;
      let completed = correctAnswers % QUESTIONS_PER_LEVEL;
      if(showCompletion && correctAnswers > 0 && completed === 0){
        level -= 1;
        completed = QUESTIONS_PER_LEVEL;
      }
      const percentage = (completed / QUESTIONS_PER_LEVEL) * 100;

      shadow.getElementById('quiz-level').textContent = `Level ${level}`;
      shadow.getElementById('quiz-progress-text').textContent = `${completed} / ${QUESTIONS_PER_LEVEL}`;
      shadow.getElementById('quiz-progress-fill').style.width =`${percentage}%`;
      return completed === QUESTIONS_PER_LEVEL;
    }
    const initialProgressLoad = updateOverlayProgress().catch(console.error);

    let answered = false;
    buttons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (answered) return; //Prevents clicking the correct button multiple times for more points
        const selectedIndex = Number(btn.getAttribute('data-index'));

        if (selectedIndex === quiz.answer) {
          answered=true;
          btn.classList.add('correct');
          feedback.style.color = '#25b618';
          feedback.textContent = 'Correct! Resuming...';

          try {
            const response = await chrome.runtime.sendMessage({action: "QUIZ_CORRECT"});
            if (response?.saved){
              const levelCompleted = await updateOverlayProgress(true);
              //show level progress updating
              await new Promise(resolve => setTimeout(resolve, 1000));
              if(levelCompleted){
                //give time for progress animations to finish
                await new Promise(resolve => setTimeout(resolve, 700));
                await updateOverlayProgress();
                await new Promise(resolve => setTimeout(resolve, 500));
              }
              
            }else {
              console.error('Progress couldn\'t be saved in overlay');
            }
          } catch (error) {
            console.error('Failed to save progress', error);
          }
          
          closeOverlay();
        } else {
          btn.classList.add('wrong');
          feedback.textContent = 'Wrong answer — try again!';
        }
      });
    });

    document.body.appendChild(host);
  }

  loadQuizzes();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "SHOW_DOOMSTOPPER") {
      showOverlay();
    }
  });
})();