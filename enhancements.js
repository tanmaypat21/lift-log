/* Lift Log v0.4: progressive visual exercise discovery, cardio, progress and opt-in sharing.
   Uses the existing local-first data store. No authentication or cloud sync is implied. */
'use strict';
(() => {
  const CATALOG = [
    ['leg-press','Leg Press','Legs','Leg press machine','presslegs','Push the platform away with control.','plates'],
    ['calf-raises','Calf Raises','Legs','Calf raise machine','calf','Rise onto the balls of your feet.','plates'],
    ['leg-curl','Hamstring Leg Curl','Legs','Leg curl machine (variation unspecified)','seatedcurl','Curl your lower legs against resistance. Select seated or lying if known.','direct'],
    ['seated-leg-curl','Seated Leg Curl','Legs','Seated curl machine','seatedcurl','Curl your lower legs against the pads.','direct'],
    ['lying-leg-curl','Lying Leg Curl','Legs','Lying curl machine','lyingcurl','Bend the knees while keeping hips stable.','direct'],
    ['leg-extension','Leg Extension','Legs','Leg extension machine','seatedcurl','Straighten your knees smoothly.','direct'],
    ['squat','Barbell Squat','Legs','Barbell + rack','squat','Squat to a controlled depth.','direct'],
    ['rdl','Romanian Deadlift','Legs','Barbell or dumbbells','hinge','Hinge through the hips; keep load close.','direct'],
    ['lunge','Walking Lunge','Legs','Dumbbells or bodyweight','lunge','Take a step and lower under control.','direct'],
    ['hip-thrust','Hip Thrust','Legs','Bench + barbell','bridge','Extend the hips, keeping ribs stacked.','direct'],
    ['bench-press','Bench Press','Chest','Bench + barbell','bench','Lower the bar in a controlled path.','direct'],
    ['incline-db-press','Incline Dumbbell Press','Chest','Incline bench + dumbbells','incline','Press from a low incline position.','direct'],
    ['chest-fly','Machine Chest Fly','Chest','Pec deck machine','fly','Bring handles together without jerking.','direct'],
    ['push-up','Push-up','Chest','Floor','plank','Keep your body aligned through the rep.','direct'],
    ['lat-pulldown','Lat Pulldown','Back','Cable pulldown machine','pulldown','Pull toward the upper chest.','direct'],
    ['cable-row','Seated Cable Row','Back','Cable row machine','row','Pull handles to your torso smoothly.','direct'],
    ['pull-up','Pull-up','Back','Pull-up bar','pullup','Pull your chest toward the bar.','direct'],
    ['db-row','One-arm Dumbbell Row','Back','Bench + dumbbell','hinge','Drive the elbow toward your hip.','direct'],
    ['shoulder-press','Overhead Press','Shoulders','Barbell or dumbbells','overhead','Press overhead without arching excessively.','direct'],
    ['lateral-raise','Lateral Raise','Shoulders','Dumbbells','fly','Raise your arms to the sides under control.','direct'],
    ['face-pull','Face Pull','Shoulders','Cable + rope','pulldown','Pull toward your face with elbows high.','direct'],
    ['biceps-curl','Biceps Curl','Arms','Dumbbells or barbell','curl','Keep upper arms relatively still.','direct'],
    ['triceps-pushdown','Triceps Pushdown','Arms','Cable + rope/bar','pulldown','Extend the elbows without swinging.','direct'],
    ['plank','Plank','Core','Mat','plank','Hold a comfortable, stable trunk position.','direct'],
    ['cable-crunch','Cable Crunch','Core','Cable + rope','curl','Flex the trunk slowly and deliberately.','direct']
  ].map(([id,name,category,equipment,pose,cue,loadType]) => ({id,name,category,equipment,pose,cue,loadType}));
  const POSES = {
    presslegs:{head:[45,47],body:'M43 57 L65 75 L86 68 M65 75 L92 44 L112 37 M65 75 L80 88',gear:'<path d="M118 20l19 32M111 30l20 12M15 93h60M66 87l-22 10"/>'},
    calf:{head:[76,25],body:'M76 34 L75 65 L67 87 L67 96 M75 65 L89 87 L94 94 M75 43 L56 55 M75 43 L95 55',gear:'<path d="M55 99h60M54 56h7M91 56h11"/>'},
    seatedcurl:{head:[54,30],body:'M55 41 L63 65 L95 65 L109 82 L112 96 M64 65 L58 90 M62 49 L88 52',gear:'<path d="M40 64h65M45 48v41M38 90h20M100 94h28"/>'},
    lyingcurl:{head:[27,63],body:'M37 65 L92 67 L115 66 L122 42 M52 67 L50 86 M73 66 L72 84',gear:'<path d="M20 74h100M30 74v22M110 74v22M116 40h16"/>'},
    squat:{head:[80,24],body:'M80 36 L79 61 L60 78 L71 96 M79 61 L97 77 L104 94 M79 42 L57 44 M79 42 L102 44',gear:'<path d="M46 38h67M52 31v14M107 31v14M47 97h20M99 97h18"/>'},
    hinge:{head:[53,30],body:'M58 40 L87 57 L100 78 L105 96 M87 57 L70 81 L70 96 M72 54 L80 78',gear:'<path d="M39 77h74M43 71v12M111 71v12"/>'},
    lunge:{head:[76,23],body:'M76 34 L76 62 L51 80 L35 94 M76 62 L102 80 L107 94 M76 44L56 62 M76 44L94 59',gear:'<path d="M20 98h124"/>'},
    bridge:{head:[33,70],body:'M45 70 L85 45 L117 70 L132 91 M76 52 L77 77 M43 74 L45 91',gear:'<path d="M23 76h38M26 76v21M60 61h66M88 36v23"/>'},
    bench:{head:[44,65],body:'M54 68L100 68L119 88 M70 68L72 92 M75 67L86 41 M97 66L103 42',gear:'<path d="M32 76h88M48 76v20M108 76v20M52 31h69M58 26v10M116 26v10"/>'},
    incline:{head:[47,52],body:'M55 55L90 80 L108 88 M85 76L88 95 M68 62 L79 37 M83 72L105 44',gear:'<path d="M35 50L91 92 M40 97h82M52 28h15M98 35h15"/>'},
    fly:{head:[77,25],body:'M77 36L77 70L66 94 M77 70L88 94 M77 46L43 42 M77 46L111 42',gear:'<path d="M30 35h18M106 35h18M72 72h12M72 96h12"/>'},
    plank:{head:[27,48],body:'M38 55L77 62L113 76L134 82 M80 63L72 90 M119 77L115 96',gear:'<path d="M12 99h138"/>'},
    pulldown:{head:[78,41],body:'M78 51L78 80L65 99 M78 80L92 99 M75 59L49 36L51 18 M81 59L107 36L107 18',gear:'<path d="M29 17h100M42 10v15M115 10v15M58 100h40"/>'},
    row:{head:[61,35],body:'M64 45L72 72L104 77L123 95 M72 72L55 97 M63 50L100 57',gear:'<path d="M32 76h53M35 78v21M102 55h32M136 17v82M113 95h20"/>'},
    pullup:{head:[81,48],body:'M81 59L81 82L69 97 M81 82L92 97 M80 64L56 26 M83 64L106 26',gear:'<path d="M32 24h101M39 17v15M125 17v15"/>'},
    overhead:{head:[78,38],body:'M78 49L78 76L64 97 M78 76L93 97 M74 55L54 25 M82 55L102 25',gear:'<path d="M41 21h76M45 14v14M113 14v14"/>'},
    curl:{head:[75,24],body:'M75 35L77 65L67 96 M77 65L89 96 M75 43L58 59L68 44 M77 43L96 60L86 44',gear:'<path d="M60 40h31M61 36v9M90 36v9"/>'}
  };
  const cateColor={Legs:'#9cf4af',Chest:'#b4c2ff',Back:'#8cd7f5',Shoulders:'#f3c79a',Arms:'#d7b7fb',Core:'#ebc7f0'};
  let catalogFilter='All',catalogSearch='',chartRange='all',chartMetric='load';
  const htmlNum=n => fmt(Number(n)||0);
  const $ = (s,root=document) => root.querySelector(s);
  function mark(){if(!Array.isArray(data.cardio))data.cardio=[];if(!data.sharePrefs||typeof data.sharePrefs!=='object')data.sharePrefs={workouts:false,cardio:false,records:false}; if(typeof data.cardioGoal!=='number')data.cardioGoal=0;}
  mark();
  function figure(ex,large=false){
    const p=POSES[ex.pose]||POSES.curl; const ink=cateColor[ex.category]||'#9cf4af';
    return `<svg class="exercise-figure${large?' large':''}" viewBox="0 0 160 112" role="img" aria-label="Simplified illustration of ${esc(ex.name)}">
      <rect x="0" y="0" width="160" height="112" rx="15" fill="#1d2b3d"/>
      <circle cx="132" cy="22" r="31" fill="${ink}" fill-opacity=".06"/>
      <g fill="none" stroke="#667c93" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${p.gear}</g>
      <g fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="${p.head[0]}" cy="${p.head[1]}" r="8" stroke-width="5"/><path d="${p.body}"/></g>
    </svg>`;
  }
  function lookup(ex){return CATALOG.find(c=>c.id===ex.catalogId || c.id===ex.id || c.name.toLowerCase()===ex.name.toLowerCase())||{...ex,pose:'curl',equipment:'Custom exercise',cue:'Your own exercise setup'};}
  function row(ex){const r=recent(ex.id),wt=r?Number(r.weight):exerciseLoad(ex),art=lookup(ex);return `<article class="lift-row"><div class="lift-row-art">${figure(art)}</div><div class="lift-row-meta"><strong>${esc(ex.name)}</strong><span>${esc(ex.category||'Other')} · ${esc(art.equipment||'Custom')}</span></div><div class="lift-row-weight">${htmlNum(wt)}<small> lb</small></div><button class="quick-plus" aria-label="Log ${esc(ex.name)}" data-log="${esc(ex.id)}">+</button></article>`;}
  const weekStart=(d)=>{const z=new Date(`${d}T12:00:00`);z.setDate(z.getDate() - ((z.getDay()+6)%7));return `${z.getFullYear()}-${String(z.getMonth()+1).padStart(2,'0')}-${String(z.getDate()).padStart(2,'0')}`};
  function weekData(){const wk=weekStart(today());const entries=data.entries.filter(e=>e.date>=wk&&e.date<=today());const workouts=new Set(entries.map(e=>e.date)).size;const cardioMinutes=data.cardio.filter(e=>e.date>=wk&&e.date<=today()).reduce((s,r)=>s+Number(r.duration||0),0);return {wk,workouts,cardioMinutes};}
  const FACTS=[
    'Consistency beats chasing a perfect workout. Look for trends over several weeks.',
    'Machine loads differ between brands. Compare your lifts on the same equipment.',
    'Recovery matters: sleep and rest days support productive strength training.',
    'For endurance progress, record time, distance and effort—not just calories.',
    'Muscle soreness is not a reliable measure of workout quality.',
    'Protein supports muscle repair, but training, sleep and total energy also matter.',
    'A small step forward—one more rep or a cleaner set—still counts as progress.'
  ];
  const fact=()=>FACTS[Math.floor((new Date(`${today()}T12:00:00`).getTime()/86400000)%FACTS.length)];
  function goalCard(){
    const c=data.coach||{},w=Number(c.currentWeight),goal=Number(c.targetWeight);const {workouts,cardioMinutes}=weekData();const days=Number(c.days);
    const targetText=w>0&&goal>0?`${htmlNum(Math.abs(w-goal))} lb ${w===goal?'at target':`to ${w>goal?'lower':'higher'} target weight`}`:'Add a target weight in Coach to see your remaining distance.';
    return `<section class="hero panel"><div class="hero-eyebrow">YOUR WEEK AT A GLANCE</div><h1>Keep showing up<span class="accent-dot">.</span></h1><p class="hero-sub">${esc(targetText)}</p>
      <div class="hero-metrics"><div><strong>${workouts}${days?' / '+days:''}</strong><small>Training days${days?' this week':' recorded this week'}</small></div><div><strong>${htmlNum(cardioMinutes)}<small> min</small></strong><small>Cardio this week</small></div></div>
      ${days?`<div class="goal-bar" role="progressbar" aria-label="Weekly workout goal" aria-valuemin="0" aria-valuemax="${days}" aria-valuenow="${Math.min(days,workouts)}"><span style="width:${Math.min(100,workouts/days*100)}%"></span></div>`:''}
      <div class="hero-actions"><button class="primary" data-tab="exercises">Log a workout</button><button class="secondary" data-tab="history">See progress</button></div></section>`;
  }
  home=function(){const latest=[...data.entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,2),frequent=[...data.exercises].sort((a,b)=>(recent(b.id)?.date||'').localeCompare(recent(a.id)?.date||'')).slice(0,3);
    return `${goalCard()}
      <div class="section-header"><h2>Quick log</h2><button class="text-action" data-tab="exercises">All exercises →</button></div><div class="panel list-panel">${frequent.map(row).join('')||'<p class="muted-inset">Add your first exercise to begin.</p>'}</div>
      <div class="home-tiles"><button class="feature-tile" data-tab="history"><span class="feature-icon">↗</span><strong>Progress</strong><small>Exercise trends and records</small></button><button class="feature-tile" data-tab="cardio"><span class="feature-icon">♡</span><strong>Cardio</strong><small>Log a run, walk or ride</small></button></div>
      <button class="social-banner panel" data-tab="groups"><span class="feature-icon">♧</span><span><strong>Friends & milestones</strong><small>Share a progress summary only when you choose</small></span><span class="social-chevron">→</span></button>
      <div class="fact-card"><span class="fact-icon">✦</span><div><strong>Training note</strong><p>${esc(fact())}</p></div></div>
      ${latest.length?`<div class="section-header"><h2>Recent lifts</h2><button class="text-action" data-tab="history">History →</button></div><div class="panel recent-panel">${latest.map(historyRow).join('')}</div>`:''}`;
  };
  function catalogCard(c){const own=data.exercises.find(e=>e.catalogId===c.id||e.id===c.id);return `<article class="catalog-card"><button type="button" class="catalog-art" data-exercise-info="${esc(c.id)}" aria-label="Learn about ${esc(c.name)}">${figure(c)}</button><div class="catalog-copy"><strong>${esc(c.name)}</strong><span>${esc(c.equipment)}</span><div class="catalog-tags"><small>${esc(c.category)}</small></div></div><button class="catalog-action ${own?'existing':''}" data-pick-catalog="${esc(c.id)}" aria-label="${own?'Log':'Add'} ${esc(c.name)}">${own?'Log':'Add +'}</button></article>`}
  function catalogMatches(){return CATALOG.filter(c=>(catalogFilter==='All'||c.category===catalogFilter)&&`${c.name} ${c.equipment} ${c.category}`.toLowerCase().includes(catalogSearch.toLowerCase().trim()));}
  function catalogCards(){const matches=catalogMatches();return `<div class="catalog-results">${matches.length} exercise${matches.length===1?'':'s'} found</div>${matches.length?`<div class="catalog-grid">${matches.map(catalogCard).join('')}</div>`:'<p class="muted-inset">No matches. Try another name or muscle group.</p>'}`;}
  exercises=function(){return `<div class="page-top"><span class="eyebrow">YOUR WORKOUTS</span><h1>Find your movement.</h1><p class="sub">Search by name, equipment or muscle group. Tap an illustration to identify the exercise.</p></div>
    <div class="section-header"><h2>My exercises <span class="count-inline">${data.exercises.length}</span></h2><button id="addExercise" class="text-action">+ Custom</button></div>
    <div class="panel list-panel">${data.exercises.map(row).join('')||'<p class="muted-inset">Nothing tracked yet.</p>'}</div>
    <div class="section-header"><h2>Browse exercise gallery</h2><span class="hint">Offline illustrations</span></div>
    <label class="search-wrap" for="catalogSearch"><span aria-hidden="true">⌕</span><input id="catalogSearch" type="search" placeholder="e.g. leg curl, cable, chest..." value="${esc(catalogSearch)}" autocomplete="off"/></label>
    <div class="catalog-filters" role="group" aria-label="Muscle group">${['All','Legs','Chest','Back','Shoulders','Arms','Core'].map(s=>`<button data-catalog-filter="${esc(s)}" class="chip ${catalogFilter===s?'selected':''}">${esc(s)}</button>`).join('')}</div>
    <div id="catalogResults">${catalogCards()}</div>`;
  };
  function shownPoints(id){let rs=entriesFor(id).filter(r=>Number.isFinite(Number(r.weight))&&Number(r.weight)>0);
    if(chartRange!=='all'){const d=new Date();d.setDate(d.getDate()-Number(chartRange));const cutoff=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;rs=rs.filter(r=>r.date>=cutoff)}
    let points=rs.map(r=>({date:r.date,weight:Number(r.weight),volume:r.sets&&r.reps?Number(r.weight)*Number(r.sets)*Number(r.reps):null}));
    if(chartMetric==='volume')points=points.filter(p=>p.volume!==null);
    const perDay=new Map();for(const r of points){const prev=perDay.get(r.date);const val=chartMetric==='volume'?r.volume:r.weight;if(!prev||val>prev.y)perDay.set(r.date,{date:r.date,y:val})}
    return [...perDay.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function trendSvg(points,unit){if(!points.length)return `<div class="chart-empty">${chartMetric==='volume'?'Add sets and reps to display volume.':'Log a lift to start your trend chart.'}</div>`;
    const W=680,H=234,left=60,right=22,top=20,bottom=37;const ys=points.map(x=>x.y);let lo=Math.min(...ys),hi=Math.max(...ys);let pad=Math.max(5,(hi-lo)*.16);lo=Math.max(0,lo-pad);hi+=pad;if(hi===lo)hi=lo+10;
    const time=points.map(x=>new Date(`${x.date}T12:00:00`).getTime());const first=Math.min(...time),last=Math.max(...time);
    const xy=points.map((p,i)=>({date:p.date,value:p.y,x:left+(last===first?.5:(time[i]-first)/(last-first))*(W-left-right),y:top+(1-(p.y-lo)/(hi-lo))*(H-top-bottom)}));
    const coords=xy.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return `<div class="trend-svg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Exercise trend from ${esc(points[0].date)} to ${esc(points.at(-1).date)} in ${esc(unit)}">
      ${[0,.5,1].map(q=>{const y=top+(1-q)*(H-top-bottom);return `<line x1="${left}" y1="${y}" x2="${W-right}" y2="${y}" stroke="#33445a" stroke-dasharray="4 7"/><text x="${left-10}" y="${y+5}" fill="#9cacc0" text-anchor="end" font-size="12">${htmlNum(lo+q*(hi-lo))}</text>`}).join('')}
      ${points.length>1?`<polyline points="${coords}" fill="none" stroke="#9ef5a8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`:''}
      ${xy.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${i===xy.length-1?6:4}" fill="#9ef5a8"><title>${esc(p.date)}: ${htmlNum(p.value)} ${esc(unit)}</title></circle>`).join('')}
      <text x="${left}" y="${H-8}" fill="#9cacc0" font-size="12">${esc(points[0].date.slice(5))}</text><text x="${W-right}" y="${H-8}" text-anchor="end" fill="#9cacc0" font-size="12">${esc(points.at(-1).date.slice(5))}</text>
    </svg></div>${points.length===1?'<p class="smallprint">One workout day logged. Add another to see a trend.</p>':''}`;
  }
  history=function(){const ex=exById(selectedExercise)||data.exercises[0];if(!ex)return `${heading('Your progress.','Log an exercise to start tracking.')}`;selectedExercise=ex.id;
    const points=shownPoints(ex.id),all=entriesFor(ex.id),allNums=all.map(r=>Number(r.weight)),best=Math.max(0,...allNums),change=points.length>1?points.at(-1).y-points[0].y:null;
    return `<div class="page-top"><span class="eyebrow">YOUR PROGRESS</span><h1>Watch the work add up.</h1><p class="sub">Compare recorded loads or training volume on the same exercise.</p></div>
    <div class="field"><label for="historyExercise">Exercise</label><select id="historyExercise">${data.exercises.map(e=>`<option value="${esc(e.id)}" ${e.id===ex.id?'selected':''}>${esc(e.name)}</option>`).join('')}</select></div>
    <div class="panel progress-panel"><div class="trend-metrics"><div><span>Best recorded load</span><strong>${htmlNum(best)} <small>lb</small></strong></div><div><span>${chartMetric==='load'?'Load change':'Volume change'}</span><strong class="${change===null?'neutral':change>=0?'positive':'negative'}">${change===null?'—':`${change>0?'+':''}${htmlNum(change)}`} ${change===null?'':chartMetric==='load'?'lb':'lb·reps'}</strong></div></div>
      <div class="segmented">${[['load','Load'],['volume','Volume']].map(([k,v])=>`<button data-chart-metric="${k}" class="${chartMetric===k?'current':''}">${v}</button>`).join('')}</div>
      <div class="trend-frame">${trendSvg(points,chartMetric==='load'?'lb':'lb·reps')}</div>
      <div class="periods">${[['30','30 days'],['90','90 days'],['365','1 year'],['all','All time']].map(([v,label])=>`<button data-chart-range="${v}" class="${chartRange===v?'current':''}">${label}</button>`).join('')}</div>
      <p class="smallprint">Load chart uses the highest logged weight per day. Volume is weight × sets × reps. These are training metrics, not a prediction of muscle growth.</p>
    </div>
    <div class="section-header"><h2>Exercise history</h2><span class="hint">${all.length} logs</span></div><div class="panel recent-panel">${all.length?all.map(r=>`<div class="history-line"><time>${esc(r.date.slice(5))}</time><div><strong>${htmlNum(r.weight)} lb</strong><span class="mini">${r.sets&&r.reps?`${r.sets} × ${r.reps}`:'Sets/reps not entered'} ${esc(r.notes||'')}</span></div><button class="secondary danger" data-remove-entry="${esc(r.id)}">Delete</button></div>`).join(''):'<p class="muted-inset">No entries yet.</p>'}</div>`;
  };
  const cardioTypes=['Walk','Run','Treadmill','Cycling','Elliptical','Rowing','Swimming','Hiking','Other'];
  function cardioPage(){mark();const {cardioMinutes}=weekData(),goal=Number(data.cardioGoal)||0,logs=[...data.cardio].sort((a,b)=>b.date.localeCompare(a.date));
    return `<div class="page-top"><span class="eyebrow">MOVE MORE</span><h1>Cardio, tracked.</h1><p class="sub">Log a walk, run, ride or another session. Fitness-band syncing is planned.</p></div>
    <div class="panel cardio-hero"><span class="eyebrow">THIS WEEK</span><div class="cardio-headline"><strong>${htmlNum(cardioMinutes)} <small>minutes</small></strong><button class="primary" data-add-cardio>+ Log cardio</button></div>
      <div class="cardio-goal-line">${goal?`${htmlNum(Math.max(0,goal-cardioMinutes))} minutes left to your weekly goal`:'Set an optional weekly minutes goal below'}</div>
      ${goal?`<div class="goal-bar" role="progressbar" aria-label="Weekly cardio target" aria-valuenow="${Math.min(cardioMinutes,goal)}" aria-valuemax="${goal}" aria-valuemin="0"><span style="width:${Math.min(100,cardioMinutes/goal*100)}%"></span></div>`:''}
      <div class="goal-edit"><label for="cardioGoal">Weekly goal (minutes)</label><input type="number" id="cardioGoal" min="0" max="10000" step="5" value="${goal||''}" placeholder="Optional"/><button class="secondary" data-save-cardio-goal>Save</button></div></div>
    <div class="section-header"><h2>Recent cardio</h2><span class="hint">${logs.length} sessions</span></div>
    <div class="panel recent-panel">${logs.length?logs.slice(0,18).map(r=>`<div class="history-line"><time>${esc(r.date.slice(5))}</time><div><strong>${esc(r.type)} · ${htmlNum(r.duration)} min</strong><span class="mini">${r.distance?`${htmlNum(r.distance)} mi · `:''}${r.avgHr?`${htmlNum(r.avgHr)} bpm · `:''}${esc(r.notes||'Manual entry')}</span></div><button class="secondary danger" data-remove-cardio="${esc(r.id)}">Delete</button></div>`).join(''):'<p class="muted-inset">No cardio sessions yet. Tap “Log cardio” to begin.</p>'}</div>
    <div class="panel info-panel"><strong>⌁ Device sync — planned</strong><p>Apple Health and wearable integration require a supported, permission-based connection. This web prototype only saves what you enter manually.</p></div>`;
  }
  function openCardio(){openModal(`${modalTop('Log cardio','Manually track your session')}<form id="cardioForm">
    <div class="twocol"><div class="field"><label for="cardioDate">Date</label><input id="cardioDate" required type="date" value="${today()}"></div><div class="field"><label for="cardioType">Activity</label><select id="cardioType">${cardioTypes.map(t=>`<option>${esc(t)}</option>`).join('')}</select></div></div>
    <div class="twocol"><div class="field"><label for="cardioMinutes">Duration (min)</label><input type="number" id="cardioMinutes" min="1" max="1440" step="1" required placeholder="30"></div><div class="field"><label for="cardioDistance">Distance (miles, optional)</label><input type="number" id="cardioDistance" min="0" max="500" step="0.01" placeholder="3.1"></div></div>
    <div class="field"><label for="cardioHr">Average heart rate (bpm, optional)</label><input type="number" id="cardioHr" min="30" max="240" step="1" placeholder="145"></div>
    <div class="field"><label for="cardioNotes">Notes (optional)</label><textarea id="cardioNotes" maxlength="240" placeholder="Pace, terrain, effort..."></textarea></div>
    <button type="submit" class="primary full">Save cardio session</button></form>`);
    $('#cardioForm',modalRoot).addEventListener('submit',e=>{e.preventDefault();const duration=Number($('#cardioMinutes',modalRoot).value),distance=Number($('#cardioDistance',modalRoot).value),avgHr=Number($('#cardioHr',modalRoot).value),date=$('#cardioDate',modalRoot).value;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||duration<1||duration>1440||!Number.isFinite(duration)||distance<0||distance>500||avgHr<0||(avgHr!==0&&(avgHr<30||avgHr>240))){alert('Please check date, duration, distance and heart rate.');return;}
      data.cardio.push({id:newId(),date,type:$('#cardioType',modalRoot).value,duration,distance:distance||null,avgHr:avgHr||null,notes:$('#cardioNotes',modalRoot).value.trim(),source:'manual'});
      if(save()){closeModal();render();notify('Cardio saved')}
    });
  }
  function shareText(){const p=data.sharePrefs||{},wk=weekData(),lines=['Lift Log · My weekly progress',`Week of ${wk.wk}`];if(p.workouts)lines.push(`Training days: ${wk.workouts}`);if(p.cardio)lines.push(`Cardio: ${htmlNum(wk.cardioMinutes)} min`);if(p.records){const a=data.exercises.slice(0,5).map(e=>({name:e.name,best:Math.max(0,...entriesFor(e.id).map(r=>Number(r.weight)||0))})).filter(x=>x.best>0);lines.push('Recorded best loads: '+(a.length?a.map(x=>`${x.name}: ${htmlNum(x.best)} lb`).join(' · '):'none yet'));}return lines.join('\n')}
  function groupPage(){mark();const p=data.sharePrefs;const chosen=Object.values(p).some(Boolean);
    return `<div class="page-top"><span class="eyebrow">TRAIN TOGETHER</span><h1>Better with friends.</h1><p class="sub">Your progress is private. Pick exactly what to share, then send it yourself.</p></div>
    <div class="panel group-preview"><div class="friend-symbol">♧</div><h2>Friends & groups</h2><p>Real group feeds, invites and leaderboards need private accounts, consent controls and secure cloud storage. Those features are not active yet.</p></div>
    <div class="section-header"><h2>Share a weekly summary</h2></div><div class="panel"><p class="smallprint" style="margin-top:0">Everything is off by default. Turning an option on only changes your preview; nothing is uploaded or sent automatically.</p>
      ${[['workouts','Training days'],['cardio','Cardio minutes'],['records','Best recorded lifts (up to five)']].map(([k,label])=>`<label class="share-toggle"><input type="checkbox" data-share-pref="${k}" ${p[k]?'checked':''}/><span>${label}</span></label>`).join('')}
      <div class="share-preview"><strong>Preview</strong><pre id="sharePreview">${chosen?esc(shareText()):'Select a metric to preview the summary.'}</pre></div>
      <button data-send-share ${chosen?'':'disabled'} class="primary full">Share selected summary</button></div>
    <div class="panel info-panel"><strong>Privacy by design</strong><p>No public profiles, friend lists, social accounts or automatic data sharing exist in this version. Never place user health information in the GitHub repository.</p></div>`;
  }
  const baseSettings=settings;
  settings=function(){return `${baseSettings()}<div class="panel info-panel"><strong>Social & device roadmap</strong><p>Manual cardio and opt-in summary sharing work locally. Live friend groups and wearable syncing need secure infrastructure and permission-based integrations.</p><button class="secondary" data-tab="groups">Friends & privacy</button></div>`};
  render=function(){mark();const pages={home,exercises,history,coach,settings,cardio:cardioPage,groups:groupPage};app.innerHTML=(pages[tab]||home)();document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));};
  function openCatalogInfo(id){const c=CATALOG.find(x=>x.id===id);if(!c)return;openModal(`${modalTop(c.name,c.category+' · '+c.equipment)}<div class="detail-figure">${figure(c,true)}</div><p class="detail-cue">${esc(c.cue)}</p><p class="smallprint">Illustration is simplified and for identifying the movement, not a full technique tutorial.</p><button class="primary full" data-pick-catalog="${esc(c.id)}">${data.exercises.some(e=>e.catalogId===c.id||e.id===c.id)?'Log this exercise':'Add to my exercises'}</button>`);}
  function pickCatalog(id){const c=CATALOG.find(x=>x.id===id);if(!c)return;const existing=data.exercises.find(x=>x.catalogId===c.id||x.id===c.id);
    if(existing){if(modalRoot.innerHTML)closeModal();openLog(existing.id);return;}
    const ex={id:c.id,name:c.name,category:c.category,loadType:c.loadType,perSide:false,plates:{},directWeight:0,notes:`${c.equipment}. ${c.cue}`,catalogId:c.id};
    data.exercises.push(ex);if(save()){if(modalRoot.innerHTML)closeModal();render();notify('Exercise added — set your working weight');openExercise(ex.id)}
  }
  app.addEventListener('click',e=>{
    const f=e.target.closest('[data-catalog-filter]');if(f){e.stopImmediatePropagation();catalogFilter=f.dataset.catalogFilter;app.querySelectorAll('[data-catalog-filter]').forEach(x=>x.classList.toggle('selected',x.dataset.catalogFilter===catalogFilter));$('#catalogResults').innerHTML=catalogCards();return;}
    const info=e.target.closest('[data-exercise-info]');if(info){e.stopImmediatePropagation();openCatalogInfo(info.dataset.exerciseInfo);return;}
    const pick=e.target.closest('[data-pick-catalog]');if(pick){e.stopImmediatePropagation();pickCatalog(pick.dataset.pickCatalog);return;}
    const met=e.target.closest('[data-chart-metric]');if(met){e.stopImmediatePropagation();chartMetric=met.dataset.chartMetric;render();return;}
    const range=e.target.closest('[data-chart-range]');if(range){e.stopImmediatePropagation();chartRange=range.dataset.chartRange;render();return;}
    if(e.target.closest('[data-add-cardio]')){e.stopImmediatePropagation();openCardio();return;}
    if(e.target.closest('[data-save-cardio-goal]')){e.stopImmediatePropagation();const n=Number($('#cardioGoal').value||0);if(!Number.isFinite(n)||n<0||n>10000){notify('Enter 0 to 10,000 minutes');return;}data.cardioGoal=n;save();render();notify('Cardio goal saved');return;}
    const del=e.target.closest('[data-remove-cardio]');if(del){e.stopImmediatePropagation();const rec=data.cardio.find(r=>r.id===del.dataset.removeCardio);if(rec&&confirm(`Delete ${rec.duration} min ${rec.type} on ${rec.date}?`)){data.cardio=data.cardio.filter(r=>r.id!==rec.id);save();render();notify('Cardio session removed')}return;}
    if(e.target.closest('[data-send-share]')){e.stopImmediatePropagation();const str=shareText();if(!Object.values(data.sharePrefs).some(Boolean))return;const send=async()=>{try{if(navigator.share)await navigator.share({text:str,title:'Lift Log progress'});else if(navigator.clipboard){await navigator.clipboard.writeText(str);notify('Summary copied — share it with a friend')}else{openModal(`${modalTop('Copy your summary','Nothing is sent automatically')}<textarea class="share-copy" readonly>${esc(str)}</textarea>`);}}catch(err){if(err.name!=='AbortError')notify('Sharing unavailable. Please copy the summary manually.')}};void send();return;}
  },true);
  app.addEventListener('input',e=>{if(e.target.id==='catalogSearch'){catalogSearch=e.target.value;$('#catalogResults').innerHTML=catalogCards()}},true);
  app.addEventListener('change',e=>{const p=e.target.closest('[data-share-pref]');if(p){data.sharePrefs[p.dataset.sharePref]=p.checked;save();render()}},true);
  modalRoot.addEventListener('click',e=>{const pick=e.target.closest('[data-pick-catalog]');if(pick){e.stopImmediatePropagation();pickCatalog(pick.dataset.pickCatalog)}},true);
  const header=document.querySelector('.topbar');const settingsButton=document.createElement('button');settingsButton.className='settings-access';settingsButton.title='Settings & backups';settingsButton.setAttribute('aria-label','Settings & backups');settingsButton.innerHTML='⚙';header.append(settingsButton);settingsButton.addEventListener('click',()=>{tab='settings';render();window.scrollTo(0,0)});
  render();
})();
