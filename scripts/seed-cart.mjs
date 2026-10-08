import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':150 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const n=async sel=>(await d.$$(sel)).length
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
const hasBar=async()=>(await n('//*[contains(@content-desc,"View Cart")]'))>0
try {
  const pkg='com.bellavita.shopifyapps'
  await d.activateApp(pkg); await d.pause(3000)
  for(let i=0;i<25;i++){ if(await n('//*[contains(@content-desc,"₹")]')) break; await d.pause(1500) }
  if(await hasBar()){ console.log('cart already seeded'); }
  else {
    // go to real PLP
    await tap('~menu-open'); await d.pause(1500); await tap('~menu-shop-all'); await d.pause(4000)
    console.log('plp quick-adds:', await n('~product-quick-add'), ' cards:', await n('//*[contains(@content-desc,"₹")]'))
    // product-quick-add navigates to the PDP in pdp_revamp; add from there.
    await tap('~product-quick-add'); await d.pause(3500)
    if(await n('~variant-popup')){ await tap('//*[contains(@content-desc,"variant-option-")]'); await d.pause(800); await tap('~variant-confirm'); await d.pause(2500) }
    else if(await n('~pdp-add-to-cart')){ await tap('~pdp-add-to-cart'); await d.pause(3000) }
    console.log('seeded:', await hasBar())
  }
  console.log('DONE')
} finally { try{await d.deleteSession()}catch{} }
