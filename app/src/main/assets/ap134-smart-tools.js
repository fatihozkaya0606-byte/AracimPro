/* Aracim Pro V134 — additive features; R8 dashboard, AdMob and Premium untouched. */
(function(){
'use strict';
if(window.ap134Ready)return;
window.ap134Ready=true;
function e(v){return esc(v===undefined||v===null?'':v)}
function dateReminderRow(title,date){
 var data=reminderState(date);
 return '<div class="statusRow"><span>'+e(title)+'</span><span class="statusTag '+e(data.cls)+'">'+e(data.txt)+'</span></div>';
}
var reminderFields=[
 ['inspection','Muayene'],['insurance','Trafik sigortası'],
 ['casco','Kasko'],['mtv','MTV / Vergi'],['tire','Lastik değişimi']
];
window.driverReminderModal=function(){
 var r=state.prefs.driverReminders||{};
 var rows=reminderFields.map(function(x){return dateReminderRow(x[1],r[x[0]])}).join('');
 var inputs=reminderFields.map(function(x){
   return '<div class="field"><label>'+e(x[1])+' tarihi</label><input type="date" name="'+x[0]+'" value="'+e(r[x[0]]||'')+'"></div>';
 }).join('');
 modal('Araç Hatırlatıcıları',
  '<div class="proPanel ap134-panel"><div class="proPanelTitle"><i>'+ico('bell')+'</i><div><b>Resmî İşlem Takvimi</b><span>Yaklaşan tarihleri takip et</span></div></div><div class="statusList">'+rows+'</div></div>'+
  '<form class="form" style="margin-top:10px" onsubmit="saveDriverReminders(event)"><div class="ap134-two">'+inputs+'</div>'+
  '<div class="hint">30, 15, 7 ve 1 gün öncesine yönelik bildirim planlanır. Bildirim izni gereklidir.</div>'+
  '<button class="primary wide">Hatırlatıcıları Kaydet</button></form>');
};
window.saveDriverReminders=function(ev){
 ev.preventDefault();
 var form=new FormData(ev.target),r={};
 reminderFields.forEach(function(x){r[x[0]]=String(form.get(x[0])||'')});
 state.prefs.driverReminders=r;
 try{Android.requestNotificationPermission()}catch(err){}
 reminderFields.forEach(function(x){
   try{
     if(r[x[0]])Android.scheduleMaintenanceReminder('driver_'+x[0],x[1]+' tarihi',r[x[0]]);
     else Android.cancelMaintenanceReminder('driver_'+x[0]);
   }catch(err){}
 });
 closeModal();save();toast('Resmî işlem tarihleri kaydedildi');
};
function plannerPresets(){
 return Object.keys(maintPresets).filter(function(n){return Number(maintPresets[n][0])>0});
}
window.ap134MaintenancePlanner=function(){
 var v=activeVehicle();
 if(!v){toast('Önce araç ekle');return}
 var opts=plannerPresets().map(function(name){return '<option value="'+e(name)+'">'+e(name)+'</option>'}).join('');
 modal('Akıllı Bakım Cetveli',
  '<div class="notice">Bakım aralıkları genel tahmindir. Son yapılan işlemin kilometresini ve üretici önerisini esas al.</div>'+
  '<form class="form ap134-form" onsubmit="ap134SaveMaintenancePlan(event)">'+
  '<div class="field"><label>Bakım işlemi</label><select id="ap134Work" name="work" onchange="ap134UpdatePlanner()" required>'+opts+'</select></div>'+
  '<div class="ap134-two">'+
  '<div class="field"><label>Son yapıldığı KM</label><input id="ap134LastKm" name="lastKm" type="number" min="0" value="'+e(v.km||0)+'" oninput="ap134UpdatePlanner()" required></div>'+
  '<div class="field"><label>Değişim aralığı (KM)</label><input id="ap134Interval" name="interval" type="number" min="1000" max="250000" value="10000" oninput="ap134UpdatePlanner()" required></div></div>'+
  '<div class="field"><label>İsteğe bağlı son tarih</label><input type="date" name="dueDate"></div>'+
  '<div class="ap134-calc" id="ap134Result" role="status"></div>'+
  '<button class="primary wide">Bakım Planına Ekle</button></form>');
 ap134UpdatePlanner();
};
window.ap134UpdatePlanner=function(){
 var name=document.getElementById('ap134Work');
 var n=document.getElementById('ap134LastKm');
 var it=document.getElementById('ap134Interval');
 var el=document.getElementById('ap134Result');
 if(!name||!n||!it||!el)return;
 if(window._ap134LastWork!==name.value){
   var preset=maintPresets[name.value]||[10000];
   it.value=Math.max(1000,Number(preset[0])||10000);
   window._ap134LastWork=name.value;
 }
 var last=Number(n.value), interval=Number(it.value),v=activeVehicle();
 var due=last+interval,remain=due-(Number(v&&v.km)||0);
 el.innerHTML=Number.isFinite(due)&&last>=0&&interval>=1000
   ?'<strong>Hedef: '+num(due)+' km</strong><span>'+(remain>=0?num(remain)+' km sonra':'Tahmini hedef '+num(Math.abs(remain))+' km geçmiş')+'</span>'
   :'<strong>Geçerli kilometre bilgisi gir</strong>';
};
window.ap134SaveMaintenancePlan=function(ev){
 ev.preventDefault();
 var v=activeVehicle();if(!v){toast('Önce araç ekle');return}
 var f=new FormData(ev.target),last=Number(f.get('lastKm')),interval=Number(f.get('interval'));
 var name=String(f.get('work')||''),dueDate=String(f.get('dueDate')||'');
 if(!Number.isFinite(last)||last<0||!Number.isFinite(interval)||interval<1000||interval>250000||!maintPresets[name]){
   toast('Bakım kilometresi ve aralığını kontrol et');return;
 }
 var record={id:uid(),vehicleId:v.id,name:name,dueKm:last+interval,dueDate:dueDate,
 cost:0,dateDone:'',completed:false,note:'Akıllı bakım tahmini. Son işlem: '+num(last)+' km; aralık: '+num(interval)+' km. Üretici bakım kitapçığını kontrol et.'};
 upsert('maintenance',record,'');
 try{if(dueDate){Android.requestNotificationPermission();Android.scheduleMaintenanceReminder(record.id,name,dueDate)}}catch(err){}
 closeModal();save();toast('Bakım kilometre hedefi eklendi');
};
var oldMaintenanceView=maintenanceView;
window.maintenanceView=function(){
 return '<div class="ap134-quick"><button type="button" onclick="ap134MaintenancePlanner()">🔧 Kilometreye Göre Akıllı Bakım Hesapla →</button><button type="button" onclick="driverReminderModal()">🗓 Muayene • Sigorta • Kasko Takvimi →</button></div>'+oldMaintenanceView();
};
function valuationHistory(){
 var v=activeVehicle();if(!v)return '<div class="notice">Değer grafiği için önce araç ekle.</div>';
 var records=vf(state.valuations||[]).filter(function(x){return Number(x.value)>0&&x.date});
 var grouped={};
 records.forEach(function(x){var ym=String(x.date).slice(0,7);if(!ym)return;var d=grouped[ym];if(!d||String(x.date)>=String(d.date))grouped[ym]=x});
 var a=Object.keys(grouped).sort().slice(-6).map(function(ym){return {month:ym,value:Number(grouped[ym].value)}});
 if(!a.length)return '<div class="notice">Henüz kayıtlı araç değeri yok. Piyasa Değeri ekranında emsal fiyat girerek bir değer kaydı oluşturabilirsin.</div>';
 var peak=Math.max.apply(null,a.map(function(x){return x.value})),base=a[0].value,final=a[a.length-1].value;
 var change=a.length>1&&base>0?((final-base)/base*100):null;
 return '<div class="ap134-series">'+a.map(function(x){
  return '<div class="ap134-series-row"><small>'+e(x.month)+'</small><div class="ap134-series-rail"><i style="width:'+Math.max(4,Math.round(100*x.value/peak))+'%"></i></div><b>'+marketMoney(x.value)+'</b></div>';
 }).join('')+'</div>'+
 (change!==null?'<div class="ap134-change">İlk ve son kayıt arasında: '+(change>=0?'+':'')+change.toFixed(1)+'%</div>':'')+
 '<div class="hint">Grafik yalnızca kaydettiğin değerlerden oluşturulur; canlı ilan fiyatı değildir.</div>';
}
window.ap134ValueHistoryModal=function(){
 if(!activeVehicle()){toast('Önce araç ekle');return}
 modal('Araç Değer Grafiği','<div class="ap134-panel">'+valuationHistory()+'</div>'+
 '<button class="secondary wide" onclick="marketValueModal()" style="margin-top:12px">Emsal İlanlarla Değer Hesapla</button>');
};
window.ap134ReportModal=function(){
 var v=activeVehicle();if(!v){toast('Önce araç ekle');return}
 var total=totals(),distance=vehicleDistance();
 var months=monthlyData(6);
 var highest=Math.max(1,...months.map(function(x){return x.total}));
 var chart=months.map(function(x){
  return '<div class="ap134-series-row"><small>'+e(x.label)+'</small><div class="ap134-series-rail"><i style="width:'+Math.max(2,100*x.total/highest)+'%"></i></div><b>'+money(x.total)+'</b></div>';
 }).join('');
 modal('Sürüş & Masraf Analizi',
 '<div class="ap134-panel"><div class="ap134-metrics"><div><small>Toplam gider</small><b>'+money(totalAll())+'</b></div><div><small>Yakıt</small><b>'+money(total.fuel)+'</b></div><div><small>Servis + bakım</small><b>'+money(total.service+total.maint)+'</b></div><div><small>Diğer gider</small><b>'+money(total.exp)+'</b></div></div>'+
 '<div class="notice">Kayıtlara göre KM başına maliyet: <b>'+(distance>0?(totalAll()/distance).toFixed(2)+' TL':'Hesaplamak için KM kaydı gerekli')+'</b></div>'+
 '<div class="sectionHead" style="margin-top:14px"><h2>Son 6 Ayın Giderleri</h2></div><div class="ap134-series">'+chart+'</div>'+
 '<div class="hint">Grafikte yalnızca kaydedilen harcamalar yer alır; kayıt olmayan aylar 0 TL görünür.</div></div>'+
 '<div class="ap134-quick"><button onclick="ap134ExportDetailedPdf()">📄 PDF Masraf Özeti</button><button onclick="exportXls()">📊 Excel Raporu</button></div>');
};
window.ap134ExportDetailedPdf=function(){
 if(!activeVehicle()){toast('Önce araç ekle');return}
 var t=totals(),distance=vehicleDistance(),rows=monthlyData(6),v=activeVehicle();
 var lines='ARACIM PRO - SURUS VE MASRAF OZETI\n\n';
 lines+='Arac: '+[v.year,v.make,v.model].filter(Boolean).join(' ')+'\n';
 lines+='Guncel KM: '+num(v.km)+'\n';
 lines+='Toplam gider: '+money(totalAll())+'\n';
 lines+='Yakit: '+money(t.fuel)+'\nServis: '+money(t.service)+'\nBakim: '+money(t.maint)+'\nDiger: '+money(t.exp)+'\n';
 lines+='Kayitli KM basina maliyet: '+(distance>0?(totalAll()/distance).toFixed(2)+' TL':'Yeterli veri yok')+'\n\nSON 6 AY:\n';
 rows.forEach(function(r){lines+=r.label+': '+money(r.total)+'\n'});
 lines+='\nNot: Bu rapor kullanici tarafindan girilen kayitlardan hesaplanir.\n';
 try{Android.savePdf('AracimPro_Masraf_Ozeti.pdf','Aracım Pro Masraf Özeti',lines);toast('PDF kaydediliyor')}catch(err){toast('PDF oluşturulamadı')}
};
var oldReportsView=reportsView;
window.reportsView=function(){
 return oldReportsView()+
 '<div class="ap134-section"><div class="sectionHead"><h2>Akıllı Analizler</h2></div>'+
 '<div class="ap134-quick"><button onclick="ap134ReportModal()">📊 6 Aylık Masraf Analizi</button>'+
 '<button onclick="ap134ValueHistoryModal()">📈 Değer Değişim Grafiği</button></div></div>';
};
var oldMoreCategoryHome=moreCategoryHome;
window.moreCategoryHome=function(){
 return '<div class="ap134-section"><div class="sectionHead"><h2>Akıllı Araç Araçları</h2></div>'+
 '<div class="ap134-quick"><button onclick="driverReminderModal()">🗓 Muayene ve Kasko</button>'+
 '<button onclick="ap134MaintenancePlanner()">🔧 Bakım Hesapla</button>'+
 '<button onclick="fuelPricesModal()">⛽ Yakıt Fiyatları</button>'+
 '<button onclick="nearbyFuel()">📍 Yakın İstasyon</button>'+
 '<button onclick="officialServicesModal()">🏛️ HGS / Ceza / e-Devlet</button>'+
 '<button onclick="ap134ValueHistoryModal()">📈 Değer Grafiği</button></div></div>'+oldMoreCategoryHome();
};
})();
