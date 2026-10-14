
/* R8 Plus Clean v95 — preserves v92 navigation tabs, AdMob, vehicle data and theme */
(function(){
'use strict';
const baseHome=homeView, baseParkModal=parkedSpotModal;
const ap95StorageKey=KEY;
function ap95MonthCosts(){
  const d=new Date();const ym=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  const amount=(arr,key)=>vf(arr||[]).reduce((sum,r)=>{
    const date=String(r.dateDone||r.date||'');return date.startsWith(ym)?sum+(Number(r[key]??r.cost??0)||0):sum;
  },0);
  return amount(state.fuel,'cost')+amount(state.maintenance,'cost')+amount(state.expenses,'cost')+amount(state.services,'total');
}
function ap95Next(){
  const a=upcoming();if(!a.length)return 'Kayıt yok';
  const x=a[0],dt=x.days,km=x.km;
  if(Number.isFinite(dt)&&dt<99999 && (dt<=30 || !(Number.isFinite(km)&&km<999999)))return dt<0?'Gecikti':dt+' gün';
  if(Number.isFinite(km)&&km<999999)return num(Math.max(0,Math.round(km)))+' km';
  return 'Planlandı';
}
function ap95Reminders(){
  const r=state.prefs.driverReminders||{},result=[];
  [['inspection','Muayene'],['insurance','Sigorta']].forEach(([key,title])=>{
    const d=daysToDate(r[key]);
    if(d!==null&&Number.isFinite(d))result.push({name:title,detail:d<0?Math.abs(d)+' gün gecikti':d+' gün kaldı',time:d});
  });
  upcoming().slice(0,2).forEach(x=>{
    const d=Number.isFinite(x.days)&&x.days<99999?x.days:null;
    const k=Number.isFinite(x.km)&&x.km<999999?x.km:null;
    result.push({name:x.name||'Bakım',detail:d!==null?(d<0?Math.abs(d)+' gün gecikti':d+' gün kaldı'):k!==null?num(Math.max(0,Math.round(k)))+' km kaldı':'Planlandı',time:d===null?9999:d});
  });
  return result.sort((a,b)=>a.time-b.time).slice(0,2);
}
function ap95Hero(v){
  const photo=typeof v.photo==='string'&&v.photo.trim()!==''?v.photo.trim():'';
  const name=[v.year,v.make,v.model].filter(Boolean).join(' ');
  const desc=[v.engine,v.fuel,v.transmission].filter(Boolean).join(' • ');
  // The user-provided or separately selected actual car photo is used unmodified.
  return '<section class="ref791-hero">'+
   '<div class="ap95Hero" onpointermove="ap95Tilt(event)" onpointerleave="ap95UnTilt(this)">'+
     '<div class="ap95PhotoStage">'+
      (photo?'<img class="ap95HeroPhoto" src="'+esc(photo)+'" alt="'+esc(name)+'" loading="eager" decoding="async">':
       '<div class="ap95PhotoEmpty">🚙<small>Aracının orijinal fotoğrafını ekle</small><button onclick="openVehicle(\''+esc(v.id)+'\')">Fotoğraf Seç</button></div>')+
      '<span class="ap95PhotoBadge">ARACIM PRO • R8 PLUS</span>'+
      (photo?'<button class="ap96PhotoChange" onclick="openVehicle(\''+esc(v.id)+'\')">📷 Fotoğrafı Değiştir</button>':'')+
     '</div>'+
     '<div class="ap95HeroInfo">'+
       '<div class="ap95HeroTop"><span class="ap95HeroStatus">● Aktif Araç</span>'+(v.plate?'<span class="ap95HeroPlate">'+esc(v.plate)+'</span>':'')+'</div>'+
       '<h1>'+esc(name)+'</h1><div class="ap95HeroSpec">'+esc(desc)+'</div>'+
       '<div class="ap95HeroBottom"><b>'+num(v.km||0)+' km</b><button onclick="go(\'garage\')">Aracımı Gör ›</button></div>'+
     '</div>'+
   '</div></section>';
}
function ap95Metrics(){
  const h=vehicleHealthScore(),avg=avgConsumption(),cost=ap95MonthCosts();
  const rows=[
   ['💚','Araç Sağlığı',h.score+'/100','vehicleHealthModal()'],
   ['🔧','Sonraki Bakım',ap95Next(),"go('plan')"],
   ['⛽','Yakıt Ort.',avg>0?avg.toFixed(1)+' L/100 km':'Kayıt yok',"go('records');recordsTab='fuel';render()"],
   ['💳','Bu Ay Masraf',money(cost),"go('reports')"]
  ];
  return '<div class="ap95Metrics">'+rows.map(r=>
   '<button class="ap95Metric" onclick="'+r[3]+'"><span class="ap95Ico">'+r[0]+'</span><small>'+r[1]+'</small><b>'+esc(r[2])+'</b></button>'
  ).join('')+'</div>';
}
function ap95Shortcuts(){
  return '<div class="ap95ActionHeading"><b>⚡ Hızlı İşlemler</b><span>Bir dokunuşla</span></div>'+
   '<div class="ap95Actions">'+
    '<button onclick="openMaintenance()"><i>🛠️</i>Bakım Ekle</button>'+
    '<button onclick="openFuel()"><i>⛽</i>Yakıt Ekle</button>'+
    '<button onclick="parkedSpotModal()"><i>📍</i>Park Yerim</button>'+
    '<button onclick="ap95ShareVehicleCard()"><i>✨</i>Araç Kartımı Paylaş</button>'+
   '</div>'+
   '<div class="ap95ActionNote">Orijinal araç fotoğrafın ve kayıtların kullanılır. Gerçek araç fotoğrafına görüntü filtresi uygulanmaz.</div>';
}
function ap95ReminderHtml(){
 const a=ap95Reminders();
 return '<section class="ap95Reminder"><h2>🔔 Yaklaşan Hatırlatmalar</h2>'+
 (a.length?a.map(x=>'<div class="ap95ReminderRow"><b>'+esc(x.name)+'</b><span>'+esc(x.detail)+'</span></div>').join(''):'<div style="font-size:11px;color:#b8cfe2">Henüz tarih eklenmedi. Muayene, sigorta ve bakım tarihlerini kaydet.</div>')+
 '<button onclick="driverReminderModal()">Hatırlatmaları Düzenle ›</button></section>';
}
homeView=function(){
 const v=activeVehicle();if(!v)return baseHome();
 const raw=baseHome();
 if(!raw.includes('<section class="ref791-hero">'))return raw;
 return raw.replace(/<section class="ref791-hero">[\s\S]*?<\/section>/,ap95Hero(v)+ap95Shortcuts()+ap95ReminderHtml()+'<details class="ap96Stats"><summary>📊 Araç Özeti • Sağlık, tüketim ve masraflar</summary>'+ap95Metrics()+'</details>');
};
window.ap95Tilt=function(ev){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  if(ev.pointerType==='touch')return;
  const e=ev.currentTarget,rc=e.getBoundingClientRect();
  if(!rc.width||!rc.height)return;
  const x=(ev.clientX-rc.left)/rc.width-.5,y=(ev.clientY-rc.top)/rc.height-.5;
  e.style.setProperty('--aprx',(-y*1.9).toFixed(2)+'deg');
  e.style.setProperty('--apry',(x*2.4).toFixed(2)+'deg');
};
window.ap95UnTilt=function(e){e.style.setProperty('--aprx','0deg');e.style.setProperty('--apry','0deg')};
parkedSpotModal=function(){
 baseParkModal();
 const p=state.prefs.parkedSpot||null,root=document.querySelector('#modalRoot .proPanel');
 if(!root)return;
 const div=document.createElement('div');div.className='field';div.style.marginTop='10px';
 div.innerHTML='<label style="display:block;font-size:12px;margin-bottom:5px">Park yeri notu (kat, blok vb.)</label>'+
  '<input maxlength="120" id="ap95ParkNote" placeholder="Örn: B2 kat, kırmızı kolon" value="'+esc(p?.note||'')+'" style="width:100%;padding:12px;border:1px solid #3a80a9;border-radius:12px"/>'+
  '<button class="secondary wide" style="margin-top:8px" onclick="ap95SaveParkNote()">Notu Kaydet</button>';
 root.appendChild(div);
};
window.ap95SaveParkNote=function(){
 const p=state.prefs.parkedSpot;if(!p)return toast('Önce park konumunu kaydet.');
 p.note=String(document.getElementById('ap95ParkNote')?.value||'').slice(0,120);
 localStorage.setItem(ap95StorageKey,JSON.stringify(state));toast('Park notu kaydedildi');
};
window.ap95CardImage='';
window.ap95ShareVehicleCard=function(){
 const v=activeVehicle();if(!v)return toast('Önce aracını ekle');
 modal('Aracımın Paylaşım Kartı','<div class="ap95ShareBox"><img id="ap95SharePreview" class="ap95SharePreview" alt="Aracının paylaşılabilir görseli"/>'+
  '<div class="ap95ShareNote" id="ap95ShareStatus">Aracına özel 1080 × 1350 paylaşım kartı hazırlanıyor… Plaka ve VIN paylaşılmaz.</div>'+
  '<div class="ap95ShareControls"><button onclick="ap95SaveCard()">⬇ Resmi Kaydet</button><button onclick="ap95ShareCard()">↗ Paylaş</button></div></div>');
 setTimeout(()=>ap95GenerateCard(),60);
};
window.ap95GenerateCard=async function(){
 const v=activeVehicle();if(!v)return;
 const c=document.createElement('canvas');c.width=1080;c.height=1350;const x=c.getContext('2d');
 const bg=x.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,'#031323');bg.addColorStop(.48,'#0d3863');bg.addColorStop(1,'#020f1e');x.fillStyle=bg;x.fillRect(0,0,1080,1350);
 x.fillStyle='#174b78';x.beginPath();x.ellipse(700,640,520,240,-.2,0,Math.PI*2);x.fill();
 // Original image remains sharp: contain fit, no blur/filter or invented model.
 const photo=v.photo;
 if(photo){try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=photo});const box={x:35,y:215,w:1010,h:610};const scale=Math.min(box.w/img.width,box.h/img.height),w=img.width*scale,h=img.height*scale;x.drawImage(img,box.x+(box.w-w)/2,box.y+(box.h-h)/2,w,h)}catch(e){x.font='120px sans-serif';x.fillStyle='#b2dfff';x.textAlign='center';x.fillText('🚗',540,530);x.textAlign='start'}}
 else {x.font='160px sans-serif';x.textAlign='center';x.fillText('🚗',540,540);x.textAlign='start'}
 x.fillStyle='#07182e';x.fillRect(0,815,1080,535);x.fillStyle='#43bdff';x.font='bold 42px sans-serif';x.fillText('ARACIM PRO',55,91);
 x.fillStyle='#dbf2ff';x.font='30px sans-serif';x.fillText('BENİM ARACIM',55,151);
 const name=[v.year,v.make,v.model].filter(Boolean).join(' ');
 x.fillStyle='#fff';x.font='bold 51px sans-serif';
 let label=name;while(x.measureText(label).width>950&&label.length>6)label=label.slice(0,-1);
 if(label!==name)label+='…';x.fillText(label,55,913);
 const specs=[v.engine,v.fuel,v.transmission].filter(Boolean).join(' • ');
 x.fillStyle='#a9d6f5';x.font='29px sans-serif';x.fillText(specs.slice(0,62),55,979);
 x.fillStyle='#32dcac';x.font='bold 33px sans-serif';x.fillText(num(v.km||0)+' km',55,1062);
 x.strokeStyle='#21689e';x.lineWidth=2;x.beginPath();x.moveTo(55,1100);x.lineTo(1025,1100);x.stroke();
 x.font='27px sans-serif';x.fillStyle='#c5e1f9';x.fillText('Araç bilgilerini Aracım Pro ile yönetiyorum.',55,1165);
 x.fillStyle='#6bcaff';x.font='bold 32px sans-serif';x.fillText('Aracım Pro • Google Play',55,1240);
 try{window.ap95CardImage=c.toDataURL('image/png');const el=document.getElementById('ap95SharePreview');if(el)el.src=window.ap95CardImage;const status=document.getElementById('ap95ShareStatus');if(status)status.textContent='Görsel hazır. Plaka ve şasi numarası gösterilmez.'}
 catch(e){const status=document.getElementById('ap95ShareStatus');if(status)status.textContent='Görsel oluşturulamadı. Kendi fotoğrafını seçip tekrar dene.'}
};
window.ap95SaveCard=function(){if(!window.ap95CardImage)return toast('Görsel henüz hazır değil');try{Android.savePngImage('AracimPro_AracKarti.png',window.ap95CardImage)}catch(e){toast('Resim kaydetme bu sürümde kullanılamıyor')}};
window.ap95ShareCard=function(){if(!window.ap95CardImage)return toast('Görsel henüz hazır değil');try{Android.sharePngImage(window.ap95CardImage)}catch(e){toast('Görsel paylaşımı bu sürümde kullanılamıyor')}};
render();
})();
