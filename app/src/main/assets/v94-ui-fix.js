
/* Aracım Pro v94 UI correction: actual map fills the screen. No fabricated traffic data. */
(function(){
  'use strict';
  const h0=header, view0=view, search0=apNavSearchPlaces, update0=apNavUpdateBottom, select0=apNavSelectDestination, clear0=apNavClearRoute;
  let lastSearch='', searchStartedAt=0;
  let detailOpen=false;
  let choiceTimer=null;
  const cities=[
    ['ankara',['Ankara, Türkiye','Kızılay, Ankara','Çankaya, Ankara','Ankara Kalesi','AŞTİ, Ankara','Keçiören, Ankara','Etimesgut, Ankara']],
    ['istanbul',['İstanbul, Türkiye','Taksim, İstanbul','Kadıköy, İstanbul','Üsküdar, İstanbul','Beşiktaş, İstanbul']],
    ['izmir',['İzmir, Türkiye','Konak, İzmir','Bornova, İzmir','Karşıyaka, İzmir']],
    ['çankırı',['Çankırı, Türkiye','Şabanözü, Çankırı','Çerkeş, Çankırı','Ilgaz, Çankırı']],
    ['çubuk',['Çubuk, Ankara','Şabanözü, Çankırı','Esenboğa, Ankara']]
  ];
  const norm=s=>String(s||'').toLocaleLowerCase('tr-TR').trim();
  header=function(){
    if(current!=='home')return h0();
    const alerts=smartAlertItems();
    return '<header class="header ap94HomeHeader">'+
      '<div class="ap93Head"><div class="ap93Brand"><span class="ap93Logo">'+ico('car')+'</span>Aracım <b>Pro</b></div>'+
      '<button class="ap93Icon" aria-label="Bildirimler" onclick="smartAlertsModal()">'+ico('bell')+(alerts.length?'<i class="ap93Bubble"></i>':'')+'</button>'+
      '<button class="ap93Icon" aria-label="Ayarlar" onclick="openSettings()">'+ico('settings')+'</button></div>'+
    '</header>';
  };
  view=function(){
    const result=view0();
    if(current==='home'&&!activeVehicle())return result.replace('<div class="ap93Hero">','<div class="ap93Hero ap94HeroEmpty">');
    return result;
  };
  window.apNavView=function(){
    return '<section class="apNavScreen ap94NavScreen" aria-label="Aracım Pro navigasyon">'+
      '<div id="apNavMap" class="apNavMap"><div class="apNavMapLoading">Keskin harita yükleniyor…</div></div>'+
      '<div class="ap94OverlayHeader"><button class="ap94Back" aria-label="Geri" onclick="go(\'home\')">‹</button>'+
        '<span class="ap94Brand">🚘 Aracım <b>Pro</b></span>'+
        '<button class="ap94TopLocate" aria-label="Konumuma git" onclick="apNavCenter()">⌖</button>'+
      '</div>'+
      '<div class="apNavSearchWrap ap94SearchWrap">'+
        '<div class="apNavSearchBar"><span class="apNavSearchIcon">⌕</span>'+
          '<input id="apNavSearch" type="search" maxlength="110" autocomplete="off" autocorrect="off" aria-label="Hedef ara" placeholder="Nereye gitmek istiyorsun?" oninput="ap94Suggest(this.value)" onfocus="ap94Suggest(this.value)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();apNavSearchPlaces()}"/>'+
          '<button id="ap94SearchGo" onclick="apNavSearchPlaces()" type="button">ARA</button>'+
        '</div><div id="apNavResults" class="apNavResults ap94SearchResults" hidden></div>'+
      '</div>'+
      '<div id="ap93NavChoices" class="ap93NavChoices ap94Routes"></div>'+
      '<div class="apNavControls ap94MapControls">'+
        '<button onclick="apNavCenter()" title="Konumuma dön">⌖</button>'+
        '<button onclick="apNavZoom(1)" title="Yakınlaştır">+</button>'+
        '<button onclick="apNavZoom(-1)" title="Uzaklaştır">−</button>'+
      '</div>'+
      '<button type="button" class="ap94Voice" id="apNavVoice" title="Sesli yönlendirme" onclick="apNavToggleVoice()">🔊</button>'+
      '<section id="ap94Sheet" class="ap94Sheet" aria-label="Rota bilgileri">'+
        '<div class="ap94Grab" onclick="ap94ToggleDetails()" role="button" aria-label="Rota ayrıntılarını aç veya kapat"><span></span></div>'+
        '<div class="ap94Summary">'+
          '<div class="ap94TurnIcon">➤</div>'+
          '<div class="ap94Direction"><strong id="apNavInstruction">Bir hedef seç</strong><small id="apNavInfo">Adres yaz veya haritada bir noktaya dokun.</small></div>'+
          '<span class="ap94Speed" id="apNavSpeed">— km/sa</span>'+
        '</div>'+
        '<div class="ap94TripMetrics"><span><b id="apNavDistance">—</b> mesafe</span><span><b id="apNavDuration">—</b> süre</span><span>Varış <b id="apNavEta">—</b></span></div>'+
        '<div class="ap94Actions"><button id="apNavStart" class="apNavStart" onclick="apNavToggleGuidance()" disabled>Önce hedef ara</button>'+
          '<button class="ap94DetailsButton" type="button" onclick="ap94ToggleDetails()">Detaylar <span id="ap94DetailsArrow">⌃</span></button></div>'+
        '<div id="ap94Expanded" class="ap94Expanded" hidden>'+
          '<div class="ap94Caution">Rota ve süre tahminidir. Canlı trafik, hız sınırı ve radar gösterilmez. Trafik levhalarına uy.</div>'+
          '<div id="ap93NavSteps" class="ap93NavDetails"></div>'+
          '<button class="ap94Clear" onclick="apNavClearRoute()">Rotayı Temizle</button>'+
          '<div class="ap94Credit">Harita © OpenStreetMap katkıda bulunanlar, © CARTO · Rota: OSRM deneme servisi</div>'+
        '</div>'+
      '</section>'+
    '</section>';
  };
  function buildSuggestions(q){
    const cleaned=norm(q);
    if(cleaned.length<2)return [];
    let out=[];
    for(const [stem,words] of cities){
      if(stem.includes(cleaned)||cleaned.includes(stem))out.push(...words);
      else for(const w of words)if(norm(w).includes(cleaned))out.push(w);
    }
    return [...new Set([q.trim(),...out])].slice(0,7);
  }
  window.ap94Suggest=function(q){
    const box=apNavEl('apNavResults');if(!box)return;
    if(!q || q.trim().length<2){box.hidden=true;return;}
    const options=buildSuggestions(q);
    if(!options.length){box.hidden=true;return;}
    box.hidden=false;
    box.innerHTML='<div class="ap94ResultsLabel">Yer önerileri — seçince gerçek haritada aranır</div>'+
      options.map(a=>'<button type="button" onclick="ap94FindAddress(\''+apNavEsc(a).replaceAll('&#39;','\\&#39;')+'\')"><b>⌕ '+apNavEsc(a)+'</b></button>').join('');
  };
  window.ap94FindAddress=function(q){
    const el=apNavEl('apNavSearch');if(!el)return;
    el.value=q;
    apNavSearchPlaces();
  };
  apNavSearchPlaces=function(){
    const el=apNavEl('apNavSearch');
    const q=el?.value?.trim()||'';
    if(q.length<2){apNavInfo('Aramak için en az iki karakter yaz.');return;}
    if(Date.now()-searchStartedAt<650 && q===lastSearch)return;
    lastSearch=q;searchStartedAt=Date.now();
    const box=apNavEl('apNavResults');
    if(box){box.hidden=false;box.innerHTML='<div class="ap94Loading">📍 “'+apNavEsc(q)+'” için gerçek adresler aranıyor…</div>';}
    const btn=apNavEl('ap94SearchGo');if(btn){btn.disabled=true;btn.textContent='…';}
    search0();
    clearTimeout(choiceTimer);
    choiceTimer=setTimeout(()=>{
      if(btn){btn.disabled=false;btn.textContent='ARA';}
      if(box && box.textContent.includes('gerçek adresler aranıyor'))box.innerHTML='<div class="ap94Loading">Arama gecikti. Yeniden deneyebilir veya haritada hedef seçebilirsin.</div>';
    },9500);
  };
  const result0=window.apNavSearchResults;
  window.apNavSearchResults=function(payload){
    const btn=apNavEl('ap94SearchGo');if(btn){btn.disabled=false;btn.textContent='ARA';}
    clearTimeout(choiceTimer);
    result0(payload);
    const results=apNav.searchResults||[];
    const box=apNavEl('apNavResults');
    if(!box)return;
    if(!results.length){
      const q=apNavEl('apNavSearch')?.value||'';
      const options=buildSuggestions(q).filter(v=>norm(v)!==norm(q));
      box.hidden=false;
      box.innerHTML='<div class="ap94ResultsLabel">Adres bulunamadı. Daha ayrıntılı bir yer seç:</div>'+
        options.map(v=>'<button type="button" onclick="ap94FindAddress(\''+apNavEsc(v).replaceAll('&#39;','\\&#39;')+'\')"><b>⌕ '+apNavEsc(v)+'</b></button>').join('')+
        '<div class="ap94ResultsLabel">Alternatif: haritada hedefin üzerine dokun.</div>';
    }else{
      box.hidden=false;
      box.innerHTML='<div class="ap94ResultsLabel">Doğrulanmış konumlar</div>'+
        results.slice(0,5).map((a,i)=>'<button type="button" onclick="apNavChooseResult('+i+')"><b>📍 '+apNavEsc(a.name)+'</b><small>Haritada bu hedefe git</small></button>').join('');
    }
  };
  apNavSelectDestination=function(lat,lon,name){
    const box=apNavEl('apNavResults');if(box)box.hidden=true;
    detailOpen=false;
    select0(lat,lon,name);
    window.ap94ApplySheet();
  };
  apNavUpdateBottom=function(){
    update0();
    window.ap94ApplySheet();
  };
  window.ap94ApplySheet=function(){
    const sheet=document.getElementById('ap94Sheet');
    if(!sheet)return;
    const ready=!!apNav.route;
    sheet.classList.toggle('ready',ready);
    sheet.classList.toggle('expanded',detailOpen);
    const pane=document.getElementById('ap94Expanded');if(pane)pane.hidden=!detailOpen;
    const arrow=document.getElementById('ap94DetailsArrow');if(arrow)arrow.textContent=detailOpen?'⌄':'⌃';
    const btn=document.getElementById('apNavStart');
    if(btn)btn.textContent=!ready?'Önce hedef ara':apNav.active?'Duraklat':'▶ Navigasyonu Başlat';
    const choices=document.getElementById('ap93NavChoices');
    if(choices)choices.classList.toggle('visible',apNav.routes.length>0);
  };
  window.ap94ToggleDetails=function(){
    detailOpen=!detailOpen;
    const pane=document.getElementById('ap94Expanded');
    if(pane){pane.hidden=!detailOpen;if(detailOpen)window.ap93RenderSteps?.();}
    window.ap94ApplySheet();
    if(apNav.map)setTimeout(()=>apNav.map.invalidateSize(),80);
  };
  apNavClearRoute=function(){
    detailOpen=false;
    clear0();
    window.ap94ApplySheet();
  };
  const after0=apNavAfterRender;
  apNavAfterRender=function(){
    after0();
    window.ap94ApplySheet();
    if(apNav.map){
      setTimeout(()=>{try{apNav.map.invalidateSize()}catch(e){}},210);
    }
  };
  /* UI state changes must not imply live traffic nor fake address results. */
})();
