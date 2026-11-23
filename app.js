'use strict';
const KEY='liftlog.v1';
const PLATES=[45,35,25,10,5,2.5];
const initial={version:1,exercises:[
{id:'leg-press',name:'Leg Press',category:'Legs',loadType:'plates',perSide:true,plates:{'45':4,'25':1},directWeight:0,notes:'Sled weight excluded.'},
{id:'calf-raises',name:'Calf Raises',category:'Legs',loadType:'plates',perSide:false,plates:{'45':2},directWeight:0,notes:'Total plates assumed; confirm if per side.'},
{id:'leg-curl',name:'Hamstring Leg Curl',category:'Legs',loadType:'direct',perSide:false,plates:{},directWeight:150,notes:'150 lb on machine; seated or lying variation not yet specified.'}
],entries:[
{id:'seed-leg',date:'2026-11-17',exerciseId:'leg-press',weight:410,sets:null,reps:null,perSide:true,plates:{'45':4,'25':1},notes:'205 lb per side; sled excluded.'},
{id:'seed-calf',date:'2026-11-17',exerciseId:'calf-raises',weight:90,sets:null,reps:null,perSide:false,plates:{'45':2},notes:'Assumed total plate load; machine excluded.'},
{id:'seed-curl',date:'2026-11-17',exerciseId:'leg-curl',weight:150,sets:null,reps:null,perSide:false,plates:{},notes:'Hamstring leg curl machine; variation not yet specified.'}
]};
function copy(x){return JSON.parse(JSON.stringify(x))}
function validState(x){return x&&x.version===1&&Array.isArray(x.exercises)&&Array.isArray(x.entries)&&x.exercises.length<5000&&x.entries.length<300000&&x.exercises.every(e=>typeof e.id==='string'&&typeof e.name==='string'&&e.name.length<=100&&['plates','direct'].includes(e.loadType))&&x.entries.every(e=>typeof e.exerciseId==='string'&&Number.isFinite(Number(e.weight))&&Number(e.weight)>=0&&Number(e.weight)<100000)}
let dataRecoveryBlocked=false;
let data=(()=>{
  let raw=null;
  try{
    raw=localStorage.getItem(KEY);
    if(raw!==null){
      const saved=JSON.parse(raw);
      if(validState(saved))return saved;
      dataRecoveryBlocked=true;
    }
  }catch(_){dataRecoveryBlocked=true}
  // A valid independent local copy is safer than silently resetting to demo data.
  try{
    const previous=JSON.parse(localStorage.getItem(KEY+'.lastGood'));
    if(validState(previous)){
      if(dataRecoveryBlocked&&raw){try{localStorage.setItem(KEY+'.unreadable',raw)}catch(_){}}
      dataRecoveryBlocked=false;
      return previous;
    }
  }catch(_){}
  // Protect unreadable user data: never overwrite it with starter entries.
  return copy(initial);
})();
// Backward-compatible update for data created with the first prototype. Never re-seed if removed later.
if(!data.migrations?.legCurl20261117){
  if(data.entries.some(e=>e.id==='seed-leg'||e.id==='seed-calf')&&!data.exercises.some(e=>e.id==='leg-curl')){
    data.exercises.push(copy(initial.exercises.find(e=>e.id==='leg-curl')));
    data.entries.push(copy(initial.entries.find(e=>e.id==='seed-curl')));
  }
  data.migrations={...(data.migrations||{}),legCurl20261117:true};
}
const blankCoach={goal:'',currentWeight:'',waist:'',targetWeight:'',maintenance:'',days:'',notes:''};
if(!data.coach||typeof data.coach!=='object')data.coach=copy(blankCoach);
if(!Array.isArray(data.checkins))data.checkins=[];
if(!data.intake || typeof data.intake!=='object')data.intake={};
if(!Array.isArray(data.weeklyReviews))data.weeklyReviews=[];
// Do not write initial seed data at startup: recovery snapshots may contain missing logs.

let tab='home',selectedExercise='leg-press',editorState=null,toastTimer=null,interviewStep=0;
const app=document.querySelector('#app'),modalRoot=document.querySelector('#modalRoot');
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function newId(){return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`}
function save(){
  if(dataRecoveryBlocked){
    alert('Your existing workout data could not be read. Nothing has been overwritten. Use Settings → Recovery & backups before adding a workout.');
    return false;
  }
  if(!validState(data)){alert('Workout data validation failed. No changes were written.');return false}
  try{
    const before=localStorage.getItem(KEY);
    if(before){
      try{
        const previous=JSON.parse(before);
        if(validState(previous)){
          const removedFrom=(name)=>{
            const ids=new Set((data[name]||[]).map(x=>String(x.id)));
            return (previous[name]||[]).filter(x=>!ids.has(String(x.id)));
          };
          const missingEntries=removedFrom('entries'),missingCardio=removedFrom('cardio');
          const auth=window.LiftLogAuthorizedDeletion;
          const allowed=(name,rows)=>!rows.length||
            (rows.length===1&&auth?.type===name&&auth.id===rows[0].id);
          if(!allowed('entries',missingEntries)||!allowed('cardio',missingCardio)){
            const repaired=window.LiftLogSafety.merge(data,previous);
            data=repaired.data;
            notify('Older workout records were preserved automatically.');
          }
          void window.LiftLogSafety?.capture(previous,'before change');
        }
      }catch(_){}
    }
    window.LiftLogAuthorizedDeletion=null;
    const serialized=JSON.stringify(data);
    localStorage.setItem(KEY,serialized);
    // A quota error in the *secondary* copy must not falsely report the primary save as failed.
    try{localStorage.setItem(KEY+'.lastGood',serialized)}catch(_){}
    void window.LiftLogSafety?.capture(serialized,'saved workout data');
    return true;
  }catch(e){
    alert('Could not save the workout on this device. Export a JSON backup and check available storage. '+e.message);
    return false;
  }
}
function notify(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
function exById(id){return data.exercises.find(e=>e.id===id)}
function entriesFor(id){return data.entries.map((entry,index)=>({entry,index})).filter(x=>x.entry.exerciseId===id).sort((a,b)=>String(b.entry.date||'').localeCompare(String(a.entry.date||''))||b.index-a.index).map(x=>x.entry)}
function recent(id){return entriesFor(id)[0]}
function plateWeight(plates,perSide){return Object.entries(plates||{}).reduce((s,[size,count])=>s+Number(size)*Number(count||0),0)*(perSide?2:1)}
function exerciseLoad(ex){if(ex.loadType==='direct')return Number(ex.directWeight)||0;return plateWeight(ex.plates,ex.perSide)}
function loadLabel(ex){return ex.loadType==='plates'?(ex.perSide?'Plates per side · machine excluded':'Total plates · machine excluded'):'Working weight'}
function describePlates(plates,perSide){const chunks=Object.entries(plates||{}).filter(([,c])=>c>0).sort((a,b)=>Number(b[0])-Number(a[0])).map(([w,c])=>`${c}×${w}`);return (chunks.join(' + ')||'No plates')+(perSide?' / side':' total')}
function categoryIcon(category){return ({Legs:'▥',Chest:'◒',Back:'≋',Shoulders:'⬡',Arms:'⌁',Core:'◇'})[category]||'◈'}
function item(ex){const r=recent(ex.id),weight=r?r.weight:exerciseLoad(ex);return `<article class="card ex-card"><div class="ex-icon">${categoryIcon(ex.category)}</div><div class="grow"><div class="ex-name">${esc(ex.name)}</div><div class="mini">${esc(ex.category)} · ${esc(ex.loadType==='plates'?describePlates(r?.plates||ex.plates,r?r.perSide:ex.perSide):'Direct weight')}</div></div><div class="load">${fmt(weight)} <small>lb</small></div><button class="primary" data-log="${esc(ex.id)}">Log</button></article>`}
function heading(title,sub){return `<div class="eyebrow">STRENGTH, IN NUMBERS</div><h1 class="headline">${title}</h1><p class="sub">${sub}</p>`}
function home(){const n=data.entries.length, max=Math.max(0,...data.entries.map(x=>Number(x.weight)||0));const latest=[...data.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);return `${heading('Make every rep count.','A clean view of the weights you actually lifted.')}<div class="stats"><div class="stat"><div class="label">Exercises</div><div class="number">${data.exercises.length}</div><div class="note">Tracked</div></div><div class="stat"><div class="label">Log entries</div><div class="number">${n}</div><div class="note">All time</div></div><div class="stat"><div class="label">Top load</div><div class="number">${fmt(max)}</div><div class="note">lb recorded</div></div></div><div class="section-header"><h2>Quick log</h2><span class="hint">Tap an exercise to log</span></div>${data.exercises.map(item).join('')||'<div class="empty">Add an exercise to begin.</div>'}<div class="section-header"><h2>Latest activity</h2><button class="secondary" data-tab="history">View history</button></div><div class="card">${latest.length?latest.map(historyRow).join(''):'<div class="empty">No logged workouts yet.</div>'}</div>`}
function exercises(){return `${heading('Your exercises.','Set your equipment configuration and log in one tap.')}<div class="section-header"><h2>Exercise library</h2><button class="primary" id="addExercise">＋ Add new</button></div>${data.exercises.map(ex=>`<div>${item(ex)}<div class="flexend" style="margin:-5px 6px 15px"><button class="secondary" data-edit="${esc(ex.id)}">Edit equipment / exercise</button></div></div>`).join('')||'<div class="empty">Create your first exercise.</div>'}`}
function historyRow(r){const e=exById(r.exerciseId);const rep=r.sets&&r.reps?`${r.sets} × ${r.reps}`:'Sets/reps not entered';return `<div class="history-line"><time>${esc(r.date.slice(5))}</time><div><strong>${esc(e?.name||'Deleted exercise')}</strong><span class="mini">${esc(rep)}${r.notes?' · '+esc(r.notes):''}</span></div><div class="weight">${fmt(r.weight)} <span class="mini">lb</span></div></div>`}
function chartRows(id){const records=entriesFor(id).slice().reverse();const nums=records.map(r=>Number(r.weight));if(nums.length<2)return `<div class="chart-empty">Log this exercise again to see a progress line.</div>`;const W=640,H=208,pad=32,low=Math.min(...nums),high=Math.max(...nums),spread=Math.max(10,high-low),points=nums.map((v,i)=>[(pad+(i/(nums.length-1))*(W-2*pad)).toFixed(1),(H-pad-(v-(low-spread*.1))/(spread*1.2)*(H-2*pad)).toFixed(1)]);const line=points.map(p=>p.join(',')).join(' ');return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Load history from ${fmt(nums[0])} to ${fmt(nums.at(-1))} pounds"><line x1="32" y1="175" x2="610" y2="175" stroke="#405269"/><polyline fill="none" stroke="#9ef5a8" stroke-width="4" stroke-linejoin="round" points="${line}"/>${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4.2" fill="#9ef5a8"/>`).join('')}<text x="34" y="200" font-size="12" fill="#9aa8bd">${esc(records[0].date.slice(5))}</text><text x="605" y="200" text-anchor="end" font-size="12" fill="#9aa8bd">${esc(records.at(-1).date.slice(5))}</text><text x="40" y="21" font-size="12" fill="#aab9c8">${fmt(high)} lb max</text></svg></div>`}
function history(){const ex=exById(selectedExercise)||data.exercises[0];if(!ex)return `${heading('Your progress.','Your records will appear here once you add an exercise.')}`;selectedExercise=ex.id;const rs=entriesFor(ex.id),best=Math.max(0,...rs.map(r=>Number(r.weight)));return `${heading('Progress over time.','Every entry stays in your history until you delete it.')}<div class="section-header"><h2>Exercise progress</h2><div class="filter"><select id="historyExercise" aria-label="Choose exercise">${data.exercises.map(e=>`<option value="${esc(e.id)}" ${e.id===ex.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div></div><div class="card"><div class="flex" style="justify-content:space-between"><div><div class="eyebrow">${esc(ex.name)}</div><div style="font-size:26px;font-weight:800">${fmt(best)} <span class="mini">lb best logged</span></div></div><span class="pr-bubble">${rs.length} entries</span></div>${chartRows(ex.id)}</div><div class="section-header"><h2>Entry history</h2><span class="hint">Newest first</span></div><div class="card">${rs.length?rs.map(r=>`<div class="history-line"><time>${esc(r.date.slice(5))}</time><div><strong>${fmt(r.weight)} lb</strong><span class="mini">${r.sets&&r.reps?`${r.sets} sets × ${r.reps} reps`:'Sets/reps not entered'}<br>${esc(r.notes||'')}</span></div><button class="secondary danger" data-remove-entry="${esc(r.id)}" title="Delete log entry">Delete</button></div>`).join(''):'<div class="empty">No entries yet.</div>'}</div>`}
function coach(){
 const c={...blankCoach,...data.coach};
 const w=Number(c.currentWeight), maintenance=Number(c.maintenance), goal=c.goal;
 const mult={cut:.88,recomp:1,maintain:1,gain:1.06}[goal]||1;
 const target=maintenance>0&&goal?Math.round(maintenance*mult/25)*25:null;
 const prot=w>0?`${Math.round(w*.7)}–${Math.round(w)}`:'—';
 const trend=checkinTrend();
 const advice=!goal?'Choose a goal first. Nutrition targets should reflect what you are trying to achieve.':goal==='cut'?'Start with a modest deficit; prioritize performance, recovery, and weight trends.':goal==='gain'?'Start with a small surplus and train progressively; avoid chasing scale weight too quickly.':goal==='recomp'?'Start near estimated maintenance and track strength, waist, and weight trends.':'Start near maintenance; monitor weight and training quality.';
 const latest=data.entries.filter(r=>r.sets&&r.reps).length;
 const last=data.checkins.slice(-4).reverse();
 return `${heading('Your coach, in progress.','A private goal and physique dashboard. AI conversation is planned, not active in this version.')}
 <div class="coach-note"><strong>Coaching preview, not AI</strong><p>This version uses transparent starting rules—not photo analysis, a language model, or medical advice. You remain in control of every change.</p></div>
 ${coachIntakeSection()}
 <form class="card" id="coachForm"><div class="section-header" style="margin-top:0"><h2>Your goal & current measurements</h2></div>
 <div class="field"><label for="coachGoal">Current goal</label><select id="coachGoal"><option value="" ${!goal?'selected':''}>Choose your goal</option><option value="recomp" ${goal==='recomp'?'selected':''}>Build muscle while reducing fat (recomp)</option><option value="cut" ${goal==='cut'?'selected':''}>Lose body fat (cut)</option><option value="gain" ${goal==='gain'?'selected':''}>Gain muscle (lean bulk)</option><option value="maintain" ${goal==='maintain'?'selected':''}>Maintain</option></select></div>
 <div class="twocol"><div class="field"><label for="coachWeight">Current bodyweight (lb)</label><input id="coachWeight" type="number" min="70" max="700" step="0.1" value="${esc(c.currentWeight)}" placeholder="e.g. 140"></div><div class="field"><label for="coachWaist">Waist (in, optional)</label><input id="coachWaist" type="number" min="15" max="80" step="0.1" value="${esc(c.waist)}" placeholder="e.g. 32"></div></div>
 <div class="twocol"><div class="field"><label for="coachTarget">Target weight (lb, optional)</label><input id="coachTarget" type="number" min="70" max="700" step="0.1" value="${esc(c.targetWeight)}"></div><div class="field"><label for="coachDays">Training days / week</label><select id="coachDays"><option value="" ${!c.days?'selected':''}>Choose training days</option>${[2,3,4,5,6].map(n=>`<option value="${n}" ${String(n)===String(c.days)?'selected':''}>${n} days</option>`).join('')}</select></div></div>
 <div class="field"><label for="coachMaintenance">Estimated maintenance calories (kcal/day)</label><input id="coachMaintenance" type="number" min="1000" max="8000" step="25" value="${esc(c.maintenance)}" placeholder="Enter your best current estimate"><p class="smallprint">Leave blank if unknown. No calorie target will be calculated until you enter a baseline.</p></div>
 <div class="field"><label for="coachNotes">Preferences / training limitations (optional)</label><textarea id="coachNotes" maxlength="400" placeholder="Equipment, schedule, injuries to accommodate, dietary preferences...">${esc(c.notes)}</textarea></div>
 <div class="btnrow"><button class="primary" type="submit">Save profile</button><button class="secondary" type="button" id="addCheckin">Save today's check-in</button></div></form>
 <div class="section-header"><h2>Starting guidance</h2><span class="hint">Rules-based preview</span></div>
 <div class="stats"><div class="stat"><div class="label">Daily calories</div><div class="number">${target?fmt(target):'—'}</div><div class="note">${target?'kcal/day starting estimate':'Add maintenance estimate'}</div></div><div class="stat"><div class="label">Daily protein</div><div class="number coach-number">${prot}</div><div class="note">g/day if resistance training</div></div><div class="stat"><div class="label">Weight trend</div><div class="number coach-number">${trend?esc(trend):'—'}</div><div class="note">lb/week between check-ins</div></div></div>
 <div class="card"><h2 style="font-size:17px">What to focus on</h2><p class="settings-p">${esc(advice)}</p><p class="settings-p">Use consistent weekly bodyweight averages, waist measurements, energy, and strength performance before adjusting calories. Reassess after approximately 2–3 weeks of useful data.</p><div class="separator"></div><h2 style="font-size:17px">Training feedback</h2><p class="settings-p">${latest<2?'Log sets and reps for at least two workout entries so future recommendations can account for how your sets are progressing.':`You have ${latest} workout entries with sets and reps. Track how hard sets felt to improve future progression recommendations.`} Do not increase loading when form deteriorates or an exercise provokes pain.</p></div>
 <div class="section-header"><h2>Physique check-ins</h2><span class="hint">Saved only in this browser</span></div>
 <div class="card">${last.length?last.map(x=>`<div class="history-line"><time>${esc(x.date.slice(5))}</time><div><strong>${fmt(x.weight)} lb</strong><span class="mini">${x.waist?`${fmt(x.waist)} in waist`: 'Waist not recorded'}</span></div></div>`).join(''):'<div class="empty">Save your first measurement to track trends.</div>'}</div>
 ${weeklyReviewSection()}
 <div class="card"><h2 style="font-size:17px">Planned AI agent</h2><p class="settings-p">A future AI-backed version can analyze workout history, physique progress, recovery and nutrition logs; suggest training blocks and calorie adjustments; explain its reasoning; and ask permission before changing a plan. It will need a secure backend, a real model integration, opt-in data sharing and photo privacy controls. None of those are active today.</p></div>`;
}
function checkinTrend(){const a=data.checkins;if(a.length<2)return null;const sorted=a.slice().sort((x,y)=>x.date.localeCompare(y.date));const first=sorted[0],last=sorted.at(-1);const days=(new Date(last.date+'T12:00:00')-new Date(first.date+'T12:00:00'))/864e5;if(days<7)return null;const rate=(last.weight-first.weight)/days*7;return `${rate>0?'+':''}${rate.toFixed(1)}`}
function readCoachForm(){const val=id=>document.getElementById(id)?.value||'';return {goal:val('coachGoal'),currentWeight:val('coachWeight'),waist:val('coachWaist'),targetWeight:val('coachTarget'),days:val('coachDays'),maintenance:val('coachMaintenance'),notes:val('coachNotes').trim()}}
function validateCoach(c){const numeric=[['currentWeight',70,700],['waist',15,80],['targetWeight',70,700],['maintenance',1000,8000]];for(const [k,min,max] of numeric){if(c[k]!==''&&(!Number.isFinite(Number(c[k]))||Number(c[k])<min||Number(c[k])>max)){alert(`Check ${k}: expected a value from ${min} to ${max}.`);return false}}return true}
function saveCoach(addCheckin=false){const c=readCoachForm();if(!validateCoach(c))return;if(addCheckin){const weight=Number(c.currentWeight);if(!(weight>0))return alert('Enter your bodyweight before saving a check-in.');const date=today();data.checkins.push({date,weight,waist:c.waist?Number(c.waist):null});data.checkins.sort((a,b)=>a.date.localeCompare(b.date));}data.coach=c;if(save()){render();notify(addCheckin?'Check-in saved':'Coaching profile saved')}}

// Guided intake and weekly reflections are stored locally. This is NOT an LLM connection.
const intakeSteps=[
 {title:'Your goal',subtitle:'What should the plan optimize for?',fields:[
  {id:'goal',label:'Primary goal',type:'select',options:[['','Choose a goal'],['recomp','Build muscle and reduce fat'],['cut','Lose body fat'],['gain','Build muscle (lean gain)'],['maintain','Maintain performance and weight']]},
  {id:'currentWeight',label:'Bodyweight (lb)',type:'number',min:70,max:700,step:.1,placeholder:'Optional'},
  {id:'targetWeight',label:'Target bodyweight (lb)',type:'number',min:70,max:700,step:.1,placeholder:'Optional'},
  {id:'heightIn',label:'Height (inches, optional)',type:'number',min:48,max:90,step:.5,placeholder:'e.g. 66'},
  {id:'goalDetail',label:'What matters most about this goal?',type:'textarea',placeholder:'e.g. stronger arms, better endurance, gradual fat loss'},
  {id:'pace',label:'Approach',type:'select',options:[['','Not sure yet'],['conservative','Slow and sustainable'],['balanced','Steady progress without aggressive changes']]}
 ]},
 {title:'Training context',subtitle:'Build a routine that fits real life.',fields:[
  {id:'experience',label:'Experience lifting',type:'select',options:[['','Choose one'],['new','Getting started (< 6 months)'],['intermediate','Consistent (6 months–3 years)'],['advanced','Experienced (3+ years)'],['returning','Returning after time away']]},
  {id:'days',label:'Workout days available each week',type:'select',options:[['','Choose one'],['2','2 days'],['3','3 days'],['4','4 days'],['5','5 days'],['6','6 days']]},
  {id:'minutes',label:'Time per workout (minutes)',type:'number',min:20,max:240,step:5,placeholder:'e.g. 60'},
  {id:'equipment',label:'Equipment access',type:'select',options:[['','Choose one'],['gym','Full gym'],['home','Home gym'],['limited','Limited equipment'],['mixed','Combination']]},
  {id:'priority',label:'Training priority',type:'select',options:[['','Not sure'],['strength','Strength'],['hypertrophy','Muscle growth'],['fitness','Overall fitness'],['endurance','Endurance']]},
  {id:'otherActivity',label:'Other physical activities (optional)',type:'text',placeholder:'e.g. running twice a week'},
  {id:'limitations',label:'Exercises, pain, or other limitations to accommodate (optional)',type:'textarea',placeholder:'List only what you are comfortable sharing'}
 ]},
 {title:'Nutrition reality',subtitle:'Personalize recommendations to the way you eat.',fields:[
  {id:'maintenance',label:'Current maintenance estimate (kcal/day)',type:'number',min:1000,max:8000,step:25,placeholder:'Optional / unknown'},
  {id:'protein',label:'Typical protein intake (g/day, optional)',type:'number',min:0,max:400,step:5,placeholder:'Leave blank if unknown'},
  {id:'tracking',label:'Would you log food?',type:'select',options:[['','Not sure'],['daily','Yes, most days'],['occasionally','Sometimes'],['no','Prefer simple food habits']]},
  {id:'diet',label:'Eating style',type:'select',options:[['','No preference'],['omnivore','Omnivore'],['vegetarian','Vegetarian'],['vegan','Vegan'],['other','Other']]},
  {id:'foods',label:'Foods to avoid or dietary preferences (optional)',type:'textarea',placeholder:'Foods, budget, cuisine and convenience'},
  {id:'allergies',label:'Food allergies (optional)',type:'text',placeholder:'Only if relevant and comfortable sharing'},
  {id:'nutritionBarrier',label:'Biggest food-related obstacle (optional)',type:'select',options:[['','Choose one'],['time','Not enough cooking time'],['hunger','Managing hunger'],['protein','Eating enough protein'],['consistency','Staying consistent'],['unknown','Not sure']]}
 ]},
 {title:'Recovery and check-ins',subtitle:'Adjust your plan based on how you actually feel.',fields:[
  {id:'sleep',label:'Average nightly sleep (hours, optional)',type:'number',min:3,max:12,step:.5,placeholder:'e.g. 7.5'},
  {id:'energy',label:'General energy lately',type:'select',options:[['','Not sure'],['low','Low'],['mixed','Up and down'],['good','Good']]},
  {id:'weeklyCheckin',label:'How often should the plan be reviewed?',type:'select',options:[['weekly','Every week'],['biweekly','Every two weeks']]},
  {id:'mainObstacle',label:'Biggest challenge right now (optional)',type:'textarea',placeholder:'Recovery, time, motivation, routine, etc.'}
 ]}
];
const intakeCoachKeys=new Set(['goal','currentWeight','targetWeight','days','maintenance']);
function intakeValue(k){return intakeCoachKeys.has(k)?String(data.coach?.[k]??''):String(data.intake?.[k]??'')}
function completeSteps(){return Math.max(0,Math.min(4,Number(data.intake?.completedSteps)||0))}
function coachIntakeSection(){
 const done=completeSteps(), pct=done*25;
 return `<div class="card coach-feature"><div class="section-header" style="margin:0 0 10px"><h2>Personalization interview</h2><span class="pr-bubble">${done}/4 complete</span></div>
 <p class="settings-p">Answer a few relevant questions so your future AI coach can work with your goals, equipment, food preferences, schedule, and recovery—not a generic template.</p>
 <div class="progress-track" aria-label="Interview ${pct}% complete"><span style="width:${pct}%"></span></div>
 <div class="btnrow"><button class="primary" id="openCoachInterview">${done===4?'Review answers':done?'Continue interview':'Start interview'}</button><button class="secondary" id="copyCoachBrief">Copy coaching brief</button></div>
 <div class="next-question"><strong>Next useful question</strong><p>${esc(nextCoachQuestion())}</p></div>
 <p class="smallprint">Your answers stay in this browser. Copying the brief does not send it automatically. You can skip any question. Not connected to an AI model yet.</p></div>`;
}
function nextCoachQuestion(){
 const c=data.coach||{},i=data.intake||{};
 if(!c.goal)return 'What matters most now: building muscle, reducing fat, maintaining, or general fitness?';
 if(!c.currentWeight)return 'What is your current bodyweight? A recent average helps set reasonable nutrition targets.';
 if(!i.experience)return 'How long have you been resistance training consistently?';
 if(!i.equipment)return 'Do you have access to a full gym, a home gym, or limited equipment?';
 if(!c.maintenance)return 'Do you have a maintenance-calorie estimate from your food and weight logs? It is fine if not—we can establish one from trends.';
 if(!i.limitations)return 'Are there any exercises or movements that you want to avoid or that currently cause discomfort? You can skip this question.';
 if(!data.weeklyReviews?.length)return 'How have energy and gym performance felt this week?';
 return 'What is the biggest obstacle to your goal right now?';
}
function intakeField(f){
 const value=intakeValue(f.id),id='intake-'+f.id;
 const options=f.type==='select'?f.options.map(([v,label])=>`<option value="${esc(v)}" ${String(v)===value?'selected':''}>${esc(label)}</option>`).join(''):'';
 const field=f.type==='select'?`<select id="${id}" name="${esc(f.id)}">${options}</select>`:
    f.type==='textarea'?`<textarea id="${id}" name="${esc(f.id)}" maxlength="500" placeholder="${esc(f.placeholder||'')}">${esc(value)}</textarea>`:
    `<input id="${id}" name="${esc(f.id)}" type="${f.type}" value="${esc(value)}" ${f.type==='number'?`min="${f.min}" max="${f.max}" step="${f.step}"`: 'maxlength="160"'} placeholder="${esc(f.placeholder||'')}" />`;
 return `<div class="field"><label for="${id}">${esc(f.label)}</label>${field}</div>`;
}
function openInterview(step=null){
 if(step!==null)interviewStep=Math.max(0,Math.min(3,step));
 else interviewStep=completeSteps()===4?0:Math.min(completeSteps(),3);
 const s=intakeSteps[interviewStep];
 openModal(`${modalTop(s.title,s.subtitle)}<div class="wizard-step">Question group ${interviewStep+1} of 4</div><div class="progress-track" aria-label="Step ${interviewStep+1} of 4"><span style="width:${(interviewStep+1)*25}%"></span></div>
 <form id="intakeForm">${s.fields.map(intakeField).join('')}<p class="smallprint">Everything is optional. Your coach will ask follow-up questions when more information would change its advice.</p>
 <div class="btnrow">${interviewStep?'<button type="button" class="secondary" id="intakeBack">Previous</button>':''}<button type="submit" class="primary">${interviewStep===3?'Finish interview':'Save and continue'}</button></div></form>`);
 modalRoot.querySelector('#intakeBack')?.addEventListener('click',()=>saveIntakeStep(-1));
 modalRoot.querySelector('#intakeForm').addEventListener('submit',e=>{e.preventDefault();saveIntakeStep(1)});
}
function saveIntakeStep(direction){
 const f=modalRoot.querySelector('#intakeForm');if(!f?.reportValidity())return;
 const step=intakeSteps[interviewStep];
 for(const item of step.fields){const v=String(f.elements[item.id]?.value??'').trim();if(intakeCoachKeys.has(item.id))data.coach[item.id]=v;else data.intake[item.id]=v}
 data.intake.completedSteps=Math.max(completeSteps(),interviewStep+1);
 if(interviewStep===3&&direction>0)data.intake.completedAt=today();
 if(!save())return;
 if(direction>0&&interviewStep===3){closeModal();render();notify('Interview saved locally');return}
 openInterview(interviewStep+direction);
}
function weeklyReviewSection(){
 const reviews=data.weeklyReviews.slice(-3).reverse();
 let message='Save regular check-ins. The coach will need trends and context before recommending changes.';
 if(reviews.length){const x=reviews[0];message='Latest review: '+(x.energy||'energy not rated')+' energy, '+(x.performance||'performance not rated')+' gym performance. ';
    if(x.pain==='yes')message+='If exercise causes pain, avoid pushing through it and consider assessment by an appropriate clinician.';
    else if(x.energy==='low'||x.performance==='down')message+='Prioritize recovery and review training stress and nutrition before adding load.';
    else message+='One review cannot establish a trend; keep tracking.';
 }
 return `<div class="section-header"><h2>Coach check-ins</h2><button class="secondary" id="openWeeklyReview">＋ Weekly check-in</button></div>
 <div class="card"><p class="settings-p">${esc(message)}</p>${reviews.length?reviews.map(x=>`<div class="history-line"><time>${esc(x.date.slice(5))}</time><div><strong>${esc(x.weightAvg?x.weightAvg+' lb average':'Weekly review')}</strong><span class="mini">Energy: ${esc(x.energy||'—')} · Performance: ${esc(x.performance||'—')} · Workouts: ${esc(x.sessions||'—')}</span></div></div>`).join(''):'<div class="empty">No weekly check-ins yet.</div>'}<p class="smallprint">The preview does not change calories or training automatically. Proposed changes will require user approval when the AI agent is connected.</p></div>`;
}
function openWeeklyReview(){
 openModal(`${modalTop('Weekly coach check-in','Reflect on your week to make future recommendations smarter.')}<form id="weeklyReviewForm">
 <div class="field"><label for="weeklyWeight">Average bodyweight this week (lb, optional)</label><input id="weeklyWeight" type="number" min="70" max="700" step="0.1" placeholder="Use an average of multiple weigh-ins"></div>
 <div class="field"><label for="weeklySessions">Workouts completed this week</label><input id="weeklySessions" type="number" min="0" max="21" step="1" placeholder="Optional"></div>
 <div class="twocol"><div class="field"><label for="weeklyEnergy">Energy</label><select id="weeklyEnergy"><option value="">Not sure</option><option value="low">Low</option><option value="okay">Okay</option><option value="good">Good</option></select></div>
 <div class="field"><label for="weeklyPerformance">Gym performance</label><select id="weeklyPerformance"><option value="">Not sure</option><option value="up">Improving</option><option value="stable">Steady</option><option value="down">Declining</option></select></div></div>
 <div class="twocol"><div class="field"><label for="weeklyNutrition">Nutrition consistency</label><select id="weeklyNutrition"><option value="">Not sure</option><option value="low">Inconsistent</option><option value="medium">Mostly consistent</option><option value="high">Consistent</option></select></div>
 <div class="field"><label for="weeklyPain">Pain during training?</label><select id="weeklyPain"><option value="">Prefer not to say</option><option value="no">No</option><option value="yes">Yes</option></select></div></div>
 <div class="field"><label for="weeklyNotes">Anything affecting progress? (optional)</label><textarea id="weeklyNotes" maxlength="500" placeholder="Work stress, sleep, travel, fatigue, exercise changes…"></textarea></div>
 <p class="smallprint">Check-ins do not diagnose issues or automatically change your plan.</p><button class="primary full" type="submit">Save check-in</button></form>`);
 modalRoot.querySelector('#weeklyReviewForm').addEventListener('submit',e=>{e.preventDefault();const val=id=>modalRoot.querySelector('#'+id).value.trim();data.weeklyReviews.push({id:newId(),date:today(),weightAvg:val('weeklyWeight'),sessions:val('weeklySessions'),energy:val('weeklyEnergy'),performance:val('weeklyPerformance'),nutrition:val('weeklyNutrition'),pain:val('weeklyPain'),notes:val('weeklyNotes')});if(save()){closeModal();render();notify('Weekly check-in saved')}});
}
function coachingBrief(){
 const profile={...data.coach,...data.intake};delete profile.completedSteps;delete profile.completedAt;
 const all=data.entries.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,16).map(r=>({date:r.date,exercise:exById(r.exerciseId)?.name||'Unknown',weightLb:r.weight,sets:r.sets,reps:r.reps,notes:r.notes,perSide:r.perSide}));
 const reviews=data.weeklyReviews.slice(-4);
 return `I am using Lift Log and want a personalized, evidence-informed fitness and nutrition coaching conversation. Ask only the highest-value missing questions, one at a time. Use my actual logs when available, distinguish estimates from data, avoid definitive diagnosis or body-fat claims from photos, and propose realistic, reversible calorie and training recommendations. Explain the reasoning and wait for my approval before proposing changes to stored targets. Pay attention to pain and recovery.\n\nMY COACH PROFILE (some fields may be unanswered):\n${JSON.stringify(profile,null,2)}\n\nRECENT WORKOUT LOGS:\n${JSON.stringify(all,null,2)}\n\nRECENT WEEKLY REVIEWS:\n${JSON.stringify(reviews,null,2)}\n\nPlease begin by identifying the single most important missing detail, then ask me about it.`;
}
async function copyCoachBrief(){
 const brief=coachingBrief();
 try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(brief);notify('Coaching brief copied — paste it into ChatGPT');return}}
 catch(e){}
 // Clipboard APIs are unavailable in some local-file and older mobile contexts. Allow manual selection.
 openModal(`${modalTop('Your coaching brief','Copy this text to ChatGPT yourself. It is not sent automatically.')}<div class="field"><textarea id="briefText" rows="12" readonly>${esc(brief)}</textarea></div><button id="selectBrief" class="primary full">Select all text</button>`);
 modalRoot.querySelector('#selectBrief').addEventListener('click',()=>modalRoot.querySelector('#briefText').select());
}
function settings(){return `${heading('Your data.','Your workouts belong to you.')}<div class="card"><div class="section-header" style="margin-top:0"><h2>Backup and export</h2></div><p class="settings-p">Records are saved on this device in your browser. They do not automatically sync with ChatGPT or another device. Back up your data before clearing browser storage.</p><div class="btnrow"><button class="primary" id="exportJson">Export JSON backup</button><button class="secondary" id="exportCsv">Export CSV</button><button class="secondary" id="importJson">Merge JSON backup</button><input id="importFile" class="file-input" type="file" accept=".json,application/json"></div></div><div class="card"><h2 style="font-size:17px">About load calculations</h2><p class="settings-p">For plate-loaded machines, the app calculates plate load only. When <strong>per side</strong> is selected, it doubles the plates you enter. A sled, lever, carriage, or other machine starting resistance is <strong>not</strong> included. For barbell lifts, use direct weight including the bar.</p><p class="settings-p">Your initial entries were entered on November 17, 2026. Calf raises are provisionally treated as 2 × 45 lb total rather than per side.</p></div><div class="card"><h2 style="font-size:17px">Future improvements</h2><p class="settings-p">Workout templates, warm-up tracking, progressive overload suggestions, cloud sync, and app-store release can be added after using the prototype.</p></div>`}
function render(){app.innerHTML=({home,exercises,history,coach,settings}[tab]||home)();document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab))}
function openModal(html){modalRoot.innerHTML=`<div class="modal-backdrop" id="backdrop"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;document.body.style.overflow='hidden';document.querySelector('#backdrop').addEventListener('click',e=>{if(e.target.id==='backdrop')closeModal()});document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',closeModal))}
function closeModal(){modalRoot.innerHTML='';editorState=null;document.body.style.overflow=''}
function modalTop(title,sub){return `<div class="modal-header"><div><h2>${esc(title)}</h2><div class="mini">${esc(sub)}</div></div><button class="close" data-close aria-label="Close">×</button></div>`}
function plateControls(){return PLATES.map(n=>`<div class="plate-row"><span><strong>${fmt(n)} lb</strong> <span class="mini">plate</span></span><button type="button" data-plate-down="${n}" aria-label="Remove ${n} pound plate">−</button><output data-plate-count="${n}">${Number(editorState.plates[String(n)]||0)}</output><button type="button" data-plate-up="${n}" aria-label="Add ${n} pound plate">+</button></div>`).join('')}
function configFields(){const ex=editorState;return `<div id="plateFields" style="${ex.loadType==='plates'?'':'display:none'}"><div class="field"><div class="field-label">How are plates counted?</div><div class="toggle"><label><input type="radio" name="perSide" value="true" ${ex.perSide?'checked':''}><span>Per side (×2)</span></label><label><input type="radio" name="perSide" value="false" ${ex.perSide?'':'checked'}><span>Total plates</span></label></div></div><div class="field-label">Plate count ${ex.perSide?'on one side':'on machine'}</div>${plateControls()}</div><div id="directFields" style="${ex.loadType==='direct'?'':'display:none'}"><div class="field"><label for="directWeight">${editorState.id==='ab-coaster'||editorState.catalogId==='ab-coaster'?'Added resistance (lb) — 0 means bodyweight':'Weight in lb (include the bar, if used)'}</label><input type="number" id="directWeight" min="0" max="100000" step="0.5" value="${Number(ex.directWeight)||0}" /></div></div><div class="result"><span id="resultLabel">${ex.loadType==='plates'?'Total plate load':'Working weight'}</span><strong><span id="computedWeight">${fmt(exerciseLoad(ex))}</span> lb</strong></div>${ex.loadType==='plates'?'<p class="smallprint">Machine or sled resistance is NOT included.</p>':''}`}
function setupConfigListeners(){modalRoot.querySelectorAll('[data-plate-up],[data-plate-down]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.dataset.plateUp||btn.dataset.plateDown;editorState.plates[p]=Math.max(0,Math.min(100,Number(editorState.plates[p]||0)+(btn.dataset.plateUp?1:-1)));const out=modalRoot.querySelector(`[data-plate-count="${p}"]`);if(out)out.textContent=editorState.plates[p];updateResult()}));modalRoot.querySelectorAll('[name=perSide]').forEach(x=>x.addEventListener('change',()=>{editorState.perSide=x.value==='true';updateResult()}));modalRoot.querySelector('#directWeight')?.addEventListener('input',e=>{editorState.directWeight=Number(e.target.value)||0;updateResult()});modalRoot.querySelector('#loadType')?.addEventListener('change',e=>{editorState.loadType=e.target.value;modalRoot.querySelector('#plateFields').style.display=editorState.loadType==='plates'?'':'none';modalRoot.querySelector('#directFields').style.display=editorState.loadType==='direct'?'':'none';updateResult()})}
function updateResult(){const wt=exerciseLoad(editorState);modalRoot.querySelector('#computedWeight').textContent=fmt(wt);modalRoot.querySelector('#resultLabel').textContent=editorState.loadType==='plates'?'Total plate load':'Working weight'}
function openLog(id){const ex=exById(id);if(!ex)return;editorState=copy(ex);openModal(`${modalTop('Log '+ex.name,loadLabel(ex))}<form id="logForm"><div class="field"><label for="logDate">Date</label><input id="logDate" type="date" value="${today()}" required></div>${configFields()}<div class="twocol"><div class="field"><label for="sets">Sets</label><input id="sets" type="number" min="1" max="100" placeholder="e.g. 3"></div><div class="field"><label for="reps">Reps per set</label><input id="reps" type="number" min="1" max="1000" placeholder="e.g. 10"></div></div><div class="field"><label for="notes">Notes (optional)</label><textarea id="notes" placeholder="How did it feel?" maxlength="500"></textarea></div><button class="primary full" type="submit">Save log entry</button></form>`);setupConfigListeners();modalRoot.querySelector('#logForm').addEventListener('submit',event=>{event.preventDefault();const v=exerciseLoad(editorState);const bodyweightCoaster=id==='ab-coaster'||ex.catalogId==='ab-coaster'||String(ex.name).trim().toLowerCase()==='ab coaster';if(v<0||v>100000||(!bodyweightCoaster&&v===0))return alert('Enter a positive weight first.');const date=modalRoot.querySelector('#logDate').value;const sets=modalRoot.querySelector('#sets').value,reps=modalRoot.querySelector('#reps').value;if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return alert('Choose a valid date.');if(Boolean(sets)!==Boolean(reps))return alert('Fill in both sets and reps, or leave both blank.');if(bodyweightCoaster&&v===0&&(!sets||!reps))return alert('Enter sets and reps to track bodyweight Ab Coaster progress.');const entry={id:newId(),date,exerciseId:id,weight:v,sets:sets?Number(sets):null,reps:reps?Number(reps):null,perSide:editorState.perSide,plates:copy(editorState.plates),notes:modalRoot.querySelector('#notes').value.trim()};data.entries.push(entry);Object.assign(ex,{loadType:editorState.loadType,plates:copy(editorState.plates),perSide:editorState.perSide,directWeight:editorState.directWeight});if(save()){closeModal();render();notify('Workout logged!')}})}
function openExercise(id){const orig=id?exById(id):null;editorState=orig?copy(orig):{id:newId(),name:'',category:'Other',loadType:'direct',perSide:false,plates:{},directWeight:0,notes:''};openModal(`${modalTop(orig?'Edit exercise':'New exercise',orig?'Update equipment and default loading':'Build your workout library')}<form id="exerciseForm"><div class="field"><label for="exerciseName">Exercise name</label><input id="exerciseName" maxlength="100" value="${esc(editorState.name)}" required placeholder="e.g. Bench press" /></div><div class="twocol"><div class="field"><label for="category">Muscle group</label><select id="category">${['Legs','Chest','Back','Shoulders','Arms','Core','Other'].map(x=>`<option ${x===editorState.category?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label for="loadType">Load input</label><select id="loadType"><option value="direct" ${editorState.loadType==='direct'?'selected':''}>Total weight</option><option value="plates" ${editorState.loadType==='plates'?'selected':''}>Plates</option></select></div></div>${configFields()}<div class="field"><label for="exerciseNotes">Equipment notes</label><textarea id="exerciseNotes" maxlength="500">${esc(editorState.notes||'')}</textarea></div><button class="primary full" type="submit">${orig?'Save changes':'Add exercise'}</button></form>`);setupConfigListeners();modalRoot.querySelector('#exerciseForm').addEventListener('submit',event=>{event.preventDefault();editorState.name=modalRoot.querySelector('#exerciseName').value.trim();editorState.category=modalRoot.querySelector('#category').value;editorState.notes=modalRoot.querySelector('#exerciseNotes').value.trim();if(!editorState.name)return;if(orig)Object.assign(orig,editorState);else data.exercises.push(copy(editorState));if(save()){closeModal();render();notify(orig?'Exercise updated':'Exercise added')}})}
function downloadFile(filename,content,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000)}
function csvRow(fields){return fields.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')}
function exportCsv(){const hdr=['Date','Exercise','Muscle group','Weight (lb)','Sets','Reps','Per side','Plate breakdown','Notes'];const rs=data.entries.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>{const e=exById(r.exerciseId);return [r.date,e?.name||'',e?.category||'',r.weight,r.sets||'',r.reps||'',r.perSide?'Yes':'No',describePlates(r.plates||{},r.perSide),r.notes||'']});downloadFile('lift-log-'+today()+'.csv',[hdr,...rs].map(csvRow).join('\r\n'),'text/csv;charset=utf-8');notify('CSV exported')}
async function importData(file){
  if(!file||file.size>5e6)return alert('Choose a JSON backup under 5 MB.');
  try{
    const payload=JSON.parse(await file.text());
    if(!validState(payload))throw Error('Not a supported Lift Log backup.');
    const {data:merged,added}=window.LiftLogSafety.merge(data,payload);
    const found=Object.entries(added).map(([k,v])=>k+': '+v).join(' · ');
    if(!confirm('Merge this backup WITHOUT deleting your current records? New items: '+found))return;
    const original=data,wasBlocked=dataRecoveryBlocked;
    dataRecoveryBlocked=false;
    data=merged;
    if(save()){render();notify('Backup merged safely. Your recent entries are kept.');return true;}
    data=original;dataRecoveryBlocked=wasBlocked;
    return false;
  }catch(e){alert('Import failed. Existing data was not changed: '+e.message)}
}
window.LiftLogStorage={
  snapshot:()=>copy(data),
  isRecoveryBlocked:()=>dataRecoveryBlocked,
  mergeRecovery:payload=>{
    const {data:merged,added}=window.LiftLogSafety.merge(data,payload);
    const old=data;data=merged;
    const blocked=dataRecoveryBlocked;dataRecoveryBlocked=false;
    if(!save()){data=old;dataRecoveryBlocked=blocked;return null}
    render();return added;
  }
};
app.addEventListener('submit',e=>{if(e.target.id==='coachForm'){e.preventDefault();saveCoach(false)}});
app.addEventListener('click',e=>{if(e.target.closest('#addCheckin'))return saveCoach(true);if(e.target.closest('#openCoachInterview'))return openInterview();if(e.target.closest('#openWeeklyReview'))return openWeeklyReview();if(e.target.closest('#copyCoachBrief'))return copyCoachBrief();const log=e.target.closest('[data-log]'),edit=e.target.closest('[data-edit]'),tabBtn=e.target.closest('[data-tab]'),remove=e.target.closest('[data-remove-entry]');if(log)return openLog(log.dataset.log);if(edit)return openExercise(edit.dataset.edit);if(tabBtn){tab=tabBtn.dataset.tab;render();window.scrollTo(0,0);return}if(remove){const entry=data.entries.find(x=>x.id===remove.dataset.removeEntry);if(entry&&confirm(`Delete the ${entry.date} record of ${fmt(entry.weight)} lb?`)){window.LiftLogAuthorizedDeletion={type:'entries',id:entry.id};data.entries=data.entries.filter(x=>x.id!==entry.id);if(save()){render();notify('Entry deleted (recoverable from local snapshots)')}}return}if(e.target.closest('#addExercise'))return openExercise();if(e.target.closest('#exportJson'))return downloadFile('lift-log-backup-'+today()+'.json',JSON.stringify(data,null,2),'application/json');if(e.target.closest('#exportCsv'))return exportCsv();if(e.target.closest('#importJson'))document.querySelector('#importFile')?.click()});
app.addEventListener('change',e=>{if(e.target.id==='historyExercise'){selectedExercise=e.target.value;render()}if(e.target.id==='importFile')importData(e.target.files?.[0])});
document.querySelector('.bottomnav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;render();window.scrollTo(0,0)}});
document.querySelector('#addExerciseTop').addEventListener('click',()=>openExercise());
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalRoot.innerHTML)closeModal()});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
render();
