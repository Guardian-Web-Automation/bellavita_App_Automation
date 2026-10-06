import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':120,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
async function has(sel){ try{ return (await d.$$(sel)).length>0 }catch{ return false } }
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await wait()
  const sels=['~Home','~Categories','~Offers','~Sale','~Crazy Deals','~nav-home','~nav-offers','~nav-crazy-deals','~Shop All','~Perfumes','~product-quick-add','~Use Bellacash']
  for(const s of sels){ console.log(`  [${await has(s)?'YES':'no '}] ${s}`) }
} finally { try{await d.deleteSession()}catch{} }
