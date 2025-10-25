// sw.js

const CACHE_NAME = 'gestione-manutenzioni-v5'; // Incrementato per forzare l'aggiornamento
// Lista delle risorse fondamentali per l'app shell.
const urlsToCache = [
  '/',
  'index.html',
  'index.css',
  'index.tsx'
];

// Evento di installazione: viene eseguito quando il service worker viene installato.
self.addEventListener('install', event => {
  console.log('Service Worker installing. Cache name:', CACHE_NAME); // Added log
  // Esegui i passaggi di installazione
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        // Aggiunge le risorse fondamentali alla cache.
        // Se una qualsiasi delle risorse non riesce a essere scaricata, l'installazione fallisce.
        return cache.addAll(urlsToCache);
      })
  );
  // Forza il service worker in attesa a diventare attivo.
  self.skipWaiting();
});

// Evento di attivazione: viene eseguito quando il service worker viene attivato.
self.addEventListener('activate', event => {
  console.log('Service Worker activating. Cache name:', CACHE_NAME); // Added log
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Elimina tutte le cache che NON corrispondono al CACHE_NAME corrente
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Prende il controllo immediato della pagina.
        return self.clients.claim();
    })
  );
});

// Evento fetch: intercetta tutte le richieste di rete.
self.addEventListener('fetch', event => {
  // Per le richieste di navigazione (es. ricaricare la pagina), usa sempre la rete prima
  // per assicurarsi di avere l'HTML più recente, ma torna alla cache se offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Per le altre richieste (CSS, JS, immagini), usa una strategia cache-first.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la risorsa è trovata nella cache, la restituisce.
        if (response) {
          return response;
        }

        // Se la risorsa non è in cache, la richiede alla rete.
        return fetch(event.request).then(
          networkResponse => {
            // Non mettere in cache le risposte di errore o da estensioni.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona la risposta. Una risposta è uno stream e può essere consumata una sola volta.
            // Ne abbiamo bisogno sia per il browser che per la cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Aggiunge la nuova risorsa alla cache per usi futuri.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch fallito:', error);
            // In un'implementazione più avanzata, si potrebbe restituire una pagina offline di fallback.
            throw error;
        });
      })
  );
});