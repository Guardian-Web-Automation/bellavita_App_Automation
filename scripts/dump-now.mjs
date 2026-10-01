import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:autoLaunch':false,'appium:newCommandTimeout':120 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
try {
  console.log('activity:', await d.getCurrentActivity().catch(()=>'?'))
  const xml=await d.getPageSource()
  console.log('total nodes:', tags(xml).length)
  console.log('\n=== content-descs ==='); { const s=new Set(); for(const t of tags(xml)){ const cd=attr(t,'content-desc'); if(cd&&!s.has(cd)){s.add(cd);console.log('  ~'+cd)} } }
  console.log('\n=== text nodes ==='); { const s=new Set(); for(const t of tags(xml)){ const tx=attr(t,'text'); if(tx&&!s.has(tx)){s.add(tx);console.log('  "'+tx.slice(0,70)+'"')} } }
} finally { try{await d.deleteSession()}catch{} }
