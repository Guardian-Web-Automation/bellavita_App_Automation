import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const bnds=(t)=>{const m=t.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return m?m.slice(1).map(Number):null}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function dismissPerms(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button','com.android.permissioncontroller:id/permission_allow_one_time_button'];for(let i=0;i<6;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/GrantPermissions|permission/i.test(a))return;let tp=false;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();tp=true;break}}catch{}}if(!tp)break;await d.pause(1200)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
function cartCount(x){for(const t of tags(x)){const cd=attr(t,'content-desc');if(/view cart/i.test(cd)){const m=cd.match(/(\d+)\s*Items?/i);return m?+m[1]:0}}return -1}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dismissPerms(); await wait()
  const {width,height}=await d.getWindowSize()
  // open first product
  const cards=await d.$$('//*[contains(@content-desc,"₹")]')
  console.log('home ₹ cards:', cards.length)
  if(cards.length){ await cards[0].click(); await d.pause(3500); await wait(/Reviews|₹/) }
  let xml=await d.getPageSource()
  console.log('\n=== all add-to-cart / buy candidates on PDP (as landed) ===')
  const cands=[]
  for(const t of tags(xml)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'); if(/add to cart|add to bag|buy now/i.test(cd+' '+tx)){ const b=bnds(t); cands.push({cd,tx,rid:attr(t,'resource-id'),cls:attr(t,'class'),b}); console.log(`  cd="${cd}" text="${tx}" rid="${attr(t,'resource-id')}" [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}] ${b?`y=${b[1]}-${b[3]} (h${b[3]-b[1]})`:''}`) } }
  // classify: sticky bottom bar = element whose bottom is near screen bottom
  const sticky=cands.filter(c=>c.b && c.b[3]>height*0.85).sort((a,b)=>b.b[1]-a.b[1])[0]
  console.log('\nsticky bottom CTA candidate:', sticky?`cd="${sticky.cd}" y=${sticky.b[1]}-${sticky.b[3]}`:'NONE (no add-to-cart near screen bottom → likely only Similar-Products cards)')

  // Flow test: read cart count, tap sticky CTA, read again
  const before=cartCount(xml)
  console.log('\ncart count before (View Cart bar):', before<0?'(no bar visible on PDP)':before)
  if(sticky){
    const cx=Math.round((sticky.b[0]+sticky.b[2])/2), cy=Math.round((sticky.b[1]+sticky.b[3])/2)
    console.log(`tapping sticky CTA @ ${cx},${cy}`)
    await d.execute('mobile: clickGesture',{x:cx,y:cy}); await d.pause(3000)
    xml=await d.getPageSource()
    const after=cartCount(xml)
    const nowBar=/content-desc="[^"]*view cart/i.test(xml)
    console.log('after tap → View Cart bar present:', nowBar, '| cart count:', after)
    // any confirmation/added indicator?
    const added=/added to cart|added to bag|item added|go to cart|view cart/i.test(xml)
    console.log('add-to-cart succeeded (bar/confirmation appeared):', added, before>=0&&after>before?`(count ${before}→${after})`:'')
  } else {
    console.log('No sticky CTA to tap — PDP still has no main add-to-cart control (only similar-product cards).')
  }
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
