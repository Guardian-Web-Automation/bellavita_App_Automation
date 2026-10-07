import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
const barCount=async()=>{const b=await d.$$('//*[contains(@content-desc,"View Cart")]');if(!b.length)return '(no bar)';return (await b[0].getAttribute('content-desc').catch(()=>''))}
function dumpNear(xml,re,label){ console.log(`\n== ${label} ==`); const s=new Set(); for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const clk=attr(t,'clickable'); const lab=`${rid}|${cd}|${tx}`; if(s.has(lab))continue; s.add(lab); if(re.test(rid)||re.test(cd)||re.test(tx)){ console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"Search for")]')).length) break; await d.pause(1500) }
  await tap('//*[contains(@content-desc,"Search for")]'); await d.pause(2000)
  const inp=await d.$$('~Search input'); if(inp.length){ await inp[0].setValue('lip'); await d.pause(2500) }
  // CATEGORY buttons: check visibility with/without keyboard
  console.log('category btn count (starts-with):', (await d.$$('//android.widget.Button[starts-with(@content-desc,", ")]')).length)
  console.log('category btn count (contains comma):', (await d.$$('//android.widget.Button[contains(@content-desc,", ")]')).length)
  try{ if(await d.isKeyboardShown()){ await d.hideKeyboard(); await d.pause(1200); console.log('keyboard hidden') } }catch{}
  const catBtns=await d.$$('//android.widget.Button[contains(@content-desc,", ")]')
  if(catBtns.length){ console.log('first cat displayed?', await catBtns[0].isDisplayed().catch(()=>false), 'cd=', await catBtns[0].getAttribute('content-desc').catch(()=>'')) }
  // RESULTS: submit perfume, examine quick-add behavior
  const inp2=await d.$$('~Search input'); if(inp2.length){ await inp2[0].clearValue(); await inp2[0].setValue('perfume') }
  try{ await d.execute('mobile: performEditorAction',{action:'search'}) }catch{ await d.execute('mobile: pressKey',{keycode:66}) }
  await d.pause(3500)
  console.log('\nbar BEFORE add:', await barCount())
  // find an in-stock quick-add (card without "Out of stock")
  const qa=await d.$$('//*[@content-desc="product-quick-add"]')
  console.log('quick-add count:', qa.length)
  if(qa.length){ await qa[0].click().catch(()=>{}); await d.pause(2500) }
  console.log('bar AFTER add (qa[0]):', await barCount())
  dumpNear(await d.getPageSource(), /qty|stepper|Added|product-quick-add|Remove/i, 'card area after add')
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
