import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function dump(xml,re,label){ console.log(`\n== ${label} ==`); const s=new Set(); for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const clk=attr(t,'clickable'); const lab=`${rid}|${cd}|${tx}`; if(s.has(lab))continue; s.add(lab); if(re.test(rid)||re.test(cd)||re.test(tx)){ console.log(`  [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"₹")]')).length) break; await d.pause(1500) }
  // open drawer -> Shop All (real PLP)
  await tap('~menu-open'); await d.pause(1500)
  await tap('~menu-shop-all'); await d.pause(3500)
  console.log('on PLP, filter-button present:', (await d.$$('~filter-button')).length>0, ' sort-button:', (await d.$$('~sort-button')).length>0)
  // FILTER: open and dump tabs + options with labels
  if(await tap('~filter-button')){ await d.pause(2000)
    dump(await d.getPageSource(), /filter|stock|Avail|Price|Note|Type|Brand|Category/i, 'FILTER PANEL (tabs/options)')
    // enumerate filter-item-list and filter-option ids with their text
    for(let i=0;i<6;i++){ const e=await d.$$(`~filter-item-list-${i}`); if(e.length){ const tx=await e[0].getText().catch(()=>''); console.log(`  filter-item-list-${i} text="${tx}"`) } }
    await d.back(); await d.pause(1200)
  }
  // VARIANT: scan cards for a shade/variant/option CTA
  dump(await d.getPageSource(), /Shade|Variant|Option|Select|Colour|Color/i, 'CARD variant-CTA scan')
  console.log('\nvariant text candidates:', (await d.$$('//*[contains(@text,"Shade") or contains(@text,"Variant") or contains(@text,"Option") or contains(@content-desc,"Shade") or contains(@content-desc,"Variant")]')).length)
  console.log('out-of-stock candidates:', (await d.$$('//*[contains(@text,"Out of stock") or contains(@content-desc,"Out of stock")]')).length)
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
