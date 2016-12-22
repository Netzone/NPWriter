let CACHE_NAME = 'newspilot-writer-cache-v1';

self.addEventListener('install', (event) => {
    console.log("Install");
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/app.js',
                    '/assets/icon.svg',
                    '/substance/substance.css',
                    '/substance/substance-reset.css',
                    '/substance/substance-pagestyle.css',
                    '/substance/substance.js',
                    '/font-awesome/css/font-awesome.min.css',
                    '/styles/app.css',
                    '/api/config',
                    '/writer/assets/icon.svg'
                ])
            })
            .then(() => {
                self.skipWaiting()
            })
            .catch((e) => {
                console.log("Error", e);
            })
    )
})

const urlsNotToCache = [
    '/search/concepts/',
    'sockjs-node',
    'chrome-extension',
    'spellcheck',
    'gstatic.com',
    'googleapis'
]

function shouldResponseBeCached(response) {
    return !(!response || response.status !== 200 && response.status !== 0 || response.type !== 'basic' && response.type !== 'opaque');
}

self.addEventListener('fetch', function (event) {

    const method = event.request.method
    const url = event.request.url

    let foundURL = urlsNotToCache.find((notCachebleURL) => {
        return url.indexOf(notCachebleURL) >= 0
    })

    // If we found a url that we are not supposed to cache
    // or the the request method is other then GET
    // We just return the response
    if (method !== 'GET' || foundURL) {
        // console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
        return
    }

    event.respondWith(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.match(event.request)
                    .then((response) => {

                        if (response && !navigator.onLine) {
                            // console.log("Response is cached return and user offline");
                            return response
                        }

                        var fetchRequest = event.request.clone();

                        return fetch(fetchRequest)
                            .then((response) => {
                                if(shouldResponseBeCached(response)) {
                                    // console.log(`Cache new response for ${url}`);
                                    cache.put(event.request, response.clone())
                                    return response;
                                } else {
                                    return response
                                }

                            })
                    })
            })
    )
})