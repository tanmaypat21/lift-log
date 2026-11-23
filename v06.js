/* Lift Log v0.6 — Progress-first dashboard and chronological workout journal.
   Reads the existing local-first records; no data migration, reset, or upload. */
'use strict';
(() => {
  const factList = [
    'Consistency is easier to assess over weeks, not from a single workout.',
    'One extra rep with good form can be meaningful progress even at the same weight.',
    'Use the same machine when comparing loads: resistance differs between models.',
    'A steady sleep schedule can support recovery alongside training and nutrition.',
    'Cardio progress can be measured through pace, duration, distance, and effort.',
    'Muscle soreness alone does not tell you how effective a workout was.',
    'Warm-up sets help you practice a movement before harder working sets.',
    'Exercise variety can help, but repeating movements is what makes progress measurable.'
  ];
  let selectedTrendExercise = null;
  let trendMetric = 'load';
  let trendWindow = 'all';
  let selectedJournalDate = today();
  let expandedJournalDate = null;
  let visibleJournalDays = 8;
  let journalQuery = '';
  let journalShowAll = false;
  let pendingLogDate = null;
  let factIndex = Math.floor(Math.random() * factList.length);

  const escapeText = value => esc(String(value ?? ''));
  const isoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const readableDate = value => isoDate(value)
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'})
    : String(value || 'Unknown date');
  const daysAgo = days => {const d = new Date(`${today()}T12:00:00`);d.setDate(d.getDate()-days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const workoutEntries = () => Array.isArray(data.entries)?data.entries:[]; // Never silently hide records with an unrecognized date.
  const cardioEntries = () => (Array.isArray(data.cardio)?data.cardio:[]).filter(r=>isoDate(r.date));
  const exerciseName = id => exById(id)?.name || 'Unlisted exercise';
  const formatNum = value => fmt(Number(value) || 0);

  function dailySessions(){
    const bucket = new Map();
    const byDate = date => {if(!bucket.has(date))bucket.set(date,{date,weights:[],cardio:[]});return bucket.get(date);};
    workoutEntries().forEach(record=>byDate(isoDate(record.date)?record.date:'undated').weights.push(record));
    cardioEntries().forEach(record=>byDate(record.date).cardio.push(record));
    return [...bucket.values()].sort((a,b)=>a.date==='undated'?1:b.date==='undated'?-1:b.date.localeCompare(a.date));
  }
  function trendExercises(){
    const seen = new Set(workoutEntries().map(r=>r.exerciseId));
    return data.exercises.filter(e=>seen.has(e.id));
  }
  function trendRecords(exerciseId,metric=trendMetric,period=trendWindow){
    const start = period==='all' ? null : daysAgo(Math.max(0,Number(period)-1));
    const matching=workoutEntries().filter(r=>isoDate(r.date)&&r.exerciseId===exerciseId && (!start||r.date>=start) && (metric==='reps'?Number(r.reps)>0:Number(r.weight)>0));
    const grouped = new Map();
    for(const entry of matching){
      const value = metric==='reps' ? (Number(entry.reps)>0?Number(entry.reps):null) : metric==='volume'
        ? (Number(entry.sets)>0&&Number(entry.reps)>0?Number(entry.weight)*Number(entry.sets)*Number(entry.reps):null)
        : Number(entry.weight);
      if(value===null||!Number.isFinite(value))continue;
      const previous=grouped.get(entry.date);
      grouped.set(entry.date,metric==='volume'?(previous||0)+value:Math.max(previous||0,value));
    }
    return [...grouped].map(([date,value])=>({date,value})).sort((a,b)=>a.date.localeCompare(b.date));
  }
  function lineChart(points,label){
    if(points.length<2){
      return `<div class="v6-no-trend"><span class="v6-no-trend-icon" aria-hidden="true">↗</span><strong>${points.length?'One recorded day so far':'Not enough history yet'}</strong><p>${points.length?'Log this exercise on another day to see the trend.':'Log your lifts to build a progress chart from real entries.'}</p></div>`;
    }
    const width=600,height=195,left=44,right=22,top=23,bottom=35;
    const values=points.map(p=>p.value);
    const smallest=Math.min(...values),largest=Math.max(...values);
    const pad=Math.max(3,(largest-smallest)*0.18);
    const lo=Math.max(0,smallest-pad),hi=largest+pad;
    const y=value=>top+(hi-value)/(hi-lo||1)*(height-top-bottom);
    const x=index=>left+index/(points.length-1)*(width-left-right);
    const coords=points.map((p,i)=>[x(i),y(p.value)]);
    const path=coords.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area=`${path} L${x(points.length-1).toFixed(1)},${height-bottom} L${left},${height-bottom} Z`;
    const grid=[0,0.5,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${(top+t*(height-top-bottom)).toFixed(1)}" y2="${(top+t*(height-top-bottom)).toFixed(1)}" stroke="currentColor" opacity=".11"/>`).join('');
    return `<div class="v6-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeText(label)} from ${formatNum(points[0].value)} to ${formatNum(points.at(-1).value)} over ${points.length} training days">
      <defs><linearGradient id="v6ChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a8f8b4" stop-opacity=".26"/><stop offset="100%" stop-color="#a8f8b4" stop-opacity="0"/></linearGradient></defs>
      ${grid}<path d="${area}" fill="url(#v6ChartFill)"/><path d="${path}" fill="none" stroke="#a8f8b4" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${coords.map((p,i)=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i===coords.length-1?5:3.2}" fill="#a8f8b4" stroke="#16231e" stroke-width="2"/>`).join('')}
      <text x="${left}" y="${height-9}" fill="currentColor" opacity=".7" font-size="12">${escapeText(points[0].date.slice(5))}</text>
      <text x="${width-right}" y="${height-9}" text-anchor="end" fill="currentColor" opacity=".7" font-size="12">${escapeText(points.at(-1).date.slice(5))}</text>
      <text x="${left}" y="${top-9}" fill="currentColor" opacity=".8" font-size="12">${formatNum(largest)}</text>
    </svg></div>`;
  }
  function metricSelector(){
    return `<div class="v6-segmented" role="group" aria-label="Progress measure"><button type="button" data-v6-metric="load" class="${trendMetric==='load'?'active':''}" aria-pressed="${trendMetric==='load'}">Best weight</button><button type="button" data-v6-metric="volume" class="${trendMetric==='volume'?'active':''}" aria-pressed="${trendMetric==='volume'}">Volume</button><button type="button" data-v6-metric="reps" class="${trendMetric==='reps'?'active':''}" aria-pressed="${trendMetric==='reps'}">Reps</button></div>`;
  }
  function chartCard(){
    const available=trendExercises();
    if(!available.length){
      return `<section class="v6-surface v6-feature"><div class="v6-card-head"><h2>Strength trend</h2><span class="v6-hint">From your workouts</span></div><div class="v6-no-trend"><strong>Your progress starts here</strong><p>Add your first workout to start building your chart.</p><button type="button" class="v6-button" data-v6-quick-log>Log an exercise</button></div></section>`;
    }
    if(!available.some(e=>e.id===selectedTrendExercise))selectedTrendExercise=available.reduce((a,e)=>entriesFor(e.id).length>entriesFor(a.id).length?e:a,available[0]).id;
    const selected=exById(selectedTrendExercise);
    const points=trendRecords(selectedTrendExercise);
    const first=points[0]?.value,last=points.at(-1)?.value;
    const delta=points.length>1?last-first:null;
    const goalLabel=trendMetric==='load'?'lb':trendMetric==='reps'?'reps / set':'lb × reps';
    const difference=delta===null?'Add another training day':`${delta>0?'+':''}${formatNum(delta)} ${goalLabel} since first recorded day`;
    const prior=points.length>1&&first>0?` (${delta>0?'+':''}${Math.round(delta/first*100)}%)`:'';
    return `<section class="v6-surface v6-feature" aria-label="Your strength progress"><div class="v6-card-head"><div><span class="v6-eyebrow">ACTUAL WORKOUT DATA</span><h2>Strength trend</h2></div><span class="v6-hint">${points.length} recorded ${points.length===1?'day':'days'}</span></div>
      <div class="v6-chart-controls"><label class="v6-field">Exercise<select id="v6TrendExercise" aria-label="Exercise to chart">${available.map(e=>`<option value="${escapeText(e.id)}" ${e.id===selectedTrendExercise?'selected':''}>${escapeText(e.name)}</option>`).join('')}</select></label><label class="v6-field v6-range-field">Time range<select id="v6TrendRange" aria-label="Chart time range"><option value="30" ${trendWindow==='30'?'selected':''}>30 days</option><option value="90" ${trendWindow==='90'?'selected':''}>90 days</option><option value="all" ${trendWindow==='all'?'selected':''}>All time</option></select></label></div>
      ${metricSelector()}
      <div class="v6-trend-value"><strong>${last!==undefined?formatNum(last):'—'}</strong><span>${last!==undefined?goalLabel:'No recorded sets'}</span></div>
      <div class="v6-trend-delta ${delta>0?'up':delta<0?'down':''}">${escapeText(difference+prior)}</div>
      ${lineChart(points,`${selected?.name||'Exercise'} ${trendMetric}`)}
      <button type="button" class="v6-inline-action" data-v6-show-exercise="${escapeText(selectedTrendExercise)}">View logged workouts <span aria-hidden="true">→</span></button>
    </section>`;
  }
  function factCard(){
    return `<aside class="v6-fact" aria-label="Fitness fact"><span class="v6-fact-icon" aria-hidden="true">✳</span><div><span class="v6-eyebrow">QUICK FITNESS NOTE</span><p>${escapeText(factList[factIndex%factList.length])}</p></div><button type="button" class="v6-fact-next" data-v6-next-fact aria-label="Show another training fact">↻</button></aside>`;
  }
  function journalTotals(){
    const week=daysAgo(6);
    const days=new Set([...workoutEntries(),...cardioEntries()].filter(r=>r.date>=week).map(r=>r.date)).size;
    const lifts=workoutEntries().filter(r=>r.date>=week).length;
    const minutes=cardioEntries().filter(r=>r.date>=week).reduce((n,r)=>n+(Number(r.duration)||0),0);
    return {days,lifts,minutes};
  }
  function compactRecent(){
    const recent=dailySessions()[0];
    if(!recent)return `<section class="v6-recent v6-surface"><h2>Latest workout</h2><p class="v6-muted">Nothing logged yet. Your sessions will appear here by date.</p><button class="v6-button" data-v6-quick-log>Log a workout</button></section>`;
    const exerciseNames=recent.weights.slice(0,3).map(r=>exerciseName(r.exerciseId));
    const more=recent.weights.length>3?` +${recent.weights.length-3} more`:'';
    return `<section class="v6-recent v6-surface"><div class="v6-card-head"><h2>Latest training day</h2><button type="button" class="v6-inline-action" data-v6-open-day="${escapeText(recent.date)}">View journal →</button></div><div class="v6-recent-date">${escapeText(readableDate(recent.date))}</div><p class="v6-muted">${escapeText(exerciseNames.join(' · ')+more+(recent.cardio.length?' · '+recent.cardio.length+' cardio session'+(recent.cardio.length>1?'s':''):''))||'Cardio session recorded'}</p></section>`;
  }
  function progressHome(){
    const totals=journalTotals();
    return `<div class="v6-page"><div class="v6-heading"><span class="v6-eyebrow">LIFT LOG · YOUR PROGRESS</span><h1>See how far you've come<span class="v6-period">.</span></h1><p>Your strength, one workout at a time.</p></div>
      ${chartCard()}
      ${factCard()}
      ${weightBoard(5)}
      <div class="v6-section-title"><h2>This week</h2><span>Last 7 days</span></div>
      <div class="v6-stat-grid"><div class="v6-stat"><strong>${totals.days}</strong><span>Active days</span></div><div class="v6-stat"><strong>${totals.lifts}</strong><span>Lift entries</span></div><div class="v6-stat"><strong>${formatNum(totals.minutes)}</strong><span>Cardio min</span></div></div>
      ${compactRecent()}
      <button type="button" class="v6-button v6-full" data-v6-open-journal>See your workout journal <span aria-hidden="true">→</span></button>
    </div>`;
  }
  function sessionHeader(session,open){
    const lines=[];
    if(session.weights.length)lines.push(`${session.weights.length} ${session.weights.length===1?'lift':'lifts'}`);
    if(session.cardio.length)lines.push(`${session.cardio.length} cardio`);
    return `<button type="button" class="v6-day-header" data-v6-toggle-day="${escapeText(session.date)}" aria-expanded="${open}"><span><strong>${escapeText(readableDate(session.date))}</strong><small>${escapeText(lines.join(' · '))}</small></span><span class="v6-day-arrow" aria-hidden="true">${open?'−':'+'}</span></button>`;
  }
  function loggedLift(record){
    const sets=Number(record.sets),reps=Number(record.reps);
    const repText=sets>0&&reps>0?`${sets} sets × ${reps} reps`:'Sets / reps not recorded';
    const notes=String(record.notes||'');
    return `<div class="v6-record"><div class="v6-record-icon" aria-hidden="true">↗</div><div class="v6-record-info"><strong>${escapeText(exerciseName(record.exerciseId))}</strong><span>${escapeText(repText)}${notes?` · ${escapeText(notes.slice(0,75))}`:''}</span></div><div class="v6-record-weight"><strong>${record.exerciseId==='ab-coaster'&&Number(record.weight)===0?'Bodyweight':formatNum(record.weight)+' lb'}</strong><button type="button" data-v6-edit-entry="${escapeText(record.id)}">Edit</button></div></div>`;
  }
  function loggedCardio(record){
    const detail=[`${formatNum(record.duration)} min`,record.distance?`${formatNum(record.distance)} mi`:null,record.avgHr?`${formatNum(record.avgHr)} bpm`:null].filter(Boolean).join(' · ');
    return `<div class="v6-record"><div class="v6-record-icon" aria-hidden="true">♡</div><div class="v6-record-info"><strong>${escapeText(record.type||'Cardio')}</strong><span>${escapeText(detail)}${record.notes?` · ${escapeText(String(record.notes).slice(0,75))}`:''}</span></div><span class="v6-record-tag">Cardio</span></div>`;
  }
  function dayCard(session){
    const open=expandedJournalDate===session.date;
    return `<section class="v6-day v6-surface">${sessionHeader(session,open)}${open?`<div class="v6-day-body">${session.weights.map(loggedLift).join('')}${session.cardio.map(loggedCardio).join('')}<button type="button" class="v6-day-add" data-v6-quick-log="${escapeText(session.date)}">+ Add exercise to this day</button></div>`:''}</section>`;
  }
  // All saved weights are displayed, even when a user has never saved a dated set.
  function latestWeightRows(){
    const byExercise=new Map();
    workoutEntries().forEach((entry,index)=>{
      const prior=byExercise.get(entry.exerciseId);
      const date=isoDate(entry.date)?entry.date:'';
      const previousDate=prior&&isoDate(prior.entry.date)?prior.entry.date:'';
      if(!prior||date>previousDate||(date===previousDate&&index>prior.index)){
        byExercise.set(entry.exerciseId,{entry,index});
      }
    });
    const exercises=[...data.exercises];
    for(const id of byExercise.keys()){
      if(!exercises.some(e=>e.id===id))exercises.push({id,name:'Unlisted exercise ('+id+')',loadType:'direct',directWeight:0});
    }
    return exercises.map(ex=>{
      const latest=byExercise.get(ex.id)?.entry||null;
      const current=latest?Number(latest.weight):Number(exerciseLoad(ex))||0;
      return {ex,latest,current};
    }).filter(x=>x.latest||x.current>0).sort((a,b)=>{
      const da=a.latest?.date||'',db=b.latest?.date||'';
      return db.localeCompare(da)||a.ex.name.localeCompare(b.ex.name);
    });
  }
  function weightBoard(limit=0){
    let rows=latestWeightRows();
    const q=tab==='history'?journalQuery.trim().toLowerCase():'';
    if(q)rows=rows.filter(x=>x.ex.name.toLowerCase().includes(q));
    const visible=limit?rows.slice(0,limit):rows;
    return `<section class="v6-surface v62-weight-board">
      <div class="v6-card-head"><h2>My last working weights</h2><span class="v6-hint">${rows.length} saved movements</span></div>
      <p class="v62-weight-explain">These are your last logged weights, or the saved starting load if you haven't logged a dated set yet.</p>
      <div class="v62-weight-list">${visible.map(x=>`<div class="v62-weight-row">
        <div><strong>${escapeText(x.ex.name)}</strong><small>${x.latest?'Last logged '+escapeText(readableDate(x.latest.date))+' · '+(Number(x.latest.sets)>0?x.latest.sets+' sets × '+x.latest.reps+' reps':'Sets/reps not recorded'):'Saved starting load · no dated entry'}</small></div>
        <strong>${x.ex.id==='ab-coaster'&&x.current===0?'Bodyweight':formatNum(x.current)+' lb'}</strong>
      </div>`).join('')||'<p class="v6-muted">No recorded weights match your search.</p>'}</div>
      ${limit&&rows.length>limit?'<button type="button" class="v6-inline-action" data-v62-open-weights>View all weights →</button>':''}
    </section>`;
  }
  function filteredSessions(){
    const q=journalQuery.trim().toLowerCase();
    if(!q)return dailySessions();
    return dailySessions().map(session=>{
      const dateMatch=session.date.toLowerCase().includes(q)||readableDate(session.date).toLowerCase().includes(q);
      return {
        date:session.date,
        weights:session.weights.filter(r=>dateMatch||exerciseName(r.exerciseId).toLowerCase().includes(q)||(r.notes||'').toLowerCase().includes(q)),
        cardio:session.cardio.filter(r=>dateMatch||String(r.type||'').toLowerCase().includes(q)||(r.notes||'').toLowerCase().includes(q))
      };
    }).filter(s=>s.weights.length||s.cardio.length);
  }
  function journalPage(){
    const all=dailySessions(),sessions=filteredSessions();
    if(sessions.length&&!sessions.some(s=>s.date===expandedJournalDate))expandedJournalDate=sessions[0].date;
    const shown=(journalShowAll||journalQuery.trim())?sessions:sessions.slice(0,visibleJournalDays);
    return `<div class="v6-page v6-journal">
      <div class="v6-heading"><span class="v6-eyebrow">TRAINING JOURNAL · FULL HISTORY</span>
        <h1>Find any previous workout<span class="v6-period">.</span></h1>
        <p>${workoutEntries().length} strength entries across ${all.length} dates, plus ${cardioEntries().length} cardio sessions. Nothing is hidden by a recent-date cutoff.</p></div>
      <div class="v6-journal-toolbar v6-surface"><label class="v6-field">Log for date<input id="v6JournalDate" type="date" value="${escapeText(selectedJournalDate)}" /></label><button type="button" class="v6-button" data-v6-quick-log="${escapeText(selectedJournalDate)}">+ Log exercise</button></div>
      <label class="v6-field v62-search-field">Search all workouts and weights<input id="v62JournalSearch" type="search" value="${escapeText(journalQuery)}" placeholder="Leg press, preacher curl, date, notes…" autocomplete="off"/></label>
      ${weightBoard()}
      <div class="v6-section-title"><h2>Every training day</h2><span>${sessions.length} of ${all.length} dates</span></div>
      ${shown.length?shown.map(dayCard).join(''):`<div class="v6-empty v6-surface"><strong>No matching workouts</strong><p>Try another search or recover a previous JSON backup from Settings.</p></div>`}
      ${sessions.length>shown.length?`<button type="button" class="v6-more" data-v62-all-days>Show all ${sessions.length} training days</button>`:''}
      <p class="v6-journal-footer">Workout entries remain grouped by their recorded date. Use Edit to fix a weight, date, set count, or notes.</p>
    </div>`;
  }
  function quickLog(date) {
  const selected = isoDate(date)?date:today();
  selectedJournalDate = selected;
  const catalog = window.LiftLogCatalog;
  let visible = 20;
  let query = '';
  const normal = value => String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const savedExercise = entry => data.exercises.find(ex=>
    ex.id===entry.id||ex.catalogId===entry.id||normal(ex.name)===normal(entry.name));
  const recentDate = entry => {
    const saved=savedExercise(entry);
    return saved ? (recent(saved.id)?.date || '') : '';
  };
  function renderPickerResults(){
    if(!catalog) return '<p class="v6-muted">Exercise library is unavailable. Reopen Lift Log after the update finishes.</p>';
    const all=catalog.list(),normalized=normal(query);
    const listed=new Set(all.map(entry=>normal(entry.name)));
    const extra=data.exercises.filter(ex=>!listed.has(normal(ex.name))&&!all.some(entry=>entry.id===ex.id||entry.id===ex.catalogId));
    const extraMatches=extra.filter(ex=>!normalized || normal(`${ex.name} ${ex.category} ${ex.notes||''}`).includes(normalized));
    let matches=catalog.search(query).map(entry=>({entry,custom:false}));
    if(!normalized){
      matches.sort((a,b)=>Number(!!savedExercise(b.entry))-Number(!!savedExercise(a.entry))||recentDate(b.entry).localeCompare(recentDate(a.entry)));
    }
    matches=[...extraMatches.map(entry=>({entry,custom:true})),...matches];
    const rows=matches.slice(0,visible).map(({entry,custom})=>{
      const saved=custom?savedExercise(entry)||entry:savedExercise(entry);
      const visual=catalog.visual(entry);
      const key=custom?'data-v6-saved-pick':'data-v6-library-pick';
      return `<button type="button" class="v6-picker-item v6-library-item" ${key}="${escapeText(entry.id)}">
        <span class="v6-library-art" aria-hidden="true">${visual}</span>
        <span class="v6-library-details"><strong>${escapeText(entry.name)}</strong><small>${escapeText(entry.equipment||entry.category||'Custom exercise')}</small><small class="v6-library-cue">${escapeText(entry.cue||'Your saved custom exercise')}</small></span>
        <span class="v6-library-tag">${saved?'Saved':'Add'}</span>
      </button>`;
    }).join('');
    const remaining=matches.length-visible;
    return `<p class="v6-picker-count">${matches.length} matches · ${Math.min(matches.length,visible)} shown</p>
      ${rows||'<p class="v6-muted">No exercises match. Try another name or create a custom exercise below.</p>'}
      ${remaining>0?`<button type="button" class="v6-picker-more" data-v6-picker-more>Show more (${remaining} remaining)</button>`:''}`;
  }
  openModal(`${modalTop('Choose an exercise','Search the full exercise library first')}
    <div class="v6-picker" id="v6PickerSurface">
      <label class="v6-field">Training date<input id="v6PickerDate" type="date" value="${escapeText(selected)}" required /></label>
      <label class="v6-field">Find an exercise<input id="v6PickerSearch" type="search" placeholder="Ab Coaster, wide grip pulldown..." autocomplete="off" /></label>
      <div class="v6-picker-list" id="v6PickerList" aria-live="polite">${renderPickerResults()}</div>
      <div class="v6-picker-custom">
        <p><strong>Can't find your exercise?</strong><span>Create a custom one only when it's missing from the library.</span></p>
        <button type="button" data-v6-create-custom>+ Create Custom Exercise</button>
      </div>
    </div>`);
  const surface=modalRoot.querySelector('#v6PickerSurface');
  surface?.querySelector('#v6PickerSearch')?.addEventListener('input',event=>{
    query=event.target.value;
    visible=20;
    surface.querySelector('#v6PickerList').innerHTML=renderPickerResults();
  });
  surface?.addEventListener('click',event=>{
    if(!event.target.closest('[data-v6-picker-more]'))return;
    event.preventDefault();
    visible+=20;
    surface.querySelector('#v6PickerList').innerHTML=renderPickerResults();
  });
}
  function editEntry(id){
    const record=data.entries.find(r=>r.id===id);
    if(!record)return;
    const name=exerciseName(record.exerciseId);
    const exercise=exById(record.exerciseId);
    const plateLoad=exercise?.loadType==='plates'||Object.keys(record.plates||{}).length>0;
    openModal(`${modalTop('Edit logged exercise',name)}<form id="v6EntryForm"><div class="v6-editor-intro">${escapeText(name)} · ${record.exerciseId==='ab-coaster'&&Number(record.weight)===0?'Bodyweight':formatNum(record.weight)+' lb'}</div>
      <label class="v6-field">Workout date<input id="v6EntryDate" type="date" value="${escapeText(record.date)}" required /></label>
      <div class="v6-two-cols"><label class="v6-field">Sets<input id="v6EntrySets" type="number" min="1" max="100" value="${record.sets||''}" placeholder="3" /></label><label class="v6-field">Reps per set<input id="v6EntryReps" type="number" min="1" max="1000" value="${record.reps||''}" placeholder="10" /></label></div>
      ${plateLoad?'<p class="v6-editor-tip">This record uses plate loading. Its weight is kept unchanged so the plate breakdown stays accurate.</p>':`<label class="v6-field">Working weight (lb)<input id="v6EntryWeight" type="number" step="0.5" min="${record.exerciseId==='ab-coaster'?0:0.5}" max="100000" value="${Number(record.weight)||0}" required /></label>`}
      <label class="v6-field">Notes<textarea id="v6EntryNotes" maxlength="500" rows="3" placeholder="How did it feel?">${escapeText(record.notes||'')}</textarea></label><button type="submit" class="v6-button v6-full">Save workout changes</button><button type="button" class="v6-delete-entry" id="v6DeleteEntry">Delete this entry</button></form>`);
    modalRoot.querySelector('#v6DeleteEntry')?.addEventListener('click',()=>{
      if(!confirm(`Delete the ${record.date} ${name} workout entry? This cannot be undone.`))return;
      data.entries=data.entries.filter(entry=>entry.id!==record.id);
      if(save()){closeModal();render();notify('Workout entry deleted')}
    });
    modalRoot.querySelector('#v6EntryForm')?.addEventListener('submit',event=>{
      event.preventDefault();
      const date=modalRoot.querySelector('#v6EntryDate')?.value;
      const setValue=modalRoot.querySelector('#v6EntrySets')?.value;
      const repValue=modalRoot.querySelector('#v6EntryReps')?.value;
      const sets=Number(setValue||0),reps=Number(repValue||0);
      const weight=plateLoad?record.weight:Number(modalRoot.querySelector('#v6EntryWeight')?.value);
      if(!isoDate(date)||!date)return alert('Choose a valid date.');
      if(Boolean(setValue)!==Boolean(repValue))return alert('Enter both sets and reps, or leave both blank.');
      if((setValue&&(!Number.isInteger(sets)||sets<1||sets>100))||(repValue&&(!Number.isInteger(reps)||reps<1||reps>1000)))return alert('Enter valid whole-number sets and reps.');
      if(!Number.isFinite(Number(weight))||Number(weight)<0||(Number(weight)===0&&record.exerciseId!=='ab-coaster')||Number(weight)>100000)return alert('Enter a valid working weight.');
      Object.assign(record,{date,sets:setValue?sets:null,reps:repValue?reps:null,weight:Number(weight),notes:modalRoot.querySelector('#v6EntryNotes')?.value?.trim()||''});
      if(save()){expandedJournalDate=date;selectedJournalDate=date;closeModal();render();notify('Workout entry updated')}
    });
  }

  const standardLog=openLog;
  openLog=function(exerciseId){
    const date=pendingLogDate;
    pendingLogDate=null;
    standardLog(exerciseId);
    if(date&&isoDate(date)){const field=modalRoot.querySelector('#logDate');if(field)field.value=date;}
  };

  home=progressHome;
  history=journalPage;
  const tabs=document.querySelector('.bottomnav');
  const homeButton=tabs?.querySelector('[data-tab="home"]');if(homeButton)homeButton.innerHTML='<span aria-hidden="true">↗</span>Progress';
  const historyButton=tabs?.querySelector('[data-tab="history"]');if(historyButton)historyButton.innerHTML='<span aria-hidden="true">▤</span>Journal';
  const trainButton=tabs?.querySelector('[data-tab="exercises"]');if(trainButton)trainButton.innerHTML='<span aria-hidden="true">⊕</span>Train';
  const topLog=document.querySelector('#addExerciseTop');if(topLog){topLog.textContent='+ Log';topLog.setAttribute('title','Log a workout');topLog.setAttribute('aria-label','Log an exercise');}
  document.addEventListener('click',e=>{
    if(e.target.closest('#addExerciseTop')){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();quickLog(today());
    }
  },true);
  app.addEventListener('click',event=>{
    const target=event.target.closest('[data-v6-quick-log],[data-v6-open-journal],[data-v6-toggle-day],[data-v6-more-days],[data-v6-next-fact],[data-v6-open-day],[data-v6-show-exercise],[data-v6-metric],[data-v6-edit-entry],[data-v62-all-days],[data-v62-open-weights]');
    if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(target.hasAttribute('data-v62-all-days')){journalShowAll=true;render();return;}
    if(target.hasAttribute('data-v62-open-weights')){tab='history';render();scrollTo({top:0,behavior:'instant'});return;}
    if(target.hasAttribute('data-v6-quick-log')){quickLog(target.dataset.v6QuickLog||(tab==='history'?selectedJournalDate:today()));return;}
    if(target.hasAttribute('data-v6-open-journal')){tab='history';render();scrollTo({top:0,behavior:'instant'});return;}
    if(target.hasAttribute('data-v6-toggle-day')){expandedJournalDate=expandedJournalDate===target.dataset.v6ToggleDay?'':target.dataset.v6ToggleDay;render();return;}
    if(target.hasAttribute('data-v6-open-day')){expandedJournalDate=target.dataset.v6OpenDay;selectedJournalDate=expandedJournalDate;tab='history';render();scrollTo({top:0,behavior:'instant'});return;}
    if(target.hasAttribute('data-v6-more-days')){visibleJournalDays+=8;render();return;}
    if(target.hasAttribute('data-v6-next-fact')){factIndex=(factIndex+1)%factList.length;render();return;}
    if(target.hasAttribute('data-v6-show-exercise')){const day=workoutEntries().filter(r=>r.exerciseId===target.dataset.v6ShowExercise).map(r=>r.date).sort().at(-1);expandedJournalDate=day||null;if(day)selectedJournalDate=day;tab='history';render();scrollTo({top:0,behavior:'instant'});return;}
    if(target.hasAttribute('data-v6-metric')){trendMetric=target.dataset.v6Metric;render();return;}
    if(target.hasAttribute('data-v6-edit-entry')){editEntry(target.dataset.v6EditEntry);return;}
  },true);
  app.addEventListener('input',event=>{
    if(event.target.id!=='v62JournalSearch')return;
    const position=event.target.selectionStart;
    journalQuery=event.target.value;
    render();
    const field=app.querySelector('#v62JournalSearch');
    if(field){
      field.focus();
      if(typeof position==='number')try{field.setSelectionRange(position,position)}catch(_){}
    }
  },true);
  app.addEventListener('change',event=>{
    if(event.target.id==='v6TrendExercise'){selectedTrendExercise=event.target.value;if(selectedTrendExercise==='ab-coaster'&&trendMetric==='load')trendMetric='reps';render()}
    if(event.target.id==='v6TrendRange'){trendWindow=event.target.value;render()}
    if(event.target.id==='v6JournalDate'){if(isoDate(event.target.value))selectedJournalDate=event.target.value;render()}
  },true);
  modalRoot.addEventListener('click',function(event){
  const saved=event.target.closest('[data-v6-saved-pick]');
  const library=event.target.closest('[data-v6-library-pick]');
  const custom=event.target.closest('[data-v6-create-custom]');
  if(!saved&&!library&&!custom)return;
  event.preventDefault();event.stopImmediatePropagation();
  const pickedDate=modalRoot.querySelector('#v6PickerDate')?.value;
  const date=isoDate(pickedDate)?pickedDate:today();
  selectedJournalDate=date;expandedJournalDate=date;
  closeModal();
  tab='history';
  render();
  if(saved){pendingLogDate=date;openLog(saved.dataset.v6SavedPick);return;}
  if(library){pendingLogDate=date;window.LiftLogCatalog?.pick(library.dataset.v6LibraryPick);return;}
  // Only assign the pending date after custom exercise creation succeeds.
  pendingLogDate=null;
  openExercise();
  const addedId=editorState?.id;
  modalRoot.querySelector('#exerciseForm')?.addEventListener('submit',()=>{
    if(addedId && exById(addedId))queueMicrotask(()=>{pendingLogDate=date;openLog(addedId);});
  });
} ,true);
  render();
})();
