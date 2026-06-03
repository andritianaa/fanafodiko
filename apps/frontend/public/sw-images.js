/**
 * Service Worker, Cache images 30 jours (CacheFirst + stale-while-revalidate)
 * Stratégie : retourne l'image depuis le cache si < 30j, sinon refetch en fond.
 */

const CACHE_NAME = 'fanafodiko-images-v2';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Domaines de tuiles cartographiques (supportent CORS) */
const TILE_HOSTS = ['tile.openstreetmap.org'];

/** Vrai si l'URL est une tuile de carte */
function isTileUrl(url) {
  try {
    const { hostname } = new URL(url);
    return TILE_HOSTS.some((h) => hostname.endsWith(h));
  } catch {
    return false;
  }
}

/** Vrai si l'URL est une image (extension ou dossier uploads) */
function isImageUrl(url) {
  try {
    const { pathname } = new URL(url);
    return (
      /\.(jpe?g|png|webp|gif|svg|avif|bmp)(\?.*)?$/i.test(pathname) ||
      pathname.includes('/uploads/') ||
      pathname.includes('/images/')
    );
  } catch {
    return false;
  }
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Nettoyer les anciens caches au démarrage
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('fanafodiko-images-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  // Uniquement GET et images
  if (e.request.method !== 'GET') return;
  if (!isImageUrl(e.request.url)) return;

  e.respondWith(handleImageFetch(e.request));
});

async function handleImageFetch(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const cachedAt = cached.headers.get('x-sw-cached-at');
    const age = cachedAt ? Date.now() - Number(cachedAt) : 0;

    if (age < MAX_AGE_MS) {
      // Cache frais, retourner immédiatement, revalider en arrière-plan
      // si > 50% de la durée max (stale-while-revalidate)
      if (age > MAX_AGE_MS / 2) {
        revalidate(cache, request).catch(() => {});
      }
      return cached;
    }
    // Cache expiré : revalider et retourner le stale pendant ce temps
    revalidate(cache, request).catch(() => {});
    return cached;
  }

  // Pas en cache : fetch + stocker
  try {
    // Les tuiles OSM arrivent en mode no-cors (img element) → réponse opaque (status 0).
    // On re-fetche explicitement en mode cors pour obtenir une vraie réponse cacheable.
    const fetchRequest = isTileUrl(request.url)
      ? new Request(request.url, { mode: 'cors', credentials: 'omit' })
      : request;

    const response = await fetch(fetchRequest);
    if (response.ok && response.status === 200) {
      const toCache = await buildCachedResponse(response.clone());
      cache.put(request, toCache).catch(() => {});
    }
    return response;
  } catch {
    // Réseau indisponible et pas de cache → réponse vide 503
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

async function revalidate(cache, request) {
  const fetchRequest = isTileUrl(request.url)
    ? new Request(request.url, { mode: 'cors', credentials: 'omit' })
    : request;
  const response = await fetch(fetchRequest);
  if (response.ok && response.status === 200) {
    const toCache = await buildCachedResponse(response.clone());
    await cache.put(request, toCache);
  }
}

/** Clone la réponse en y injectant le header de timestamp */
async function buildCachedResponse(response) {
  const body = await response.arrayBuffer();
  const headers = new Headers(response.headers);
  headers.set('x-sw-cached-at', String(Date.now()));
  // Forcer cache-control pour éviter que le browser ignore notre cache
  headers.set('cache-control', `max-age=${Math.floor(MAX_AGE_MS / 1000)}`);
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
