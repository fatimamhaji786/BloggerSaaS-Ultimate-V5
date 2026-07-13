const CACHE_NAME = "bloggersaas-v5-cache-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/pages/login.html",
  "/pages/dashboard.html",
  "/assets/css/style.css",
  "/assets/css/login.css",
  "/assets/css/dashboard.css",
  "/assets/js/app.js",
  "/assets/js/login.js",
  "/assets/js/dashboard.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
