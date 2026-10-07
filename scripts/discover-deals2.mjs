import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
const count=async sel=>(await d.$$(sel)).length
function dump(xml,label){ console.log(`\n== ${label} ==`); const s=new Set(); for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const clk=attr(t,'clickable'); if(!rid&&!cd&&!tx)continue; const lab=`${rid}|${cd}|${tx}`; if(s.has(lab))continue; s.add(lab); console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"₹")]')).length) break; await d.pause(1500) }
  await tap('~nav-crazy-deals'); await d.pause(3000)
  await tap('~Build Your Box'); await d.pause(3000)
  // select until 3 "Remove" present (robust)
  for(let i=0;i<10 && (await count('~Remove'))<3;i++){ await tap('~Add To Box'); await d.pause(1200) }
  console.log('Remove count (selected):', await count('~Remove'))
  dump(await d.getPageSource(),'BUILDER with 3 selected (look for ADD TO CART bar)')
  console.log('\nADD TO CART text:', await count('//*[contains(@text,"ADD TO CART") or contains(@content-desc,"ADD TO CART") or contains(@text,"Add to Cart") or contains(@content-desc,"Add to Cart")]'))
  console.log('Add To Box remaining:', await count('~Add To Box'))
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
