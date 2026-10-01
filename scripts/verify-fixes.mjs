import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function wait(re=/₹/,to=45000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x)||/content-desc="Home"/.test(x))break;await d.pause(2000)}return x}
async function found(sel){ try { return (await d.$$(sel)).length>0 } catch { return false } }
function line(label,ok,extra=''){ console.log(`  [${ok?'PASS':'----'}] ${label}${extra?' — '+extra:''}`) }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); let xml=await wait()

  console.log('\n=== FIX 1: Hamburger drawer button ===')
  const menuOpenAcc = await found('~menu-open')
  const homeDrawerAcc = await found('~home-drawer-button')
  const menuOpenRid = await found('android=new UiSelector().resourceIdMatches(".*menu-open")')
  const homeDrawerRid = await found('android=new UiSelector().resourceIdMatches(".*home-drawer-button")')
  line('~menu-open (accessibility-id)', menuOpenAcc)
  line('~home-drawer-button (accessibility-id)', homeDrawerAcc)
  line('resource-id ...menu-open', menuOpenRid)
  line('resource-id ...home-drawer-button', homeDrawerRid)

  // open drawer by whatever resolves
  let opened=false
  for(const sel of ['~menu-open','~home-drawer-button','android=new UiSelector().resourceIdMatches(".*menu-open")','android=new UiSelector().resourceIdMatches(".*home-drawer-button")']){
    if(await found(sel)){ try { await (await d.$(sel)).click(); opened=true; console.log('  opened drawer via '+sel); break } catch {} }
  }
  await d.pause(2500)

  console.log('\n=== FIX 2: Drawer menu link titles (undefined-title bug) ===')
  xml=await d.getPageSource()
  const undef = tags(xml).filter(t=>attr(t,'content-desc')==='undefined-title').length
  const drawerLabels=[]; for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(cd && /shop all|perfume|skincare|makeup|gifting|cosmetic|bath|all perfumes/i.test(cd)) drawerLabels.push(cd) }
  line('no "undefined-title" links', undef===0, `undefined-title count = ${undef}`)
  console.log('  drawer category labels seen:', [...new Set(drawerLabels)].slice(0,10).join(' | ') || '(none)')

  console.log('\n=== FIX 3: PLP Sort / Filter (Hamburger -> Shop All) ===')
  let onPlp=false
  if(await found('~Shop All')){ try { await (await d.$('~Shop All')).click(); await d.pause(3000); await wait(); onPlp=true } catch {} }
  xml=await d.getPageSource()
  const hasSort = tags(xml).some(t=>/sort/i.test(attr(t,'content-desc')+attr(t,'text')))
  const hasFilter = tags(xml).some(t=>/filter/i.test(attr(t,'content-desc')+attr(t,'text')))
  line('Sort control present', hasSort)
  line('Filter control present', hasFilter)
  if(hasSort||hasFilter){ for(const t of tags(xml)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'); if(/sort|filter/i.test(cd+tx)) console.log(`     -> cd="${cd}" text="${tx}" [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]`) } }

  console.log('\n=== FIX 4: PDP Add to Cart ===')
  // relaunch home -> open a product -> check add to cart
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await wait()
  const card = (await d.$$('//*[contains(@content-desc,"₹")]'))
  if(card.length){ try { await card[0].click(); await d.pause(3000); await wait(/Reviews|₹/) } catch {} }
  xml=await d.getPageSource()
  const pdpAtcAcc = await found('~pdp-add-to-cart')
  const pdpAtcText = tags(xml).some(t=>/add to cart|add to bag|buy now/i.test(attr(t,'content-desc')+attr(t,'text')))
  const pdpAtcRid = await found('android=new UiSelector().resourceIdMatches(".*(add-to-cart|add_to_cart|addtocart)")')
  line('~pdp-add-to-cart (accessibility-id)', pdpAtcAcc)
  line('Add-to-cart by text/content-desc on PDP', pdpAtcText)
  line('resource-id add-to-cart on PDP', pdpAtcRid)

  console.log('\nDONE')
} finally { await d.deleteSession() }
