import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function found(sel){ try { return (await d.$$(sel)).length>0 } catch { return false } }
function line(label,ok,extra=''){ console.log(`  [${ok?'PASS':'----'}] ${label}${extra?' — '+extra:''}`) }
async function dismissPermissions(){
  const btns=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button','com.android.permissioncontroller:id/permission_allow_one_time_button']
  for(let i=0;i<6;i++){
    const act=await d.getCurrentActivity().catch(()=>'')
    if(!/GrantPermissions|permission/i.test(act)) return
    let tapped=false
    for(const b of btns){ try{ const els=await d.$$(`android=new UiSelector().resourceId("${b}")`); if(els.length){ await els[0].click(); tapped=true; break } }catch{} }
    if(!tapped) break
    await d.pause(1200)
  }
}
async function wait(re=/₹/,to=45000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x)||/content-desc="Home"/.test(x))break;await d.pause(2000)}return x}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000)
  await dismissPermissions()
  let xml=await wait(/₹/,60000)
  const rupee = tags(xml).filter(t=>/content-desc="[^"]*₹/.test(t)).length
  console.log('activity:', await d.getCurrentActivity().catch(()=>'?'), '| ₹ cards:', rupee)
  if(rupee===0){ console.log('HOME STILL NOT LOADED — cannot verify.'); await d.deleteSession(); process.exit(0) }

  console.log('\n=== FIX 1: Hamburger drawer button ===')
  const checks1={'~menu-open':await found('~menu-open'),'~home-drawer-button':await found('~home-drawer-button'),'rid ...menu-open':await found('android=new UiSelector().resourceIdMatches(".*menu-open")'),'rid ...home-drawer-button':await found('android=new UiSelector().resourceIdMatches(".*home-drawer-button")')}
  for(const [k,v] of Object.entries(checks1)) line(k,v)
  let opened=false
  for(const sel of ['~menu-open','~home-drawer-button','android=new UiSelector().resourceIdMatches(".*menu-open")','android=new UiSelector().resourceIdMatches(".*home-drawer-button")']){ if(await found(sel)){ try{ await (await d.$(sel)).click(); opened=true; console.log('  drawer opened via '+sel); break }catch{} } }
  if(!opened){ // fallback: tap top-left corner
    const {width,height}=await d.getWindowSize(); await d.execute('mobile: clickGesture',{x:Math.round(width*0.06),y:Math.round(height*0.08)}); console.log('  drawer: tapped top-left by coordinates (fallback)')
  }
  await d.pause(2500)

  console.log('\n=== FIX 2: Drawer menu link titles ===')
  xml=await d.getPageSource()
  const undef=tags(xml).filter(t=>attr(t,'content-desc')==='undefined-title').length
  const closeDrawer=await found('~Close drawer')
  const labels=[...new Set(tags(xml).map(t=>attr(t,'content-desc')).filter(cd=>/shop all|perfume|skincare|makeup|gifting|cosmetic|bath|all perfumes|login|orders|faq|support/i.test(cd)))]
  line('drawer actually open (Close drawer present)', closeDrawer)
  line('no "undefined-title" links', closeDrawer && undef===0, `undefined-title count=${undef}`)
  console.log('  drawer labels:', labels.slice(0,14).join(' | ')||'(none)')

  console.log('\n=== FIX 3: PLP Sort / Filter ===')
  if(await found('~Shop All')){ try{ await (await d.$('~Shop All')).click(); await d.pause(3000); await wait() }catch{} }
  xml=await d.getPageSource()
  const hasSort=tags(xml).some(t=>/sort/i.test(attr(t,'content-desc')+attr(t,'text')))
  const hasFilter=tags(xml).some(t=>/filter/i.test(attr(t,'content-desc')+attr(t,'text')))
  line('Sort present',hasSort); line('Filter present',hasFilter)
  if(hasSort||hasFilter) for(const t of tags(xml)){ const s=attr(t,'content-desc')+'|'+attr(t,'text'); if(/sort|filter/i.test(s)) console.log(`     -> cd="${attr(t,'content-desc')}" text="${attr(t,'text')}"`) }

  console.log('\n=== FIX 4: PDP Add to Cart ===')
  await d.activateApp(pkg); await d.pause(1000); await dismissPermissions(); await wait()
  const cards=await d.$$('//*[contains(@content-desc,"₹")]')
  if(cards.length){ try{ await cards[0].click(); await d.pause(3000); await wait(/Reviews|₹/) }catch{} }
  xml=await d.getPageSource()
  line('~pdp-add-to-cart', await found('~pdp-add-to-cart'))
  line('add-to-cart by text/desc on PDP', tags(xml).some(t=>/add to cart|add to bag|buy now/i.test(attr(t,'content-desc')+attr(t,'text'))))
  line('rid add-to-cart on PDP', await found('android=new UiSelector().resourceIdMatches(".*(add.?to.?cart|addtocart)")'))
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
