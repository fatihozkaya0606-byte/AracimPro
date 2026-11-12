const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync(__dirname+'/game.js','utf8');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const css=fs.readFileSync(__dirname+'/style.css','utf8');
const start=src.indexOf('  const RANKS=Object.freeze(');
const end=src.indexOf('  const $ = id =>',start);
assert.ok(start>=0&&end>start,'Pure rank functions not present');
const rankApi=new Function('const TOTAL_LEVELS=540;\n'+src.slice(start,end)+
 '\nreturn {RANKS,rankForLevel,rankProgress};')();
const {RANKS,rankForLevel,rankProgress}=rankApi;
const tiers=[
 [1,10,'Çaylak'],[11,25,'Çırak'],[26,50,'Amatör'],[51,80,'Kalfa'],
 [81,120,'Becerikli'],[121,170,'Uzman'],[171,230,'Profesyonel'],
 [231,300,'Usta'],[301,380,'Büyük Usta'],[381,460,'Efsane'],
 [461,520,'Şampiyon'],[521,540,'Okların Efendisi']
];
test('exactly 12 contiguous permanent career ranks cover 540 levels',()=>{
 assert.equal(RANKS.length,12);
 let expectedFrom=1,count=0;
 for(let i=0;i<tiers.length;i++){
  const [from,to,name]=tiers[i],r=RANKS[i];
  assert.equal(r.from,expectedFrom);
  assert.equal(r.from,from);
  assert.equal(r.to,to);
  assert.equal(r.name,name);
  assert.ok(r.icon&&r.color);
  expectedFrom=r.to+1;
  for(let n=from;n<=to;n++){assert.equal(rankForLevel(n).name,name,'Rank mismatch at '+n);count++;}
 }
 assert.equal(count,540);
 assert.equal(expectedFrom,541);
});
test('earning a rank requires completing the previous milestone; replay cannot farm promotion',()=>{
 for(let i=1;i<RANKS.length;i++){
  const n=RANKS[i].from;
  const before=rankProgress(n-1),after=rankProgress(n);
  assert.equal(before.rank.name,RANKS[i-1].name);
  assert.equal(after.rank.name,RANKS[i].name);
  assert.equal(after.earned,0);
  assert.equal(after.percent,0);
  assert.equal(after.remaining,RANKS[i].to-(n-1));
 }
 assert.equal(rankProgress(1).earned,0);
 assert.equal(rankProgress(11).rank.name,'Çırak');
 assert.equal(rankProgress(26).rank.name,'Amatör');
 assert.equal(rankProgress(521).rank.name,'Okların Efendisi');
 assert.equal(rankProgress(541).percent,100);
 assert.equal(rankProgress(541).remaining,0);
 assert.equal(rankProgress(541).next,null);
 for(let h=1;h<=541;h++){
  const p=rankProgress(h);
  assert.ok(p.percent>=0&&p.percent<=100);
  assert.ok(p.earned>=0&&p.earned<=p.span);
  assert.ok(p.remaining>=0);
 }
});
test('all four rank surfaces exist without touching controls or stored saves',()=>{
 for(const id of ['rankOverviewBtn','currentLevelTitle','levelGrid','victoryRank'])
   assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(src,/const formerRank=playerRank\(\)\.rank/);
 assert.match(src,/levelData\.rankPromotion=formerRank\.name!==newRank\.name/);
 assert.match(src,/function showRankOverview\(\)/);
 assert.match(src,/rankForLevel\(n\)/);
 assert.match(src,/rankLabel\(playerRank\(\)\.rank\)/);
 assert.match(css,/V31: player career rank/);
 assert.match(src,/localStorage\.setItem\('ok-kacis-v1'/);
 assert.match(src,/boardTouchLayer\.addEventListener\('pointerdown'/);
 assert.match(src,/const SIZE = 9, TOTAL_LEVELS = 540/);
});
