/* Aracım Pro v97 / Neon Dashboard. Preview-only, data-driven R8 home. */
(function(){
'use strict';
const previousHome = homeView;
const previousHeader = header;
function safeText(value){return esc(String(value == null ? '' : value));}
function pct(n){return Math.max(0,Math.min(100,Number(n)||0));}
function n97Button(iconName,label,call,tone,sub){
  return '<button type="button" class="n97Action '+tone+'" onclick="'+call+'">'+
    '<span class="n97ActionIcon">'+ico(iconName)+'</span>'+
    '<strong>'+safeText(label)+'</strong>'+
    '<small>'+safeText(sub||'')+'</small></button>';
}
function n97Stats(){
  const health=vehicleHealthScore(), fuel=fuelRangeData(), next=upcoming()[0];
  const h=pct(health.score), range=Number(fuel.range)||0;
  let nextValue='Kayıt yok',nextInfo='Hatırlatma ekle';
  if(next){
    if(Number.isFinite(next.days)&&next.days<99999&&(next.days<=30||!Number.isFinite(next.km)||next.km>=999999)){
      nextValue=next.days<0?'Gecikti':next.days+' gün';
    }else if(Number.isFinite(next.km)&&next.km<999999){
      nextValue=num(Math.max(0,Math.round(next.km)))+' km';
    }else nextValue='Planlandı';
    nextInfo=next.name||'Bakım kaydı';
  }
  return '<div class="n97Stats">'+
    '<button class="n97Stat health" onclick="vehicleHealthModal()">'+
      '<span class="n97StatLabel">♥ Araç Sağlığı</span><strong>'+h+'<small>/100</small></strong>'+
      '<span class="n97Gauge"><i style="width:'+h+'%"></i></span>'+
      '<span class="n97StatDetail">'+safeText(health.notes?.[0]||'Araç kayıtlarına göre')+'</span></button>'+
    '<button class="n97Stat range" onclick="fuelRangeModal()">'+
      '<span class="n97StatLabel">⛽ Yakıt / Menzil</span>'+
      '<strong>'+(fuel.pct?num(Math.round(range))+' <small>km</small>':'—')+'</strong>'+
      '<span class="n97Gauge"><i style="width:'+pct(fuel.pct)+'%"></i></span>'+
      '<span class="n97StatDetail">'+(fuel.pct?('%'+Math.round(pct(fuel.pct))+' depo • tahmini'):'Menzili ayarla')+'</span></button>'+
    '<button class="n97Stat maintenance" onclick="go(\'plan\')">'+
      '<span class="n97StatLabel">🔧 Sonraki Bakım</span>'+
      '<strong class="n97NextValue">'+safeText(nextValue)+'</strong>'+
      '<span class="n97StatDetail">'+safeText(nextInfo)+'</span>'+
      '<span class="n97NextLink">Bakım planı ›</span></button>'+
    '</div>';
}
function n97Hero(v){
  const title=[v.year,v.make,v.model].filter(Boolean).join(' ')||'Aracım';
  const subtitle=[v.engine,v.fuel,v.transmission].filter(Boolean).join(' • ');
  const photo=typeof v.photo==='string'?v.photo.trim():'';
  return '<section class="n97Hero">'+
    '<div class="n97HeroShine" aria-hidden="true"></div>'+
    '<div class="n97HeroCopy">'+
      '<span class="n97Active"><i></i> Aktif Araç</span>'+
      '<h1>'+safeText(title)+'</h1>'+
      '<p>'+safeText(subtitle)+'</p>'+
      '<div class="n97Specs">'+
        '<div><span>'+ico('road')+'</span><b>'+num(v.km||0)+' km</b><small>Güncel kilometre</small></div>'+
        '<div><span>'+ico('settings')+'</span><b>'+safeText(v.transmission||'Belirtilmedi')+'</b><small>Vites</small></div>'+
        '<div><span>'+ico('fuel')+'</span><b>'+safeText(v.fuel||'Belirtilmedi')+'</b><small>Yakıt türü</small></div>'+
      '</div>'+
      '<button class="n97Details" onclick="go(\'garage\')">Araç Detayları <span>→</span></button>'+
    '</div>'+
    '<div class="n97Photo">'+(photo?'<img src="'+safeText(photo)+'" alt="'+safeText(title)+'" decoding="async" loading="eager">':
      '<div class="n97NoPhoto">'+ico('car')+'<small>Fotoğraf ekle</small></div>')+'</div>'+
    '<button class="n97EditPhoto" onclick="openVehicle(\''+safeText(v.id)+'\')" aria-label="Araç fotoğrafını seç">📷 Fotoğraf</button>'+
    '</section>';
}
function n97Reminders(){
  const rows=[],rem=state.prefs.driverReminders||{};
  [['inspection','Muayene'],['insurance','Sigorta']].forEach(([key,label])=>{
    const day=daysToDate(rem[key]);
    if(day!==null && Number.isFinite(day))rows.push({
      name:label,days:day,detail:day<0?Math.abs(day)+' gün gecikti':day+' gün kaldı'
    });
  });
  upcoming().forEach(u=>{
    const days=Number.isFinite(u.days)&&u.days<99999?u.days:999999;
    const km=Number.isFinite(u.km)&&u.km<999999?u.km:null;
    rows.push({name:u.name||'Bakım',days:days,detail:days!==999999?
      (days<0?Math.abs(days)+' gün gecikti':days+' gün kaldı'):
      (km!==null?num(Math.max(0,Math.round(km)))+' km kaldı':'Planlandı')});
  });
  rows.sort((a,b)=>a.days-b.days);
  const top=rows.slice(0,2);
  return '<section class="n97Section n97Reminders">'+
    '<div class="n97SectionTitle"><strong>🔔 Yaklaşan Hatırlatmalar</strong>'+
    '<button onclick="driverReminderModal()">Tümünü Gör →</button></div>'+
    (top.length?top.map((x,i)=>'<button class="n97ReminderRow" onclick="driverReminderModal()">'+
      '<span class="n97ReminderIcon">'+(i?'📋':'🛢️')+'</span>'+
      '<span><b>'+safeText(x.name)+'</b><small>'+safeText(x.detail)+'</small></span>'+
      '<em>›</em></button>').join(''):
      '<div class="n97EmptyRem">Henüz bakım veya resmi işlem tarihi eklenmedi.'+
      '<button onclick="driverReminderModal()">Hatırlatma Ekle ›</button></div>')+'</section>';
}
function n97Report(){
  const months=monthlyData(6),max=Math.max(1,...months.map(x=>Number(x.total)||0));
  const monthTotal=months.at(-1)?.total||0,all=totals();
  return '<section class="n97Section n97Report">'+
    '<div class="n97SectionTitle"><strong>'+ico('chart')+' Aylık Giderlerim</strong>'+
      '<button onclick="go(\'reports\')">Tüm Masraflar →</button></div>'+
    '<div class="n97ReportBody"><div class="n97ReportSummary">'+
      '<strong>'+money(monthTotal)+'</strong><small>Bu ay toplam gider</small>'+
      '<div class="n97Legend">'+
        '<span><i class="fuel"></i> Yakıt <b>'+money(all.fuel)+'</b></span>'+
        '<span><i class="service"></i> Bakım <b>'+money(all.maint+all.service)+'</b></span>'+
        '<span><i class="other"></i> Diğer <b>'+money(all.exp)+'</b></span>'+
      '</div></div>'+
      '<div class="n97Chart" role="img" aria-label="Son altı ay için kaydedilen giderler">'+
        months.map((m,i)=>{
          const n=Number(m.total)||0,height=n>0?Math.max(9,Math.round(n/max*100)):3;
          return '<div class="n97ChartColumn" title="'+safeText(m.label+' '+money(n))+'">'+
            '<div class="n97ChartTrack"><span class="'+(i===5?'last':'')+'" style="height:'+height+'%"></span></div>'+
            '<small>'+safeText(m.label)+'</small></div>';
        }).join('')+
      '</div></div>'+
    '<p class="n97ReportFoot">Yalnızca kaydettiğin gerçek araç giderleri gösterilir.</p></section>';
}
function n97Actions(){
 return '<div class="n97Actions">'+
   n97Button('wrench','Bakım Ekle','openMaintenance()','blue','Bakım kaydı')+
   n97Button('fuel','Yakıt Ekle','openFuel()','red','Yakıt kaydı')+
   n97Button('road','Park Yerim','parkedSpotModal()','green','Konum kaydet')+
   n97Button('expense','Gider Ekle','openExpense()','purple','Masraf kaydı')+
   n97Button('car','Araç Kartım','ap95ShareVehicleCard()','teal','Paylaş')+
   n97Button('menu','Tüm İşlemler',"go('more')",'gray','Daha fazla')+
   '</div>';
}
homeView=function(){
  const v=activeVehicle();
  if(!v)return previousHome();
  setTimeout(ensureRef791VehiclePhoto,140);
  return '<div class="n97Dashboard">'+
    n97Hero(v)+n97Stats()+n97Actions()+
    '<div class="n97AdArea">'+apMrecCardHtml()+'</div>'+ 
    n97Reminders()+n97Report()+
    '</div>';
};
header=function(){
  const old=previousHeader();
  return old.replace('<span class="apLiveMini active"><b id="apActiveUsers">—</b> aktif</span>',
    '<span class="apLiveMini active" title="Firebase: son 2 dakikada etkin cihazlar">'+
    '<b id="apActiveUsers" aria-live="polite">—</b> aktif <small>son 2 dk</small></span>');
};
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible') {
    try{apRefreshPresence();}catch(e){}
  }
});
render();
})();