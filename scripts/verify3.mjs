import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function found(sel){ try { return (await d.$$(sel)).length>0 } catch { return false } }
async function tap(sel){ try{ const e=await d.$$(sel); if(e.length){ await e[0].click(); return true } }catch{} return false }
function P(label,ok,extra=''){ console.log(`  [${ok?'PASS':'FAIL'}] ${label}${extra?' — '+extra:''}`) }
async function dismissPerms(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button','com.android.permissioncontroller:id/permission_allow_one_time_button'];for(let i=0;i<6;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/GrantPermissions|permission/i.test(a))return;let tp=false;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();tp=true;break}}catch{}}if(!tp)break;await d.pause(1200)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dismissPerms()
  let xml=await wait()
  const rupee=tags(xml).filter(t=>/content-desc="[^"]*₹/.test(t)).length
  console.log('home loaded — ₹ cards:', rupee)
  if(rupee===0){ console.log('HOME BLANK — cannot verify'); await d.deleteSession(); process.exit(0) }

  console.log('\n=== FIX 5: Product card quick-add + price testIDs (home) ===')
  P('~product-quick-add', await found('~product-quick-add'))
  P('~product-price', await found('~product-price'))
  P('~product-mrp', await found('~product-mrp'))
  P('~product-card', await found('~product-card'))

  console.log('\n=== FIX 2: Hamburger open button ===')
  const menuOpen=await found('~menu-open')
  P('~menu-open (accessibility id)', menuOpen)
  const opened = await tap('~menu-open') || await tap('android=new UiSelector().resourceIdMatches(".*menu-open")')
  if(!opened){ const {width,height}=await d.getWindowSize(); await d.execute('mobile: clickGesture',{x:Math.round(width*0.06),y:Math.round(height*0.08)}); console.log('  (fell back to coordinate tap to open drawer)') }
  await d.pause(2500)

  console.log('\n=== FIX 1: Hamburger menu links (undefined-title + testIDs) ===')
  xml=await d.getPageSource()
  const undef=tags(xml).filter(t=>attr(t,'content-desc')==='undefined-title').length
  P('no "undefined-title" links', undef===0, `count=${undef}`)
  const menuShopAll=await found('~menu-shop-all')||await found('~menu-shopall')
  const menuPerfumes=await found('~menu-perfumes')
  P('~menu-shop-all', menuShopAll)
  P('~menu-perfumes', menuPerfumes)
  console.log('  menu-* testIDs seen:', [...new Set(tags(xml).map(t=>attr(t,'content-desc')).filter(cd=>/^menu-/.test(cd)))].join(' | ')||'(none)')

  console.log('\n=== FIX 4: PLP Sort + Filter (via menu -> Shop All) ===')
  const wentPlp = await tap('~menu-shop-all') || await tap('~menu-shopall')
  if(wentPlp){ await d.pause(3500); await wait() } else console.log('  (could not tap ~menu-shop-all)')
  xml=await d.getPageSource()
  P('~plp-sort', await found('~plp-sort'))
  P('~plp-filter', await found('~plp-filter'))
  const sortText=tags(xml).some(t=>/sort/i.test(attr(t,'content-desc')+attr(t,'text')))
  const filterText=tags(xml).some(t=>/filter/i.test(attr(t,'content-desc')+attr(t,'text')))
  P('Sort present (any form)', sortText)
  P('Filter present (any form)', filterText)

  console.log('\n=== FIX 3: PDP Add to Cart ===')
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(1500); await dismissPerms(); await wait()
  const cards=await d.$$('//*[contains(@content-desc,"₹")]')
  if(cards.length){ await cards[0].click(); await d.pause(3500); await wait(/Reviews|₹/) }
  xml=await d.getPageSource()
  P('~pdp-add-to-cart', await found('~pdp-add-to-cart'))
  P('add-to-cart present (any form)', tags(xml).some(t=>/add to cart|add to bag|buy now/i.test(attr(t,'content-desc')+attr(t,'text'))))

  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
