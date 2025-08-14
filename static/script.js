const chatEl = document.getElementById('chat');
const form = document.getElementById('chatForm');
const input = document.getElementById('message');
const micBtn = document.getElementById('micBtn');
const ttsToggle = document.getElementById('ttsToggle');
const tpl = document.getElementById('msgTemplate');

let recognizing = false;
let recognition = null;

function addMessage(role, text) {
  const node = tpl.content.cloneNode(true);
  const root = node.querySelector('.msg');
  root.classList.add(role);
  node.querySelector('.bubble').textContent = text;
  chatEl.appendChild(node);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function speak(text) {
  if (!ttsToggle.checked) return;
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  // Let the browser choose a default voice; keep it simple/cross-platform
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

async function sendMessage(text) {
  addMessage('user', text);
  input.value = '';

  // show a lightweight typing indicator
  const indicator = document.createElement('div');
  indicator.className = 'msg bot';
  indicator.innerHTML = '<div class="avatar"></div><div class="bubble">Thinking…</div>';
  chatEl.appendChild(indicator);
  chatEl.scrollTop = chatEl.scrollHeight;

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const data = await res.json();

    indicator.remove();
    addMessage('bot', data.response || '[No response]');
    speak(data.response || '');
  } catch (err) {
    indicator.remove();
    addMessage('bot', 'Error contacting server.');
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  sendMessage(text);
});

// Voice input using Web Speech API (client-side STT)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    recognizing = true;
    micBtn.classList.add('recording');
    micBtn.textContent = '⏺️';
  };
  recognition.onend = () => {
    recognizing = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎙️';
  };
  recognition.onerror = () => {
    recognizing = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎙️';
  };
  recognition.onresult = (e) => {
    const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
    if (text) {
      input.value = text;
      sendMessage(text);
    }
  };

  micBtn.addEventListener('click', () => {
    if (recognizing) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
} else {
  // Fallback: disable mic if API not supported
  micBtn.disabled = true;
  micBtn.title = 'Voice input not supported in this browser';
}