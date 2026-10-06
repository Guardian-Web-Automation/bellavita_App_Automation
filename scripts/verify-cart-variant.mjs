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
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dperm(); await wait()

  console.log('=== CART: quick-add then open cart ===')
  const qa=await tap('~product-quick-add'); console.log('quick-add tapped:', qa); await d.pause(3000)
  let xml=await d.getPageSource()
  const bar=tags(xml).map(t=>attr(t,'content-desc')).find(cd=>/view cart/i.test(cd))
  console.log('View Cart bar:', bar||'(none)')
  // try tapping cart bar by testid then by text
  const opened = await tap('~cart-bar') || await tap('//*[contains(@content-desc,"View Cart")]')
  console.log('cart bar tapped:', opened); await d.pause(3000)
  xml=await d.getPageSource()
  const onCart = /PLACE ORDER/i.test(xml) || slugs(xml).some(s=>s.startsWith('cart-'))
  console.log('on cart screen:', onCart)
  console.log('cart screen testIDs:', slugs(xml).join(' ') || '(none)')
  for(const id of ['cart-qty-plus','cart-qty-minus','cart-remove-item','cart-bill-items','cart-bill-saved','cart-bill-delivery','cart-bill-grand-total','cart-bundle-add','cart-combo-tag','place-order','cart-place-order']){ console.log(`  [${slugs(xml).includes(id)?'PASS':'MISS'}] ~${id}`) }

  console.log('\n=== PDP VARIANT: open products, look for a variant CTA + popup ===')
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(1500); await dperm(); await wait()
  // open PLP and scan cards for a variant-style CTA ("Variant"/"Shades"/"Option")
  await tap('~menu-open'); await d.pause(1500); await tap('~menu-perfumes'); await d.pause(3000); await wait()
  xml=await d.getPageSource()
  const variantCds=[...new Set(tags(xml).map(t=>attr(t,'content-desc')).filter(cd=>/variant|shade|option/i.test(cd)))]
  console.log('variant-ish labels on PLP:', variantCds.slice(0,8).join(' | ')||'(none)')
  // tap the first variant CTA if present
  if(variantCds.length){ await tap(`~${variantCds[0]}`); await d.pause(2500); xml=await d.getPageSource(); console.log('after variant tap — testIDs:', slugs(xml).filter(s=>/variant|option|shade|select/.test(s)).join(' ')||'(none variant-specific)') }
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
