// Sipraw Coffee Break Reminder — popup.js

const enableToggle  = document.getElementById('enableToggle');
const intervalSelect= document.getElementById('intervalSelect');
const statusBadge   = document.getElementById('statusBadge');
const statusText    = document.getElementById('statusText');
const countdownTime = document.getElementById('countdownTime');
const countdownLabel= document.getElementById('countdownLabel');
const ringProg      = document.getElementById('ringProg');
const ringLabel     = document.getElementById('ringLabel');
const testBtn       = document.getElementById('testBtn');
const resetBtn      = document.getElementById('resetBtn');
const shopLink      = document.getElementById('shopLink');
const toast         = document.getElementById('toast');

// Circumference of ring (r=45): 2*PI*45 ≈ 282.74
const CIRC = 282.74;
let countdownInterval = null;

// ── Toast ──
function showToast(msg, color = '#4caf82') {
  toast.style.background = color;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Ring progress ──
function setRing(fraction, active) {
  const offset = CIRC - (fraction * CIRC);
  ringProg.style.strokeDashoffset = Math.max(0, Math.min(CIRC, offset));
  if (active) {
    ringProg.classList.add('active');
  } else {
    ringProg.classList.remove('active');
    ringProg.style.strokeDashoffset = CIRC;
  }
}

// ── Format ms to MM:SS or HH:MM ──
function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── Update countdown display ──
function updateCountdown(nextBreak, intervalMinutes, enabled) {
  if (countdownInterval) clearInterval(countdownInterval);

  if (!enabled || !nextBreak) {
    countdownTime.textContent = '— : —';
    countdownTime.classList.add('inactive');
    countdownLabel.textContent = 'Next break in';
    setRing(0, false);
    ringLabel.textContent = 'Idle';
    return;
  }

  countdownTime.classList.remove('inactive');
  const totalMs = intervalMinutes * 60 * 1000;

  function tick() {
    const remaining = nextBreak - Date.now();
    if (remaining <= 0) {
      countdownTime.textContent = '00:00';
      setRing(1, true);
      ringLabel.textContent = 'Break!';
      return;
    }
    countdownTime.textContent = formatTime(remaining);
    const elapsed = totalMs - remaining;
    setRing(elapsed / totalMs, true);
    ringLabel.textContent = 'Active';
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

// ── Update UI state ──
function applyState(enabled, intervalMinutes, nextBreak) {
  // Toggle
  enableToggle.checked = enabled;

  // Interval
  intervalSelect.value = String(intervalMinutes);

  // Badge
  statusBadge.className = `status-badge ${enabled ? 'on' : 'off'}`;
  statusText.textContent = enabled ? 'Reminders on' : 'Reminders off';

  // Countdown
  updateCountdown(nextBreak, intervalMinutes, enabled);
}

// ── Load stored state ──
chrome.storage.local.get(['enabled', 'intervalMinutes', 'nextBreak'], (data) => {
  const enabled = data.enabled || false;
  const intervalMinutes = data.intervalMinutes || 60;
  const nextBreak = data.nextBreak || null;
  applyState(enabled, intervalMinutes, nextBreak);
});

// ── Toggle reminders ──
enableToggle.addEventListener('change', () => {
  const enabled = enableToggle.checked;
  const intervalMinutes = parseInt(intervalSelect.value, 10);

  if (enabled) {
    chrome.runtime.sendMessage({ action: 'setAlarm', intervalMinutes }, () => {
      const nextBreak = Date.now() + intervalMinutes * 60 * 1000;
      applyState(true, intervalMinutes, nextBreak);
      showToast('✅ Reminders activated!');
    });
  } else {
    chrome.runtime.sendMessage({ action: 'clearAlarm' }, () => {
      applyState(false, intervalMinutes, null);
      showToast('Reminders paused', '#c47b2b');
    });
  }
});

// ── Interval change ──
intervalSelect.addEventListener('change', () => {
  if (enableToggle.checked) {
    const intervalMinutes = parseInt(intervalSelect.value, 10);
    chrome.runtime.sendMessage({ action: 'setAlarm', intervalMinutes }, () => {
      const nextBreak = Date.now() + intervalMinutes * 60 * 1000;
      applyState(true, intervalMinutes, nextBreak);
      showToast(`⏰ Interval updated to ${intervalMinutes} min`);
    });
  }
});

// ── Test notification ──
testBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'testNotif' });
  showToast('☕ Test notification sent!');
});

// ── Reset ──
resetBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'clearAlarm' }, () => {
    enableToggle.checked = false;
    intervalSelect.value = '60';
    applyState(false, 60, null);
    showToast('Reset done', '#c47b2b');
  });
});

// ── Shop link ──
shopLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://sipraw.com' });
});
