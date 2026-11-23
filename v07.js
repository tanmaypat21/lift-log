'use strict';
(function LiftLogV7() {
  // View-only redesign: works with the existing liftlog.v1 state and saving functions.
  const $ = (q, root=document) => root.querySelector(q);
  const safe = value => esc(String(value ?? ''));
  const nfmt = value => fmt(Number(value)||0);
  const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const dateKey = value => validDate(value) ? value : 'undated';
  const dateLabel = value => value === 'undated' ? 'Date not recorded'
    : new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  const monthKey = value => value === 'undated' ? 'undated' : value.slice(0,7);
  const monthLabel = value => value === 'undated' ? 'Undated workouts'
    : new Date(`${value}-01T12:00:00`).toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const rawLifts=()=>Array.isArray(data.entries)?data.entries:[];
  const rawCardio=()=>Array.isArray(data.cardio)?data.cardio:[];
  const titleFor = id => exById(id)?.name || `Unlisted exercise (${id ?? 'unknown'})`;
  const bodyweight = row => Number(row.weight)===0 &&
    (row.exerciseId==='ab-coaster'||exById(row.exerciseId)?.catalogId==='ab-coaster');
  const weightText = row => bodyweight(row)?'Bodyweight':`${nfmt(row.weight)} lb`;
  const repText = row => Number(row.sets)>0 && Number(row.reps)>0
    ? `${nfmt(row.sets)} sets × ${nfmt(row.reps)} reps` : 'Sets/reps not entered';

  let panel='activity'; // Activity counts are comparable across different machines.
  let chosenDay=null,chosenExercise=null,measure='load',duration='all';
  let findText='',monthFilter='all',expandedMonths=new Set(),initialized=false;
  let noteIndex=Math.floor(Math.random()*7);
  const facts=[
    'Your most useful comparison is usually the same exercise on the same machine over time.',
    'A technically cleaner rep still represents progress, even when the weight stays the same.',
    'Looking at multiple sessions is more informative than judging a single workout.',
    'Recording sets and reps helps reveal improvements that weight alone can miss.',
    'Recovery and consistent sleep help you benefit from regular training.',
    'For cardio, track effort, duration and distance as well as pace.',
    'Gradual progression is often more sustainable than chasing a personal record every session.'
  ];
  function days(){
    const map=new Map();
    function get(d){const key=dateKey(d);if(!map.has(key))map.set(key,{date:key,lifts:[],cardio:[]});return map.get(key);}
    for(const row of rawLifts())get(row.date).lifts.push(row);
    for(const row of rawCardio())get(row.date).cardio.push(row);
    return [...map.values()].sort((a,b)=>a.date==='undated'?1:b.date==='undated'?-1:b.date.localeCompare(a.date));
  }
  function monthBuckets(dayList){
    const map=new Map();
    for(const item of dayList){
      const key=monthKey(item.date);
      if(!map.has(key))map.set(key,[]);
      map.get(key).push(item);
    }
    return [...map].map(([key,entries])=>({key,entries}));
  }
  function searchableDays(){
    const q=findText.trim().toLowerCase();
    let source=days();
    if(monthFilter!=='all')source=source.filter(s=>monthKey(s.date)===monthFilter);
    if(!q)return source;
    return source.map(day=>{
      const hit=day.date.includes(q)||dateLabel(day.date).toLowerCase().includes(q)||
        monthLabel(monthKey(day.date)).toLowerCase().includes(q);
      return {date:day.date,
        lifts:day.lifts.filter(row=>hit||titleFor(row.exerciseId).toLowerCase().includes(q)||String(row.notes||'').toLowerCase().includes(q)),
        cardio:day.cardio.filter(row=>hit||String(row.type||'').toLowerCase().includes(q)||String(row.notes||'').toLowerCase().includes(q))
      };
    }).filter(d=>d.lifts.length||d.cardio.length);
  }
  function summary(){
    const ds=days(),recent=ds.find(x=>x.date!=='undated');
    return {ds,recent,logs:rawLifts().length,active:ds.length,total:rawLifts().length+rawCardio().length};
  }
  function liftRow(row){
    const name=titleFor(row.exerciseId);
    return `<div class="v7-entry">
      <div class="v7-entry-copy"><strong>${safe(name)}</strong>
        <small>${safe(repText(row))}${row.notes?` · ${safe(String(row.notes).slice(0,120))}`:''}</small></div>
      <div class="v7-entry-side"><strong>${safe(weightText(row))}</strong>
        <button type="button" data-v07-edit="${safe(row.id)}" aria-label="Edit ${safe(name)} entry">Edit</button></div>
    </div>`;
  }
  function cardioRow(row){
    const pieces=[`${nfmt(row.duration)} min`,row.distance?`${nfmt(row.distance)} mi`:null,row.avgHr?`${nfmt(row.avgHr)} bpm`:null].filter(Boolean);
    return `<div class="v7-entry"><div class="v7-entry-copy"><strong>${safe(row.type||'Cardio')}</strong>
      <small>${safe(pieces.join(' · '))}${row.notes?` · ${safe(String(row.notes).slice(0,120))}`:''}</small></div><span class="v7-entry-side">CARDIO</span></div>`;
  }
  function daySummary(day){
    if(!day)return `<div class="v7-blank">No recorded training days yet. Log an exercise and it will appear here.</div>`;
    const logs=day.lifts.length+day.cardio.length;
    return `<div class="v7-day-focus" aria-live="polite">
      <div class="v7-focus-header"><span>${safe(dateLabel(day.date))}</span><strong>${logs} ${logs===1?'entry':'entries'}</strong></div>
      ${day.lifts.map(liftRow).join('')}${day.cardio.map(cardioRow).join('')}
      <button type="button" class="v7-day-link" data-v07-jump="${safe(day.date)}">Find this date below <span aria-hidden="true">↗</span></button>
    </div>`;
  }
  function activityChart(dayList,compact=false){
    const chronological=dayList.filter(d=>d.date!=='undated').slice().reverse();
    const display=chronological.slice(-14);
    if(!display.length)return `<div class="v7-chart-empty">Your training graph will start when you record a dated workout.</div>`;
    const values=display.map(d=>d.lifts.length+d.cardio.length);
    const max=Math.max(1,...values);
    const current=chosenDay && display.some(x=>x.date===chosenDay)?chosenDay:display.at(-1).date;
    if(!compact)chosenDay=current;
    return `<div class="v7-activity-chart" role="group" aria-label="Number of logged workout entries for the last ${display.length} training dates">
      ${display.map((d,i)=>{const count=values[i],percent=Math.max(6,Math.round(count/max*100));
        return `<button type="button" class="v7-activity-column ${!compact&&current===d.date?'selected':''}" data-v07-day="${safe(d.date)}"
          aria-label="${safe(dateLabel(d.date))}: ${count} recorded movements" aria-pressed="${!compact&&current===d.date}">
          <span class="v7-bar-val">${count}</span>
          <span class="v7-bar-track"><span class="v7-bar-fill" style="height:${percent}%"></span></span>
          <span class="v7-bar-date">${safe(d.date.slice(5))}</span>
        </button>`;}).join('')}
    </div>`;
  }
  function exercisesWithLogs(){
    const ids=new Set(rawLifts().map(r=>r.exerciseId));
    const known=data.exercises.filter(e=>ids.has(e.id));
    for(const id of ids)if(!known.some(e=>e.id===id))known.push({id,name:titleFor(id)});
    return known.sort((a,b)=>{
      const last=id=>rawLifts().filter(e=>e.exerciseId===id).map(e=>validDate(e.date)?e.date:'').sort().at(-1)||'';
      return last(b.id).localeCompare(last(a.id))||a.name.localeCompare(b.name);
    });
  }
  function strengthData(id){
    const records=rawLifts().filter(r=>r.exerciseId===id&&validDate(r.date));
    let cutoff=null;
    if(duration!=='all'){
      const day=new Date();day.setDate(day.getDate()-Number(duration)+1);
      cutoff=[day.getFullYear(),String(day.getMonth()+1).padStart(2,'0'),String(day.getDate()).padStart(2,'0')].join('-');
    }
    const points=new Map();
    for(const row of records){
      if(cutoff&&row.date<cutoff)continue;
      let val=measure==='load'?Number(row.weight):
        measure==='reps'?Number(row.reps):
          Number(row.weight)*Number(row.sets)*Number(row.reps);
      if(!Number.isFinite(val)||val<0 || (measure==='reps'&&val===0) ||
        (measure==='volume'&&(!(Number(row.sets)>0)||!(Number(row.reps)>0))))continue;
      const prior=points.get(row.date);
      points.set(row.date,measure==='volume'?(prior||0)+val:Math.max(prior??-Infinity,val));
    }
    return [...points].map(([date,value])=>({date,value})).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function lineChart(points){
    if(points.length<2)return `<div class="v7-chart-empty">${points.length?'One dated result so far. Record another day to show the trend.':'No matching recorded measurements for this exercise and metric.'}</div>`;
    const w=640,h=224,left=48,right=18,top=22,bottom=36;
    const vals=points.map(p=>p.value),min=Math.min(...vals),max=Math.max(...vals);
    const margin=Math.max(1,(max-min)*.18),lo=Math.max(0,min-margin),hi=max+margin;
    const x=i=>left+(i/(points.length-1))*(w-left-right);
    const y=v=>top+(hi-v)/(hi-lo||1)*(h-top-bottom);
    const coords=points.map((p,i)=>({x:x(i),y:y(p.value)}));
    const path=coords.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `<div class="v7-line-svg"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Recorded ${measure} from ${dateLabel(points[0].date)} to ${dateLabel(points.at(-1).date)}">
      <line x1="${left}" x2="${w-right}" y1="${h-bottom}" y2="${h-bottom}" stroke="#595959" stroke-width="1"/>
      <line x1="${left}" x2="${w-right}" y1="${top+(h-top-bottom)/2}" y2="${top+(h-top-bottom)/2}" stroke="#333" stroke-dasharray="4 5"/>
      <path d="${path}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${coords.map((p,i)=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===coords.length-1?5:3.4}" fill="#fff"/>`).join('')}
      <text x="${left}" y="13" fill="#ddd" font-size="13">${nfmt(max)}</text>
      <text x="${left}" y="${h-7}" fill="#aaa" font-size="12">${safe(points[0].date.slice(5))}</text>
      <text x="${w-right}" y="${h-7}" text-anchor="end" fill="#aaa" font-size="12">${safe(points.at(-1).date.slice(5))}</text>
    </svg></div>`;
  }
  function strengthChart(){
    const available=exercisesWithLogs();
    if(!available.length)return `<div class="v7-chart-empty">Once you log exercises, you'll be able to compare their recorded weights over time.</div>`;
    if(!available.some(e=>e.id===chosenExercise))chosenExercise=available[0].id;
    const selected=available.find(e=>e.id===chosenExercise);
    const ab=selected.id==='ab-coaster'||selected.catalogId==='ab-coaster';
    if(ab&&measure==='load')measure='reps';
    const points=strengthData(selected.id);
    const last=points.at(-1),first=points[0],change=points.length>1?last.value-first.value:null;
    return `<div class="v7-strength">
      <div class="v7-chart-selectors">
        <label>Exercise<select id="v07Exercise">${available.map(e=>`<option value="${safe(e.id)}" ${e.id===chosenExercise?'selected':''}>${safe(e.name)}</option>`).join('')}</select></label>
        <label>Period<select id="v07Range">${[['all','All time'],['30','30 days'],['90','90 days']].map(([id,name])=>`<option value="${id}" ${duration===id?'selected':''}>${name}</option>`).join('')}</select></label>
      </div>
      <div class="v7-metrics" role="group" aria-label="Recorded measurement">
        ${[['load','Weight'],['volume','Volume'],['reps','Reps']].map(([id,label])=>`<button data-v07-metric="${id}" class="${measure===id?'active':''}" aria-pressed="${measure===id}">${label}</button>`).join('')}
      </div>
      ${last?`<div class="v7-strength-number"><strong>${nfmt(last.value)}</strong><small>${measure==='load'?'lb':measure==='volume'?'lb × reps':'reps per set (best)'}</small></div>
        <p class="v7-strength-change">${change===null?'First recorded result':`${change>0?'+':''}${nfmt(change)} since first visible record`} · ${points.length} training ${points.length===1?'day':'days'}</p>`:''}
      ${lineChart(points)}
      <div class="v7-point-list">${points.slice(-5).reverse().map(p=>`<button type="button" data-v07-day="${safe(p.date)}"><span>${safe(dateLabel(p.date))}</span><strong>${nfmt(p.value)}</strong></button>`).join('')}</div>
    </div>`;
  }
  function recentWeights(limit=5){
    const entries=rawLifts();
    const ranked=[...data.exercises].map(ex=>{
      const records=entries.map((row,index)=>({row,index})).filter(x=>x.row.exerciseId===ex.id);
      records.sort((a,b)=>(validDate(b.row.date)?b.row.date:'').localeCompare(validDate(a.row.date)?a.row.date:'')||b.index-a.index);
      const last=records[0]?.row;
      const saved=ex.loadType==='plates'?Object.entries(ex.plates||{}).reduce((s,[weight,count])=>s+Number(weight)*Number(count||0),0)*(ex.perSide?2:1):Number(ex.directWeight)||0;
      return {ex,last,load:last?Number(last.weight):saved,date:last?.date||''};
    }).filter(x=>x.last||x.load>0).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,limit);
    return ranked;
  }
  function recentCard(){
    const weights=recentWeights(4);
    return `<section class="v7-surface v7-recents"><div class="v7-section-head"><h2>Last working weights</h2><button type="button" data-v07-nav="history">All history ↗</button></div>
      ${weights.length?weights.map(({ex,last,load})=>`<div class="v7-recent-row"><div><strong>${safe(ex.name)}</strong><small>${last?safe(dateLabel(dateKey(last.date))):'Saved starting load'}</small></div><strong>${load===0&&ex.id==='ab-coaster'?'Bodyweight':nfmt(load)+' lb'}</strong></div>`).join(''):
      '<p class="v7-muted">No lifts logged yet. Start with an exercise from the Train tab.</p>'}
    </section>`;
  }
  function homePage(){
    const s=summary(),activity=activityChart(s.ds,true);
    return `<div class="v7-page v7-home">
      <div class="v7-overline">LIFT LOG / OVERVIEW</div><h1>Progress starts with showing up.</h1>
      <p class="v7-intro">Your training, organized around what you actually recorded.</p>
      <section class="v7-surface v7-home-progress">
        <div class="v7-section-head"><h2>Your progress</h2><button type="button" data-v07-nav="history">Open progress ↗</button></div>
        <div class="v7-number-strip"><div><strong>${s.active}</strong><span>Training days</span></div><div><strong>${s.logs}</strong><span>Strength entries</span></div><div><strong>${rawCardio().length}</strong><span>Cardio logs</span></div></div>
        ${activity}
        <button type="button" class="v7-main-button" data-v07-nav="history">View charts & history <span aria-hidden="true">↗</span></button>
      </section>
      <aside class="v7-fact"><span>TRAINING NOTE</span><p>${safe(facts[noteIndex%facts.length])}</p><button type="button" data-v07-fact aria-label="Show another training fact">↻</button></aside>
      ${recentCard()}
      <button type="button" class="v7-quiet-action" data-v6-quick-log>+ Log a workout</button>
    </div>`;
  }
  function monthData(){
    const buckets=monthBuckets(searchableDays());
    if(!initialized){
      for(const x of buckets.slice(0,2))expandedMonths.add(x.key);
      initialized=true;
    }
    return buckets;
  }
  function monthlyHistory(){
    const buckets=monthData(),query=findText.trim();
    const count=days().length;
    return `<section class="v7-history" aria-label="All recorded workouts by month and day">
      <div class="v7-section-head"><div><span class="v7-overline">COMPLETE HISTORY</span><h2>Month by month.</h2></div><span class="v7-count">${rawLifts().length} lift entries · ${count} dates</span></div>
      <div class="v7-history-filters">
        <label>Find a workout<input id="v07Search" type="search" placeholder="Search exercises, dates, notes..." value="${safe(findText)}" autocomplete="off" /></label>
        <label>Month<select id="v07Month"><option value="all">All months</option>${monthBuckets(days()).map(m=>`<option value="${safe(m.key)}" ${monthFilter===m.key?'selected':''}>${safe(monthLabel(m.key))}</option>`).join('')}</select></label>
      </div>
      ${buckets.length?buckets.map(month=>{
        const open=query||monthFilter!=='all'||expandedMonths.has(month.key);
        return `<section class="v7-month" id="v07-month-${safe(month.key)}">
          <button type="button" class="v7-month-toggle" data-v07-month-toggle="${safe(month.key)}" aria-expanded="${!!open}">
            <span><strong>${safe(monthLabel(month.key))}</strong><small>${month.entries.length} training ${month.entries.length===1?'day':'days'}</small></span>
            <span class="v7-month-indicator" aria-hidden="true">${open?'−':'+'}</span>
          </button>
          ${open?`<div class="v7-month-body">${month.entries.map(d=>`<article class="v7-history-day" id="v07-day-${safe(d.date)}">
            <div class="v7-history-day-head"><strong>${safe(dateLabel(d.date))}</strong><span>${d.lifts.length} ${d.lifts.length===1?'lift':'lifts'}${d.cardio.length?` · ${d.cardio.length} cardio`:''}</span></div>
            ${d.lifts.map(liftRow).join('')}${d.cardio.map(cardioRow).join('')}
          </article>`).join('')}</div>`:''}
        </section>`;
      }).join(''):'<div class="v7-blank">No workouts match those filters. Clear the search or select All months.</div>'}
      <p class="v7-history-note">Every recorded set stays listed here unless explicitly deleted. Undated entries also appear at the end.</p>
    </section>`;
  }
  function progressPage(){
    const s=summary(),shown=s.ds.find(d=>d.date===chosenDay) || s.recent||s.ds[0]||null;
    const total=s.total;
    return `<div class="v7-page v7-progress">
      <div class="v7-overline">LIFT LOG / PROGRESS</div>
      <h1>Everything you've logged.</h1>
      <p class="v7-intro">First the trends. Then every workout, grouped by month and date.</p>
      <div class="v7-summary"><span><strong>${nfmt(total)}</strong> recorded movements</span><span><strong>${nfmt(s.active)}</strong> training dates</span></div>
      <section class="v7-surface v7-chart-panel">
        <div class="v7-section-head"><h2>Training timeline</h2><span class="v7-subtitle">Actual saved entries</span></div>
        <div class="v7-switch" role="group" aria-label="Progress chart view">
          <button type="button" data-v07-panel="activity" aria-pressed="${panel==='activity'}" class="${panel==='activity'?'active':''}">Workout days</button>
          <button type="button" data-v07-panel="strength" aria-pressed="${panel==='strength'}" class="${panel==='strength'?'active':''}">Strength</button>
        </div>
        ${panel==='activity'?`<p class="v7-chart-desc">Number of recorded movements on each training day · latest 14 dates</p>
          ${activityChart(s.ds)}${daySummary(shown&&chosenDay?s.ds.find(d=>d.date===chosenDay)||shown:shown)}`:strengthChart()}
      </section>
      ${monthlyHistory()}
    </div>`;
  }
  // Keep global app state, workout data and recovery modules unchanged.
  home=homePage;
  history=progressPage;
  const nav=document.querySelector('.bottomnav');
  const homeTab=nav?.querySelector('[data-tab="home"]');
  const progressTab=nav?.querySelector('[data-tab="history"]');
  if(homeTab)homeTab.innerHTML='<span aria-hidden="true">⌂</span>Home';
  if(progressTab)progressTab.innerHTML='<span aria-hidden="true">↗</span>Progress';

  function repaint(){render();}
  app.addEventListener('click',event=>{
    const button=event.target.closest('[data-v07-panel],[data-v07-day],[data-v07-metric],[data-v07-month-toggle],[data-v07-nav],[data-v07-jump],[data-v07-edit],[data-v07-fact]');
    if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(button.hasAttribute('data-v07-nav')){tab=button.dataset.v07Nav;repaint();window.scrollTo({top:0});return;}
    if(button.hasAttribute('data-v07-panel')){panel=button.dataset.v07Panel;repaint();return;}
    if(button.hasAttribute('data-v07-day')){chosenDay=button.dataset.v07Day;panel='activity';tab='history';repaint();return;}
    if(button.hasAttribute('data-v07-metric')){measure=button.dataset.v07Metric;repaint();return;}
    if(button.hasAttribute('data-v07-month-toggle')){
      const key=button.dataset.v07MonthToggle;
      if(expandedMonths.has(key))expandedMonths.delete(key);else expandedMonths.add(key);
      repaint();return;
    }
    if(button.hasAttribute('data-v07-jump')){
      const day=button.dataset.v07Jump,key=monthKey(day);
      expandedMonths.add(key);monthFilter='all';findText='';repaint();
      document.getElementById('v07-day-'+day)?.scrollIntoView({behavior:'smooth',block:'center'});return;
    }
    if(button.hasAttribute('data-v07-fact')){noteIndex=(noteIndex+1)%facts.length;repaint();return;}
    if(button.hasAttribute('data-v07-edit')){
      const id=button.dataset.v07Edit,row=rawLifts().find(r=>r.id===id);
      if(row)window.LiftLogJournalEditor?.editEntry(id);
    }
  },true);
  app.addEventListener('change',event=>{
    if(event.target.id==='v07Exercise'){chosenExercise=event.target.value;repaint();return;}
    if(event.target.id==='v07Range'){duration=event.target.value;repaint();return;}
    if(event.target.id==='v07Month'){monthFilter=event.target.value;repaint();return;}
  },true);
  app.addEventListener('input',event=>{
    if(event.target.id!=='v07Search')return;
    const pos=event.target.selectionStart,scroll=window.scrollY;
    findText=event.target.value;
    repaint();
    const input=$('#v07Search');
    if(input){input.focus();try{input.setSelectionRange(pos,pos)}catch(_){}}
    window.scrollTo({top:scroll});
  },true);
  // Launch directly into the dedicated Progress tab, per user's progress-first preference.
  tab='history';
  render();
})();
