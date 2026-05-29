const AUDIO_CACHE_NAME = 'fretboard-audio-v1'
const FONT_CACHE_NAME = 'fretboard-fonts-v1'
const FONT_ASSET_URLS = [
  'https://fonts.gstatic.com/s/varelaround/v21/w8gdH283Tvk__Lua32TysjIfp8uPLdshZg.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([warmFontCache(), self.skipWaiting()]).catch(() => {
      return self.skipWaiting()
    }),
  )
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
    return
  }

  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(event.request, FONT_CACHE_NAME))
  }
})

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok || networkResponse.type === 'opaque') {
          cache.put(request, networkResponse.clone())
        }
        return networkResponse
      })
    }),
  )
}

function warmFontCache() {
  return caches.open(FONT_CACHE_NAME).then((cache) =>
    Promise.all(
      FONT_ASSET_URLS.map((url) =>
        fetch(url)
          .then((networkResponse) => {
            if (networkResponse.ok || networkResponse.type === 'opaque') {
              return cache.put(url, networkResponse)
            }
            return undefined
          })
          .catch(() => undefined),
      ),
    ),
  )
}
