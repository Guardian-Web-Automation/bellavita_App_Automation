import { remote } from 'webdriverio'
import { writeFileSync } from 'node:fs'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const OUT='scripts/audit-output'
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const bounds=(t)=>{const m=t.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return m?m.slice(1).map(Number):null}
async function waitContent(re=/₹/,to=45000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x)||/content-desc="Home"/.test(x))break;await d.pause(2000)}return x}
function tags(x){return x.match(/<[^/][^>]*?\/?>/g)||[]}
async function dumpClickable(x,label){
  console.log(`\n--- ${label}: clickable / image / button elements ---`)
  for(const t of tags(x)){
    const cls=attr(t,'class'), cd=attr(t,'content-desc'), rid=attr(t,'resource-id'), clk=attr(t,'clickable')
    if(clk==='true' || /ImageButton|ImageView|Button/.test(cls)){
      const b=bounds(t)
      console.log(`  [${cls.replace(/^android\.(widget|view)\./,'')}] cd="${cd}" rid="${rid}" clickable=${clk} bounds=${b?`${b[0]},${b[1]}`:'?'}`)
    }
  }
}
async function tapXY(x,y){ await d.execute('mobile: clickGesture',{x,y}) }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg)
  let xml=await waitContent()
  const {width,height}=await d.getWindowSize()
  console.log('WINDOW',width,height)
  await dumpClickable(xml,'HOME top area')

  // Find a clickable/image element in the top-left corner (the hamburger ☰).
  let ham=null
  for(const t of tags(xml)){
    const cls=attr(t,'class'), clk=attr(t,'clickable'); const b=bounds(t)
    if(!b) continue
    const cx=(b[0]+b[2])/2, cy=(b[1]+b[3])/2
    if(cy<height*0.14 && cx<width*0.25 && (clk==='true'||/ImageButton|ImageView/.test(cls))){ ham={cx,cy,t}; break }
  }
  console.log('\nHAMBURGER candidate:', ham?`center ${Math.round(ham.cx)},${Math.round(ham.cy)} [${attr(ham.t,'class')}]`:'NONE — will tap 40, top')
  await tapXY(ham?Math.round(ham.cx):40, ham?Math.round(ham.cy):Math.round(height*0.07))
  await d.pause(2500)
  xml=await d.getPageSource(); writeFileSync(`${OUT}/hamburger-menu.xml`, xml,'utf8')
  console.log('\n=== HAMBURGER MENU content-descs (saved hamburger-menu.xml) ===')
  for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(cd) console.log('  ~'+cd) }

  // Tap "Shop All" in the menu → real PLP
  let shopAll=null
  for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(/^shop all$/i.test(cd)){ const b=bounds(t); shopAll=b?{cx:(b[0]+b[2])/2,cy:(b[1]+b[3])/2}:null; break } }
  if(shopAll){ console.log(`\ntapping Shop All @ ${Math.round(shopAll.cx)},${Math.round(shopAll.cy)}`); await tapXY(Math.round(shopAll.cx),Math.round(shopAll.cy)); await d.pause(3500); await waitContent() }
  else console.log('\nShop All not found in menu by content-desc')
  xml=await d.getPageSource(); writeFileSync(`${OUT}/plp-real.xml`, xml,'utf8')
  console.log('\n=== REAL PLP (menu→Shop All) — sort/filter present? (saved plp-real.xml) ===')
  const found=new Set()
  for(const t of tags(xml)){ const cd=attr(t,'content-desc'),tx=attr(t,'text'); const s=(cd+' '+tx); if(/sort|filter/i.test(s)){ const cls=attr(t,'class'); const key=`[${cls.replace(/^android\.(widget|view)\./,'')}] cd="${cd}" text="${tx}"`; if(!found.has(key)){found.add(key);console.log('  '+key)} } }
  if(!found.size) console.log('  (no sort/filter labels found)')
  await dumpClickable(xml,'REAL PLP bottom-bar area')
  console.log('\nDONE')
} finally { await d.deleteSession() }
