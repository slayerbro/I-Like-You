const buttons = document.querySelectorAll('[data-answer]');
const scare = document.getElementById('scare');
const after = document.getElementById('after');
const again = document.getElementById('again');
let triggered = false;
let audioContext;

function makeNoise(ctx, duration) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function tone(ctx, type, startHz, endHz, start, duration, level, destination) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startHz, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endHz, 1), start + duration);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
}

function playScareSound() {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioContext;
    ctx.resume();
    const now = ctx.currentTime + .005;
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 7;
    master.gain.value = .72;
    master.connect(compressor).connect(ctx.destination);

    // A short low impact followed by an urgent, layered shriek.
    tone(ctx, 'sine', 105, 38, now, .55, .85, master);
    tone(ctx, 'sawtooth', 285, 890, now + .035, .7, .23, master);
    tone(ctx, 'sawtooth', 520, 1240, now + .045, .56, .14, master);
    tone(ctx, 'triangle', 735, 420, now + .22, .64, .13, master);

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoise(ctx, 1.15);
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(900, now);
    band.frequency.exponentialRampToValueAtTime(3300, now + .43);
    band.Q.value = .5;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(.38, now + .035);
    noiseGain.gain.exponentialRampToValueAtTime(.0001, now + 1.02);
    noise.connect(band).connect(noiseGain).connect(master);
    noise.start(now);
    noise.stop(now + 1.05);
  } catch (_) {
    // The visual still works if a browser blocks audio.
  }
}

function triggerScare() {
  if (triggered) return;
  triggered = true;
  scare.classList.add('active');
  scare.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  playScareSound();
  window.setTimeout(() => {
    scare.classList.remove('active');
    scare.setAttribute('aria-hidden', 'true');
    after.hidden = false;
    again.focus();
  }, 1650);
}

buttons.forEach(button => button.addEventListener('click', triggerScare));
again.addEventListener('click', () => {
  after.hidden = true;
  triggered = false;
  document.body.style.overflow = '';
  buttons[0].focus();
});
