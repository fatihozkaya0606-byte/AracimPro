/* Feature discovery for the ten owner tools; respects established Home, More & MREC. */
(function(){
'use strict';
const originalServices=moreAllServices,originalWelcome=welcome,originalHome=homeView;
const FEATURES=[
 ['voice114','Aras • Sesli Sohbet','AI ile sesli soru ve yanıt','arasVoiceOpen114()','tools','assistant'],
 ['anatomy114','İnteraktif Araç Anatomisi','Parça seç, açıklamayı ve Aras rehberini aç','anatomy114()','service','engine'],
 ['wrapped114','Yılın Sürüş Özeti','Kayıtlardan 2026 / önceki yıllar özeti','yearWrapped114()','travel','reports'],
 ['score114','GPS Sürüş Puanım','İzinli ve deneysel hız değişimi analizi','driveScore114()','travel','speed'],
 ['sound114','Motor Sesini Kaydet','Ses kayıt uygulamasıyla kaydet ve paylaş','engineSound114()','service','engine'],
 ['forecast114','12 Ay Masraf Senaryosu','Kayıtlı giderlerinle 12 aylık tahmin','costForecast114()','tools','expenses'],
 ['history114','Aracımın Hikâyesi','Bakım ve yolculuk zaman çizelgesi','story114()','tools','documents'],
 ['hud114','HUD Gece Ekranı','GPS hız göstergesi / aynalama','hud114()','travel','speed'],
 ['badges114','Garaj Başarıları','Gerçek araç kayıtlarından rozet kazan','badges114()','account','award'],
 ['damage114','Araç Hasar Haritası','Parça bazında hasar ve fotoğraf kaydı','damageMap114()','service','car']
];
window.arasVoiceOpen114=function(){faultGuideModal();toast('Aras sohbetinde Sesli soru sor düğmesine dokun')};
function homeTeaser114(){
 const links=[
  ['🎙','Sesli Aras','arasVoiceOpen114()'],
  ['🚗','Araç Anatomisi','anatomy114()'],
  ['✨','Yılın Özeti','yearWrapped114()'],
  ['📈','Masraf Tahmini','costForecast114()']
 ];
 return '<section class="ap114Discovery" aria-label="Aracım Pro 10 yeni özellik">'+
 '<div class="ap114DiscoveryTitle"><strong>ARACIM PRO STÜDYO</strong><small>10 yeni özellik • keşfet</small></div>'+
 '<div class="ap114DiscoveryGrid">'+links.map(([ico,title,action])=>
  '<button type="button" onclick="'+action+'"><span>'+ico+'</span><b>'+title+'</b></button>').join('')+'</div>'+
 '<button type="button" class="ap114MoreLink" onclick="go(\'more\')">Tüm yeni araçları Daha Fazla’da gör →</button></section>';
}
moreAllServices=function(){
 const services=originalServices().filter(x=>x.id!=='auto-market');
 for(const [id,title,sub,action,cat,icon] of FEATURES){
  if(!services.some(x=>x.id===id))services.push({id,cat,action,img:'service',icon,title,sub});
 }
 return services;
};
welcome=function(){
 const html=originalWelcome();
 return html.includes('ap114Discovery')?html:
   html.includes('<div class="dailyQuickTitle"')?
    html.replace('<div class="dailyQuickTitle"',homeTeaser114()+'<div class="dailyQuickTitle"'):
    html+homeTeaser114();
};
homeView=function(){
 const html=originalHome();
 if(html.includes('ap114Discovery'))return html;
 return html.includes('<div class="n97AdArea">')?
 html.replace('<div class="n97AdArea">',homeTeaser114()+'<div class="n97AdArea">'):
 html+homeTeaser114();
};
setTimeout(()=>{try{if(current==='home')render()}catch(e){console.warn('V114 home refresh',e)}},260);
})();
