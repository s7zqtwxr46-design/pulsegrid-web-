// PulseGrid Sentinel — the small service worker that shows alerts on this
// device: web push sent by the database through the sentinel-push function
// (an SOS no nurse has taken, a panic alarm, sign-in or a website down, a
// society without a nurse after a shift start, an SOS still open). It only
// shows the alert and opens Sentinel when it is tapped; it keeps no copy of
// any page or data. Published next to Sentinel by tool/sentinel_web.py.

const URGENT = ['sos', 'sos2', 'panic', 'open', 'down', 'noshift'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let m = {};
  try {
    m = event.data ? event.data.json() : {};
  } catch (_) {
    m = { body: event.data ? event.data.text() : '' };
  }
  const urgent = URGENT.includes(m.alarm);
  const options = {
    body: m.body || '',
    icon: 'icons/Icon-192.png',
    badge: 'icons/Icon-192.png',
    requireInteraction: urgent,
    data: { url: m.url || self.registration.scope },
  };
  if (m.tag) {
    // A newer alert about the same thing replaces the older one, and still rings.
    options.tag = String(m.tag);
    options.renotify = true;
  }
  if (urgent) options.vibrate = [300, 150, 300, 150, 600];
  event.waitUntil(self.registration.showNotification(m.title || 'Sentinel', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(
    (async () => {
      const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of open) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
