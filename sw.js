function toResult(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = reject
  })
}

const dbCache = {}

async function readDb(dbName, storeName, key) {
  let db = dbCache[dbName]
  if (!db) {
    db = await toResult(indexedDB.open(dbName))
    dbCache[dbName] = db
  }
  const store = db.transaction(storeName, 'readonly').objectStore(storeName)
  if (/^\d+$/.test(key)) key = +key
  const file = await toResult(store.get(key))
  return new Response(file)
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  if (url.host === 'db') {
    const [_, dbName, storeName, ...rest] = url.pathname.split('/')
    e.respondWith(readDb(dbName, storeName, rest.join('/')))
  }
})

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()))
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
