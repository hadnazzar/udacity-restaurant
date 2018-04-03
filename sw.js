var staticCacheName = "restaurant-static-v1";
self.addEventListener("install", function (event) {
  var urlsToCache = [
    '/',
    '/img/1.jpg',
    '/img/2.jpg',
    '/img/3.jpg',
    '/img/4.jpg',
    '/img/5.jpg',
    '/img/6.jpg',
    '/img/7.jpg',
    '/img/8.jpg',
    '/img/9.jpg',
    '/img/10.jpg',
    '/css/styles.css',
    '/data/restaurants.json',
    '/js/dbhelper.js',
    '/js/main.js',
    '/js/restaurant_info.js',
    '/index.html',
    '/restaurant.html',
  ]

  event.waitUntil(
    caches.open(staticCacheName).then(function (cache) {
      console.log("all them cached");
      return cache.addAll(urlsToCache);
    })
  )
})

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      if (response) return response;
      return fetch(event.request);
    })
  )

})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function (cacheName) {
          return cacheName.startsWith('restaurant-') && cacheName !== staticCacheName;
        }).map(function (cacheName) {
          return caches.delete(cacheName)
        })
      )
    })
  )
})