import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg)
  // wait up to 50s for ANY meaningful content
  let xml=''; const e=Date.now()+50000
  while(Date.now()<e){ xml=await d.getPageSource(); if(/₹/.test(xml)||/content-desc="Home"/.test(xml)) break; await d.pause(2500) }
  console.log('current activity:', await d.getCurrentActivity().catch(()=>'?'))
  const rupee = tags(xml).filter(t=>/content-desc="[^"]*₹/.test(t)).length
  console.log('₹ product-card nodes:', rupee)
  console.log('total nodes:', tags(xml).length)
  console.log('\n=== ALL non-empty content-descs on current screen ===')
  const seen=new Set(); for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(cd && !seen.has(cd)){seen.add(cd); console.log('  ~'+cd)} }
  console.log('\n=== top-left clickable/image elements (hamburger area) ===')
  for(const t of tags(xml)){ const b=t.match(/bounds="\[(\d+),(\d+)\]/); const cls=attr(t,'class'); const clk=attr(t,'clickable'); if(b){ const x=+b[1],y=+b[2]; if(y<260 && x<300 && (clk==='true'||/Image|Button/.test(cls))) console.log(`  [${cls.replace(/^android\.(widget|view)\./,'')}] cd="${attr(t,'content-desc')}" rid="${attr(t,'resource-id')}" clickable=${clk} @${x},${y}`) } }
  console.log('\nDONE')
} finally { await d.deleteSession() }
