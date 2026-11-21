const CACHE='lift-log-v5-1';
const CORE=['./','./index.html','./styles.css','./v04.css','./app.js','./exercise-library.js','./enhancements.js','./icon.svg','./manifest.webmanifest'];
const EXAMPLES=['./assets/exercises/standing-calf-raise-machine/start.webp','./assets/exercises/seated-calf-raise-machine/start.webp','./assets/exercises/leg-press-calf-raise/start.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll([...CORE,...EXAMPLES])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('lift-log-')&&n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(e.request);if(hit)return hit;
 const res=await fetch(e.request);if(res.ok&&new URL(e.request.url).pathname.includes('/assets/exercises/'))cache.put(e.request,res.clone()).catch(()=>{});return res;})());
});
