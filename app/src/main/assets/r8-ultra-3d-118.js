/* Aracim Pro R8 Ultra 3D: activate visual skin for all working screens.
   No changes to app storage, AdMob SDK, premium state or motor matching. */
(function(){
 'use strict';
 if(window.r118UltraLoaded)return;
 window.r118UltraLoaded=true;
 document.body.classList.add('r118Skin');
 const svgParts={
  garage:'<path d="M4 12.5 18 3l14 9.5v18H4z"/><path d="M8 30V16h20v14"/><path d="M12 22h12v8H12z"/><path d="M10 13h2m12 0h2"/>',
  health:'<path d="M18 31 6 19C-1 11 9 1 18 9c9-8 19 2 12 10z"/><path d="M8 20h6l3-6 3 12 3-6h6"/>',
  route:'<circle cx="18" cy="18" r="14"/><path d="m23 12-4 9-7 3 4-9z"/><path d="m18 3v4m0 22v4M3 18h4m22 0h4"/>',
  hud:'<path d="M4 25a15 15 0 1 1 28 0"/><path d="m18 22 7-11-3 13-4 2z"/><path d="M7 25h22M8 14l2 2m16-2-2 2M18 7v3"/>',
  compare:'<rect x="5" y="19" width="6" height="12" rx="1"/><rect x="15" y="11" width="6" height="20" rx="1"/><rect x="25" y="5" width="6" height="26" rx="1"/>',
 };
 function glyph(k){
   const path=svgParts[k];if(!path)return '';
   return '<svg class="r118Pictogram" aria-hidden="true" viewBox="0 0 36 36" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">'+path+'</svg>';
 }
 function decorate(){
   document.querySelectorAll('#app .ap116DockScroll button[data-ap116]').forEach(button=>{
     if(button.dataset.r118Done)return;
     const k=button.dataset.ap116;
     const span=button.querySelector('span');
     if(!span||!svgParts[k])return;
     span.innerHTML=glyph(k);
     span.classList.add('r118PictogramWrap');
     button.dataset.r118Done='1';
   });
 }
 const prior=render;
 render=function(){const value=prior.apply(this,arguments);decorate();return value};
 decorate();
})();