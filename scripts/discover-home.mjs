import { remote } from 'webdriverio'
const caps = { platformName:'Android','appium:automationName':'UiAutomator2','appium:udid':'emulator-5554','appium:appPackage':'com.bellavita.shopifyapps','appium:appActivity':'com.bellavita.shopifyapps.MainActivity','appium:appWaitActivity':'*','appium:noReset':true,'appium:newCommandTimeout':240 }
const d = await remote({ hostname:'127.0.0.1', port:4723, path:'/', logLevel:'error', capabilities:caps })
const attr=(t,n)=>{const m=t.match(new RegExp(`\\b${n}="([^"]*)"`));return m?m[1]:''}
const tags=x=>x.match(/<[^/][^>]*?\/?>/g)||[]
const seen=new Set()
function dump(xml,label){
  console.log(`\n==== ${label} ====`)
  for(const t of tags(xml)){ const rid=attr(t,'resource-id').replace(/^.*:id\//,''); const cd=attr(t,'content-desc'); const tx=attr(t,'text'); const cls=attr(t,'class').replace(/^android\.(widget|view)\./,''); const clk=attr(t,'clickable')
    if(!cd && !tx) continue
    // only show clickable or heading-ish text; skip pure price noise
    const label2=cd||tx
    const key=`${rid}|${cd}|${tx}`; if(seen.has(key))continue; seen.add(key)
    if(clk==='true' || /Shop|Category|View All|See All|Trending|Bestseller|New Arrival|Gifting|Skincare|Bath|Cosmetic|Perfume/i.test(label2)){
      console.log(`  [${cls}]${clk==='true'?'*':' '} rid="${rid}" cd="${cd}" text="${tx}"`) } }
}
try {
  const pkg='com.bellavita.shopifyapps'
  await d.terminateApp(pkg); await d.pause(800); await d.activateApp(pkg); await d.pause(4000)
  for(let i=0;i<20;i++){ if((await d.$$('//*[contains(@content-desc,"₹")]')).length) break; await d.pause(1500) }
  const {width,height}=await d.getWindowSize()
  for(let s=0;s<8;s++){
    dump(await d.getPageSource(),`HOME scroll ${s}`)
    await d.execute('mobile: scrollGesture',{left:Math.round(width*0.5),top:Math.round(height*0.3),width:Math.round(width*0.4),height:Math.round(height*0.45),direction:'down',percent:0.9}); await d.pause(900)
  }
  console.log('\nDONE')
} finally { try{await d.deleteSession()}catch{} }
