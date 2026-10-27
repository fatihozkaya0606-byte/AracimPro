/* Ok Kaçış — playable offline puzzle game, no external services */
(() => {
  'use strict';
  const MAX_LIVES = 20, LIFE_REGEN_MS = 2 * 60 * 1000;
  const SIZE = 7, TOTAL_LEVELS = 540, COLORS = ['red','green','orange','purple','yellow','blue'];
  const WORLDS=[{id:'forest',name:'🌿 Yeşil Vadi',emoji:'🌲'},{id:'desert',name:'🏜️ Altın Çöl',emoji:'🌵'},{id:'snow',name:'❄️ Buz Tepeleri',emoji:'❄️'},{id:'sunset',name:'🌅 Günbatımı',emoji:'🌅'},{id:'neon',name:'🌌 Neon Evren',emoji:'💜'}];
  const SKINS=[{id:'classic',name:'Klasik Parlak',icon:'🌈',price:0},{id:'crystal',name:'Kristal Ok',icon:'💎',price:850},{id:'metal',name:'Altın Ok',icon:'🏆',price:1200},{id:'neon',name:'Neon Ok',icon:'⚡',price:1800},{id:'candy',name:'Şeker Ok',icon:'🍬',price:2400}];
  const THEME_PRICES={auto:0,forest:0,desert:900,snow:1100,sunset:1500,neon:2000};
  const $ = id => document.getElementById(id);
  const defaultSave = () => ({highest:1,coins:1250,stars:0,hints:3,undos:3,lastDaily:'',completed:{},sound:true,music:true,vibrate:true,selectedSkin:'classic',ownedSkins:['classic'],selectedTheme:'auto',ownedThemes:['auto','forest'],totalArrows:0,totalWins:0,perfectWins:0,dailyQuests:{},claimedAchievements:{},dailyStreak:0,lastWinDate:'',lives:MAX_LIVES,nextLifeAt:0,lifeSystemVersion:1,powerMoves:0,powerTime:0,powerUnlock:0,powerAuto:0,powerRevive:0});
  let save;
  try { save = Object.assign(defaultSave(),JSON.parse(localStorage.getItem('ok-kacis-v1')||'{}')); } catch(_) { save = defaultSave(); }
  // Migrate older saves: hearts were cosmetic and never blocked play.
  delete save.hearts;
  // Upgrade an old offline save to the new 20-life system only once.
  if(save.lifeSystemVersion!==1){save.lives=MAX_LIVES;save.nextLifeAt=0;save.lifeSystemVersion=1;}
  save.lives=Math.max(0,Math.min(MAX_LIVES,Number.isFinite(Number(save.lives))?Math.floor(Number(save.lives)):MAX_LIVES));
  save.nextLifeAt=Number.isFinite(Number(save.nextLifeAt))?Math.max(0,Number(save.nextLifeAt)):0;
  save.completed = save.completed || {};
  save.ownedSkins = Array.isArray(save.ownedSkins)?save.ownedSkins:['classic'];
  save.ownedThemes = Array.isArray(save.ownedThemes)?save.ownedThemes:['auto','forest'];
  save.dailyQuests = save.dailyQuests || {};
  save.claimedAchievements = save.claimedAchievements || {};
  for(const k of ['powerMoves','powerTime','powerUnlock','powerAuto','powerRevive'])save[k]=Math.max(0,Math.min(9999,Math.floor(Number(save[k])||0))); 
  if(save.highest>TOTAL_LEVELS)save.highest=TOTAL_LEVELS;
  const TODAY=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  function ensureDaily(){const d=TODAY();if(save.dailyQuests.date!==d){save.dailyQuests={date:d,arrows:0,wins:0,perfect:0,claimed:{}};persist();}}
  function vibrate(pattern){if(save.vibrate&&navigator.vibrate){try{navigator.vibrate(pattern)}catch(_){}}}
  function levelWorld(n){return WORLDS[Math.floor((n-1)/20)%WORLDS.length]}
  function applyTheme(){const chosen=save.selectedTheme==='auto'?levelWorld(Math.max(1,currentLevel)).id:save.selectedTheme; $('app').className='app theme-'+chosen+' skin-'+save.selectedSkin;
    if($('worldLabel'))$('worldLabel').textContent=save.selectedTheme==='auto'?levelWorld(currentLevel).name:WORLDS.find(w=>w.id===chosen).name;
  }
  function updateHome(){if($('homeStatus'))$('homeStatus').textContent=`❤️ ${save.lives}/${MAX_LIVES} can  •  🪙 ${save.coins} altın  •  ⭐ ${save.stars} yıldız`;}
  const persist = () => {try{localStorage.setItem('ok-kacis-v1',JSON.stringify(save));}catch(_){}};
  // Persist the time of the NEXT heart, not a timer. Regeneration also works
  // while the app is closed. A full bar never accumulates extra hearts.
  function refreshLives(now=Date.now()){
    if(save.lives>=MAX_LIVES){
      if(save.nextLifeAt!==0){save.nextLifeAt=0;persist();}
      return;
    }
    if(!save.nextLifeAt){save.nextLifeAt=now+LIFE_REGEN_MS;persist();return;}
    if(now<save.nextLifeAt)return;
    const gained=1+Math.floor((now-save.nextLifeAt)/LIFE_REGEN_MS);
    save.lives=Math.min(MAX_LIVES,save.lives+gained);
    save.nextLifeAt=save.lives>=MAX_LIVES?0:save.nextLifeAt+gained*LIFE_REGEN_MS;
    persist();
  }
  function timeUntilHeart(now=Date.now()){
    if(save.lives>=MAX_LIVES)return 'Dolu';
    const left=Math.max(0,(save.nextLifeAt||now+LIFE_REGEN_MS)-now);
    const secs=Math.ceil(left/1000);
    return `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  }
  function updateLifeUI(){
    refreshLives();
    if($('livesTxt'))$('livesTxt').textContent=`${save.lives}/${MAX_LIVES}`;
    if($('lifeTimer'))$('lifeTimer').textContent=save.lives===MAX_LIVES?'Canlar dolu':`+1 can ${timeUntilHeart()}`;
    if($('livesResource'))$('livesResource').textContent=`${save.lives}/${MAX_LIVES}`;
    if($('livesCountdown'))$('livesCountdown').textContent=save.lives===MAX_LIVES?'':`+1 ${timeUntilHeart()}`;
    if($('lostLives'))$('lostLives').textContent=`❤️ ${save.lives}/${MAX_LIVES}`;
    if($('lostRefill'))$('lostRefill').textContent=save.lives===MAX_LIVES?'Canların dolu':`Sonraki can: ${timeUntilHeart()}`;
    if($('retryLevel'))$('retryLevel').disabled=save.lives<=0;
    if($('openRewardLives'))$('openRewardLives').dataset.earnable=save.lives<MAX_LIVES?'yes':'no';
    updateRewardButton();
    updateHome();
  }
  function consumeLife(){
    refreshLives();
    if(save.lives<=0)return false;
    if(save.lives===MAX_LIVES || !save.nextLifeAt)save.nextLifeAt=Date.now()+LIFE_REGEN_MS;
    save.lives--;persist();updateLifeUI();return true;
  }
  // Optional rewarded ads: never grant hearts for launching, skipping, or failing an ad.
  // Native bridge is available only in the Android debug/production shell with AdMob.
  const REWARDED_HEARTS = 5;
  let rewardedReady = false;
  let rewardedPending = false;
  let rewardedGranted = false;
  const nativeAds = () => typeof window.AndroidAds !== 'undefined' ? window.AndroidAds : null;
  function adBannerForScreen(next){
    const bridge=nativeAds();
    if(bridge && typeof bridge.setBannerVisible==='function'){
      try{bridge.setBannerVisible(next==='playing');}catch(_){}
    }
  }
  function updateRewardButton(){
    const buttons=['watchRewardLives','watchRewardNoLives'].map(id=>$(id)).filter(Boolean);
    for(const b of buttons){
      b.disabled=!rewardedReady||rewardedPending||save.lives>=MAX_LIVES;
      b.textContent=save.lives>=MAX_LIVES?'❤️ Canların dolu':rewardedPending?'Reklam açılıyor...':rewardedReady?'🎬 Reklam izle · +5 can':'Reklam hazırlanıyor...';
    }
  }
  function requestRewardedLives(){
    refreshLives();
    if(save.lives>=MAX_LIVES){toast('❤️ Canların zaten dolu!');return;}
    const bridge=nativeAds();
    if(!bridge || !rewardedReady || rewardedPending){toast('Reklam şu an hazır değil. Biraz sonra dene.');return;}
    rewardedPending=true;rewardedGranted=false;rewardedReady=false;timerLastAt=performance.now();
    updateRewardButton();
    try{bridge.showRewarded();}catch(_){rewardedPending=false;updateRewardButton();toast('Reklam açılamadı.');}
  }
  function rewardLivesGranted(){
    if(!rewardedPending || rewardedGranted)return;
    rewardedGranted=true;
    const old=save.lives;
    refreshLives();
    save.lives=Math.min(MAX_LIVES,save.lives+REWARDED_HEARTS);
    if(save.lives===MAX_LIVES)save.nextLifeAt=0;
    else if(!save.nextLifeAt)save.nextLifeAt=Date.now()+LIFE_REGEN_MS;
    persist();
    updateLifeUI();
    if(modalType==='reward-lives'||modalType==='no-lives')closeModal();
    playSound('coin');vibrate([25,40,30]);
    toast('❤️ +' +(save.lives-old) +' can kazandın!');
  }
  window.OkKacisAdCallbacks = Object.freeze({
    onReady: ready=>{rewardedReady=!!ready;updateRewardButton();adBannerForScreen(screen);},
    onRewardEarned: ()=>{rewardLivesGranted();},
    onClosed: ()=>{if(rewardedPending&&!rewardedGranted)toast('Reklam ödülü kazanılmadı.');rewardedPending=false;timerLastAt=performance.now();updateRewardButton();},
    onFailed: ()=>{rewardedPending=false;rewardedReady=false;updateRewardButton();toast('Reklam açılamadı. Daha sonra tekrar dene.');}
  });
  function openRewardLives(){
    refreshLives();
    if(save.lives>=MAX_LIVES){toast('❤️ Canların dolu!');return;}
    modal('❤️ Reklam izle, can kazan',`<p>İstersen bir ödüllü reklam izleyerek <strong>+5 can</strong> kazanabilirsin. Reklamı izlemezsen veya ödül kazanılmazsa can eklenmez.</p><p>❤️ ${save.lives}/${MAX_LIVES} · En fazla ${MAX_LIVES} can</p><button id="watchRewardLives" class="btn medium green" style="width:100%;margin-bottom:8px">🎬 Reklam izle · +5 can</button><button id="skipReward" class="btn medium blue" style="width:100%">Şimdi değil</button>`,'reward-lives');
    $('watchRewardLives').onclick=requestRewardedLives;
    $('skipReward').onclick=closeModal;
    updateRewardButton();
  }

  // One lightweight ticker updates only displayed countdowns.
  setInterval(updateLifeUI,1000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateLifeUI();});
  let screen = 'home', modalType = '', page = 0, shopReturn='home', selectedShopTab='skins';
  let currentLevel = 1, levelData = null, pieces = [], history = [], removed = 0, movesLeft = 0, hintsUsed = 0, mistakesUsed = 0, busy = false, hintId = -1, lostThisRun = false;
  let specialTiles = [], comboStreak = 0, awardedCombos = new Set();
  let timeRemainingMs=0, initialTimeMs=0, timerLastAt=0, lastTickSeconds=-1, lastBeepSecond=-1, revivesUsed=0;
  function secondsForLevel(n){
    // Increasing time allowance reflects increasing puzzle length/difficulty.
    if(n<=9)return 120;
    if(n<=19)return 140;
    if(n<=39)return 165;
    if(n<=69)return 185;
    if(n<=99)return 205;
    if(n<=149)return 225;
    if(n<=249)return 245;
    return 270;
  }
  function timerRunning(){return !rewardedPending && screen==='playing' && $('modal').hidden && !document.hidden && !lostThisRun && !levelTransitioning && !busy && !!levelData;}
  function clockString(milliseconds){const seconds=Math.max(0,Math.ceil(milliseconds/1000));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function drawTimer(){
    if(!$('timerText'))return;
    $('timerText').textContent=clockString(timeRemainingMs);
    const ratio=initialTimeMs?Math.max(0,Math.min(1,timeRemainingMs/initialTimeMs)):1;
    $('timerFill').style.width=(ratio*100)+'%';
    $('timerPanel').classList.toggle('timer-warning',timeRemainingMs>0&&timeRemainingMs<=15000);
    $('timerPanel').classList.toggle('timer-critical',timeRemainingMs>0&&timeRemainingMs<=5000);
  }
  function tickTimer(now=performance.now()){
    if(!timerRunning()){timerLastAt=now;return;}
    const elapsed=Math.max(0,Math.min(1000,now-(timerLastAt||now)));
    timerLastAt=now;timeRemainingMs=Math.max(0,timeRemainingMs-elapsed);
    const second=Math.ceil(timeRemainingMs/1000);
    if(second!==lastTickSeconds){
      lastTickSeconds=second;drawTimer();
      if(second<=5&&second>0&&lastBeepSecond!==second){lastBeepSecond=second;playSound('tick');}
    }
    if(timeRemainingMs<=0){drawTimer();failLevel('Süren bitti!');}
  }
  setInterval(()=>tickTimer(),100);
  function addTime(seconds){timeRemainingMs=Math.min(timeRemainingMs+seconds*1000,600000);initialTimeMs=Math.max(initialTimeMs,timeRemainingMs);lastTickSeconds=-1;drawTimer();}

  ensureDaily();
  let toastTimer;
  function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),1700)}
  let audioCtx=null;
  // Offline soundtrack; music and SFX are independently adjustable.
  const bgMusic = new Audio('bg-music.ogg');
  bgMusic.loop=true; bgMusic.volume=.18; bgMusic.preload='auto';
  const openingSound = new Audio('opening-jingle.ogg');
  openingSound.volume=.46; openingSound.preload='auto';
  function syncMusic(){
    const shouldPlay=!!save.music && !document.hidden;
    if(shouldPlay){bgMusic.play().catch(()=>{});}else bgMusic.pause();
    if($('musicToggleFloat')){$('musicToggleFloat').textContent=save.music?'♫ Müzik Açık':'♪ Müzik Kapalı';$('musicToggleFloat').setAttribute('aria-pressed',String(!!save.music));}
  }
  document.addEventListener('visibilitychange',syncMusic);
  document.addEventListener('pointerdown',()=>{if(save.music && bgMusic.paused)syncMusic();},{passive:true});
  function setMusic(on){save.music=on;persist();syncMusic();}
  // 3.6 s intro appears once at each actual application launch.
  let splashComplete=false;
  function finishSplash(){if(splashComplete)return;splashComplete=true;const el=$('splash');el.classList.add('finished');setTimeout(()=>{el.hidden=true;},420);syncMusic();}
  function launchIntro(){
    const splash=$('splash');
    splash.hidden=false;
    requestAnimationFrame(()=>splash.classList.add('loading'));
    if(save.sound)openingSound.play().catch(()=>{});
    const stamp=performance.now();const pct=setInterval(()=>{
      if(splashComplete){clearInterval(pct);return;}
      $('splashPercent').textContent=Math.min(99,Math.floor((performance.now()-stamp)/36))+'%';
    },90);
    setTimeout(()=>{$('splashPercent').textContent='100%';finishSplash();},3600);
    $('skipSplash').onclick=finishSplash;
    syncMusic();
  }
  let levelTransitioning=false;
  function transitionToLevel(nextLevel){
    if(levelTransitioning)return;
    levelTransitioning=true;
    const el=$('levelTransition');$('transitionLevel').textContent=`Seviye ${nextLevel}`;
    el.hidden=false;el.classList.remove('running');void el.offsetWidth;el.classList.add('running');
    playSound('coin');
    setTimeout(()=>{startLevel(nextLevel);el.classList.remove('running');el.hidden=true;levelTransitioning=false;},2200);
  }
  
  function playSound(kind='tap') {
    if(!save.sound)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();
      const now=audioCtx.currentTime;
      const freqs=kind==='win'?[440,554,660,880]:kind==='bad'?[210,160]:kind==='coin'?[700,1000]:kind==='tick'?[780]:[500,660];
      freqs.forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='win'?'triangle':'sine';o.frequency.value=f;
        const t=now+i*.06;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.09,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
        o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.15);});
    }catch(_){}
  }
  function show(next){
    document.querySelectorAll('.screen').forEach(x=>x.classList.toggle('active',x.id===next));
    screen=next;
    timerLastAt=performance.now();
    refreshLives();
    $('musicToggleFloat').hidden=(next!=='playing');
    applyTheme();updateHome();
    if(next==='levels')renderLevels();
    if(next==='playing')drawBoard();
    if(next==='victory')renderVictory();
    if(next==='shop')renderShop();
    if(next==='challenges')renderChallenges();
    adBannerForScreen(next);
    updateLifeUI();
  }
  function resources(){return `<div class="resource"><span class="resource-emoji">🪙</span><span>${save.coins}</span><button class="plus" data-open-shop="1">+</button></div><div class="resource"><span class="resource-emoji">❤️</span><span id="livesResource">${save.lives}/${MAX_LIVES}</span><small id="livesCountdown"></small></div><div class="resource"><span class="resource-emoji">⭐</span><span>${save.stars}</span></div>`}
  function renderLevels(){
    $('resourcesLevels').innerHTML=resources();
    const grid=$('levelGrid');grid.innerHTML='';
    let first=page*12+1;
    for(let n=first;n<Math.min(first+12,TOTAL_LEVELS+1);n++){
      const unlocked=n<=save.highest;
      const grades=save.completed[n]||0;
      const type=['green','blue-l','orange-l','purple'][(Math.floor((n-1)/20))%4];
      const landscape=levelWorld(n).emoji+' ✦ '+(n%5===0?'🏆':'🏛️');
      const stars = unlocked ? Array.from({length:3},(_,i)=>`<span class="${i<grades?'':'off'}">★</span>`).join('') : '<span class="off">★★★</span>';
      const btn=document.createElement('button');btn.className=`level-card ${unlocked?type:'gray locked'}`;btn.innerHTML=`<div class="level-name">Seviye ${n}</div><div class="level-stars">${stars}</div><div class="mini-landscape">${unlocked?landscape:'🔒'}</div>`;
      btn.onclick=()=>{if(unlocked)startLevel(n);else toast(`Önce Seviye ${save.highest}'i tamamla!`)};
      grid.appendChild(btn);
    }
    $('pageDots').innerHTML='';let totalPages=Math.ceil(TOTAL_LEVELS/12), nDots=4;
    for(let d=0;d<nDots;d++){let dot=document.createElement('span');dot.className='page-dot'+(d===page%nDots?' active':'');$('pageDots').appendChild(dot)}
    $('prevPage').disabled=page===0;$('nextPage').disabled=page>=totalPages-1;
    $('levelTip').textContent=`Açılan bölüm: ${save.highest} / ${TOTAL_LEVELS}`;
  }
  function rngFor(level){let seed=(Math.imul(level,2654435761)^0x64321fab)>>>0;return function(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296}}
  const pick=(r,a)=>a[Math.floor(r()*a.length)];
  function cells(p){let a=[];for(let z=0;z<p.length;z++)a.push([p.x+(p.dir==='L'||p.dir==='R'?z:0),p.y+(p.dir==='U'||p.dir==='D'?z:0)]);return a;}
  function key(x,y){return x+','+y;}
  function occupancy(pcs,rocks){let occupied=new Set(rocks||[]);pcs.forEach(p=>cells(p).forEach(([x,y])=>occupied.add(key(x,y))));return occupied;}
  function freeExit(p,pcs,rocks){
    const own=new Set(cells(p).map(([x,y])=>key(x,y)));
    const occ=occupancy(pcs.filter(q=>q.id!==p.id),rocks);
    const c=cells(p), dx=p.dir==='R'?1:p.dir==='L'?-1:0,dy=p.dir==='D'?1:p.dir==='U'?-1:0;
    const tip=c.reduce((best,cur)=>cur[0]*dx+cur[1]*dy>best[0]*dx+best[1]*dy?cur:best,c[0]);
    let x=tip[0]+dx,y=tip[1]+dy;
    while(x>=0&&x<SIZE&&y>=0&&y<SIZE){if(occ.has(key(x,y))&&!own.has(key(x,y)))return false;x+=dx;y+=dy;}
    return true;
  }
  // Controlled difficulty: more arrows, longer pieces, blockers and key locks.
  // Candidate arrows must have a clear exit when added, so undoing insertion
  // order always solves the board. Pick arrows that obstruct existing exits to
  // avoid the previous sparse, trivially independent layouts.
  // Difficulty curve: early stages teach the rules; stages 20+ introduce
  // more dependencies, fewer visible choices and a smaller mistake budget.
  function difficulty(n){
    return {target:n<=5?6+n:n<11?10+n:n<16?17+Math.floor((n-8)*.7):n<31?22+Math.floor((n-16)/2):Math.min(32,29+Math.floor((n-30)/25)),
      rocks:n<=5?0:n<13?1:n<35?2:n<75?3:n<120?4:5,
      maxLen:n>=120?3:2,
      longChance:n<5?.11:n<14?.27:n<40?.33:n<100?.38:.44,
      allowances:n<=5?10:n<=10?5:n<20?4:n<35?3:n<75?2:n<160?1:1,
      lockChance:n<=5?0:n<=10?.19:n<15?.34:n<20?.51:n<30?.72:n<50?.79:n<85?.84:.90,
      visibleGoal:n<10?99:n<15?8:n<20?6:n<30?5:n<50?4:n<100?3:2,
      name:n<=5?'Başlangıç':n<=10?'Isınma':n<20?'Orta':n<35?'Zorlu':n<75?'Usta':n<160?'Uzman':'Efsane'};
  }
  function makeLevel(n){
    const rand=rngFor(n), diff=difficulty(n);
    const stones=[];
    for(let attempts=0;stones.length<diff.rocks&&attempts<110;attempts++){
      const k=key(1+Math.floor(rand()*(SIZE-2)),1+Math.floor(rand()*(SIZE-2)));
      if(!stones.includes(k))stones.push(k);
    }
    let best=[];
    for(let attempt=0;attempt<3;attempt++){
      const pcs=[];
      for(let index=0;index<diff.target;index++){
        const filled=occupancy(pcs,stones);
        const available=pcs.filter(p=>freeExit(p,pcs,stones));
        let chosen=null,bestScore=-1e8;
        const tries= n<6 ? 35 : n<25 ? 60 : 75;
        for(let t=0;t<tries;t++){
          const len=rand()<diff.longChance ? (diff.maxLen===3&&rand()<.12?3:2):1;
          const dir=pick(rand,['R','L','U','D']);
          const horizontal=dir==='R'||dir==='L';
          const x=Math.floor(rand()*(SIZE-(horizontal?len-1:0)));
          const y=Math.floor(rand()*(SIZE-(horizontal?0:len-1)));
          const p={id:pcs.length+1,x,y,length:len,dir,color:COLORS[(pcs.length+Math.floor(rand()*6))%COLORS.length]};
          if(cells(p).some(([cx,cy])=>filled.has(key(cx,cy))))continue;
          if(!freeExit(p,pcs,stones))continue;
          let blocked=0;
          for(const old of available)if(!freeExit(old,[...pcs,p],stones))blocked++;
          // Reward arrow-on-arrow dependencies, board density and variety.
          // A subtle seeded jitter prevents repetitive layouts.
          const score=blocked*11+(len>1?(n>=7?3.5:1):0)+(rand()*2)-Math.abs(x-3)*.09-Math.abs(y-3)*.09;
          if(score>bestScore){chosen=p;bestScore=score;}
          if(blocked>=3&&bestScore>30)break;
        }
        if(!chosen)break;
        pcs.push(chosen);
      }
      if(pcs.length>best.length)best=pcs;
      if(best.length>=diff.target)break;
    }
    // Dependencies always go from an earlier placed arrow to a later arrow.
    // The reverse insertion order therefore remains a guaranteed solution.
    // Critically, the advanced game has only a handful of initially removable
    // arrows instead of 10-15 open arrows that make a level feel effortless.
    if(n>=6 && best.length>=8){
      const all=best.length;
      for(let i=0;i<all-2;i++){
        if(rand()>=diff.lockChance)continue;
        const distance=2+Math.floor(rand()*Math.min(7,all-i-2));
        const keyIndex=Math.min(all-1,i+distance);
        best[i].needsKey=best[keyIndex].id;
        best[keyIndex].isKey=true;
      }
      // Enforce stage-specific maximum number of initially available arrows
      // without creating a cycle or adding a dependency on an earlier arrow.
      let initial=best.filter(p=>(!p.needsKey || !best.some(k=>k.id===p.needsKey)) && freeExit(p,best,stones));
      if(initial.length>diff.visibleGoal){
        const byIndex=new Map(best.map((p,i)=>[p.id,i]));
        const candidates=initial.slice().sort((a,b)=>byIndex.get(a.id)-byIndex.get(b.id));
        for(const p of candidates){
          if(initial.length<=diff.visibleGoal)break;
          const index=byIndex.get(p.id);
          if(index>=all-2)continue;
          const later=best.slice(index+1).filter(k=>k.id!==p.id);
          if(!later.length)continue;
          const keyPiece=later[Math.min(later.length-1,2+Math.floor(rand()*Math.min(5,later.length-1)))];
          p.needsKey=keyPiece.id;keyPiece.isKey=true;
          initial=initial.filter(a=>a.id!==p.id);
        }
      }
    }
    return {rocks:stones,pieces:best,level:n,difficulty:diff};
  }

  // Candy-style collectible tokens occupy FREE cells only, so they cannot block an
  // arrow exit or alter the level's guaranteed reverse-insertion solution.
  function createSpecialTiles(n, lvl){
    if(n<=5)return [];
    const rand=rngFor(n+45319), occupied=occupancy(lvl.pieces,lvl.rocks);
    const slots=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
      if(occupied.has(key(x,y)))continue;
      const adjacent=[[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([cx,cy])=>occupied.has(key(cx,cy))).length;
      const rowArrows=lvl.pieces.filter(p=>cells(p).some(([cx,cy])=>cy===y)).length;
      if(!adjacent || !rowArrows)continue;
      slots.push({x,y,score:adjacent*8 + (3-Math.abs(3-x))*0.2 + rand()});
    }
    slots.sort((a,b)=>b.score-a.score);
    const count=n<=10?1:n<=30?2:3, kinds=['bomb','lightning','spin','gift'];
    const result=[];
    for(const slot of slots){
      if(result.length>=count)break;
      if(result.some(p=>Math.abs(p.x-slot.x)+Math.abs(p.y-slot.y)<2))continue;
      result.push({id:'gem-'+result.length,x:slot.x,y:slot.y,type:kinds[(n-6+result.length)%kinds.length]});
    }
    return result;
  }
  function renderComboHud(){
    const tip=$('gameTip');if(!tip)return;
    let meter=$('comboHud');
    if(!meter){
      meter=document.createElement('div');meter.id='comboHud';
      meter.style.cssText='margin:5px auto 7px;padding:6px 10px;max-width:280px;border-radius:12px;text-align:center;font-weight:800;font-size:12px;background:linear-gradient(110deg,#542a81,#923bce);color:#fff;text-shadow:0 1px 2px #0006;box-shadow:0 3px 7px #0004;';
      tip.insertAdjacentElement('afterend',meter);
    }
    meter.hidden=currentLevel<=5;
    if(currentLevel>5)meter.textContent='🔥 KOMBO '+(comboStreak%5)+'/5 · 5 ok = +30 altın';
  }
  function specialStyle(){
    if($('okSpecialStyle'))return;
    const css=document.createElement('style');css.id='okSpecialStyle';
    css.textContent="\n      .power-gem{position:absolute;z-index:18;display:grid;place-items:center;min-width:0;min-height:0;padding:0;border:2px solid rgba(255,255,255,.85);border-radius:20%;color:white;font-size:clamp(15px,5vw,27px);line-height:1;background:linear-gradient(145deg,#ffe99b,#ff992e 56%,#b64a14);box-shadow:inset 1px 2px 5px #fff8,inset -3px -4px 5px #59260088,0 4px 0 #79391d,0 6px 10px #0006;text-shadow:0 2px 3px #0008;transform:scale(.78);transition:filter .14s,transform .14s;}\n      .power-gem[data-kind=\"bomb\"]{background:linear-gradient(145deg,#f6b1ff,#9745e8 60%,#4d1da0);}\n      .power-gem[data-kind=\"lightning\"]{background:linear-gradient(145deg,#f9ff8a,#f5ae07 55%,#a75c05);}\n      .power-gem[data-kind=\"spin\"]{background:linear-gradient(145deg,#bcffff,#238de0 55%,#13417f);}\n      .power-gem[data-kind=\"gift\"]{background:linear-gradient(145deg,#ffd8eb,#fa4d8c 60%,#a41352);}\n      .power-gem:active{transform:scale(.71);filter:brightness(1.22);}\n      .power-gem:focus-visible{outline:3px solid #fff;outline-offset:3px;}\n      .power-burst{position:absolute;z-index:20;pointer-events:none;width:19%;height:19%;display:grid;place-items:center;font-size:30px;text-shadow:0 2px 8px #000;animation:okBurst .5s ease-out both;}\n      @keyframes okBurst {from{opacity:1;transform:scale(.6)}to{opacity:0;transform:scale(2.2)}}\n      @media(prefers-reduced-motion:reduce){.power-gem,.power-burst{animation:none;transition:none}}\n    ";
    document.head.appendChild(css);
  }
  function snapshot(){return {pieces:pieces.map(p=>({...p})),removed,movesLeft,mistakesUsed,specialTiles:specialTiles.map(t=>({...t})),comboStreak};}
  function useSpecialTile(id){
    if(busy||screen!=='playing'||lostThisRun||!$('modal').hidden)return;
    const gem=specialTiles.find(t=>t.id===id);if(!gem)return;
    busy=true;if(gem.type!=='gift'){history.push(snapshot());if(history.length>9)history.shift();}
    specialTiles=specialTiles.filter(t=>t.id!==id);
    const crossed=(p)=>cells(p).some(([cx,cy])=>gem.type==='bomb'?Math.abs(cx-gem.x)<=1&&Math.abs(cy-gem.y)<=1:cy===gem.y);
    let victims=[];
    if(gem.type==='bomb'||gem.type==='lightning')victims=pieces.filter(crossed);
    if(gem.type==='spin'){
      const choices=pieces.filter(p=>!freeExit(p,pieces,levelData.rocks));
      const pool=choices.length?choices:pieces;
      if(pool.length)victims=[pool.reduce((best,p)=>Math.abs(p.x-gem.x)+Math.abs(p.y-gem.y)<Math.abs(best.x-gem.x)+Math.abs(best.y-gem.y)?p:best)];
    }
    if(victims.length){
      const ids=new Set(victims.map(p=>p.id));
      pieces=pieces.filter(p=>!ids.has(p.id));removed+=victims.length;
    }
    if(gem.type==='gift')save.coins+=45;
    const labels={bomb:'💣 Bomba patladı!',lightning:'⚡ Yıldırım geçti!',spin:'🔄 Bir ok kurtarıldı!',gift:'🎁 +45 altın!'};
    const targetX=gem.x,targetY=gem.y;
    playSound('coin');vibrate([20,25,45]);persist();busy=false;
    drawBoard();
    const fx=document.createElement('div');fx.className='power-burst';fx.textContent={bomb:'💥',lightning:'⚡',spin:'🌀',gift:'✨'}[gem.type];
    fx.style.left=(targetX/SIZE*100)+'%';fx.style.top=(targetY/SIZE*100)+'%';
    $('gameBoard').appendChild(fx);setTimeout(()=>fx.remove(),520);
    toast(labels[gem.type]);
    if(!pieces.length){completeLevel();return;}
    // These are rewards, not extra moves. They never remove rocks or
    // introduce new obstacles and cannot invalidate a solvable stage.
    $('progressTxt').textContent=`${removed}/${levelData.pieces.length}`;
  }
  function availableCount(lvl){const pp=lvl.pieces;return pp.filter(p=>(!p.needsKey||!pp.some(x=>x.id===p.needsKey))&&freeExit(p,pp,lvl.rocks)).length;}
  function startLevel(n){
    if(n>TOTAL_LEVELS){show('levels');return;}
    refreshLives();
    if(save.lives<=0){
      show('levels');
      modal('Canların Bitti',`<div class="life-big">❤️ 0/${MAX_LIVES}</div><p>Her 2 dakikada bir can yenilenir. Sonraki cana <strong id="lostRefill">${timeUntilHeart()}</strong> kaldı.</p><button class="btn medium green" id="watchRewardNoLives" style="width:100%;margin-bottom:10px">🎬 Reklam izle · +5 can</button><button class="btn medium blue" id="noLivesBack" style="width:100%">Bölümlere Dön</button>`,'no-lives');
      $('watchRewardNoLives').onclick=requestRewardedLives;
      $('noLivesBack').onclick=closeModal;
      updateLifeUI();return;
    }
    currentLevel=n;levelData=makeLevel(n);pieces=levelData.pieces.map(p=>({...p}));removed=0;specialTiles=createSpecialTiles(n,levelData);comboStreak=0;awardedCombos.clear();specialStyle();ensureDaily();
    movesLeft=pieces.length+levelData.difficulty.allowances;hintsUsed=0;mistakesUsed=0;hintId=-1;
    timeRemainingMs=initialTimeMs=secondsForLevel(n)*1000;timerLastAt=performance.now();lastTickSeconds=-1;lastBeepSecond=-1;revivesUsed=0;
    history=[];busy=false;lostThisRun=false;show('playing');$('gameTip').textContent=`${levelData.difficulty.name} • Önce birbirini engelleyen okları çöz!`;playSound();
  }
  function renderRock(x,y){return `<div class="grid-rock" style="left:${x/SIZE*100}%;top:${y/SIZE*100}%"><span></span></div>`}
  function drawBoard(){
    if(!levelData)return;
    $('currentLevelTitle').textContent=`Seviye ${currentLevel}`;
    if($('difficultyLabel'))$('difficultyLabel').textContent=`${levelData.difficulty.name} · ${levelData.pieces.length} ok`;
    $('progressTxt').textContent=`${removed}/${levelData.pieces.length}`;
    if($('difficultyLabel')){const closed=pieces.filter(p=>p.needsKey && pieces.some(q=>q.id===p.needsKey)).length; $('difficultyLabel').textContent=`${levelData.difficulty.name} · ${pieces.length} ok${closed?' · 🔒 '+closed:''}`;}
    $('movesTxt').textContent=String(movesLeft);
    drawTimer();updateLifeUI();updatePowerButtons();renderComboHud();
    $('undoBadge').textContent=String(save.undos);$('hintBadge').textContent=String(save.hints);
    $('undoBtn').disabled=save.undos<=0;
    $('hintBtn').disabled=save.hints<=0;
    const html=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)html.push(renderRock(x,y));
    for(const k of levelData.rocks){const [x,y]=k.split(',').map(Number);html.push(`<div class="grid-rock fixed" style="left:${x/SIZE*100}%;top:${y/SIZE*100}%"><span style="background:linear-gradient(#8b8482,#58514d);border-color:#68625d"></span></div>`)}
    for(const gem of specialTiles){const ico={bomb:'💣',lightning:'⚡',spin:'🔄',gift:'🎁'}[gem.type];html.push(`<button type="button" class="power-gem" data-gem="${gem.id}" data-kind="${gem.type}" style="left:${gem.x/SIZE*100}%;top:${gem.y/SIZE*100}%;width:${100/SIZE}%;height:${100/SIZE}%" aria-label="Özel güç ${gem.type}">${ico}</button>`);}
    for(const p of pieces){
      const horizontal=p.dir==='R'||p.dir==='L';
      html.push(`<button class="piece ${p.color} ${p.isKey?'key-piece':''} ${p.needsKey&&pieces.some(q=>q.id===p.needsKey)?'locked-piece':''} ${p.id===hintId?'hinted':''}" data-dir="${p.dir}" data-id="${p.id}" style="left:${p.x/SIZE*100}%;top:${p.y/SIZE*100}%;width:${(horizontal?p.length:1)/SIZE*100}%;height:${(horizontal?1:p.length)/SIZE*100}%;--tile-image:url('sprites/${p.color}-${p.length===1?'s':p.length===2?'l':'xl'}-${p.dir}.webp')" aria-label="${p.dir==='R'?'Sağa':p.dir==='L'?'Sola':p.dir==='U'?'Yukarı':'Aşağı'} giden ok"><span class="piece-inner">${p.isKey?'<span class="key-icon">🔑</span>':''}${p.needsKey&&pieces.some(q=>q.id===p.needsKey)?'<span class="lock-icon">🔒</span>':''}</span></button>`);
    }
    $('gameBoard').innerHTML=html.join('');
    $('gameBoard').querySelectorAll('.piece').forEach(el=>el.addEventListener('click',()=>tapPiece(Number(el.dataset.id),el)));
    $('gameBoard').querySelectorAll('.power-gem').forEach(el=>el.addEventListener('click',()=>useSpecialTile(el.dataset.gem)));
  }
  // Also catch blank/stone tile taps. Clicks on arrow buttons do NOT bubble
  // into a second penalty, because their target is inside .piece.
  $('gameBoard').addEventListener('click',event=>{
    if(event.target.closest('.piece') || !event.target.closest('.grid-rock'))return;
    if(busy || screen!=='playing' || movesLeft<=0 || !$('modal').hidden)return;
    playSound('bad');vibrate(30);
    penalizeMistake('Boş kareye dokundun!');
  });
  function penalizeMistake(reason='Bu okun çıkış yolu kapalı!'){
    // Wrong taps cost one move at EVERY level, including levels 1–5.
    // Keep the counter in sync with the visible HUD and never go negative.
    if(busy || screen!=='playing' || movesLeft<=0 || !$('modal').hidden)return;
    if(currentLevel<=5){toast('İlk 5 bölümde rahatça dene; önce yolu açık oku seç!');return;}
    comboStreak=0;renderComboHud();
    movesLeft=Math.max(0,movesLeft-1);mistakesUsed++;
    $('movesTxt').textContent=String(movesLeft);
    updateLifeUI();
    $('gameTip').textContent=reason+' −1 hamle';
    const counter=$('movesTxt');
    counter.classList.remove('mistake-pulse');void counter.offsetWidth;
    counter.classList.add('mistake-pulse');
    setTimeout(()=>counter.classList.remove('mistake-pulse'),430);
    if(movesLeft===0)failLevel('Hamle hakkın bitti!');
  }
  function tapPiece(id,element){
    if(busy)return;
    const p=pieces.find(p=>p.id===id);if(!p)return;
    if(p.needsKey&&pieces.some(q=>q.id===p.needsKey)){playSound('bad');vibrate(45);penalizeMistake('🔐 Önce anahtarlı oku çıkar!');element.classList.add('blocked');setTimeout(()=>element.classList.remove('blocked'),300);return;}
    if(!freeExit(p,pieces,levelData.rocks)){
      element.classList.add('blocked');setTimeout(()=>element.classList.remove('blocked'),310);
      playSound('bad');vibrate(35);penalizeMistake('Önce bu okun önündeki engeli kaldır!');return;
    }
    if(movesLeft<1)return;busy=true;playSound();vibrate(12);
    history.push(snapshot());
    if(history.length>9)history.shift();
    element.classList.add('escaping');
    setTimeout(()=>{
      pieces=pieces.filter(x=>x.id!==id);removed++;movesLeft=Math.max(0,movesLeft-1);hintId=-1;busy=false;
      save.totalArrows++;ensureDaily();save.dailyQuests.arrows++;
      if(currentLevel>=6){comboStreak++;if(comboStreak%5===0&&!awardedCombos.has(comboStreak)){awardedCombos.add(comboStreak);save.coins+=30;toast('🔥 5X KOMBO! +30 altın');playSound('coin');vibrate([15,25,45]);}}
      persist();
      if(pieces.length===0){completeLevel();return;}
      if(movesLeft===0){drawBoard();failLevel('Hamle hakkın bitti!');return;}
      $('gameTip').textContent='Harika! Yolu açık olan sonraki oku bul.';drawBoard();
    },275);
  }
  function undo(){if(busy||save.undos<=0)return;if(!history.length){toast('Geri alınacak hamle yok!');return;}const state=history.pop();pieces=state.pieces;removed=state.removed;movesLeft=state.movesLeft;mistakesUsed=state.mistakesUsed;if(state.specialTiles)specialTiles=state.specialTiles;if(Number.isFinite(state.comboStreak))comboStreak=state.comboStreak;save.undos--;persist();hintId=-1;drawBoard();toast('Son hamle geri alındı.');playSound('coin')}
  function hint(){if(busy||save.hints<=0)return;const valid=pieces.filter(p=>(!p.needsKey||!pieces.some(q=>q.id===p.needsKey))&&freeExit(p,pieces,levelData.rocks));if(!valid.length){toast('Açık ok bulunamadı. Yeniden dene.');return;}hintId=valid[valid.length-1].id;save.hints--;hintsUsed++;persist();drawBoard();toast('Parlayan oka dokun!');playSound('coin');setTimeout(()=>{if(screen==='playing'){hintId=-1;drawBoard();}},2500)}
  function failLevel(reason='Bölümü tamamlayamadın!'){
    // Exactly one life is lost per failed attempt, whichever action reached 0.
    if(lostThisRun || screen!=='playing' || pieces.length===0)return;
    lostThisRun=true;busy=true;
    consumeLife();playSound('bad');vibrate([60,55,100]);
    $('gameTip').textContent=reason;
    setTimeout(()=>{
      if(screen!=='playing')return;
      const retryDisabled=save.lives<=0;
      modal('Bölümü Geçemedin!',`<div class="loss-icon">💔</div><p>${reason} Okların tamamını çıkaramadın.</p><div class="loss-lives" id="lostLives">❤️ ${save.lives}/${MAX_LIVES}</div><p id="lostRefill">${save.lives===MAX_LIVES?'Canların dolu':'Sonraki can: '+timeUntilHeart()}</p>${save.powerRevive&&revivesUsed<1?`<button class="btn medium orange" id="reviveLevel" style="width:100%;margin-bottom:10px">💚 İkinci Şans (${save.powerRevive})</button>`:''}<button class="btn medium green" id="retryLevel" ${retryDisabled?'disabled':''} style="width:100%">↻ Yeniden Dene</button><button class="btn medium blue" id="lossLevels" style="width:100%;margin-top:10px">Bölümlere Dön</button>`,'lose');
      if($('reviveLevel'))$('reviveLevel').onclick=useRevive;
      $('retryLevel').onclick=()=>{if(save.lives<=0)return;closeModal();restart()};
      $('lossLevels').onclick=()=>{closeModal();show('levels')};
      updateLifeUI();
    },260);
  }

  const POWER_ITEMS=[
    {id:'powerMoves',icon:'👣',name:'+5 Hamle',desc:'Oynarken 5 ek hamle verir',cost:180},
    {id:'powerTime',icon:'⏱️',name:'+30 Saniye',desc:'Süreyi 30 saniye uzatır',cost:140},
    {id:'powerUnlock',icon:'🗝️',name:'Altın Anahtar',desc:'Bir kilitli oku açar',cost:240},
    {id:'powerAuto',icon:'⚡',name:'Otomatik Ok',desc:'Yolu açık bir oku hamle harcamadan çıkarır',cost:330},
    {id:'powerRevive',icon:'💚',name:'İkinci Şans',desc:'Bölüm kaybedildiğinde +5 hamle ve +30 saniye',cost:420},
  ];
  function updatePowerButtons(){
    const b=$('powersBtn');if(b)b.textContent=`⚡ Güçler  ·  👣${save.powerMoves}  ⏱${save.powerTime}  🗝${save.powerUnlock}  ✨${save.powerAuto}`;
  }
  function showPowers(){
    if(screen!=='playing'||lostThisRun)return;
    const rows=POWER_ITEMS.map(p=>`<div class="power-use-row"><span class="power-ico">${p.icon}</span><div><strong>${p.name}</strong><small>${p.desc}</small></div><button data-use-power="${p.id}" ${save[p.id]<=0?'disabled':''}>${save[p.id]>0?'Kullan · '+save[p.id]:'Yok'}</button></div>`).join('');
    modal('⚡ Ek Güçler',rows+`<button id="powerShopOpen" class="btn medium blue" style="width:100%;margin-top:12px">🏪 Mağazadan Al</button>`,'powers');
    $('powerShopOpen').onclick=()=>{closeModal();shopReturn='playing';selectedShopTab='boost';show('shop');};
    $('modalContent').querySelectorAll('[data-use-power]').forEach(btn=>btn.onclick=()=>usePower(btn.dataset.usePower));
  }
  function usePower(id){
    if(screen!=='playing'||save[id]<=0||lostThisRun)return false;
    if(id==='powerRevive'){toast('İkinci Şans, kaybedince kullanılabilir!');return false;}
    if(id==='powerUnlock'){
      const candidates=pieces.filter(p=>p.needsKey&&pieces.some(q=>q.id===p.needsKey));
      if(!candidates.length){toast('Tahtada kilitli ok yok!');return false;}
      candidates.sort((a,b)=>(freeExit(b,pieces,levelData.rocks)?1:0)-(freeExit(a,pieces,levelData.rocks)?1:0));
      candidates[0].needsKey=null;
    }
    if(id==='powerAuto'){
      const valid=pieces.filter(p=>(!p.needsKey||!pieces.some(q=>q.id===p.needsKey))&&freeExit(p,pieces,levelData.rocks));
      if(!valid.length){toast('Şimdilik çıkarılabilir ok yok!');return false;}
      const p=valid[0];pieces=pieces.filter(x=>x.id!==p.id);removed++;
      save.totalArrows++;ensureDaily();save.dailyQuests.arrows++;
    }
    if(id==='powerMoves')movesLeft+=5;
    if(id==='powerTime')addTime(30);
    save[id]--;persist();playSound('coin');vibrate(30);closeModal();drawBoard();
    if(id==='powerAuto'&&pieces.length===0)completeLevel();
    else toast('⚡ Güç uygulandı!');
    return true;
  }
  function useRevive(){
    if(modalType!=='lose'||save.powerRevive<=0||revivesUsed>=1)return false;
    save.powerRevive--;save.lives=Math.min(MAX_LIVES,save.lives+1);
    if(save.lives===MAX_LIVES)save.nextLifeAt=0;
    // Return the one life spent for this failed attempt; no second life cost.
    movesLeft=Math.max(movesLeft,5);timeRemainingMs=Math.max(timeRemainingMs,30000);
    initialTimeMs=Math.max(initialTimeMs,timeRemainingMs);revivesUsed++;
    lostThisRun=false;busy=false;persist();closeModal();timerLastAt=performance.now();
    drawBoard();toast('💚 İkinci şans! +5 hamle, +30 sn');playSound('coin');return true;
  }

  function restart(){if(!levelData)return;const n=currentLevel;startLevel(n);if(screen==='playing')toast('Bölüm yeniden başladı.')}
  function completeLevel(){
    playSound('win');const grade=hintsUsed===0&&mistakesUsed===0?3:(hintsUsed<=1&&mistakesUsed<=1)?2:1;const previous=save.completed[currentLevel]||0;
    if(grade>previous){save.stars+=(grade-previous);save.completed[currentLevel]=grade;}
    save.totalWins++;if(grade===3)save.perfectWins++;ensureDaily();save.dailyQuests.wins++;if(grade===3)save.dailyQuests.perfect++;
    if(currentLevel>=save.highest)save.highest=Math.min(TOTAL_LEVELS,currentLevel+1);
    const reward=previous?25:100;save.coins+=reward;save.undos=Math.max(save.undos,2);save.hints=Math.max(save.hints,2);
    levelData.reward=reward;levelData.grade=grade;persist();vibrate([25,35,40]);show('victory');
  }
  function renderVictory(){if(!levelData)return;
    $('victory').classList.remove('celebrating');void $('victory').offsetWidth;$('victory').classList.add('celebrating');
    $('continueBtn').disabled=true;$('replayBtn').disabled=true;
    setTimeout(()=>{if(screen==='victory'){$('continueBtn').disabled=false;$('replayBtn').disabled=false;}},2900);$('victoryLevel').innerHTML=`Seviye ${currentLevel}<br>Tamamlandı!`;$('rewardNumber').textContent=`🟡 +${levelData.reward||100}`;
    document.querySelectorAll('.big-stars span').forEach((el,i)=>{el.style.filter=i<levelData.grade?'':'grayscale(1) brightness(.6)'});
    const colors=['#ffdd2d','#ff509d','#04e8ca','#b76aff','#ffad25','#73ef47'];
    $('confetti').innerHTML=Array.from({length:35},(_,i)=>`<span style="left:${(i*73)%100}%;background:${colors[i%colors.length]};animation-duration:${3+(i%5)*.4}s;animation-delay:${-(i%7)*.7}s"></span>`).join('');
  }
  function modal(title,body,kind){timerLastAt=performance.now();modalType=kind;$('modalClose').textContent=(kind==='lose'?'Bölümlere Dön':'Kapat');$('modalTitle').textContent=title;$('modalContent').innerHTML=body;$('modal').hidden=false;playSound()}
  function closeModal(){$('modal').hidden=true;modalType='';timerLastAt=performance.now();}
  function openSettings(){modal('Ayarlar',`<div class="setting-line"><span>🔊 Ses efektleri</span><button id="soundToggle">${save.sound?'Açık':'Kapalı'}</button></div><div class="setting-line"><span>🎵 Fon müziği</span><button id="musicToggle">${save.music?'Açık':'Kapalı'}</button></div><div class="setting-line"><span>📳 Titreşim</span><button id="vibrateToggle">${save.vibrate?'Açık':'Kapalı'}</button></div><div class="setting-line"><span>🌍 Dil</span><span>Türkçe</span></div><p>Ok Kaçış · Sürüm 4.2<br>Çevrimdışı oynanır • ilerleme telefonda saklanır.</p>`,'settings');
    $('soundToggle').onclick=()=>{save.sound=!save.sound;persist();$('soundToggle').textContent=save.sound?'Açık':'Kapalı'};
    $('musicToggle').onclick=()=>{setMusic(!save.music);$('musicToggle').textContent=save.music?'Açık':'Kapalı'};
    $('vibrateToggle').onclick=()=>{save.vibrate=!save.vibrate;persist();$('vibrateToggle').textContent=save.vibrate?'Açık':'Kapalı'};
  }
  function openShop(){shopReturn=screen==='shop'?shopReturn:screen;selectedShopTab='skins';show('shop')}
  function buy(kind,cost,amount){if(save.coins<cost){toast('Yeterli altının yok!');playSound('bad');return false;}
    save.coins-=cost;save[kind]+=amount;persist();playSound('coin');updateHome();updatePowerButtons();toast('Satın alındı!');if(screen==='playing')drawBoard();if(screen==='shop')renderShop();return true}
  function renderShop(){
    $('shopWallet').textContent='🪙 '+save.coins;
    const categories=[['skins','✨ Ok Tasarımları'],['themes','🌄 Dünyalar'],['boost','⚡ Güçlendiriciler'],['premium','💳 Premium']];
    let html='<p class="shop-intro">Oynadıkça altın kazan, kendi maceranı tasarla!</p><div class="shop-tabs">'+categories.map(([v,t])=>`<button data-shop-tab="${v}" class="${selectedShopTab===v?'selected':''}">${t}</button>`).join('')+'</div><div class="shop-cards">';
    if(selectedShopTab==='skins')html+=SKINS.map(item=>{const owned=save.ownedSkins.includes(item.id),active=save.selectedSkin===item.id;return `<div class="shop-card"><span class="shop-card-icon skin-preview ${item.id}">${item.icon}</span><div class="shop-card-info"><strong>${item.name}</strong><small>${active?'Kullanılıyor':owned?'Satın alındı':'Özel parlak ok görünümü'}</small></div><button data-skin="${item.id}" class="shop-buy ${active?'equipped':''}">${active?'✓ Aktif':owned?'Kullan':'🪙 '+item.price}</button></div>`}).join('');
    if(selectedShopTab==='themes')html+=([{id:'auto',name:'🌈 Otomatik Dünya',emoji:'🌍'},...WORLDS]).map(item=>{const owned=save.ownedThemes.includes(item.id),active=save.selectedTheme===item.id;return `<div class="shop-card"><span class="shop-card-icon theme-preview ${item.id}">${item.emoji}</span><div class="shop-card-info"><strong>${item.name}</strong><small>${active?'Kullanılıyor':owned?'Satın alındı':'Yeni bir oyun dünyası'}</small></div><button data-theme="${item.id}" class="shop-buy ${active?'equipped':''}">${active?'✓ Aktif':owned?'Kullan':'🪙 '+THEME_PRICES[item.id]}</button></div>`}).join('');
    if(selectedShopTab==='boost'){
      html+=[['hints','💡','3 İpucu','Açık oku gösterir',150,3],['undos','↶','5 Geri Al','Son hamleni geri al',180,5],...POWER_ITEMS.map(p=>[p.id,p.icon,p.name,p.desc,p.cost,1])].map(([id,icon,name,desc,cost,count])=>`<div class="shop-card"><span class="shop-card-icon">${icon}</span><div class="shop-card-info"><strong>${name}</strong><small>${desc} · Stok: ${save[id]}</small></div><button data-boost="${id}" data-count="${count}" data-cost="${cost}" class="shop-buy">🪙 ${cost}</button></div>`).join('');
    }
    if(selectedShopTab==='premium'){
      const premium=[['🌟','Başlangıç Paketi','Önerilen ₺19,99 · 3 ipucu, 3 zaman gücü, 3 hamle gücü'],['💎','Süper Güç Paketi','Önerilen ₺29,99 · Gelişmiş güçler'],['👑','Premium Paket','Önerilen ₺49,99 · Özel ok ve tema'],['🚀','Büyük Güç Paketi','Önerilen ₺89,99 · Ek güç stoğu'],['🚫','Reklamsız Premium','Önerilen ₺59,99 · Reklamsız sürüm']];
      html+='<p class="shop-pending">🔒 Gerçek para ile satışlar bu test APK’sında etkin değil. Google Play Billing bağlantısı ve Play Console ürün onayı gerekiyor.</p>';
      html+=premium.map(([icon,name,desc])=>`<div class="shop-card premium-card"><span class="shop-card-icon">${icon}</span><div class="shop-card-info"><strong>${name}</strong><small>${desc}</small></div><button disabled class="shop-buy">Yakında</button></div>`).join('');
    }
    $('shopItems').innerHTML=html+'</div><p class="shop-footer">Altınlı güçler çalışır. Gerçek para ile satış için Google Play onayı gerekir; test sürümünde ödeme alınmaz.</p>';
    $('shopItems').querySelectorAll('[data-shop-tab]').forEach(b=>b.onclick=()=>{selectedShopTab=b.dataset.shopTab;renderShop()});
    $('shopItems').querySelectorAll('[data-boost]').forEach(b=>b.onclick=()=>buy(b.dataset.boost,Number(b.dataset.cost),Number(b.dataset.count)));
    $('shopItems').querySelectorAll('[data-skin]').forEach(b=>b.onclick=()=>{const id=b.dataset.skin,item=SKINS.find(x=>x.id===id);if(!save.ownedSkins.includes(id)){if(save.coins<item.price){toast('Yeterli altın yok!');return;}save.coins-=item.price;save.ownedSkins.push(id);}save.selectedSkin=id;persist();applyTheme();playSound('coin');renderShop()});
    $('shopItems').querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{const id=b.dataset.theme;if(!save.ownedThemes.includes(id)){const cost=THEME_PRICES[id];if(save.coins<cost){toast('Yeterli altın yok!');return;}save.coins-=cost;save.ownedThemes.push(id);}save.selectedTheme=id;persist();applyTheme();playSound('coin');renderShop()});
  }
  const QUESTS=[{id:'arrows',icon:'🎯',name:'15 oku çıkar',goal:15,prize:100},{id:'wins',icon:'🏆',name:'3 bölüm tamamla',goal:3,prize:160},{id:'perfect',icon:'⭐',name:'2 bölümde 3 yıldız kazan',goal:2,prize:220}];
  const ACHIEVEMENTS=[{id:'first5',name:'İlk Adımlar',desc:'5 bölüm tamamla',icon:'🥉',target:5,metric:'totalWins',prize:180},{id:'arrows50',name:'Ok Ustası',desc:'50 ok çıkar',icon:'🏹',target:50,metric:'totalArrows',prize:230},{id:'perfect20',name:'Kusursuz',desc:'20 bölümde 3 yıldız',icon:'🌟',target:20,metric:'perfectWins',prize:350},{id:'arrows300',name:'Efsane Nişancı',desc:'300 ok çıkar',icon:'💎',target:300,metric:'totalArrows',prize:750},{id:'wins100',name:'Macera Kralı',desc:'100 bölüm bitir',icon:'👑',target:100,metric:'totalWins',prize:1250}];
  function renderChallenges(){ensureDaily();$('challengeWallet').textContent='🪙 '+save.coins;
    let body='<p class="shop-intro">🎁 Görevler her gün yenilenir. Tamamla, ödülünü topla!</p><div class="shop-cards">';
    for(const q of QUESTS){const done=!!save.dailyQuests.claimed[q.id],val=Math.min(q.goal,save.dailyQuests[q.id]||0);body+=`<div class="mission-card"><div class="mission-row"><span class="mission-icon">${q.icon}</span><div><strong>${q.name}</strong><small>${val}/${q.goal} tamamlandı</small></div><button data-claim-quest="${q.id}" ${done||val<q.goal?'disabled':''}>${done?'✓ Alındı':`🪙 ${q.prize}`}</button></div><div class="progress-rail"><div style="width:${val/q.goal*100}%"></div></div></div>`}
    $('challengeItems').innerHTML=body+'</div><button class="btn medium green missions-play" id="questPlay">▶ Oynamaya devam et</button>';
    $('questPlay').onclick=()=>{page=Math.floor((save.highest-1)/12);show('levels')};
    $('challengeItems').querySelectorAll('[data-claim-quest]').forEach(btn=>btn.onclick=()=>{const q=QUESTS.find(x=>x.id===btn.dataset.claimQuest);if(!q||save.dailyQuests.claimed[q.id]||save.dailyQuests[q.id]<q.goal)return;save.dailyQuests.claimed[q.id]=true;save.coins+=q.prize;persist();playSound('coin');toast(`+${q.prize} altın!`);renderChallenges()});
  }
  function showAchievements(){let body='<div class="achievement-list">';
    for(const a of ACHIEVEMENTS){const value=Math.min(a.target,save[a.metric]||0),done=!!save.claimedAchievements[a.id];body+=`<div class="achievement-row"><span>${a.icon}</span><div><strong>${a.name}</strong><small>${a.desc} · ${value}/${a.target}</small></div><button data-ach="${a.id}" ${done||value<a.target?'disabled':''}>${done?'✓':'🪙 '+a.prize}</button></div>`}
    modal('🏆 Başarılar',body+'</div>','achievements');$('modalContent').querySelectorAll('[data-ach]').forEach(b=>b.onclick=()=>{const a=ACHIEVEMENTS.find(x=>x.id===b.dataset.ach);if(!a||save.claimedAchievements[a.id]||save[a.metric]<a.target)return;save.claimedAchievements[a.id]=true;save.coins+=a.prize;persist();playSound('coin');showAchievements()});
  }
  function openDaily(){const today=TODAY();const already=save.lastDaily===today;
    modal('Günlük Sandık',`<div class="daily-chest">🎁</div><p>${already?'Bugünkü hediyeni aldın. Yarın yeni bir sandık var!':'Günün sürprizi: 150 altın, bir ipucu ve yeni görevlere başlangıç!'}</p>${already?'':`<button class="btn medium green" id="claimDaily" style="width:100%;margin-top:10px">🎁 Hediyeyi Al</button>`}`,'daily');
    if(!already)$('claimDaily').onclick=()=>{save.coins+=150;save.hints++;save.lastDaily=today;persist();closeModal();playSound('coin');vibrate([20,30,35]);toast('🎁 +150 altın ve +1 ipucu!');updateHome()};
  }
  function pause(){if(screen!=='playing')return;modal('Duraklatıldı',`<p>Seviye ${currentLevel}<br>İlerlemen bu bölüm boyunca korunur.</p><button class="btn medium green" id="resumeGame" style="width:100%">▶ Devam Et</button><button class="btn medium orange" id="pauseRestart" style="width:100%;margin-top:14px">↻ Yeniden Başlat</button><button class="btn medium blue" id="pauseLevels" style="width:100%;margin-top:14px">Bölümler</button>`,'pause');$('resumeGame').onclick=closeModal;$('pauseRestart').onclick=()=>{closeModal();restart()};$('pauseLevels').onclick=()=>{closeModal();show('levels')}}
  function back(){if(!$('modal').hidden){if(modalType==='lose'){closeModal();show('levels')}else closeModal();return;}if(screen==='home')toast('Oynamak için Başla butonuna dokun!');else if(screen==='playing')pause();else if(screen==='victory')show('levels');else if(screen==='shop')show(shopReturn==='shop'?'home':shopReturn);else show('home')}
  window.gameBack=back;
  $('startBtn').onclick=()=>{page=Math.floor((save.highest-1)/12);show('levels')};
  document.querySelectorAll('[data-nav]').forEach(btn=>btn.onclick=()=>show(btn.dataset.nav));
  $('prevPage').onclick=()=>{page=Math.max(0,page-1);renderLevels()};
  $('nextPage').onclick=()=>{page=Math.min(Math.ceil(TOTAL_LEVELS/12)-1,page+1);renderLevels()};
  if($('openRewardLives'))$('openRewardLives').onclick=openRewardLives;
  $('pauseBtn').onclick=pause;$('gameSettings').onclick=openSettings;$('undoBtn').onclick=undo;$('hintBtn').onclick=hint;$('restartBtn').onclick=restart;
  $('victoryHome').onclick=()=>show('home');$('continueBtn').onclick=()=>transitionToLevel(Math.min(TOTAL_LEVELS,save.highest));$('replayBtn').onclick=()=>transitionToLevel(currentLevel);
  $('dailyBtn').onclick=openDaily;$('settingsBtn').onclick=openSettings;$('shopBtn').onclick=openShop;
  $('gameShop').onclick=openShop;$('shopBack').onclick=()=>show(shopReturn==='shop'?'home':shopReturn);
  $('missionsBtn').onclick=()=>show('challenges');$('achievementsBtn').onclick=showAchievements;
  $('modalClose').onclick=()=>{if(modalType==='lose'){closeModal();show('levels')}else closeModal();};
  $('resourcesLevels').addEventListener('click',e=>{if(e.target.closest('[data-open-shop]'))openShop()});
  $('musicToggleFloat').onclick=()=>setMusic(!save.music);
  $('powersBtn').onclick=showPowers;
  window.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Backspace'){e.preventDefault();back()}});
  // Diagnostic hook used only by offline browser tests.
  window.__okKacisTest={makeLevel,freeExit,occupancy,difficulty,availableCount,levels:TOTAL_LEVELS,getState:()=>({screen,currentLevel,mistakesUsed,movesLeft,timeRemainingMs,initialTimeMs,pieces:[...pieces],rocks:levelData?.rocks||[],save,lostThisRun,revivesUsed}),startLevel,show,refreshLives,consumeLife,updateLifeUI,failLevel,completeLevel,secondsForLevel,tickTimer,addTime,usePower,useRevive,showPowers,claimableQuests:()=>QUESTS.filter(q=>(save.dailyQuests[q.id]||0)>=q.goal&&!save.dailyQuests.claimed[q.id])};
  show('home');
  launchIntro();
})();
