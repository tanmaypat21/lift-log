// Lift Log v0.5.2: network-first app shell keeps installed PWAs up to date.
const CACHE='lift-log-v7';
const CORE=['./','./index.html','./styles.css','./v04.css','./v06.css','./v07.css','./persistence.js','./app.js','./exercise-library.js','./enhancements.js','./v06.js','./recovery-ui.js','./v07.js','./icon.svg','./manifest.webmanifest'];
const EXAMPLES=['./assets/exercises/ab-coaster/start.svg','./assets/exercises/ab-coaster/end.svg','./assets/exercises/standing-calf-raise-machine/start.webp','./assets/exercises/seated-calf-raise-machine/start.webp','./assets/exercises/leg-press-calf-raise/start.webp'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...CORE,...EXAMPLES])));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('lift-log-')&&name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  const ownOrigin=url.origin===self.location.origin;
  const remoteExercise=url.hostname==='raw.githubusercontent.com'
    &&url.pathname.startsWith('/MarvinNazari/exercise-images/main/images/')
    &&url.pathname.endsWith('.webp');
  if(!ownOrigin&&!remoteExercise)return;
  const appShell=ownOrigin&&(request.mode==='navigate'||/\.(?:html|js|css|webmanifest)$/.test(url.pathname)||url.pathname.endsWith('/'));
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(appShell){
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok)await cache.put(request,response.clone());
        return response;
      }catch(err){
        const offline=await cache.match(request,{ignoreSearch:true});
        if(offline)return offline;
        if(request.mode==='navigate'){
          const home=await cache.match('./index.html');
          if(home)return home;
        }
        throw err;
      }
    }
    const cached=await cache.match(request);
    if(cached)return cached;
    const response=await fetch(request);
    if(response.ok||response.type==='opaque')cache.put(request,response.clone()).catch(()=>{});
    return response;
  })());
});