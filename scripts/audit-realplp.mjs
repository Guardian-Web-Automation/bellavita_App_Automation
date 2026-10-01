import { remote } from 'webdriverio'
import { writeFileSync } from 'node:fs'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const OUT='scripts/audit-output'
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const bnds=(t)=>{const m=t.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return m?m.slice(1).map(Number):null}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function waitContent(re=/₹/,to=45000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x)||/content-desc="Home"/.test(x))break;await d.pause(2000)}return x}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg)
  await waitContent()
  // open drawer via its real testID
  await d.$('~home-drawer-button').click(); await d.pause(2000)
  let xml=await d.getPageSource()
  // collect the "undefined-title" drawer rows with their centers, top-to-bottom
  const rows=[]
  for(const t of tags(xml)){ if(attr(t,'content-desc')==='undefined-title'){ const b=bnds(t); if(b) rows.push({cy:(b[1]+b[3])/2, cx:(b[0]+b[2])/2, b}) } }
  rows.sort((a,b)=>a.cy-b.cy)
  console.log('undefined-title rows (top→bottom):', rows.map(r=>`${Math.round(r.cx)},${Math.round(r.cy)}`).join('  '))
  if(!rows.length){ console.log('no drawer rows found'); }
  else {
    const first=rows[0]
    console.log(`tapping first drawer link @ ${Math.round(first.cx)},${Math.round(first.cy)}`)
    await d.execute('mobile: clickGesture',{x:Math.round(first.cx),y:Math.round(first.cy)})
    await d.pause(3500); await waitContent()
    xml=await d.getPageSource(); writeFileSync(`${OUT}/plp-real2.xml`,xml,'utf8')
    console.log('\n=== after first drawer link (saved plp-real2.xml) ===')
    const hits=new Set()
    for(const t of tags(xml)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'); const s=cd+' '+tx; if(/sort|filter/i.test(s)){ const k=`[${attr(t,'class').replace(/^android\.(widget|view)\./,'')}] cd="${cd}" text="${tx}"`; if(!hits.has(k)){hits.add(k);console.log('  SORT/FILTER: '+k)} } }
    if(!hits.size) console.log('  (still no sort/filter)')
    // is this a product grid? count ₹ cards + show a title if any
    let n=0; for(const t of tags(xml)){ if(/content-desc="[^"]*₹/.test(t)) n++ }
    console.log('  ₹ product-card nodes:', n)
    console.log('  bottom-bar clickables:')
    const {height}=await d.getWindowSize()
    for(const t of tags(xml)){ const b=bnds(t); if(b && (b[1]+b[3])/2>height*0.82 && attr(t,'clickable')==='true'){ console.log(`    cd="${attr(t,'content-desc')}" [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}] @${Math.round((b[0]+b[2])/2)},${Math.round((b[1]+b[3])/2)}`) } }
  }
  console.log('\nDONE')
} finally { await d.deleteSession() }
