import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':120 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg)
  const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
  // wait for the nav / feed to render
  let xml=''
  const end=Date.now()+45000
  while(Date.now()<end){ xml=await d.getPageSource(); if(/content-desc="Home"/.test(xml)||/₹/.test(xml)) break; await d.pause(2000) }
  const tags = xml.match(/<[^/][^>]*?\/?>/g) || []
  console.log('=== Button-class content-descs (bottom nav) ===')
  for (const t of tags) { if (attr(t,'class')==='android.widget.Button') console.log('  ~'+attr(t,'content-desc')) }
  console.log('\n=== ALL non-empty content-descs (order = tree order) ===')
  for (const t of tags) { const cd=attr(t,'content-desc'); if (cd) console.log('  ~'+cd) }
} finally { await d.deleteSession() }
