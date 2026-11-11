const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
const java=fs.readFileSync(path.join(__dirname,'native/MainActivity.java'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
test('one native banner is requested on ALL screens',()=>{assert.match(js,/setBannerVisible\(true\)/);assert.match(java,/wantsBanner = true/);assert.match(java,/bannerContainer = new FrameLayout\(this\)/);});
test('interstitial and rewarded formats entirely absent',()=>{assert.doesNotMatch(java,/showInterstitial|loadInterstitial|InterstitialAd|RewardedAd/);assert.doesNotMatch(js,/showInterstitial|pendingMilestoneInterstitial|advanceFromVictory|watchReward|showRewarded/);assert.doesNotMatch(html,/openRewardLives/);assert.match(js,/\$\('continueBtn'\)\.onclick=\(\)=>transitionToLevel/);});
test('9x9 540 levels preserved',()=>assert.match(js,/const SIZE = 9, TOTAL_LEVELS = 540/));
test('all unknown age requests are treated as child-directed',()=>{assert.match(java,/TAG_FOR_CHILD_DIRECTED_TREATMENT_TRUE/);assert.match(java,/TAG_FOR_UNDER_AGE_OF_CONSENT_TRUE/);assert.match(java,/MAX_AD_CONTENT_RATING_G/);});
