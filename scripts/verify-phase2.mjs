import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':200,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
const SLUG=/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/
async function dperm(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button'];for(let i=0;i<4;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/permission/i.test(a))return;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();break}}catch{}}await d.pause(1000)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function slugs(xml){ const s=new Set(); for(const t of tags(xml)){ for(const v of [attr(t,'content-desc'),attr(t,'resource-id').replace(/^.*:id\//,'')]){ if(v && SLUG.test(v) && !/^appmaker/.test(v) && !/[0-9a-f]{8}-[0-9a-f]{4}/.test(v)) s.add(v) } } return [...s].sort() }
function check(xml,label,list){ const present=slugs(xml); console.log(`\n--- ${label} ---`); for(const id of list){ console.log(`  [${present.includes(id)?'PASS':'MISS'}] ~${id}`) } const extra=present.filter(p=>!list.includes(p)); if(extra.length) console.log('  other testIDs here: '+extra.join(' ')) }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dperm()
  let xml=await wait()

  check(xml,'HOME',['product-card','product-price','product-mrp','product-quick-add','home-banner','home-section-arrow','home-category-card','menu-open'])

  // MENU
  await tap('~menu-open'); await d.pause(2000); xml=await d.getPageSource()
  check(xml,'HAMBURGER MENU',['menu-shop-all','menu-perfumes','menu-skincare','menu-cosmetics','menu-expand-perfumes','menu-perfumes-all','menu-perfumes-women'])

  // PLP via menu-shop-all
  await tap('~menu-shop-all'); await d.pause(3000); await wait(); xml=await d.getPageSource()
  check(xml,'PLP (real)',['plp-sort','plp-filter','product-card','product-price','product-mrp','product-quick-add','product-variant-cta'])

  // FILTER panel
  if(await tap('~plp-filter')){ await d.pause(2000); xml=await d.getPageSource(); check(xml,'FILTER panel',['filter-apply','filter-close','filter-price-min','filter-price-max','filter-option-in-stock']); await tap('~filter-close')||await d.pressKeyCode(4); await d.pause(1000) }
  // SORT sheet
  if(await tap('~plp-sort')){ await d.pause(1500); xml=await d.getPageSource(); check(xml,'SORT sheet',['sort-option-2','sort-option-3','sort-close']); await tap('~sort-close')||await d.pressKeyCode(4); await d.pause(1000) }

  // PDP
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(1500); await dperm(); await wait()
  const cards=await d.$$('//*[contains(@content-desc,"₹")]'); if(cards.length){ await cards[0].click(); await d.pause(3000); await wait(/pdp-add-to-cart|Reviews|₹/) }
  xml=await d.getPageSource()
  check(xml,'PDP (top)',['pdp-add-to-cart','pdp-qty-plus','pdp-qty-minus','pdp-variant','pdp-tab-overview','pdp-tab-reviews','pdp-tab-view-similar'])
  // scroll for combo / similar / review
  for(let i=0;i<5;i++){ const {width,height}=await d.getWindowSize(); await d.execute('mobile: scrollGesture',{left:Math.round(width*0.5),top:Math.round(height*0.25),width:Math.round(width*0.4),height:Math.round(height*0.5),direction:'down',percent:0.9}); await d.pause(800) }
  xml=await d.getPageSource()
  check(xml,'PDP (scrolled)',['pdp-add-combo','pdp-write-review','similar-product-add','similar-product-variant'])

  // CART via quick-add + View Cart
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(1500); await dperm(); await wait()
  await tap('~product-quick-add'); await d.pause(2500)
  if(await tap('//*[contains(@content-desc,"View Cart")]')){ await d.pause(2500) }
  xml=await d.getPageSource()
  check(xml,'CART',['cart-qty-plus','cart-qty-minus','cart-remove-item','cart-bill-items','cart-bill-saved','cart-bill-delivery','cart-bill-grand-total','cart-bundle-add','cart-combo-tag'])

  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
