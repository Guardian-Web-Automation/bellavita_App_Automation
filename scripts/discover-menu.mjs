import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function dump(xml,label){ console.log(`\n== ${label} ==`); const s=new Set(); for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const clk=attr(t,'clickable'); if(!rid&&!cd&&!tx)return; const lab=`${rid}|${cd}|${tx}`; if(s.has(lab))continue; s.add(lab); if(clk==='true'||/menu-|Perfume|Skincare|Cosmetic|Bath|Gift|All |Women|Men|Login|Account|Order|Wishlist/i.test(`${rid} ${cd} ${tx}`)){ console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"₹")]')).length) break; await d.pause(1500) }
  await tap('~menu-open'); await d.pause(2000)
  dump(await d.getPageSource(),'DRAWER (menu items)')
  // list menu-* ids
  const xml=await d.getPageSource()
  const ids=[...xml.matchAll(/(?:resource-id|content-desc)="(menu-[^"]*)"/g)].map(m=>m[1])
  console.log('\nmenu-* ids:', JSON.stringify([...new Set(ids)]))
  // try expanding Perfumes category (tap its row) to reveal sub-items
  await tap('~menu-perfumes'); await d.pause(1500)
  dump(await d.getPageSource(),'AFTER tap menu-perfumes (expand? or navigate?)')
  console.log('\nback-arrow present / still drawer:', (await d.$$('~Close drawer')).length>0)
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
