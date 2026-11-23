/* Lift Log v0.6.2 — independent local recovery snapshots.
   Data stays on this device. A browser storage wipe can still remove BOTH stores:
   regularly export JSON backups; cloud sync will require an authenticated backend. */
'use strict';
(() => {
  const STORE='snapshots',DB_NAME='liftlog.recovery.v1',MAX=65;
  let lastSnapshotJSON='';
  const valid = obj => obj && obj.version===1 && Array.isArray(obj.entries)
    && Array.isArray(obj.exercises) && obj.entries.length<300000
    && obj.exercises.length<5000;
  const parse = input => {try {const obj=typeof input==='string'?JSON.parse(input):input;return valid(obj)?obj:null;}catch{return null;}};
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const openDB=()=>new Promise(resolve=>{
    if(!('indexedDB' in window))return resolve(null);
    let request;
    try{request=indexedDB.open(DB_NAME,1)}catch{return resolve(null)}
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'key'})};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>resolve(null);
    request.onblocked=()=>resolve(null);
  });
  async function capture(value,label='autosave'){
    const obj=parse(value);if(!obj)return false;
    const json=JSON.stringify(obj);
    if(json===lastSnapshotJSON)return true;
    const db=await openDB();
    if(!db)return false;
    return new Promise(resolve=>{
      let tx;
      try{tx=db.transaction(STORE,'readwrite')}catch{db.close();return resolve(false)}
      const store=tx.objectStore(STORE);
      store.put({key:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),at:new Date().toISOString(),label,entries:obj.entries.length,exercises:obj.exercises.length,json});
      const req=store.getAllKeys();
      req.onsuccess=()=>{
        const keys=req.result||[];
        if(keys.length>MAX)keys.sort().slice(0,keys.length-MAX).forEach(key=>store.delete(key));
      };
      tx.oncomplete=()=>{lastSnapshotJSON=json;db.close();resolve(true)};
      tx.onerror=()=>{db.close();resolve(false)};
      tx.onabort=()=>{db.close();resolve(false)};
    });
  }
  async function snapshots(){
    const db=await openDB();if(!db)return[];
    return new Promise(resolve=>{
      const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();
      r.onsuccess=()=>{const a=(r.result||[]).filter(x=>parse(x.json)).sort((x,y)=>y.at.localeCompare(x.at));db.close();resolve(a)};
      r.onerror=()=>{db.close();resolve([])};
    });
  }
  function localBackup(){
    try{const json=localStorage.getItem('liftlog.v1.lastGood');const parsed=parse(json);return parsed?{key:'lastGood',at:'Local backup',label:'last known good copy',entries:parsed.entries.length,exercises:parsed.exercises.length,json}:null}catch{return null;}
  }
  function keyFor(item,kind){
    if(item?.id!==undefined&&item.id!==null&&String(item.id).length)return String(item.id);
    if(kind==='checkins')return [item?.date,item?.weight,item?.waist].join('|');
    if(kind==='weeklyReviews')return [item?.date,item?.weightAvg,item?.sessions].join('|');
    return JSON.stringify(item);
  }
  function merge(current,incoming){
    const a=parse(current),b=parse(incoming);
    if(!a||!b)throw new Error('Not a compatible Lift Log backup.');
    const result=clone(a),added={};
    for(const kind of ['exercises','entries','cardio','checkins','weeklyReviews']){
      if(!Array.isArray(result[kind]))result[kind]=[];
      const seen=new Set(result[kind].map(row=>keyFor(row,kind)));
      added[kind]=0;
      for(const row of Array.isArray(b[kind])?b[kind]:[]){
        if(!row||typeof row!=='object')continue;
        const k=keyFor(row,kind);
        if(!seen.has(k)){result[kind].push(clone(row));seen.add(k);added[kind]++}
      }
    }
    // Keep current profile/preferences, but allow restoration of missing fields.
    for(const field of ['coach','intake','sharePrefs','migrations']){
      if(!result[field]||typeof result[field]!=='object')result[field]=clone(b[field]||{});
    }
    return {data:result,added};
  }
  async function candidates(){
    const old=await snapshots(),backup=localBackup();
    if(backup&&!old.some(x=>x.json===backup.json))old.unshift(backup);
    return old;
  }
  window.LiftLogSafety=Object.freeze({capture,snapshots,candidates,merge,parse});
})();