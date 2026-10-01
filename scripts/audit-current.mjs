import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':180,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function dperm(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button'];for(let i=0;i<5;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/permission/i.test(a))return;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();break}}catch{}}await d.pause(1000)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
function descs(x){ const s=new Set(); for(const t of tags(x)){ const cd=attr(t,'content-desc'); if(cd) s.add(cd) } return [...s] }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dperm()
  let xml=await wait()
  console.log('=== HOME content-descs (v5.777) ===')
  descs(xml).forEach(c=>console.log('  ~'+c))
  console.log('\n=== does home have ~Shop All / ~Perfumes / category chips? ===')
  for(const k of ['Shop All','Perfumes','Gifting','Skincare','Bath & Body','Cosmetics']){ const has=descs(xml).includes(k); console.log(`  ${has?'YES':'no '}  ~${k}`) }
  console.log('\n=== OPEN DRAWER (menu-open) & dump drawer content-descs ===')
  try{ await (await d.$('~menu-open')).click(); await d.pause(2500) }catch(e){ console.log('  menu-open tap failed:',e.message) }
  xml=await d.getPageSource()
  descs(xml).forEach(c=>console.log('  ~'+c))
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
