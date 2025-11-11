// Simple SW to mock session & settlement endpoints and hold current coins in memory.
let coinsCache = 1000;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('message', (e) => {
  try {
    const data = e.data || {};
    if (data.type === 'SET_COINS' && Number.isFinite(+data.coins)) {
      coinsCache = Math.max(0, Math.floor(+data.coins));
    }
  } catch {}
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Normalize path (handles both absolute and relative)
  const path = url.pathname;
  if (/\/api\/session$/i.test(path) || /\/api\/session/i.test(path)) {
    const body = JSON.stringify({ ok: true, session: 'DEMO_LOCAL', coins: coinsCache });
    event.respondWith(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return;
  }
  if (/\/api\/(settle|payout|cashout)/i.test(path)) {
    const body = JSON.stringify({ ok: true });
    event.respondWith(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return;
  }
  // passthrough
});