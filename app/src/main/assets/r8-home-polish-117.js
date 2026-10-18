/* Optional, subtle touch parallax: only inside R8 car photograph.
   No permissions, sensors, timers, data writes or route changes. */
(function(){
 'use strict';
 if(window.n117ParallaxLoaded)return;
 window.n117ParallaxLoaded=true;
 let gesture=null;
 const reduce=()=>window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function end(){
  if(!gesture)return;
  const frame=gesture.frame;
  if(frame&&frame.isConnected){
   frame.style.setProperty('--n117x','0px');
   frame.style.setProperty('--n117y','0px');
   frame.style.setProperty('--n117rot','0deg');
  }
  gesture=null;
 }
 document.addEventListener('pointerdown',function(e){
  if(reduce()||!e.isPrimary||e.target.closest('button'))return;
  const photo=e.target.closest('.n117Photo');
  if(!photo)return;
  const frame=photo.querySelector('.n117PhotoFrame');
  if(!frame)return;
  gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,frame};
 },{passive:true});
 document.addEventListener('pointermove',function(e){
  if(!gesture||e.pointerId!==gesture.pointerId)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(Math.abs(dy)>Math.abs(dx)*1.1){end();return;} // vertical scroll stays natural
  if(Math.abs(dx)<6)return;
  const x=Math.max(-14,Math.min(14,dx*.15));
  gesture.frame.style.setProperty('--n117x',x.toFixed(1)+'px');
  gesture.frame.style.setProperty('--n117y',Math.max(-4,Math.min(4,dy*.08)).toFixed(1)+'px');
  gesture.frame.style.setProperty('--n117rot',Math.max(-3,Math.min(3,dx*.035)).toFixed(2)+'deg');
 },{passive:true});
 document.addEventListener('pointerup',end,{passive:true});
 document.addEventListener('pointercancel',end,{passive:true});
 document.addEventListener('visibilitychange',function(){if(document.hidden)end()});
})();