/* Lift Log v0.6.2 — visible recovery controls.
   Restoring from a snapshot or imported JSON MERGES missing records; it never replaces all records. */
'use strict';
(() => {
  const safety=window.LiftLogSafety,storage=window.LiftLogStorage;
  if(!safety||!storage)return;
  let hiddenWarning=false,recoveryCandidates=[];
  const safeText=value=>esc(String(value??''));
  function dataIds(state){return new Set((state.entries||[]).map(row=>String(row.id)))}
  function recoverable(candidate,current){
    const other=safety.parse(candidate.json);if(!other)return 0;
    const existing=dataIds(current);
    return other.entries.filter(row=>!existing.has(String(row.id))).length;
  }
  const previousRender=render;
  render=function(){
    previousRender();
    if(tab==='settings'){
      app.insertAdjacentHTML('afterbegin',`<section class="v6-surface v62-recovery-panel" aria-label="Backup and recovery">
        <div class="v6-card-head"><h2>Backup & recovery</h2><span class="v6-hint">Local data</span></div>
        <p>Your workout history is stored on this device. Automatic recovery snapshots are kept in a separate local database, but clearing app/browser data may erase both. Export a JSON file regularly.</p>
        <div class="v62-buttons"><button type="button" data-v62-export class="v6-button">Export full JSON</button><button type="button" data-v62-recovery class="v6-button secondary">Recovery center</button></div>
        <p class="v62-status">${storage.snapshot().entries.length} strength entries saved locally.</p>
      </section>`);
    }
    showWarning();
  };
  function showWarning(){
    document.querySelector('#v62MissingBanner')?.remove();
    if(hiddenWarning)return;
    const state=storage.snapshot();
    const count=recoveryCandidates.reduce((n,item)=>Math.max(n,recoverable(item,state)),0);
    if(count===0&&!storage.isRecoveryBlocked())return;
    const banner=document.createElement('div');
    banner.id='v62MissingBanner';
    banner.className='v62-recovery-banner';
    banner.setAttribute('role','status');
    banner.innerHTML=`<div><strong>${storage.isRecoveryBlocked()?'Saved workout data needs attention':count+' older entries may be recoverable'}</strong><small>${storage.isRecoveryBlocked()?'Your original data has been protected from being overwritten.':'We found a local recovery snapshot with entries missing from the current log.'}</small></div><button type="button" data-v62-recovery>Review</button><button type="button" data-v62-dismiss aria-label="Hide notice">×</button>`;
    app.prepend(banner);
  }
  async function refreshCandidates(){
    try{recoveryCandidates=await safety.candidates()}catch{recoveryCandidates=[]}
    showWarning();
  }
  async function openRecovery(){
    await refreshCandidates();
    const state=storage.snapshot();
    const withMissing=recoveryCandidates.map((c,i)=>({...c,index:i,missing:recoverable(c,state)}));
    const options=withMissing.slice(0,20).map(c=>`<div class="v62-snapshot">
      <div><strong>${safeText(c.at)}</strong><span>${c.entries} strength entries · ${c.exercises} exercises · ${c.missing} missing from current</span></div>
      <button type="button" class="secondary" data-v62-merge="${c.index}">${c.missing?'Merge missing':'Review / merge'}</button>
    </div>`).join('');
    openModal(`${modalTop('Workout recovery','Merge older records without deleting your current ones')}
      <div class="v62-recovery-content">
        <p>Currently on this device: <strong>${state.entries.length} strength entries</strong>. Older local snapshots and JSON backups can be merged by unique record ID.</p>
        <button type="button" class="v6-button v6-full" data-v62-export>Download current JSON first</button>
        <div class="v62-filebox"><label for="v62File">Merge a previous Lift Log JSON backup</label><input id="v62File" type="file" accept=".json,application/json"><small>This will add missing entries and exercises. It will not replace recent sessions.</small></div>
        <h3>Snapshots on this device</h3>
        ${options||'<p>No independent snapshots available yet. Use a saved JSON file if you have one.</p>'}
        <p class="v62-disclaimer">Backups in IndexedDB and localStorage remain on this device. They are not cloud backups and might be deleted if the browser clears website data.</p>
      </div>`);
  }
  function exportCurrent(){
    downloadFile('lift-log-complete-'+today()+'.json',JSON.stringify(storage.snapshot(),null,2),'application/json');
    notify('Full workout backup exported.');
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-v62-recovery],[data-v62-export],[data-v62-dismiss],[data-v62-merge]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.hasAttribute('data-v62-dismiss')){hiddenWarning=true;showWarning();return;}
    if(button.hasAttribute('data-v62-export')){exportCurrent();return;}
    if(button.hasAttribute('data-v62-recovery')){void openRecovery();return;}
    const idx=Number(button.dataset.v62Merge);
    const item=recoveryCandidates[idx];
    if(!item)return;
    const current=storage.snapshot(),possible=recoverable(item,current);
    if(!confirm('Merge this recovery snapshot into your current log? '+possible+' additional strength entries may be restored. Existing records will not be deleted.'))return;
    const added=storage.mergeRecovery(safety.parse(item.json));
    if(!added){alert('Could not save recovered records. Nothing was replaced.');return;}
    closeModal();void refreshCandidates();
    notify(added.entries+' older workout entries recovered');
  },true);
  document.addEventListener('change',event=>{
    if(event.target.id!=='v62File')return;
    const file=event.target.files?.[0];
    if(!file)return;
    void importData(file).then(success=>{if(!success)return;if(modalRoot.innerHTML)closeModal();void refreshCandidates()});
  },true);
  window.addEventListener('load',()=>{
    void refreshCandidates();
    // Capture an existing, valid record; do not overwrite current data when scanning for recovery.
    try{const raw=localStorage.getItem(KEY);if(raw&&safety.parse(raw))void safety.capture(raw,'opened safely')}catch(_){}
  });
  render();
})();