const buttons = document.querySelectorAll('[data-answer]');
const scene = document.getElementById('scene');
const scare = document.getElementById('scare');
const scareImage = scare.querySelector('img');
const audio = document.getElementById('scare-audio');
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let soundBuffer = null;
let triggered = false;

// Decode the short sound while the note is being read so a tap can play it immediately.
audio.load();
if (typeof scareImage.decode === 'function') {
  scareImage.decode().catch(() => {});
}

if (AudioContextClass && window.fetch) {
  try {
    audioContext = new AudioContextClass({ latencyHint: 'interactive' });
    fetch(audio.src, { cache: 'force-cache' })
      .then(response => {
        if (!response.ok) throw new Error('Audio fetch failed');
        return response.arrayBuffer();
      })
      .then(data => new Promise((resolve, reject) => {
        audioContext.decodeAudioData(data, resolve, reject);
      }))
      .then(buffer => {
        soundBuffer = buffer;
        audio.dataset.prepared = 'buffer';
      })
      .catch(() => {});
  } catch (_) {
    audioContext = null;
  }
}

function playElement() {
  try {
    const result = audio.play();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch (_) {}
}

function playSound() {
  if (audioContext && soundBuffer) {
    try {
      const source = audioContext.createBufferSource();
      source.buffer = soundBuffer;
      source.loop = true;
      source.connect(audioContext.destination);
      const resumed = audioContext.resume();
      source.start(0);
      scare.dataset.sound = 'buffer';
      if (resumed && typeof resumed.catch === 'function') {
        resumed.catch(playElement);
      }
      return;
    } catch (_) {
      // Older browsers can still play the preloaded audio element.
    }
  }
  scare.dataset.sound = 'element';
  playElement();
}

function triggerScare() {
  if (triggered) return;
  triggered = true;
  playSound();
  scare.classList.add('active');
  scare.setAttribute('aria-hidden', 'false');
  scene.inert = true;
  scene.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'hidden';
  document.querySelector('meta[name="theme-color"]').content = '#100000';
  try {
    scare.focus({ preventScroll: true });
  } catch (_) {
    scare.focus();
  }
  if (typeof navigator.vibrate === 'function') navigator.vibrate(100);
}

function warmAudio() {
  if (audioContext && soundBuffer && audioContext.state === 'suspended') {
    const resumed = audioContext.resume();
    if (resumed && typeof resumed.catch === 'function') resumed.catch(() => {});
  }
}

buttons.forEach(button => {
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse') triggerScare();
  });
  button.addEventListener('touchstart', warmAudio, { passive: true });
  button.addEventListener('touchend', warmAudio, { passive: true });
  button.addEventListener('click', triggerScare);
});
