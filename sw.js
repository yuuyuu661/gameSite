let coinsCache = 1000;
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => {
  try{
    const d = e.data || {};
    if (d.type === 'SET_COINS' && Number.isFinite(+d.coins)) {
      coinsCache = Math.max(0, Math.floor(+d.coins));
    }
  }catch{}
});
self.addEventListener('fetch', (event) => {
  const path = new URL(event.request.url).pathname;
  if (/\/api\/session/i.test(path)) {
    const body = JSON.stringify({ ok: true, session: 'DEMO_LOCAL', coins: coinsCache });
    event.respondWith(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return;
  }
  if (/\/api\/(settle|payout|cashout)/i.test(path)) {
    const body = JSON.stringify({ ok: true });
    event.respondWith(new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }));
    return;
  }
  // passthrough for other requests
});