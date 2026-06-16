const CACHE='tempo-v4';
const ASSETS=['index.html','manifest.json','icon-180.png','icon-512.png'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isHTML = e.request.mode==='navigate' || e.request.destination==='document';
  if(isHTML){
    // network-first for the page, so updates appear immediately; cache as offline fallback
    e.respondWith(
      fetch(e.request).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put('index.html',copy)).catch(()=>{});
        return resp;
      }).catch(()=>caches.match('index.html'))
    );
    return;
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const copy=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match('index.html')))
  );
});
