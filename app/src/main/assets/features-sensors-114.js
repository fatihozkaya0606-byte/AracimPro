/* V114 voice conversations, optional location-based trip score & HUD,
   user-triggered sound recording, and vehicle damage map with optional local photo. */
(function(){
'use strict';
let voiceEnabled114=false;
const baseAiModal114=faultGuideModal;
faultGuideModal=function(){
 baseAiModal114();
 const header=document.querySelector('#modalRoot .aiIntro')||document.querySelector('.aiIntro');
 if(header&&!document.getElementById('ap114VoiceTools')){
  header.insertAdjacentHTML('beforeend','<div id="ap114VoiceTools" class="ap114VoiceControls">'+
   '<button type="button" onclick="arasVoiceListen114()">🎙 Sesli soru sor</button>'+
   '<button id="ap114VoiceMode" type="button" onclick="arasVoiceToggle114()">'+(voiceEnabled114?'🔊 Sesli yanıt açık':'🔈 Sesli yanıt kapalı')+'</button>'+
   '<button type="button" onclick="Android.arasStopSpeak()">■ Durdur</button></div>');
 }
};
window.arasVoiceListen114=function(){
 if(typeof Android==='undefined'||typeof Android.arasListen!=='function')
    return toast('Telefonda konuşma tanıma kullanılamıyor');
 toast('Aras dinleme ekranı açılıyor…');
 try{Android.arasListen()}catch(e){toast('Konuşma tanıma açılamadı')}
};
window.arasVoiceToggle114=function(){
 voiceEnabled114=!voiceEnabled114;
 const node=document.getElementById('ap114VoiceMode');
 if(node)node.textContent=voiceEnabled114?'🔊 Sesli yanıt açık':'🔈 Sesli yanıt kapalı';
 if(!voiceEnabled114){try{Android.arasStopSpeak()}catch(e){}}
};
window.onArasVoiceRecognized=function(q,error){
 if(error||!q){toast(error||'Konuşma algılanamadı');return}
 if(!document.getElementById('faultChat'))faultGuideModal();
 setTimeout(()=>faultGuideRun(String(q).slice(0,500)),150);
};
const baseAiFinish114=faultGuideFinish;
faultGuideFinish=function(id,answer,error){
 const pending=document.getElementById('faultPending'),question=pending?.getAttribute('data-question')||'';
 baseAiFinish114(id,answer,error);
 if(voiceEnabled114){
  let response=(!error&&String(answer||'').trim())?String(answer).trim():'';
  if(!response){
    const friendly=aracimOfflineSmallTalk(question);
    if(friendly)response=friendly;
    else{
      const a=aracimOfflineContextResult(question);
      response=a.title+'. '+a.causes.slice(0,2).join('. ')+'. '+a.checks[0];
    }
  }
  try{Android.arasSpeak(response.slice(0,850))}catch(e){}
 }
};
window.engineSound114=function(){
 modal('🎙 Motor Sesini Kaydet','<div class="ap114Page"><div class="ap114Hero">'+
 '<b>Motorun sesini sakla ve paylaş</b><p>Telefonun ses kayıt uygulamasını açacağız. Motorun çalışması güvenli ise araç dururken kısa kayıt alabilirsin. Ses kaydından otomatik arıza teşhisi yapılmaz.</p></div>'+
 '<div class="ap114Panel"><b>İpuçları</b><ul><li>Telefonu egzozdan ve hareketli kayışlardan uzak tut.</li>'+
 '<li>Sesin hangi koşulda çıktığını ayrıca not al.</li><li>Kayıt cihazın ses kayıt uygulamasında tutulur.</li></ul></div>'+
 '<button class="primary wide" onclick="Android.recordEngineSound()">● Ses kaydını başlat</button>'+
 '<button class="secondary wide" onclick="Android.shareEngineSound()">↗ Son motor sesini paylaş</button>'+
 '<div class="ap114Panel" id="ap114SoundStatus">Yeni kayıt henüz yok. Desteklenen bir ses kayıt uygulaması gerekir.</div></div>');
};
window.onEngineSoundRecorded=function(ok,detail){
 const el=document.getElementById('ap114SoundStatus');
 if(el)el.textContent=String(detail||'Ses kayıt sonucu bilinmiyor');
 toast(detail|| (ok?'Ses kaydı hazır':'Kayıt iptal edildi'));
};
/* GPS updates are delivered by the existing native location listener.
   No score is reported until a minimum amount of usable location samples exists. */
let drive114=null,hud114=false,hudMirror114=false;
const oldSpeed114=window.onSpeedUpdate;
function gps114(kmh,accuracy){
 const k=Number(kmh),acc=Number(accuracy);
 if(!Number.isFinite(k)||k<0||k>300||!Number.isFinite(acc)||acc<0)return;
 const good=acc<=35,now=Date.now();
 const label=document.getElementById('ap114GpsSpeed');
 if(label){label.textContent=good?String(Math.round(k)):'—';const s=document.getElementById('ap114GpsState');
   if(s)s.textContent=good?'GPS hız verisi • yaklaşık ±'+Math.round(acc)+' m':'GPS doğruluğu düşük';}
 if(drive114&&good){
   if(drive114.last){
     const dt=(now-drive114.last.ts)/1000;
     if(dt>=0.7&&dt<=15){
       const delta=(k-drive114.last.kmh)/3.6/dt;
       if(delta>3.1)drive114.accelerations++;
       if(delta< -3.5)drive114.brakings++;
       drive114.distance+=((drive114.last.kmh+k)/2)/3600*dt;
       drive114.samples++;
     }
   }
   drive114.last={kmh:k,ts:now};drive114.top=Math.max(k,drive114.top);
   const e=document.getElementById('ap114DriveStats');
   if(e)e.textContent=drive114.samples+' geçerli örnek · '+drive114.accelerations+
        ' ani hızlanma · '+drive114.brakings+' ani yavaşlama';
 }
}
window.onSpeedUpdate=function(kmh,accuracy,lat,lon){
 if(typeof oldSpeed114==='function')oldSpeed114(kmh,accuracy,lat,lon);
 if(drive114||hud114)gps114(kmh,accuracy);
};
window.hud114=function(){
 hud114=true;
 modal('🌌 HUD Gece Göstergesi','<div class="ap114HudPage"><div class="ap114HudHero">'+
 '<div class="ap114HudCaption">GPS • YAKLAŞIK HIZ</div>'+
 '<div id="ap114HudProjection" class="ap114HudDigits"><strong id="ap114GpsSpeed">—</strong><span>km/sa</span></div>'+
 '<small id="ap114GpsState">GPS verisi bekleniyor…</small></div>'+
 '<div class="ap114Panel"><b>Güvenlik</b><p>Gösterge GPS hızını yaklaşık gösterir; aracın hız göstergesinin yerine geçmez. Telefon görüş alanını kapatmayacak biçimde sabitlenmelidir.</p></div>'+
 '<button class="secondary wide" onclick="hudMirrorToggle114()">↔ Cam yansıması için aynala</button>'+
 '<button class="primary wide" onclick="hudStop114()">HUD’u Kapat ve GPS Takibini Durdur</button></div>');
 try{Android.startSpeedTracking()}catch(e){toast('GPS izni veya konum servisi gerekli')}
};
window.hudMirrorToggle114=function(){
 hudMirror114=!hudMirror114;
 const node=document.getElementById('ap114HudProjection');
 if(node)node.style.transform=hudMirror114?'scaleX(-1)':'none';
};
window.hudStop114=function(){hud114=false;if(!drive114)try{Android.stopSpeedTracking()}catch(e){};closeModal()};
window.driveScore114=function(){
 const v=activeVehicle();if(!v){requireVehicle('Sürüş Puanı');return}
 const running=drive114&&drive114.vehicleId===v.id;
 const prior=(state.prefs.ap114ScoreSessions||[]).filter(x=>x.vehicleId===v.id).slice(-6).reverse();
 modal('🎯 Sürüş Analizi','<div class="ap114Page"><div class="ap114Hero"><b>GPS sürüş özeti</b>'+
 '<p>İzin vererek başlat. Hız değişimlerini kabaca hesaplar. Trafik koşullarını, trafik kurallarını veya gerçek sürüş güvenliğini değerlendiremez.</p></div>'+
 (running?'<div class="ap114Panel"><b id="ap114DriveStats">GPS aranıyor…</b>'+
 '<p>Analiz açık. Geçerli GPS verisi birikmeden puan oluşturulmaz.</p></div>'+
 '<button class="primary wide" onclick="driveStop114()">Analizi bitir ve özetle</button>':
 '<button class="primary wide" onclick="driveStart114()">GPS ile sürüşü başlat</button>')+
 '<div class="ap114Panel"><b>Geçmiş ölçümler</b>'+
 (prior.length?prior.map(x=>'<div class="ap114Split"><span>'+esc(x.date)+' • '+x.samples+' örnek</span><b>'+
 x.score+'/100</b></div>').join(''):'<p>Henüz GPS verisiyle tamamlanmış ölçüm yok.</p>')+
 '</div><small>Bu kişisel deneysel puan araç veya sürücü güvenlik skoru değildir.</small></div>');
};
window.driveStart114=function(){
 const v=activeVehicle();if(!v)return;
 drive114={vehicleId:v.id,started:Date.now(),last:null,top:0,brakings:0,accelerations:0,samples:0,distance:0};
 driveScore114();
 try{Android.startSpeedTracking()}catch(e){toast('GPS izni verilmeli')}
};
window.driveStop114=function(){
 const a=drive114;if(!a)return;
 drive114=null;
 if(!hud114)try{Android.stopSpeedTracking()}catch(e){}
 if(a.samples<6)return toast('Yeterli ve doğru GPS örneği alınmadı; puan kaydedilmedi');
 const score=Math.max(0,Math.min(100,Math.round(100-a.brakings*4-a.accelerations*3)));
 const list=state.prefs.ap114ScoreSessions||[];
 list.push({id:uid(),vehicleId:a.vehicleId,date:today(),samples:a.samples,
   score,brakings:a.brakings,accelerations:a.accelerations,approxKm:+a.distance.toFixed(2),top:+a.top.toFixed(1)});
 state.prefs.ap114ScoreSessions=list.slice(-75);save();driveScore114();
 toast('Deneysel GPS sürüş özeti kaydedildi: '+score+'/100');
};
const closeBase114=closeModal;
closeModal=function(){
 if(hud114||drive114){
   const running=!!drive114,wasHud=hud114;
   hud114=false;drive114=null;
   if(running||wasHud)try{Android.stopSpeedTracking()}catch(e){}
 }
 closeBase114();
};
/* Optional photos: resized locally before storage, bounded by per-device quota. */
const DAMAGE_PIECES114=[
 ['Ön tampon',18,76],['Kaput',34,32],['Tavan',52,16],['Bagaj',78,28],
 ['Sol ön kapı',44,53],['Sol arka kapı',65,53],['Sağ ön kapı',44,71],['Sağ arka kapı',65,71],
 ['Arka tampon',90,79],['Sol çamurluk',26,55],['Sağ çamurluk',78,63]
];
let selectedPiece114='',photoUri114='';
function damageEntries114(){
 const v=activeVehicle();return (state.prefs.ap114Damage||[]).filter(x=>v&&x.vehicleId===v.id);
}
window.damageMap114=function(piece){
 if(!owner114())return;
 selectedPiece114=piece||selectedPiece114||DAMAGE_PIECES114[0][0];
 const entries=damageEntries114(),found=entries.filter(x=>x.part===selectedPiece114).sort((a,b)=>b.date.localeCompare(a.date));
 const imgKey='ap114_photo_'+activeVehicle().id+'_'+selectedPiece114;
 let hasPhoto=false;try{hasPhoto=!!localStorage.getItem(imgKey)}catch(e){}
 modal('🛠 Araç Hasar Haritası','<div class="ap114Page"><div class="ap114Hero"><b>Aracının parça geçmişini tut</b>'+
 '<p>Bu şematik harita resmî ekspertiz raporu değildir. Parçaya dokunup boya, çizik veya onarım kaydı ekle.</p></div>'+
 '<div class="ap114DamageMap"><img src="r8ui/service.jpg" alt="Araç servis fotoğrafı">'+
 DAMAGE_PIECES114.map(([name,x,y])=>'<button style="left:'+x+'%;top:'+y+'%" onclick="damageMap114(\''+name+'\')" class="'+(name===selectedPiece114?'active':'')+'" aria-label="'+esc(name)+'">●</button>').join('')+
 '</div><label class="ap114Label">Araç bölümü<select onchange="damageMap114(this.value)">'+
 DAMAGE_PIECES114.map(([name])=>'<option '+(name===selectedPiece114?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>'+
 '<form class="ap114Panel" onsubmit="damageSave114(event)"><b>'+esc(selectedPiece114)+' • Yeni kayıt</b>'+
 '<label>Durum<select name="status"><option>Çizik</option><option>Boyalı</option><option>Değişen</option>'+
 '<option>Göçük</option><option>Onarım</option><option>Hasarsız</option></select></label>'+
 '<label>Tarih<input type="date" name="date" required value="'+today()+'"></label>'+
 '<label>Açıklama<textarea name="note" maxlength="220" placeholder="İşlem ayrıntısı (isteğe bağlı)"></textarea></label>'+
 '<button class="primary wide" type="submit">Hasar kaydını sakla</button></form>'+
 '<button class="secondary wide" onclick="damagePhoto114()">📷 Bu bölümün fotoğrafını ekle</button>'+
 (hasPhoto?'<div class="ap114Panel"><img class="ap114DamagePhoto" src="'+
 esc(localStorage.getItem(imgKey))+'" alt="Kaydedilmiş parça fotoğrafı"></div>':'')+
 '<div class="ap114Panel"><b>'+esc(selectedPiece114)+' geçmişi</b>'+
 (found.length?found.map(x=>'<div class="ap114Split"><span>'+esc(x.date)+' • '+esc(x.status)+
 '</span><small>'+esc(x.note||'')+'</small></div>').join(''):'<p>Bu bölüm için kayıt yok.</p>')+'</div></div>');
};
window.damageSave114=function(e){
 e.preventDefault();const v=activeVehicle();if(!v)return;
 const f=new FormData(e.target),status=String(f.get('status')||'').slice(0,35),
 note=String(f.get('note')||'').slice(0,220),date=String(f.get('date')||'');
 if(!/^\d{4}-\d\d-\d\d$/.test(date))return toast('Tarih geçersiz');
 const a=state.prefs.ap114Damage||[];a.push({id:uid(),vehicleId:v.id,part:selectedPiece114,status,note,date});
 state.prefs.ap114Damage=a.slice(-90);save();damageMap114(selectedPiece114);
};
window.damagePhoto114=function(){
 if(!selectedPiece114||!activeVehicle())return;
 try{Android.captureImage('damage114')}catch(e){toast('Kamera açılamadı')}
};
const prevPicked114=window.onNativeImagePicked;
window.onNativeImagePicked=function(context,data){
 if(context!=='damage114'){
  if(typeof prevPicked114==='function')prevPicked114(context,data);
  return;
 }
 if(!selectedPiece114||!activeVehicle()||!String(data||'').startsWith('data:image/')){
   toast('Fotoğraf okunamadı');return;
 }
 const key='ap114_photo_'+activeVehicle().id+'_'+selectedPiece114;
 const img=new Image();
 img.onload=()=>{
  try{
   const scale=Math.min(1,600/Math.max(img.width,img.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
   c.getContext('2d').drawImage(img,0,0,c.width,c.height);
   const compressed=c.toDataURL('image/jpeg',.57);
   if(compressed.length>150000)throw Error('photo-limit');
   localStorage.setItem(key,compressed);
   toast('Parça fotoğrafı cihazda saklandı');damageMap114(selectedPiece114);
  }catch(e){toast('Fotoğraf saklanamadı; daha küçük bir fotoğraf dene')}
 };
 img.onerror=()=>toast('Fotoğraf açılamadı');
 img.src=data;
};
})();
