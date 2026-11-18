// Service worker: tiene l'app disponibile anche senza segnale.
// Quando aggiorni i file, cambia il numero di versione qui sotto.
const VERSIONE = "liv-v6";
const FILE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "dati.enc"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== VERSIONE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // i dati cifrati: prima la rete (per sapere se ci sono aggiornamenti), senza segnale la copia salvata
  if (e.request.url.endsWith("dati.enc")) {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSIONE).then(x => x.put("dati.enc", c)); } return r; })
      .catch(() => caches.match("dati.enc")));
    return;
  }
  // il resto: prima la copia salvata (si apre subito anche senza segnale), aggiornamento in sottofondo
  e.respondWith(
    caches.open(VERSIONE).then(c => c.match(e.request, { ignoreSearch: true }).then(salvato => {
      const rete = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
      return salvato || rete.then(r => r || c.match("index.html"));
    }))
  );
});
