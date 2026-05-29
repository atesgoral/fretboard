const AUDIO_CACHE_NAME = 'fretboard-audio-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  if (
    url.hostname === 'danigb.github.io' ||
    url.hostname === 'gleitz.github.io' ||
    url.hostname === 'smpldsnds.github.io'
  ) {
    event.respondWith(cacheFirst(event.request, AUDIO_CACHE_NAME))
  }
})

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone())
        }
        return networkResponse
      })
    }),
  )
}
