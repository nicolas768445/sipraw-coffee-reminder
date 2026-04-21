// Sipraw Coffee Break Reminder — background.js

const ALARM_NAME = 'sipraw-coffee-break';

const coffeeMessages = [
  { title: "☕ Time for a Coffee Break!", body: "Your Sipraw tumbler is waiting — step away and recharge." },
  { title: "🌿 Sip & Breathe", body: "A little break = big productivity. Pour yourself something warm." },
  { title: "☕ Break Time, Champion!", body: "Top performers take breaks. Grab your Sipraw mug now." },
  { title: "🔔 Coffee O'Clock!", body: "Your focus session earned this. Time to sip and reset." },
  { title: "☕ Hydrate Your Hustle", body: "Cold brew or hot espresso — whatever fuels you. Sipraw has you covered." },
  { title: "🌟 Recharge Mode: ON", body: "Step away from the screen. A warm cup awaits." },
  { title: "☕ You've Earned It!", body: "Every great work session deserves a great coffee break." },
];

// Create or update alarm
async function setAlarm(intervalMinutes) {
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes
  });
  const nextBreak = Date.now() + intervalMinutes * 60 * 1000;
  chrome.storage.local.set({ nextBreak, intervalMinutes, enabled: true });
}

// Clear alarm
async function clearAlarm() {
  await chrome.alarms.clear(ALARM_NAME);
  chrome.storage.local.set({ enabled: false, nextBreak: null });
}

// Show notification
function showNotification() {
  const msg = coffeeMessages[Math.floor(Math.random() * coffeeMessages.length)];
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: msg.title,
    message: msg.body,
    priority: 2,
    buttons: [{ title: '☕ Visit Sipraw' }]
  });
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    showNotification();
    // Update next break time
    chrome.storage.local.get(['intervalMinutes'], (data) => {
      if (data.intervalMinutes) {
        const nextBreak = Date.now() + data.intervalMinutes * 60 * 1000;
        chrome.storage.local.set({ nextBreak });
      }
    });
  }
});

// Handle notification button click
chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
  if (btnIdx === 0) {
    chrome.tabs.create({ url: 'https://sipraw.com' });
  }
  chrome.notifications.clear(notifId);
});

// Re-register alarm on extension startup (service workers can restart)
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['enabled', 'intervalMinutes'], (data) => {
    if (data.enabled && data.intervalMinutes) {
      setAlarm(data.intervalMinutes);
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  // Set default: 60 minutes, disabled
  chrome.storage.local.set({ enabled: false, intervalMinutes: 60, nextBreak: null });
});

// Expose helpers to popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'setAlarm') {
    setAlarm(msg.intervalMinutes).then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === 'clearAlarm') {
    clearAlarm().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.action === 'testNotif') {
    showNotification();
    sendResponse({ ok: true });
  }
});
