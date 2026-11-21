const CACHE='lift-log-v4-2';
const CORE=['./','./index.html','./styles.css','./v04.css','./app.js','./enhancements.js','./icon.svg','./manifest.webmanifest'];
const EXAMPLES=['./assets/exercises/standing-calf-raise-machine/start.webp','./assets/exercises/seated-calf-raise-machine/start.webp','./assets/exercises/leg-press-calf-raise/start.webp'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...CORE,...EXAMPLES])));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('lift-log-')&&key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const local=url.origin===self.location.origin;
  const remoteExercise=url.hostname==='raw.githubusercontent.com'
    &&url.pathname.startsWith('/MarvinNazari/exercise-images/main/images/')
    &&url.pathname.endsWith('.webp');
  if(!local&&!remoteExercise)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(event.request);
    if(cached)return cached;
    const response=await fetch(event.request);
    if((response.ok||response.type==='opaque')&&(remoteExercise||url.pathname.includes('/assets/exercises/'))){
      cache.put(event.request,response.clone()).catch(()=>{});
    }
    return response;
  })());
});