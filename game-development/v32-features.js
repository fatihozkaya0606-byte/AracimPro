/* Ok Kaçış V32 – 6 integrated offline modes. Does NOT replace the V31 puzzle engine. */
(function(){
 'use strict';
 const B=window.__okKacisV32Bridge, E=window.OkKacisV32Engine;
 if(!B||!E)return;
 const $=id=>document.getElementById(id);
 const arrows={R:'➜',L:'⬅',U:'⬆',D:'⬇'};
 const state={view:'menu',session:null,editor:{pieces:[],rocks:[]},tickAt:0};
 const save=B.save;
 save.v32BossWins=(save.v32BossWins&&typeof save.v32BossWins==='object'&&!Array.isArray(save.v32BossWins))?save.v32BossWins:{};
 save.v32SpeedBest=Math.max(0,Math.floor(Number(save.v32SpeedBest)||0));
 save.v32Weekly=(save.v32Weekly&&typeof save.v32Weekly==='object')?save.v32Weekly:{};
 save.v32CustomLevels=Array.isArray(save.v32CustomLevels)?save.v32CustomLevels.slice(0,8).map(E.normaliseLevel).filter(Boolean):[];
 function view(name){
   state.view=name;
   for(const x of ['Menu','Play','Editor','Map'])$('v32'+x).hidden=(x.toLowerCase()!==name);
   $('v32Wallet').textContent='🪙 '+save.coins;
 }
 function hub(){
   state.session=null;
   B.show('v32');view('menu');renderMenu();
 }
 function renderMenu(){
   const completedTop=save.completed&&save.completed[540]?540:Math.max(0,save.highest-1);
   const unlocked=Math.floor(completedTop/10)*10;
   const sel=$('v32BossSelect');
   sel.innerHTML='';
   if(!unlocked){
     sel.innerHTML='<option value="0">Önce Seviye 10</option>';
   }else{
     for(let i=10;i<=unlocked;i+=10){
       const o=document.createElement('option');
       o.value=i;o.textContent='👑 Seviye '+i+(save.v32BossWins[i]?' ✓':'');
       if(i===unlocked)o.selected=true;
       sel.appendChild(o);
     }
   }
   $('v32BossStart').disabled=unlocked<10;
   $('v32SpeedBest').textContent='En iyi: '+save.v32SpeedBest+' puan';
   const week=E.weekChallengeLevel(new Date());
   const previous=save.v32Weekly.week===week.week?Number(save.v32Weekly.best)||0:0;
   $('v32WeekSummary').textContent='Hafta '+week.week+' · Rekor '+previous;
   $('v32Wallet').textContent='🪙 '+save.coins;
 }
 function levelFor(n){
   const raw=B.makeLevel(n);
   return {level:n,rocks:raw.rocks.slice(),pieces:raw.pieces.map(p=>({
     ...p,gates:(p.gates||[]).map(g=>({...g,requires:(g.requires||[]).slice()}))
   }))};
 }
 function customStage(editorLevel){
   return {level:0,rocks:editorLevel.rocks.slice(),pieces:editorLevel.pieces.map(p=>({...p}))};
 }
 function begin(mode,options={}){
   const today=E.weekChallengeLevel(new Date());
   const boss=mode==='boss'?Number(options.boss):0;
   if(mode==='boss' && (E.bossStages(boss).length!==3 || (boss>=save.highest&&!(boss===540&&save.completed&&save.completed[540])))){
     B.toast('Bu patron henüz açılmadı.');return;
   }
   let custom=null;
   if(mode==='custom'){
     custom=E.normaliseLevel(options.custom);
     if(!custom){B.toast('Önce çözülebilir bir bulmaca oluştur.');return;}
   }
   const stageNumbers=mode==='boss'?E.bossStages(boss):mode==='weekly'?[today.level]:mode==='speed'?[1]:[0];
   const totalMs=mode==='speed'?60000:mode==='weekly'?240000:mode==='boss'?480000:Infinity;
   state.session={
     mode,boss,week:today.week,custom,stageNumbers,stageIndex:0,
     score:0,cleared:0,mistakes:0,undoUsed:0,history:[],health:mode==='boss'?3:0,shield:mode==='boss'?3:0,
     remaining:totalMs,totalMs,done:false,stage:null,
     pieces:[],title:mode==='speed'?'⚡ 60 Saniye Kaçış':mode==='weekly'?'🏆 Haftalık Meydan Okuma':mode==='boss'?'👑 Patron '+boss:'🧩 Kendi Bulmacan'
   };
   B.show('v32');view('play');
   $('v32PlayMessage').textContent='Yolu açık olan doğru oku seç.';
   state.tickAt=performance.now();
   beginStage();
 }
 function beginStage(){
   const s=state.session;
   if(!s)return;
   const num=s.mode==='speed'?1+(s.cleared%10):s.stageNumbers[s.stageIndex];
   s.stage=s.mode==='custom'?customStage(s.custom):levelFor(num);
   s.pieces=s.stage.pieces.map(p=>({...p,gates:(p.gates||[]).map(g=>({...g}))}));
   s.history=[];
   drawBoard();
 }
 function drawBoard(){
   const s=state.session;if(!s)return;
   const parts=[];
   for(let y=0;y<9;y++)for(let x=0;x<9;x++)
     parts.push('<span class="v32-cell" style="left:'+(x/9*100)+'%;top:'+(y/9*100)+'%"></span>');
   for(const k of s.stage.rocks){
     const p=k.split(',').map(Number);
     parts.push('<span class="v32-rock" style="left:'+(p[0]/9*100)+'%;top:'+(p[1]/9*100)+'%"></span>');
   }
   for(const p of s.pieces){
     const horiz=p.dir==='R'||p.dir==='L',width=(horiz?p.length:1)/9*100,height=(horiz?1:p.length)/9*100;
     const open=s.mode==='custom'?E.canExit(p,s.pieces,s.stage.rocks):
       B.canRemoveArrow(p,s.pieces,s.stage,Date.now(),false);
     parts.push('<button type="button" tabindex="-1" class="v32-arrow-piece '+p.color+
       (open?'':' v32-locked')+'" data-id="'+p.id+'" style="left:'+(p.x/9*100)+'%;top:'+
       (p.y/9*100)+'%;width:'+width+'%;height:'+height+'%" aria-label="Ok '+p.id+'">'+arrows[p.dir]+'</button>');
   }
   $('v32Board').innerHTML=parts.join('');
   drawStats();
 }
 function drawStats(){
   const s=state.session;if(!s)return;
   $('v32PlayTitle').textContent=s.title+(s.mode==='boss'?' · Aşama '+(s.stageIndex+1)+'/3':'');
   $('v32PlayClock').textContent=Number.isFinite(s.remaining)?timeText(s.remaining):'∞';
   const count=s.stage?s.stage.pieces.length-s.pieces.length:0;
   $('v32PlayProgress').textContent=(s.mode==='speed'?'Tur '+(s.cleared+1)+' · ':'')+count+'/'+(s.stage?s.stage.pieces.length:0)+' ok';
   $('v32PlayPoints').textContent=s.score+' puan';
   const bossHud=$('v32BossHealth');
   if(bossHud){
     bossHud.hidden=s.mode!=='boss';
     if(s.mode==='boss'){
       bossHud.textContent='👑 PATRON · Kalkan: '+('🛡️'.repeat(s.shield))+
         ' · Hata hakkı: '+('❤️'.repeat(s.health))+('🖤'.repeat(3-s.health));
     }
   }
 }
 function timeText(ms){
   const seconds=Math.max(0,Math.ceil(ms/1000));
   return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 }
 function tap(col,row){
   const s=state.session;
   if(!s||s.done||state.view!=='play')return;
   const p=E.arrowAt(s.pieces,col,row);
   if(!p)return;
   const legal=s.mode==='custom'?E.canExit(p,s.pieces,s.stage.rocks):
     B.canRemoveArrow(p,s.pieces,s.stage,Date.now(),false);
   if(!legal){
     s.mistakes++;
     s.score=Math.max(0,s.score-5);
     if(s.mode==='boss'){
       s.health=Math.max(0,s.health-1);
       $('v32PlayMessage').textContent='⚔️ Patron saldırdı! '+s.health+' hata hakkın kaldı.';
       B.sound('bad');
       if(!s.health){finish(false);return;}
     } else {
       $('v32PlayMessage').textContent='🚫 Bu okun yolu kapalı. Önce engeli kaldır.';
       B.sound('bad');
     }
     drawStats();return;
   }
   s.history.push({pieces:s.pieces.map(q=>({...q})),score:s.score});
   if(s.history.length>8)s.history.shift();
   s.pieces=s.pieces.filter(q=>q.id!==p.id);
   s.score+=10;
   $('v32PlayMessage').textContent='✓ Doğru hamle! '+s.pieces.length+' ok kaldı.';
   B.sound('coin');
   if(!s.pieces.length){
     completeStage();
   }else drawBoard();
 }
 function completeStage(){
   const s=state.session;
   if(!s)return;
   s.cleared++;
   s.score+=35;
   if(s.mode==='boss')s.shield=Math.max(0,3-s.cleared);
   if(s.mode==='speed'){
     beginStage();
     $('v32PlayMessage').textContent='⚡ Yeni tur! Seri devam ediyor.';
   }else if(s.mode==='boss'&&s.stageIndex<2){
     s.stageIndex++;beginStage();
     $('v32PlayMessage').textContent='👑 Patronun sonraki aşamasına geçtin!';
   }else finish(true);
 }
 function finish(won){
   const s=state.session;if(!s||s.done)return;
   s.done=true;
   let message=s.title+' · '+s.score+' puan';
   if(s.mode==='speed'){
     const best=Math.max(save.v32SpeedBest,s.score);
     const record=best>save.v32SpeedBest;
     save.v32SpeedBest=best;
     message+=' · '+s.cleared+' tur'+(record?' · 🏅 Yeni rekor!':'');
   }
   if(s.mode==='weekly'){
     if(won){
       const previous=save.v32Weekly.week===s.week?(Number(save.v32Weekly.best)||0):0;
       const rewarded=save.v32Weekly.week===s.week&&!!save.v32Weekly.rewarded;
       const points=s.score+Math.floor(Math.max(0,s.remaining)/1000)*4;
       save.v32Weekly={week:s.week,best:Math.max(previous,points),rewarded:true};
       message='🏆 Haftalık bulmaca çözüldü · '+points+' puan'+(points>previous?' · Kişisel rekor!':'');
       if(!rewarded){B.addCoins(200);message+=' · +200 altın';}
     }else message='🏆 Süre bitti. Haftalık bulmacayı tekrar deneyebilirsin.';
   }
   if(s.mode==='boss'){
     if(won){
       const already=!!save.v32BossWins[s.boss];
       save.v32BossWins[s.boss]=true;
       if(!already){const reward=Math.min(1000,200+s.boss*2);B.addCoins(reward);message='👑 Patron yenildi! +'+reward+' altın';}
       else message='👑 Patron yeniden yenildi! Rekor: '+s.score;
     }else message='👑 Patron savunması geçilemedi. Yeniden deneyebilirsin.';
   }
   if(s.mode==='custom')message='🧩 Kendi bulmacan '+(won?'çözüldü!':'bitirilemedi.');
   B.persist();
   state.session=null;view('menu');renderMenu();
   $('v32Result').hidden=false;
   $('v32Result').textContent=message;
 }
 function tick(now){
   const s=state.session;
   if(!s||s.done||state.view!=='play'||document.hidden||$('modal').hidden===false||!Number.isFinite(s.remaining)){
     state.tickAt=now;return;
   }
   const delta=Math.max(0,Math.min(1000,now-(state.tickAt||now)));
   state.tickAt=now;
   s.remaining=Math.max(0,s.remaining-delta);
   $('v32PlayClock').textContent=timeText(s.remaining);
   if(s.remaining===0)finish(false);
 }
 function restart(){
   const s=state.session;if(!s)return;
   const opts={boss:s.boss,custom:s.custom};
   begin(s.mode,opts);
 }
 function undo(){
   const s=state.session;
   if(!s||!s.history.length){B.toast('Geri alınacak hamle yok.');return;}
   const previous=s.history.pop();
   s.pieces=previous.pieces;s.score=Math.max(0,previous.score-5);s.undoUsed++;
   drawBoard();$('v32PlayMessage').textContent='↶ Hamle geri alındı · -5 puan';
 }
 function renderEditor(){
   view('editor');
   const e=state.editor,grid=$('v32EditorBoard'),busy=E.occupy(e.pieces,e.rocks);
   const content=[];
   for(let y=0;y<9;y++)for(let x=0;x<9;x++){
     const k=x+','+y,p=E.arrowAt(e.pieces,x,y),rock=e.rocks.includes(k);
     const icon=rock?'■':p?arrows[p.dir]:'';
     const color=rock?'rock':p?p.color:'empty';
     content.push('<button type="button" data-editor-cell="'+k+'" class="v32-editor-cell '+color+'" aria-label="Hücre '+x+','+y+'">'+icon+'</button>');
   }
   grid.innerHTML=content.join('');
   $('v32EditorInfo').textContent='Ok: '+e.pieces.length+'/12 · Taş: '+e.rocks.length+'/14';
   renderSaved();
 }
 function editCell(x,y){
   if(!E.validEditorCoord(x,y))return;
   const e=state.editor,hit=E.arrowAt(e.pieces,x,y),k=x+','+y;
   if(hit){e.pieces=e.pieces.filter(p=>p.id!==hit.id);renderEditor();return;}
   if(e.rocks.includes(k)){e.rocks=e.rocks.filter(v=>v!==k);renderEditor();return;}
   if($('v32EditKind').value==='rock'){
     if(e.rocks.length>=14){B.toast('En fazla 14 taş');return;}
     e.rocks.push(k);renderEditor();return;
   }
   if(e.pieces.length>=12){B.toast('En fazla 12 ok');return;}
   const p={id:e.pieces.reduce((m,v)=>Math.max(m,v.id),0)+1,x,y,
     length:Number($('v32EditLen').value),dir:$('v32EditDir').value,color:$('v32EditColor').value};
   if(!E.canPlace(p,e.pieces,e.rocks)){B.toast('Ok bu konuma sığmıyor.');return;}
   e.pieces.push(p);renderEditor();
 }
 function checkEditor(){
   const result=E.validateLevel(state.editor.pieces,state.editor.rocks);
   $('v32EditorInfo').textContent=(result.ok?'✅ ':'⚠️ ')+result.reason;
   return result.ok;
 }
 function saveEditor(){
   if(!checkEditor())return;
   if(save.v32CustomLevels.length>=8){B.toast('En fazla 8 kayıt; birini sil.');return;}
   const lvl=E.normaliseLevel(state.editor);
   if(!lvl)return;
   save.v32CustomLevels.push(lvl);B.persist();renderSaved();
   $('v32EditorInfo').textContent='✅ Kendi bölümün kaydedildi!';
 }
 function renderSaved(){
   const list=$('v32SavedLevels');
   list.innerHTML='<strong>Kaydedilen Bulmacalar ('+save.v32CustomLevels.length+'/8)</strong>'+
      save.v32CustomLevels.map((q,i)=>'<div class="v32-saved-item"><span>🧩 Bölümüm '+(i+1)+' · '+q.pieces.length+' ok</span>'+
       '<button data-custom-play="'+i+'">Oyna</button><button data-custom-delete="'+i+'">Sil</button></div>').join('');
 }
 function renderMap(){
   view('map');
   const highest=Math.max(1,save.highest);
   $('v32MapStops').innerHTML=E.mapIslands().map((item,i)=>{
     const unlocked=item.start<=highest;
     const endCompleted=Math.max(0,Math.min(item.end,highest-1)-item.start+1);
     return '<button type="button" class="v32-map-node '+(unlocked?'':'locked')+
       '" data-map-start="'+item.start+'" '+(unlocked?'':'disabled')+'>'+
       '<span class="v32-map-icon">'+(unlocked?item.icon:'🔒')+'</span>'+
       '<span><strong>'+item.number+'. '+item.name+'</strong><small>Seviye '+item.start+'–'+item.end+
       ' · '+endCompleted+'/20 geçildi</small></span><span>›</span></button>';
   }).join('');
 }
 function showEditor(){B.show('v32');renderEditor();}
 function showMap(){B.show('v32');renderMap();}
 // V32.1: Campaign-level visibility, not a hidden menu-only feature.
 function completedBossTop(){
   const last=save.completed&&save.completed[540]?540:Math.max(0,Math.min(540,Number(save.highest||1)-1));
   return Math.floor(last/10)*10;
 }
 function onCampaignLevels(){
   const top=completedBossTop(),button=$('v32LevelBoss');
   if(!button)return;
   button.hidden=false;
   button.classList.toggle('v32-boss-ready',top>=10);
   button.textContent=top>=10?
     '👑 PATRON '+top+' HAZIR! ⚔️ OYNA  · Sonraki: '+Math.min(540,top+10):
     '👑 İLK PATRON: SEVİYE 10’U TAMAMLA';
   button.onclick=()=>top>=10?begin('boss',{boss:top}):B.toast('10. bölüm tamamlanınca ilk patron açılacak.');
 }
 function onCampaignStart(n){
   const bossLevel=n%10===0&&n>=10;
   const panel=$('v32StageBoss'),playing=$('playing');
   playing.classList.toggle('v32-boss-stage',bossLevel);
   panel.hidden=!bossLevel;
   if(!bossLevel)return;
   const open=n<save.highest||(n===540&&save.completed&&save.completed[540]);
   panel.textContent=open?'👑 PATRON '+n+' · ⚔️ ARENAYA GİR':'👑 PATRON KAPISI · '+n+'. BÖLÜMÜ BİTİR';
   panel.onclick=()=>open?begin('boss',{boss:n}):
     B.toast('👑 Bu bölümü tamamlayınca üç aşamalı patron mücadelesi açılır!');
   const tip=$('gameTip');
   if(tip && !open)tip.textContent='👑 Patron kapısı! Bu seviyeyi tamamla; üç aşamalı mücadele açılsın.';
 }
 function onCampaignVictory(n){
   const bossLevel=n>=10&&n%10===0,btn=$('v32VictoryBoss');
   if(!btn)return;
   btn.hidden=!bossLevel;
   if(!bossLevel)return;
   btn.textContent='👑 SEVİYE '+n+' PATRONU AÇILDI · ⚔️ MÜCADELE';
   btn.onclick=()=>begin('boss',{boss:n});
 }
 $('v32LevelBoss').onclick=onCampaignLevels;
 $('v32StageBoss').onclick=()=>B.toast('Patron kapısı her 10. seviyede açılır.');
 $('v32VictoryBoss').onclick=hub;
 window.__okKacisV32Live={onCampaignLevels,onCampaignStart,onCampaignVictory,openBoss:(n)=>begin('boss',{boss:n}),hub,completedBossTop};

 function onTouch(event){
   if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
   event.preventDefault();
   const r=$('v32Board').getBoundingClientRect();
   if(!r.width||!r.height)return;
   const x=Math.floor((event.clientX-r.left)/r.width*9);
   const y=Math.floor((event.clientY-r.top)/r.height*9);
   if(E.validEditorCoord(x,y))tap(x,y);
 }
 $('v32HubOpen').onclick=hub;
 $('v32Back').onclick=()=>{
   if(state.view==='menu'){state.session=null;B.show('home');}
   else hub();
 };
 $('v32BossStart').onclick=()=>begin('boss',{boss:Number($('v32BossSelect').value)});
 $('v32SpeedStart').onclick=()=>begin('speed');
 $('v32WeekStart').onclick=()=>begin('weekly');
 $('v32EditorOpen').onclick=showEditor;
 $('v32MapOpen').onclick=showMap;
 $('v32SkinsOpen').onclick=()=>{state.session=null;B.openShopSkins();};
 $('v32Exit').onclick=hub;
 $('v32Restart').onclick=restart;
 $('v32Play').querySelector('.v32-play-controls').insertAdjacentHTML('afterbegin','<button type="button" id="v32Undo">↶ Geri Al (-5)</button>');
 $('v32Undo').onclick=undo;
 $('v32TouchLayer').addEventListener('pointerdown',onTouch,{passive:false});
 $('v32Board').addEventListener('click',event=>{
   if(event.detail!==0)return; // keyboard only; no synthetic touch double move
   const p=event.target.closest('[data-id]');
   if(!p||!state.session)return;
   const arrow=state.session.pieces.find(v=>v.id===Number(p.dataset.id));
   if(arrow)tap(arrow.x,arrow.y);
 });
 $('v32EditorBoard').addEventListener('click',ev=>{
   const cell=ev.target.closest('[data-editor-cell]');if(!cell)return;
   const parts=cell.dataset.editorCell.split(',').map(Number);editCell(parts[0],parts[1]);
 });
 $('v32EditorCheck').onclick=checkEditor;
 $('v32EditorSave').onclick=saveEditor;
 $('v32EditorTest').onclick=()=>{
   if(!checkEditor())return;
   begin('custom',{custom:E.normaliseLevel(state.editor)});
 };
 $('v32EditorClear').onclick=()=>{state.editor={pieces:[],rocks:[]};renderEditor();};
 $('v32SavedLevels').addEventListener('click',event=>{
   const play=event.target.closest('[data-custom-play]'),del=event.target.closest('[data-custom-delete]');
   if(play){const lvl=save.v32CustomLevels[Number(play.dataset.customPlay)];if(lvl)begin('custom',{custom:lvl});}
   if(del){save.v32CustomLevels.splice(Number(del.dataset.customDelete),1);B.persist();renderEditor();}
 });
 $('v32MapStops').addEventListener('click',event=>{
   const node=event.target.closest('[data-map-start]');
   if(!node||node.disabled)return;
   state.session=null;B.openLevelPage(Number(node.dataset.mapStart));
 });
 setInterval(()=>tick(performance.now()),100);
 window.__okKacisV32Test={hub,begin,editCell,checkEditor,saveEditor,renderMap,
   getState:()=>({view:state.view,mode:state.session?.mode||null,score:state.session?.score||0,
   remaining:state.session?.remaining||0,pieces:state.session?.pieces.length||0})};
})();
