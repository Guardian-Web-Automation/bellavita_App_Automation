import { remote } from 'webdriverio'
import { writeFileSync } from 'node:fs'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const OUT='scripts/audit-output'
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function waitContent(re=/₹/,to=45000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x)||/content-desc="Home"/.test(x))break;await d.pause(2000)}return x}
function dumpCD(x,label){ console.log(`\n--- ${label}: content-descs ---`); const seen=new Set(); for(const t of tags(x)){ const cd=attr(t,'content-desc'); if(cd && !seen.has(cd)){seen.add(cd); console.log('  ~'+cd)} } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await waitContent()
  // go to Crazy Deals
  await d.$('~Crazy Deals').click(); await d.pause(3000); await waitContent(/Build Your Box/)
  let xml=await d.getPageSource(); writeFileSync(`${OUT}/crazydeals.xml`,xml,'utf8')
  dumpCD(xml,'CRAZY DEALS page (saved crazydeals.xml)')
  // open the first Build Your Box
  const bybs=await d.$$('~Build Your Box')
  console.log('\nBuild Your Box count:', bybs.length)
  if(bybs.length){ await bybs[0].click(); await d.pause(4000); await waitContent(/₹|STEP|Add To Box/i) }
  xml=await d.getPageSource(); writeFileSync(`${OUT}/box-builder.xml`,xml,'utf8')
  dumpCD(xml,'BOX BUILDER (saved box-builder.xml)')
  console.log('\n=== builder text nodes (STEP / instructions) ===')
  {const seen=new Set(); for(const t of tags(xml)){ const tx=attr(t,'text'); if(tx && /step|choose|add to box|remove|product \d|add to cart/i.test(tx) && !seen.has(tx)){seen.add(tx); console.log('  text="'+tx.slice(0,60)+'"')} }}
  console.log('\n=== builder key controls (content-desc matching) ===')
  for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(/add to box|remove|step|choose|open|product \d|add to cart|search/i.test(cd)) console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}] ~${cd}`) }
  console.log('\nDONE')
} finally { await d.deleteSession() }
