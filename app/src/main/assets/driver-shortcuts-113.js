/* V113 feature discovery and first-render refresh; preserves existing navigation. */
(function(){
'use strict';
const oldServices=moreAllServices,oldWelcome=welcome,oldHome=homeView;
function grid113(){
 return '<section class="ap113Quick"><div class="ap113Head"><b>✨ Sürücü Araçları</b><small>Yeni araçlar</small></div>'+
 '<div class="ap113GridQuick">'+
 '<button onclick="receiptScan113()"><span>🧾</span><b>Fiş Okut</b><small>Gider kaydet</small></button>'+
 '<button onclick="tripTimer113()"><span>🧭</span><b>Yolculuğum</b><small>Süre & km</small></button>'+
 '<button onclick="roadHelp113()"><span>🆘</span><b>Yol Yardım</b><small>Hızlı destek</small></button>'+
 '</div></section>';
}
moreAllServices=function(){
 const all=oldServices().filter(x=>x.id!=='auto-market');
 const additions=[
 {id:'ocr113',cat:'tools',action:'receiptScan113()',img:'documents',icon:'document',title:'Fiş Okut',sub:'Fişi tara, gider veya yakıt kaydet'},
 {id:'trip113',cat:'travel',action:'tripTimer113()',img:'roadtrip',icon:'road',title:'Yolculuk Kronometresi',sub:'Süre, kilometre ve masraf günlüğü'},
 {id:'road113',cat:'safety',action:'roadHelp113()',img:'roadside',icon:'tow',title:'Yolda Kaldım',sub:'Çekici, acil çağrı ve güvenli adımlar'},
 {id:'obd113',cat:'service',action:'dtcLookup113()',img:'engine',icon:'settings',title:'OBD2 Kod Rehberi',sub:'Arıza kodlarını açıkla (canlı bağlantı yok)'},
 {id:'dash113',cat:'travel',action:'videoClip113()',img:'drive',icon:'camera',title:'Kısa Araç Videosu',sub:'Telefon kamerasından 60 sn kayıt'},
 {id:'family113',cat:'account',action:'familySummary113()',img:'profile',icon:'user',title:'Aileye Özet Paylaş',sub:'Salt okunur araç raporu'}
 ];
 for(const a of additions)if(!all.some(x=>x.id===a.id))all.push(a);
 return all;
};
welcome=function(){
 const html=oldWelcome();
 if(html.includes('ap113Quick'))return html;
 const anchor='<div class="dailyQuickTitle"';
 return html.includes(anchor)?html.replace(anchor,grid113()+anchor):html+grid113();
};
homeView=function(){
 const html=oldHome();
 if(html.includes('ap113Quick'))return html;
 const anchor='<div class="n97AdArea">';
 return html.includes(anchor)?html.replace(anchor,grid113()+anchor):html+grid113();
};
// Previous scripts paint the home before script downloads finish.
setTimeout(function(){
 try{if(typeof current!=='undefined'&&current==='home'&&typeof render==='function')render()}catch(e){console.warn('V113 initial paint',e)}
},220);
})();
