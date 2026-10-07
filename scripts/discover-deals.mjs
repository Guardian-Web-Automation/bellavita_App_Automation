import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function dump(xml,label){ console.log(`\n== ${label} ==`); const s=new Set(); for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const clk=attr(t,'clickable'); if(!rid&&!cd&&!tx)continue; const lab=`${rid}|${cd}|${tx}`; if(s.has(lab))continue; s.add(lab); console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"₹")]')).length) break; await d.pause(1500) }
  await tap('~nav-crazy-deals'); await d.pause(3000)
  console.log('Build Your Box present:', (await d.$$('~Build Your Box')).length>0)
  await tap('~Build Your Box'); await d.pause(3000)
  dump(await d.getPageSource(),'BUILDER initial')
  // add first few Add To Box
  for(let i=0;i<3;i++){ if(await tap('~Add To Box')){ await d.pause(1200) } }
  dump(await d.getPageSource(),'BUILDER after adding ~3')
  console.log('\nADD TO CART text present:', (await d.$$('//*[contains(@text,"ADD TO CART") or contains(@content-desc,"ADD TO CART")]')).length)
  console.log('Add To Box count:', (await d.$$('~Add To Box')).length, ' Remove count:', (await d.$$('~Remove')).length)
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
