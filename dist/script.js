const buttons = document.querySelectorAll('[data-answer]');
const scene = document.getElementById('scene');
const scare = document.getElementById('scare');
const audio = document.getElementById('scare-audio');
let triggered = false;

function triggerScare() {
  if (triggered) return;
  triggered = true;
  audio.play().catch(() => {});
  scare.classList.add('active');
  scare.setAttribute('aria-hidden', 'false');
  scene.inert = true;
  document.body.style.overflow = 'hidden';
  scare.focus({ preventScroll: true });
}

buttons.forEach(button => button.addEventListener('click', triggerScare));
