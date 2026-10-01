import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const bnds=(t)=>{const m=t.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return m?m.slice(1).map(Number):null}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function dismissPerms(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button'];for(let i=0;i<6;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/GrantPermissions|permission/i.test(a))return;let tp=false;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();tp=true;break}}catch{}}if(!tp)break;await d.pause(1200)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
async function scan(label){ const x=await d.getPageSource(); const hits=[]; for(const t of tags(x)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'); if(/add to cart|add to bag|buy now|proceed/i.test(cd+' '+tx)){ const b=bnds(t); hits.push(`cd="${cd}" text="${tx}" ${b?`y=${b[1]}-${b[3]}`:''}`) } } console.log(`  [${label}] add-to-cart/buy matches: ${hits.length}`); hits.slice(0,6).forEach(h=>console.log('     - '+h)); return x }
async function scrollDown(){ const {width,height}=await d.getWindowSize(); await d.execute('mobile: scrollGesture',{left:Math.round(width*0.5),top:Math.round(height*0.25),width:Math.round(width*0.4),height:Math.round(height*0.5),direction:'down',percent:0.9}) }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dismissPerms(); await wait()
  const cards=await d.$$('//*[contains(@content-desc,"₹")]')
  if(cards.length){ await cards[0].click(); await d.pause(3500); await wait(/Reviews|₹/) }
  console.log('=== scanning PDP top→bottom for any add-to-cart/buy control ===')
  await scan('landing')
  for(let i=1;i<=6;i++){ await scrollDown(); await d.pause(1200); await scan('scroll '+i) }
  console.log('\nInterpretation: a REAL sticky/main CTA shows a match at a stable bottom y across scrolls; matches only inside "Similar Products" (lower, varying) are quick-add cards, not the PDP CTA.')
  console.log('DONE')
} finally { try{await d.deleteSession()}catch{} }
