/* Aracım Pro V112 — ARAS assistant only. Vehicle marketplace removed at user request. */
(function(){
'use strict';
const oldHome=homeView;


/* V108: ARAS is a small animated companion, not an oversized promotion card.
   The icon is an original SVG drawn in app; no external image or brand art. */
function arasArt(){
 return '<svg class="aras109Robot" viewBox="0 0 130 150" aria-hidden="true">'+
 '<defs>'+
 '<radialGradient id="aras109Shell" cx=".29" cy=".19" r=".88"><stop stop-color="#b4eaff"/><stop offset=".26" stop-color="#4bbbee"/><stop offset=".52" stop-color="#1266bd"/><stop offset=".83" stop-color="#091f52"/><stop offset="1" stop-color="#020917"/></radialGradient>'+
 '<linearGradient id="aras109Chrome" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".18" stop-color="#b9d6f3"/><stop offset=".49" stop-color="#4e89bf"/><stop offset=".69" stop-color="#f5fcff"/><stop offset="1" stop-color="#23537d"/></linearGradient>'+
 '<radialGradient id="aras109Lens"><stop stop-color="#ddfaff"/><stop offset=".24" stop-color="#45c8ff"/><stop offset=".51" stop-color="#0877e0"/><stop offset=".73" stop-color="#092f78"/><stop offset="1" stop-color="#02132a"/></radialGradient>'+
 '<linearGradient id="aras109Visor" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#123f77"/><stop offset=".4" stop-color="#040e24"/><stop offset=".9" stop-color="#081b41"/><stop offset="1" stop-color="#0b3261"/></linearGradient>'+
 '<radialGradient id="aras109Glow"><stop stop-color="#33bfff" stop-opacity=".6"/><stop offset="1" stop-color="#168cff" stop-opacity="0"/></radialGradient></defs>'+
 '<ellipse cx="62" cy="143" rx="51" ry="7" fill="#051329" opacity=".45"/>'+
 '<path d="M37 104L23 115L23 130L42 130L51 118" fill="url(#aras109Shell)" stroke="#54c6fa" stroke-width="2"/>'+
 '<path d="M87 104L106 115L109 130L92 131L79 116" fill="url(#aras109Shell)" stroke="#54c6fa" stroke-width="2"/>'+
 '<path d="M41 112Q30 111 30 122L30 143L53 143L57 122M73 122L78 143L99 143L100 121Q97 111 87 111" fill="url(#aras109Chrome)" stroke="#19568c" stroke-width="2"/>'+
 '<path d="M34 107Q64 97 94 107L103 126Q103 140 90 144H40Q29 141 28 129Z" fill="url(#aras109Shell)" stroke="#7ddbff" stroke-width="2.5"/>'+
 '<path d="M48 115Q65 105 82 115L84 131L65 138L46 131Z" fill="#0a2755" stroke="#51bdf1" stroke-width="1.3"/>'+
 '<path d="M58 117L70 117L75 127L64 134L54 127Z" fill="#19aaff"/><path d="M60 122H69L65 130Z" fill="#d6faff"/>'+
 '<rect x="10" y="43" width="20" height="46" rx="10" fill="url(#aras109Chrome)" stroke="#65bbee" stroke-width="2"/>'+
 '<rect x="102" y="43" width="20" height="46" rx="10" fill="url(#aras109Chrome)" stroke="#65bbee" stroke-width="2"/>'+
 '<path d="M16 68Q9 42 28 24Q42 8 66 9Q92 8 105 29Q115 46 113 69L104 96Q91 107 66 108Q39 108 24 95Z" fill="url(#aras109Chrome)" stroke="#70d7ff" stroke-width="2"/>'+
 '<path d="M26 56Q25 25 60 21Q101 18 105 54L101 82Q92 99 65 100Q38 99 29 82Z" fill="url(#aras109Visor)" stroke="#2c7bad" stroke-width="2"/>'+
 '<path d="M37 34Q61 23 85 33" fill="none" stroke="#76d7ff" stroke-width="2" opacity=".65"/>'+
 '<ellipse cx="46" cy="62" rx="19" ry="22" fill="url(#aras109Glow)"/><ellipse cx="84" cy="62" rx="19" ry="22" fill="url(#aras109Glow)"/>'+
 '<ellipse class="aras109Eye" cx="47" cy="62" rx="13" ry="16" fill="url(#aras109Lens)" stroke="#7de5ff" stroke-width="2"/>'+
 '<ellipse class="aras109Eye" cx="83" cy="62" rx="13" ry="16" fill="url(#aras109Lens)" stroke="#7de5ff" stroke-width="2"/>'+
 '<ellipse cx="43" cy="57" rx="4" ry="5" fill="#f5ffff"/><ellipse cx="79" cy="57" rx="4" ry="5" fill="#f5ffff"/>'+
 '<ellipse cx="51" cy="70" rx="2" ry="3" fill="#89eaff" opacity=".9"/><ellipse cx="87" cy="70" rx="2" ry="3" fill="#89eaff" opacity=".9"/>'+
 '<path d="M51 83Q65 92 79 83" stroke="#e6faff" fill="none" stroke-width="3" stroke-linecap="round"/>'+
 '<path d="M56 15V8" stroke="#8beaff" stroke-width="3"/><circle class="aras109Signal" cx="56" cy="7" r="5" fill="#87f5ff"/>'+
 '<circle cx="114" cy="110" r="10" fill="url(#aras109Chrome)" stroke="#5baeee" stroke-width="2"/>'+
 '<path d="M112 102L117 92M119 105L126 97M121 111L129 109" stroke="#cbf3ff" stroke-width="4" stroke-linecap="round"/>'+
 '</svg>';
}
function arasHtml(){
 return '<div class="aras108Dock" role="group" aria-label="Aras, Aracım Pro yapay zekâ asistanı">'+
 '<button type="button" class="aras108Bot" onclick="arasOpenAi()" aria-label="Aras ile konuş">'+arasArt()+
 '<span class="aras108BotAura"></span></button>'+
 '<button type="button" class="aras108Talk" onclick="arasOpenAi()">'+
 '<span class="aras108Eyebrow"><i></i> ARAS AI <span class="aras108Sparkle">✦</span></span>'+
 '<strong>Aracınla ilgili ne merak ediyorsun?</strong>'+
 '<small>Bir belirti yaz, birlikte inceleyelim <span aria-hidden="true">↗</span></small>'+
 '</button></div>';
}
function garageHeroPhoto(){
 return '<span class="market109Photo" aria-label="Gerçek otomobil fotoğrafı"><img src="r8ui/market.jpg" alt="Otomobil" loading="lazy"></span>';
}

window.arasOpenAi=function(){
 try{faultGuideModal()}catch(e){toast('Aras şu anda açılamadı')};
};
welcome=function(){
 return '<div class="proWelcome108">'+
 '<section class="proWelcomeHero108"><span class="proWelcomeEyebrow108">ARACIM PRO GARAJ</span>'+
 '<div class="proWelcomeHeroRow108"><div><h2>Aracın, tüm bilgileriyle burada.</h2>'+
 '<p>İlk aracını ekle; bakımını, giderlerini ve geçmişini tek yerden yönet.</p></div>'+
 '<div class="proWelcomeHeroGraphic108" aria-hidden="true">'+garageHeroPhoto()+'</div></div>'+
 '<button type="button" class="proWelcomeAdd108" onclick="openVehicle()">＋ Aracımı Ekle <span>→</span></button></section>'+
 arasHtml()+apMrecCardHtml()+dailyQuickHtml()+'</div>';
};
homeView=function(){
 const s=oldHome();
 if(s.includes('aras108Dock'))return s;
 const placement=arasHtml();
 return s.includes('<div class="n97AdArea">')?
 s.replace('<div class="n97AdArea">',placement+'<div class="n97AdArea">'):
 s.replace('<div class="sectionHead">',placement+'<div class="sectionHead">');
};
})();
