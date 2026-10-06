import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':200,'appium:autoGrantPermissions':true }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'warn', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
async function dperm(){const b=['com.android.permissioncontroller:id/permission_allow_button','com.android.permissioncontroller:id/permission_allow_foreground_only_button'];for(let i=0;i<4;i++){const a=await d.getCurrentActivity().catch(()=>'');if(!/permission/i.test(a))return;for(const r of b){try{const e=await d.$$(`android=new UiSelector().resourceId("${r}")`);if(e.length){await e[0].click();break}}catch{}}await d.pause(1000)}}
async function wait(re=/₹/,to=60000){let x='';const e=Date.now()+to;while(Date.now()<e){x=await d.getPageSource();if(re.test(x))break;await d.pause(2000)}return x}
async function tap(sel){try{const e=await d.$$(sel);if(e.length){await e[0].click();return true}}catch{}return false}
function dumpCart(xml,label){
  console.log(`\n--- ${label} ---`)
  for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text')
    if(/^cart-/.test(rid) || /^cart-/.test(cd)){ console.log(`  id=${rid||cd} text="${tx}" cd="${cd}" [${attr(t,'class').replace(/^android\.(widget|view)\./,'')}]`) } }
}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(1000); await d.activateApp(pkg); await d.pause(2000); await dperm(); await wait()
  await tap('~product-quick-add'); await d.pause(2500)
  await tap('//*[contains(@content-desc,"View Cart")]'); await d.pause(2500)
  let xml=await d.getPageSource()
  dumpCart(xml,'CART top (qty stepper area)')
  // read qty value node precisely
  const q=await d.$$('~cart-qty-value'); if(q.length){ console.log('cart-qty-value text=',JSON.stringify(await q[0].getText().catch(()=>'')),'cd=',JSON.stringify(await q[0].getAttribute('content-desc').catch(()=>''))) } else console.log('cart-qty-value NOT found')
  // tap qty plus and re-read
  if(await tap('~cart-qty-plus')){ await d.pause(1500); const q2=await d.$$('~cart-qty-value'); if(q2.length) console.log('after +  cart-qty-value text=',JSON.stringify(await q2[0].getText().catch(()=>'')),'cd=',JSON.stringify(await q2[0].getAttribute('content-desc').catch(()=>''))) }
  // scroll to bill
  for(let i=0;i<6;i++){ if((await d.$$('~cart-bill-grand-total')).length && await (await d.$('~cart-bill-grand-total')).isDisplayed().catch(()=>false)) break; const {width,height}=await d.getWindowSize(); await d.execute('mobile: scrollGesture',{left:Math.round(width*0.5),top:Math.round(height*0.3),width:Math.round(width*0.4),height:Math.round(height*0.4),direction:'down',percent:0.9}); await d.pause(600) }
  xml=await d.getPageSource()
  dumpCart(xml,'CART bottom (bill + bundle)')
  console.log('\ncart-item count:', (await d.$$('~cart-item')).length)
  console.log('cart-bill-saved present:', (await d.$$('~cart-bill-saved')).length>0)
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
