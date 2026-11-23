/* Lift Log v0.4: progressive visual exercise discovery, cardio, progress and opt-in sharing.
   Uses the existing local-first data store. No authentication or cloud sync is implied. */
'use strict';
(() => {
  const CATALOG = [
    ['leg-press','Leg Press','Legs','Leg press machine','presslegs','Push the platform away with control.','plates'],
    ['calf-raises','Calf Raises','Legs','Calf raise machine','calf','Rise onto the balls of your feet.','plates'],
    ['leg-curl','Hamstring Leg Curl','Legs','Leg curl machine (variation unspecified)','seatedcurl','Curl your lower legs against resistance. Select seated or lying if known.','direct'],
    ['seated-leg-curl','Seated Leg Curl','Legs','Seated curl machine','seatedcurl','Hamstrings: bend the knee to draw the ankle pad down and back.','direct'],
    ['lying-leg-curl','Lying Leg Curl','Legs','Lying curl machine','lyingcurl','Hamstrings: lying face down, curl the padded roller toward your glutes.','direct'],
    ['leg-extension','Leg Extension','Legs','Leg extension machine','seatedcurl','Quads: straighten the knee to raise the shin pad upward.','direct'],
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
    ['cable-crunch','Cable Crunch','Core','Cable + rope','curl','Flex the trunk slowly and deliberately.','direct'],
    ['standing-calf-raise','Standing Calf Raise','Legs','Standing calf raise machine','calf','Shoulder pads over your shoulders; stand with toes on the step and lift your heels.','direct'],
    ['seated-calf-raise','Seated Calf Raise','Legs','Seated calf raise machine','calf','Sit with padded resistance across thighs; raise your heels from the foot platform.','direct'],
    ['leg-press-calf-raise','Leg Press Calf Raise','Legs','Leg press machine','presslegs','Sit in a leg press; keep knees nearly still as the balls of your feet move the sled.','plates']
  ].map(([id,name,category,equipment,pose,cue,loadType]) => ({id,name,category,equipment,pose,cue,loadType}));
  // Extra exercises contain offline searchable metadata; only displayed images may need internet.
  const existingIds=new Set(CATALOG.map(c=>c.id));
  for(const entry of window.LIFTLOG_LIBRARY||[]){if(!existingIds.has(entry.id)){CATALOG.push(entry);existingIds.add(entry.id)}}
  // Wide pronated-bar pulldowns are distinct from narrow and underhand grips.
  // The image uses the already bundled wide-bar lat-pulldown example.
  const wideGripPulldown={
    id:'wide-grip-lat-pulldown',name:'Wide-Grip Lat Pulldown',category:'Back',
    equipment:'Wide overhand bar · cable tower',equipmentGroup:'Cable',
    cue:'Hands wider than shoulders on an overhand bar; pull toward your upper chest.',
    loadType:'direct',mediaId:'lat-pulldown',frames:['start','end'],
    aliases:['wide grip pull downs','wide grip pulldown','wide grip pull down','wide lat pulldown','wide lat pull','wide bar pull down','wide grip back pulldown'],
    muscles:['lats','biceps']
  };
  if(!existingIds.has(wideGripPulldown.id)){CATALOG.push(wideGripPulldown);existingIds.add(wideGripPulldown.id)}
  // Ab Coaster uses a kneeling carriage that rises along a curved track.
  // Zero weight denotes no added resistance; users still record sets and reps.
  const abCoaster={
    id:'ab-coaster',name:'Ab Coaster',category:'Core',
    equipment:'Ab Coaster machine · curved rail & kneeling pad',equipmentGroup:'Machine',
    cue:'Kneel on the moving pad, support forearms on the handles, and draw knees forward and upward along the curved track.',
    loadType:'direct',optionalResistance:true,mediaId:'ab-coaster',frames:['start','end'],
    aliases:['abcoaster','ab coaster machine','abdominal coaster','ab coaster crunch','kneeling ab machine','knee raise coaster','curved track ab machine'],
    muscles:['abs','obliques']
  };
  if(!existingIds.has(abCoaster.id)){CATALOG.push(abCoaster);existingIds.add(abCoaster.id)}
  // Bundled CC0 reference images, from MarvinNazari/exercise-images.
  // Keep the same exercise IDs: users' existing logs must never be re-labelled automatically.
  const MEDIA = {
    'leg-press':'leg-press','calf-raises':'calf-raises','leg-curl':'leg-curl',
    'seated-leg-curl':'seated-leg-curl','lying-leg-curl':'leg-curl','leg-extension':'leg-extension',
    'squat':'squat','rdl':'romanian-deadlift','lunge':'dumbbell-lunge','hip-thrust':'hip-thrusts',
    'bench-press':'bench-press','incline-db-press':'incline-dumbbell-press','chest-fly':'pec-deck',
    'push-up':'push-up','lat-pulldown':'lat-pulldown','cable-row':'seated-cable-row',
    'pull-up':'pull-up','db-row':'dumbbell-row','shoulder-press':'overhead-press',
    'lateral-raise':'lateral-raises','face-pull':'face-pulls','biceps-curl':'biceps-curl',
    'triceps-pushdown':'tricep-pushdowns','plank':'plank','cable-crunch':'cable-crunch',
    'standing-calf-raise':'standing-calf-raise-machine',
    'seated-calf-raise':'seated-calf-raise-machine',
    'leg-press-calf-raise':'leg-press-calf-raise'
  };
  const ALIASES = {
    'calf-raises':['calves','calf machine','heel raises','toe raises','calf raises'],
    'standing-calf-raise':['standing calves','standing calf','calf raise machine','standing heel raise','calves machine','machine calves'],
    'seated-calf-raise':['seated calves','seated calf','seated heel raise','seated calves machine'],
    'leg-press-calf-raise':['leg press calves','calves on leg press','calf press','toe press','leg press calf','calf raises on leg press'],
    'leg-curl':['hamstring curl','ham curl','hamstring leg curl','leg curls','hamstrings machine'],
    'seated-leg-curl':['seated hamstring curl','seated ham curls','sitting leg curl'],
    'lying-leg-curl':['prone leg curl','lying hamstring curl','face down leg curl'],
    'leg-extension':['quad extension','knee extension','quads machine'],
    'leg-press':['leg press machine','sitting leg press','leg press sled'],
    'squat':['back squat','barbell back squat'],
    'rdl':['rdl','romanian deadlift','barbell rdl','hip hinge'],
    'lunge':['walking lunges','dumbbell lunges','lunges'],
    'hip-thrust':['barbell hip thrust','glute bridge','hip thrusts'],
    'bench-press':['bench','chest press barbell','barbell bench'],
    'incline-db-press':['incline dumbbell bench','incline chest press','incline db press'],
    'chest-fly':['pec deck','butterfly machine','chest fly machine'],
    'push-up':['pushups','push ups','press ups'],
    'lat-pulldown':['lat pull down','lat pull','pulldowns','pull down machine'],
    'cable-row':['seated row','cable rows','rowing machine cables'],
    'pull-up':['pullups','chin ups','pull up bar'],
    'db-row':['single arm row','one arm row','dumbbell rows'],
    'shoulder-press':['overhead press','military press','shoulder press machine'],
    'lateral-raise':['side raises','side lateral raise','dumbbell lateral raise'],
    'face-pull':['face pulls','rear delt cable pull'],
    'biceps-curl':['arm curl','bicep curl','dumbbell curl','bicep curls'],
    'triceps-pushdown':['tricep pushdown','cable tricep extension','triceps cable pushdown'],
    'plank':['front plank','ab plank'],
    'cable-crunch':['kneeling cable crunch','rope crunch']
  };
  Object.assign(ALIASES, {"preacher-curl":["preacher curls","preacher bicep curl","preacher bench curls"],"machine-preacher-curl":["preacher curl machine","machine preacher curls"],"dumbbell-preacher-curl":["single arm preacher curls","dumbbell preacher curls"],"incline-dumbbell-curl":["incline curl","incline curls","incline bicep curls"],"hammer-curls":["hammer curls","dumbbell hammer curls","neutral grip bicep curl"],"cross-body-hammer-curl":["cross body curls","cross body hammer curls"],"rope-hammer-curl":["rope hammer curls","cable rope hammer curl"],"cable-curl":["cable biceps curl","cable curls"],"spider-curl":["spider curls"],"reverse-curl":["reverse grip curls","reverse curls"],"ez-bar-curl":["ez bar curls","ez curl bar"],"concentration-curl":["concentration curls"],"close-grip-lat-pulldown":["close grip pull downs","narrow grip lat pulldown","neutral grip lat pulldown"]});
  const EXERCISE_DIFFERENCES = {"wide-grip-lat-pulldown":"A wider overhand grip changes your pulling angles. It does not isolate a completely separate back muscle.","close-grip-lat-pulldown":"A narrower handle lets the elbows travel nearer your sides. Log it separately from the wide-grip version.","preacher-curl":"The upper arm is supported in front of your torso. This setup differs from standing barbell curls.","machine-preacher-curl":"The elbow position is similar to free-weight preacher curls, but the machine's resistance curve differs.","incline-dumbbell-curl":"Arms begin behind your torso, training the biceps from a relatively lengthened position.","hammer-curls":"The palms-in grip recruits brachialis and brachioradialis along with the biceps.","cross-body-hammer-curl":"The cross-body, neutral-grip path is a useful alternative, not a way to isolate a single head.","spider-curl":"Upper arms hang in front while your chest is supported, unlike incline curls.","reverse-curl":"Palms-down curls increase forearm demand and change elbow-flexor recruitment."};
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
  let catalogFilter='All',catalogSearch='',catalogEquipment='All',catalogShown=24,chartRange='all',chartMetric='load';
  const htmlNum=n => fmt(Number(n)||0);
  const $ = (s,root=document) => root.querySelector(s);
  function mark(){if(!Array.isArray(data.cardio))data.cardio=[];if(!data.sharePrefs||typeof data.sharePrefs!=='object')data.sharePrefs={workouts:false,cardio:false,records:false}; if(typeof data.cardioGoal!=='number')data.cardioGoal=0;}
  mark();
  const bundledImages=new Set(Object.values(MEDIA));
  function mediaPath(id,frame='start') {
    if(id==='ab-coaster')return `./assets/exercises/ab-coaster/${frame}.svg`;
    return bundledImages.has(id)?`./assets/exercises/${id}/${frame}.webp`:`https://raw.githubusercontent.com/MarvinNazari/exercise-images/main/images/${encodeURIComponent(id)}/${frame}.webp`;
  }
  function figure(ex,large=false){
    const id=MEDIA[ex.id]||ex.mediaId;
    if(!id){return `<div class="exercise-visual visual-fallback" role="img" aria-label="No reference image for ${esc(ex.name)}"><span aria-hidden="true">${esc(categoryIcon(ex.category))}</span><small>Custom exercise</small></div>`;}
    if(ex.id==='calf-raises'){
      const parts=[['standing-calf-raise-machine','Standing'],['seated-calf-raise-machine','Seated'],['leg-press-calf-raise','Leg press']];
      return `<div class="exercise-visual calf-variations ${large?'is-large':''}" role="group" aria-label="Three different calf raise variations">${parts.map(([source,label])=>`<div><img src="${mediaPath(source)}" alt="${esc(label)} calf raise example" loading="lazy" decoding="async"/><small>${esc(label)}</small></div>`).join('')}</div>`;
    }
    const hold=ex.frames?.length===1&&ex.frames[0]==='hold'||id==='plank',first=hold?'hold':'start';
    if(!large){return `<div class="exercise-visual" role="img" aria-label="${esc(ex.name)} reference illustration"><img src="${mediaPath(id,first)}" alt="" loading="lazy" decoding="async"/><span class="visual-indicator" aria-hidden="true">${hold?'Hold':'View movement'}</span></div>`;}
    return `<div class="exercise-motion-frames" role="group" aria-label="${esc(ex.name)} movement illustrations">
       <figure><img src="${mediaPath(id,first)}" alt="${esc(ex.name)} ${hold?'hold':'starting position'}" loading="eager"/><figcaption>${hold?'Position':'Start'}</figcaption></figure>
       ${hold?'':`<span class="motion-arrow" aria-hidden="true">→</span><figure><img src="${mediaPath(id,'end')}" alt="${esc(ex.name)} finishing position" loading="eager"/><figcaption>Finish</figcaption></figure>`}
     </div>`;
  }
  function lookup(ex){return CATALOG.find(c=>c.id===ex.catalogId || c.id===ex.id || c.name.toLowerCase()===ex.name.toLowerCase())||{...ex,pose:'curl',equipment:'Custom exercise',cue:'Your own exercise setup'};}
  function row(ex){const r=recent(ex.id),wt=r?Number(r.weight):exerciseLoad(ex),art=lookup(ex);return `<article class="lift-row"><div class="lift-row-art">${figure(art)}</div><button type="button" class="lift-row-meta lift-name-btn" data-edit="${esc(ex.id)}" aria-label="Edit ${esc(ex.name)} configuration"><strong>${esc(ex.name)}</strong><span>${esc(ex.category||'Other')} · ${esc(art.equipment||'Custom')}</span></button><div class="lift-row-weight">${htmlNum(wt)}<small> lb</small></div><button class="quick-plus" aria-label="Log ${esc(ex.name)}" data-log="${esc(ex.id)}">+</button></article>`;}
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
  function catalogCard(c){
    const own=data.exercises.find(e=>e.catalogId===c.id||e.id===c.id||normalizeSearch(e.name)===normalizeSearch(c.name));
    const ambiguous=c.id==='calf-raises'||c.id==='leg-curl';
    const label=ambiguous?'Choose type':own?'Log':'Add +';
    const action=ambiguous?`data-exercise-info="${esc(c.id)}"`:`data-pick-catalog="${esc(c.id)}"`;
    const cue=ambiguous?(c.id==='calf-raises'?'Choose standing, seated or leg-press style.':'Choose seated or lying style, if known.'):c.cue;
    const primary=c.muscles?.length?` · ${c.muscles.slice(0,2).map(x=>x.replace(/_/g,' ')).join(', ')}`:'';
    return `<article class="catalog-card"><button type="button" class="catalog-art" data-exercise-info="${esc(c.id)}" aria-label="View ${esc(c.name)} start and finish images">${figure(c)}</button><div class="catalog-copy"><strong>${esc(c.name)}</strong><span>${esc(c.equipment)}</span><p class="catalog-cue">${esc(cue)}</p><div class="catalog-tags"><small>${esc(c.category+primary)}</small></div></div><button class="catalog-action ${own?'existing':''}" ${action} aria-label="${esc(label)}: ${esc(c.name)}">${esc(label)}</button></article>`;
  }
  function normalizeSearch(x){return String(x||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
  function catalogScore(c,phrase){
    if(!phrase)return 1;
    const name=normalizeSearch(c.name),aliases=[...(ALIASES[c.id]||[]),...(c.aliases||[])].map(normalizeSearch);
    const misc=normalizeSearch(`${c.category} ${c.equipment} ${c.cue} ${(c.muscles||[]).join(' ')} ${c.equipmentGroup||''}`);
    if(name===phrase)return 100;
    if(aliases.includes(phrase))return 96;
    if(name.startsWith(phrase))return 83;
    if(aliases.some(a=>a.startsWith(phrase)))return 79;
    if(name.includes(phrase))return 74;
    if(aliases.some(a=>a.includes(phrase)))return 70;
    if(misc.includes(phrase))return 42;
    const all=[name,...aliases,misc].join(' ');
    return phrase.split(' ').every(t=>all.includes(t))?20:0;
  }
  function equipmentOf(c){if(c.equipmentGroup)return c.equipmentGroup;const t=normalizeSearch(c.equipment);if(t.includes('cable'))return 'Cable';if(t.includes('dumbbell'))return 'Dumbbell';if(t.includes('barbell'))return 'Barbell';if(t.includes('kettlebell'))return 'Kettlebell';if(t.includes('band'))return 'Band';if(t.includes('machine')||t.includes('smith')||t.includes('pec deck'))return 'Machine';if(t.includes('bodyweight')||t==='floor'||t==='mat')return 'Bodyweight';return 'Other'}
  function catalogMatches(){const query=normalizeSearch(catalogSearch);
    return CATALOG.filter(c=>(catalogFilter==='All'||c.category===catalogFilter)&&(catalogEquipment==='All'||equipmentOf(c)===catalogEquipment))
      .map((c,i)=>({c,i,score:catalogScore(c,query)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.i-b.i).map(x=>x.c);
  }
  function catalogCards(){const matches=catalogMatches(),display=matches.slice(0,catalogShown);return `<div class="catalog-results">${matches.length} exercise${matches.length===1?'':'s'} found · showing ${display.length}</div>${matches.length?`<div class="catalog-grid">${display.map(catalogCard).join('')}</div>${matches.length>display.length?`<button class="secondary catalog-more" type="button" data-catalog-more>Show more exercises (${matches.length-display.length} remaining)</button>`:''}`:'<p class="muted-inset">No matches yet. Try a shorter name (e.g. “calves”), a muscle group, or another equipment type.</p>'}`;}
  exercises=function(){return `<div class="page-top"><span class="eyebrow">YOUR WORKOUTS</span><h1>Find your movement.</h1><p class="sub">Search by name, equipment or muscle group. Tap an illustration to identify the exercise.</p></div>
    <div class="section-header"><h2>Browse ${CATALOG.length} available exercises</h2><span class="hint">Start / finish references</span></div>
     <div class="search-wrap" role="search"><label class="search-label" for="catalogSearch">Search exercises</label><span aria-hidden="true">⌕</span><input id="catalogSearch" type="search" placeholder="Name, machine or muscle..." value="${esc(catalogSearch)}" autocomplete="off"/><button type="button" id="voiceExerciseSearch" class="voice-search-button" aria-label="Search exercises using your voice" aria-pressed="false" title="Speak an exercise name"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg></button></div>
     <p class="voice-status" id="voiceSearchStatus" role="status" aria-live="polite">Tap the microphone to search by speaking, or use keyboard dictation.</p>
    <div class="catalog-filters" role="group" aria-label="Muscle group">${['All','Legs','Chest','Back','Shoulders','Arms','Core','Other'].map(s=>`<button data-catalog-filter="${esc(s)}" class="chip ${catalogFilter===s?'selected':''}">${esc(s)}</button>`).join('')}</div>
    <div class="equipment-filter"><label for="catalogEquipment">Equipment</label><select id="catalogEquipment">${['All','Machine','Cable','Dumbbell','Barbell','Bodyweight','Band','Kettlebell','Other'].map(s=>`<option value="${s}" ${catalogEquipment===s?'selected':''}>${s==='All'?'All equipment':s}</option>`).join('')}</select><small>Exercise images may require internet the first time.</small></div>
    <div id="catalogResults">${catalogCards()}</div>
    <div class="v61-custom-from-library">
      <span><strong>Not in the library?</strong><small>Create an exercise with your own name and equipment setup.</small></span>
      <button id="addExercise" class="secondary" type="button">+ Create Custom Exercise</button>
    </div>
    <div class="section-header"><h2>My saved exercises <span class="count-inline">${data.exercises.length}</span></h2><span class="hint">Quick log</span></div>
    <div class="panel list-panel">${data.exercises.map(row).join('')||'<p class="muted-inset">No saved exercises yet.</p>'}</div>`;
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
  settings=function(){return `${baseSettings()}<div class="panel info-panel"><strong>App v0.5.2 · ${CATALOG.length} available exercises</strong><p>The number beside "My saved exercises" is only the workouts you have personally added. The searchable library below is much larger.</p><button class="secondary" data-update-app type="button">Check for app updates</button></div><div class="panel info-panel"><strong>Social & device roadmap</strong><p>Manual cardio and opt-in summary sharing work locally. Live friend groups and wearable syncing need secure infrastructure and permission-based integrations.</p><button class="secondary" data-tab="groups">Friends & privacy</button></div>`};
  render=function(){mark();const pages={home,exercises,history,coach,settings,cardio:cardioPage,groups:groupPage};app.innerHTML=(pages[tab]||home)();document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));};
  function openCatalogInfo(id){
    const c=CATALOG.find(x=>x.id===id);if(!c)return;
    const variants=id==='calf-raises'?
      ['standing-calf-raise','seated-calf-raise','leg-press-calf-raise']:
      id==='leg-curl'?['seated-leg-curl','lying-leg-curl']:[];
    if(variants.length){
      const description=id==='calf-raises'?'These are different movements and machines. Choose the one you used.':'A seated and a lying leg curl use different machines. Keep your existing weight record as-is unless you know which one it was.';
      openModal(`${modalTop('Which variation?',c.category+' · '+c.name)}<p class="detail-cue">${esc(description)}</p><div class="variation-select-list">${variants.map(v=>{
        const x=CATALOG.find(y=>y.id===v);
        return `<article class="variation-option"><button type="button" data-pick-catalog="${esc(x.id)}" aria-label="Select ${esc(x.name)}">${figure(x)}<span><strong>${esc(x.name)}</strong><small>${esc(x.equipment)} — ${esc(x.cue)}</small></span><b>Choose →</b></button></article>`;
      }).join('')}</div><button class="secondary full" data-pick-catalog="${esc(c.id)}">Keep as ${esc(c.name)} (unspecified)</button>`);
      return;
    }
    openModal(`${modalTop(c.name,c.category+' · '+c.equipment)}<div class="detail-figure">${figure(c,true)}</div><p class="detail-cue"><strong>How to recognize it:</strong> ${esc(c.cue)}</p>${EXERCISE_DIFFERENCES[c.id]?`<p class="detail-cue"><strong>What is different:</strong> ${esc(EXERCISE_DIFFERENCES[c.id])}</p>`:""}<p class="smallprint">Images are visual identification aids, not professional form instructions. Machine designs vary.</p><button class="primary full" data-pick-catalog="${esc(c.id)}">${data.exercises.some(e=>e.catalogId===c.id||e.id===c.id||normalizeSearch(e.name)===normalizeSearch(c.name))?'Log this exercise':'Add to my exercises'}</button>`);
  }
  function pickCatalog(id){const c=CATALOG.find(x=>x.id===id);if(!c)return;const existing=data.exercises.find(x=>x.catalogId===c.id||x.id===c.id||normalizeSearch(x.name)===normalizeSearch(c.name));
    if(existing){if(modalRoot.innerHTML)closeModal();openLog(existing.id);return;}
    const ex={id:c.id,name:c.name,category:c.category,loadType:c.loadType,perSide:false,plates:{},directWeight:0,notes:`${c.equipment}. ${c.cue}`,catalogId:c.id};
    ex.optionalResistance=!!c.optionalResistance;
    data.exercises.push(ex);if(save()){if(modalRoot.innerHTML)closeModal();render();notify('Exercise added — log your first set');openLog(ex.id)}
  }
  const VoiceRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  let recognition=null,voiceActive=false,voiceText='';
  function voiceStatus(message){
    voiceText=message;
    const status=$('#voiceSearchStatus'),button=$('#voiceExerciseSearch');
    if(status)status.textContent=message;
    if(button){button.classList.toggle('listening',voiceActive);button.setAttribute('aria-pressed',String(voiceActive));button.setAttribute('aria-label',voiceActive?'Stop voice search':'Search exercises using your voice');}
  }
  function cleanVoiceText(s){
    // Keep equipment words such as "machine"; they help identify variations.
    return normalizeSearch(s)
      .replace(/^(?:(?:hey|please|can you|could you|find me|find|search for|search|show me|show|look up|i did|i am doing|i want to do|the exercise|an exercise)\s+)+/g,'')
      .replace(/\s+(?:exercise|workout)$/,'').trim()||normalizeSearch(s);
  }
  function startVoiceSearch(){
    const field=$('#catalogSearch');if(!field)return;
    if(voiceActive&&recognition){recognition.stop();return;}
    if(!VoiceRecognition||window.isSecureContext===false){
      field.focus();voiceStatus('Voice recognition is not available here. Tap your iPhone keyboard microphone to dictate an exercise name.');
      return;
    }
    let r;
    try{r=new VoiceRecognition();}catch(_){field.focus();voiceStatus('Voice search unavailable. Use the keyboard microphone instead.');return;}
    recognition=r;r.lang=navigator.language||'en-US';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
    r.onstart=()=>{voiceActive=true;voiceStatus('Listening… Say an exercise name or describe the equipment.');};
    r.onresult=event=>{
      const raw=event.results?.[0]?.[0]?.transcript||'';
      const spoken=cleanVoiceText(raw);
      catalogFilter='All';catalogEquipment='All';catalogShown=24;catalogSearch=spoken;
      field.value=spoken;
      app.querySelectorAll('[data-catalog-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.catalogFilter==='All'));
      const equipment=$('#catalogEquipment');if(equipment)equipment.value='All';
      $('#catalogResults').innerHTML=catalogCards();
      voiceStatus(spoken?`Heard: “${raw}” — ${catalogMatches().length} matching exercises.`:'No words detected. Try again or type a search.');
    };
    r.onerror=event=>{
      const reason=event.error||'unknown';
      voiceActive=false;
      const desc=reason==='not-allowed'||reason==='service-not-allowed'?'Microphone permission denied. Enable it in browser settings, or use keyboard dictation.':reason==='no-speech'?'No speech detected. Try speaking closer to the microphone.':reason==='audio-capture'?'No microphone available. Use keyboard dictation instead.':reason==='network'?'Speech service unavailable. Try again online or use keyboard dictation.':'Voice search stopped. Type or dictate into the search box.';
      voiceStatus(desc);
    };
    r.onend=()=>{voiceActive=false;recognition=null;voiceStatus(voiceText.startsWith('Listening')?'Voice search stopped.':voiceText);};
    try{r.start();}catch(_){voiceActive=false;recognition=null;field.focus();voiceStatus('Could not start speech recognition. Use the iPhone keyboard microphone instead.');}
  }
  app.addEventListener('click',e=>{
    if(e.target.closest('[data-update-app]')){
      e.stopImmediatePropagation();
      if(!navigator.onLine){notify('Connect to the internet to check for updates.');return;}
      const update=async()=>{try{const reg=await navigator.serviceWorker?.getRegistration();if(reg)await reg.update()}catch(_){/* Reload will still request fresh versioned files. */}window.location.assign('./?refresh='+Date.now())};
      void update();return;
    }
    if(e.target.closest('#voiceExerciseSearch')){e.stopImmediatePropagation();startVoiceSearch();return;}
    if(e.target.closest('[data-catalog-more]')){e.stopImmediatePropagation();catalogShown+=24;$('#catalogResults').innerHTML=catalogCards();return;}
    const f=e.target.closest('[data-catalog-filter]');if(f){e.stopImmediatePropagation();catalogShown=24;catalogFilter=f.dataset.catalogFilter;app.querySelectorAll('[data-catalog-filter]').forEach(x=>x.classList.toggle('selected',x.dataset.catalogFilter===catalogFilter));$('#catalogResults').innerHTML=catalogCards();return;}
    const info=e.target.closest('[data-exercise-info]');if(info){e.stopImmediatePropagation();openCatalogInfo(info.dataset.exerciseInfo);return;}
    const pick=e.target.closest('[data-pick-catalog]');if(pick){e.stopImmediatePropagation();pickCatalog(pick.dataset.pickCatalog);return;}
    const met=e.target.closest('[data-chart-metric]');if(met){e.stopImmediatePropagation();chartMetric=met.dataset.chartMetric;render();return;}
    const range=e.target.closest('[data-chart-range]');if(range){e.stopImmediatePropagation();chartRange=range.dataset.chartRange;render();return;}
    if(e.target.closest('[data-add-cardio]')){e.stopImmediatePropagation();openCardio();return;}
    if(e.target.closest('[data-save-cardio-goal]')){e.stopImmediatePropagation();const n=Number($('#cardioGoal').value||0);if(!Number.isFinite(n)||n<0||n>10000){notify('Enter 0 to 10,000 minutes');return;}data.cardioGoal=n;save();render();notify('Cardio goal saved');return;}
    const del=e.target.closest('[data-remove-cardio]');if(del){e.stopImmediatePropagation();const rec=data.cardio.find(r=>r.id===del.dataset.removeCardio);if(rec&&confirm(`Delete ${rec.duration} min ${rec.type} on ${rec.date}?`)){window.LiftLogAuthorizedDeletion={type:'cardio',id:rec.id};data.cardio=data.cardio.filter(r=>r.id!==rec.id);if(save()){render();notify('Cardio session removed (recoverable from snapshots)')}}return;}
    if(e.target.closest('[data-send-share]')){e.stopImmediatePropagation();const str=shareText();if(!Object.values(data.sharePrefs).some(Boolean))return;const send=async()=>{try{if(navigator.share)await navigator.share({text:str,title:'Lift Log progress'});else if(navigator.clipboard){await navigator.clipboard.writeText(str);notify('Summary copied — share it with a friend')}else{openModal(`${modalTop('Copy your summary','Nothing is sent automatically')}<textarea class="share-copy" readonly>${esc(str)}</textarea>`);}}catch(err){if(err.name!=='AbortError')notify('Sharing unavailable. Please copy the summary manually.')}};void send();return;}
  },true);
  app.addEventListener('input',e=>{if(e.target.id==='catalogSearch'){catalogShown=24;catalogSearch=e.target.value;$('#catalogResults').innerHTML=catalogCards()}},true);
  app.addEventListener('change',e=>{if(e.target.id==='catalogEquipment'){catalogShown=24;catalogEquipment=e.target.value;$('#catalogResults').innerHTML=catalogCards();return;}const p=e.target.closest('[data-share-pref]');if(p){data.sharePrefs[p.dataset.sharePref]=p.checked;save();render()}},true);
  modalRoot.addEventListener('click',e=>{const pick=e.target.closest('[data-pick-catalog]');if(pick){e.stopImmediatePropagation();pickCatalog(pick.dataset.pickCatalog)}},true);
  const header=document.querySelector('.topbar');const settingsButton=document.createElement('button');settingsButton.className='settings-access';settingsButton.title='Settings & backups';settingsButton.setAttribute('aria-label','Settings & backups');settingsButton.innerHTML='⚙';header.append(settingsButton);settingsButton.addEventListener('click',()=>{tab='settings';render();window.scrollTo(0,0)});
  // Public read-only catalog adapter for the workout-first selection sheet.
  // Internal exercise IDs and the existing local storage schema stay unchanged.
  window.LiftLogCatalog=Object.freeze({
    list:()=>CATALOG.slice(),
    search:(query='')=>{
      const phrase=normalizeSearch(query);
      return CATALOG.map((entry,i)=>({entry,i,score:catalogScore(entry,phrase)}))
        .filter(result=>result.score>0)
        .sort((a,b)=>b.score-a.score||a.i-b.i).map(result=>result.entry);
    },
    visual:(entry)=>figure(entry),
    pick:(id)=>pickCatalog(id)
  });
  render();
})();
