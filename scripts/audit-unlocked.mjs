import { remote } from 'webdriverio'
import { writeFileSync } from 'node:fs'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const OUT='scripts/audit-output'
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const bnds=(t)=>{const m=t.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return m?m.slice(1).map(Number):null}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function dperm(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button'];for(let i=0;i<4;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/permission/i.test(a))return;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();break}}catch{}}await d.pause(1000)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function dumpControls(x,label,re){ console.log(`\n--- ${label} ---`); const seen=new Set(); for(const t of tags(x)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'),rid=attr(t,'resource-id'); const s=cd+' '+tx+' '+rid; if(re.test(s)){ const key=`cd="${cd}" text="${tx}" rid="${rid}"`; if(!seen.has(key)){seen.add(key); const b=bnds(t); console.log(`  ${key} [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${b?` y=${b[1]}`:''}`)} } } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dperm(); await wait()

  console.log('=== A) open drawer via menu-open, tap menu-shop-all -> real PLP ===')
  await tap('~menu-open'); await d.pause(2000)
  const wentPlp = await tap('~menu-shop-all'); await d.pause(3500); await wait()
  console.log('menu-shop-all tapped:', wentPlp)
  let xml=await d.getPageSource(); writeFileSync(`${OUT}/plp-sortfilter.xml`,xml,'utf8')
  dumpControls(xml,'SORT / FILTER controls on real PLP', /sort|filter/i)
  dumpControls(xml,'quick-add / add-to-cart on PLP', /add.?to.?cart|product-quick-add|quick.?add/i)
  const plpCards=tags(xml).filter(t=>/content-desc="[^"]*₹/.test(t)).length
  console.log('  ₹ product cards on PLP:', plpCards)

  console.log('\n=== B) tap Sort -> options ===')
  if(await tap('~plp-sort')||await tap('//*[contains(@content-desc,"Sort") or contains(@text,"Sort")]')){ await d.pause(2000); xml=await d.getPageSource(); dumpControls(xml,'SORT sheet options', /low to high|high to low|price|featured|popular|newest|sort/i) } else console.log('  could not open Sort')
  // close any sheet
  await d.pressKeyCode(4).catch(()=>{}); await d.pause(1000)

  console.log('\n=== C) tap Filter -> panel ===')
  if(await tap('~plp-filter')||await tap('//*[contains(@content-desc,"Filter") or contains(@text,"Filter")]')){ await d.pause(2000); xml=await d.getPageSource(); dumpControls(xml,'FILTER panel', /filter|price|availability|in stock|apply|perfume notes|gender|clear/i) } else console.log('  could not open Filter')
  await d.pressKeyCode(4).catch(()=>{}); await d.pause(1000)

  console.log('\n=== D) PDP add-to-cart flow ===')
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(1500); await dperm(); await wait()
  const cards=await d.$$('//*[contains(@content-desc,"₹")]')
  if(cards.length){ await cards[0].click(); await d.pause(3500); await wait(/Reviews|₹/) }
  xml=await d.getPageSource(); writeFileSync(`${OUT}/pdp-atc.xml`,xml,'utf8')
  dumpControls(xml,'PDP add-to-cart control', /pdp-add-to-cart|add.?to.?cart|buy now/i)
  const cartBefore=(()=>{for(const t of tags(xml)){const cd=attr(t,'content-desc');if(/view cart/i.test(cd)){const m=cd.match(/(\d+)\s*Items?/i);return m?+m[1]:0}}return -1})()
  console.log('  cart count before:', cartBefore)
  if(await tap('~pdp-add-to-cart')){ await d.pause(3000); xml=await d.getPageSource(); const after=(()=>{for(const t of tags(xml)){const cd=attr(t,'content-desc');if(/view cart/i.test(cd)){const m=cd.match(/(\d+)\s*Items?/i);return m?+m[1]:0}}return -1})(); const bar=/content-desc="[^"]*view cart/i.test(xml); console.log('  tapped ~pdp-add-to-cart -> View Cart bar:', bar, '| cart count after:', after) } else console.log('  ~pdp-add-to-cart not tappable')
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
