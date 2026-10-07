import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
async function tapText(t){return tap(`//*[@text="${t}"]`)||tap(`//*[contains(@content-desc,"${t}")]`)}
function dump(xml,label){
  console.log(`\n==== ${label} ====`)
  const seen=new Set()
  for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const cls=attr(t,'class').replace(/^android\.(widget|view)\./,''); const clk=attr(t,'clickable')
    if(!rid && !cd && !tx) continue
    const key=`${rid}|${cd}|${tx}`; if(seen.has(key))continue; seen.add(key)
    console.log(`  [${cls}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) }
}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"Search for")]')).length) break; await d.pause(1500) }
  // open search
  await tap('//*[contains(@content-desc,"Search for")]'); await d.pause(2500)
  dump(await d.getPageSource(),'SEARCH LANDING (recent/trending)')
  // type a query
  const inp = await d.$$('~Search input')
  if(inp.length){ await inp[0].setValue('lip'); await d.pause(2500) }
  dump(await d.getPageSource(),'AFTER TYPING "lip" (suggestions/categories)')
  // submit
  try{ await d.execute('mobile: performEditorAction',{action:'search'}) }catch{ await d.execute('mobile: pressKey',{keycode:66}) }
  await d.pause(3500)
  dump(await d.getPageSource(),'RESULTS GRID')
  // try open Filter / Sort by text
  const beforeFilter = await d.getPageSource()
  if(await tapText('Filter')){ await d.pause(2000); dump(await d.getPageSource(),'AFTER tap Filter'); await d.back(); await d.pause(1200) }
  else console.log('\n(no Filter text found)')
  if(await tapText('Sort')){ await d.pause(2000); dump(await d.getPageSource(),'AFTER tap Sort'); await d.back(); await d.pause(1200) }
  else console.log('\n(no Sort text found)')
  // look for variant CTA "Shades"/"Variant"
  const vx = await d.$$('//*[contains(@text,"Shade") or contains(@text,"Variant") or contains(@content-desc,"Shade") or contains(@content-desc,"Variant")]')
  console.log('\nvariant-CTA candidates:', vx.length)
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
