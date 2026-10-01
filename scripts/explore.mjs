/**
 * Temporary exploration for the smoke suite. Visits the screens the first
 * audit never captured — Categories, a PLP (via a category tile), Crazy Deals,
 * Offers, and any hamburger/menu — dumps each to scripts/audit-output/<name>.xml
 * and prints usable selectors grouped a/b/c. Read-only; no framework files.
 *
 *   node scripts/explore.mjs
 */
import { remote } from 'webdriverio'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'audit-output')

const capabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_UDID || 'emulator-5554',
  'appium:udid': process.env.ANDROID_DEVICE_UDID || 'emulator-5554',
  'appium:appPackage': process.env.ANDROID_APP_PACKAGE || 'com.bellavita.shopifyapps',
  'appium:appActivity': process.env.ANDROID_APP_ACTIVITY || 'com.bellavita.shopifyapps.MainActivity',
  'appium:appWaitActivity': '*',
  'appium:noReset': true,
  'appium:newCommandTimeout': 240,
  'appium:autoGrantPermissions': true
}
const wdOpts = { hostname: '127.0.0.1', port: 4723, path: '/', logLevel: 'warn', capabilities }

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
const ridName = (r) => (r && r.includes(':id/') ? r.split(':id/')[1] : r)
const attr = (t, n) => { const m = t.match(new RegExp(`\\b${n}="([^"]*)"`)); return m ? m[1] : '' }
const isChrome = (r) => !!r && (r.startsWith('android:id/') || /(action_bar_root|navigationBarBackground|statusBarBackground)$/.test(r))
const isSlug = (s) => !!s && /^[a-zA-Z][\w.]*[-_][\w.-]*$/.test(s) && !/\s/.test(s)
const trunc = (s, n = 72) => (!s ? '' : s.length > n ? s.slice(0, n - 1) + '…' : s)

function classify(rid, cd, cls) {
  const name = ridName(rid)
  const dynamic = UUID.test(rid || '') || UUID.test(cd || '') ||
    (name && name.toLowerCase().startsWith('appmaker')) || (cd && cd.toLowerCase().startsWith('appmaker'))
  const base = { cls, rid, cd }
  if (dynamic) return { ...base, group: 'c', reason: 'dynamic / UUID', selector: cd ? `~${cd}` : `android=new UiSelector().resourceId("${rid}")` }
  if (isChrome(rid) && !cd) return { ...base, group: 'c', reason: 'framework chrome', selector: `android=new UiSelector().resourceId("${rid}")` }
  if (cd && isSlug(cd)) return { ...base, group: 'a', reason: 'a11y id (slug)', selector: `~${cd}` }
  if (name && !isChrome(rid) && /^[a-zA-Z][\w.]*$/.test(name) && name !== 'content') return { ...base, group: 'a', reason: 'resource-id', selector: `android=new UiSelector().resourceId("${rid}")` }
  if (cd) return { ...base, group: 'b', reason: 'text label', selector: `~${cd}` }
  if (rid) return { ...base, group: 'c', reason: 'non-semantic id', selector: `android=new UiSelector().resourceId("${rid}")` }
  return null
}

async function audit(driver, name) {
  const ctx = await driver.getContext()
  const xml = await driver.getPageSource()
  writeFileSync(join(OUT_DIR, `${name}.xml`), xml, 'utf8')
  const tags = xml.match(/<[^/][^>]*?\/?>/g) || []
  const g = { a: [], b: [], c: [] }
  const seen = new Set()
  for (const t of tags) {
    const rid = attr(t, 'resource-id'), cd = attr(t, 'content-desc')
    if (!rid && !cd) continue
    const c = classify(rid, cd, attr(t, 'class'))
    if (!c || seen.has(c.selector)) continue
    seen.add(c.selector); g[c.group].push(c)
  }
  console.log(`\n${'='.repeat(66)}\nSCREEN: ${name}  (${ctx})  a:${g.a.length} b:${g.b.length} c:${g.c.length}\n${'='.repeat(66)}`)
  for (const [key, title] of [['a', '(a) real testIDs'], ['b', '(b) text labels'], ['c', '(c) avoid']]) {
    console.log(`  ${title} (${g[key].length})`)
    g[key].forEach((r) => console.log(`    ${r.selector}   [${r.reason}] ${(r.cls || '').replace(/^android\.(widget|view)\./, '')}`))
  }
  return g
}

async function tapFirst(driver, cands, label) {
  for (const sel of cands) {
    let els = []
    try { els = await driver.$$(sel) } catch { continue }
    for (const el of els) {
      try { if (await el.isDisplayed()) { await el.click(); console.log(`  ✓ ${label}: ${sel}`); return true } } catch { /* next */ }
    }
  }
  console.log(`  ✗ ${label}: none of ${cands.length} candidates`)
  return false
}

async function goHome(driver) {
  const pkg = capabilities['appium:appPackage']
  try { await driver.terminateApp(pkg); await driver.pause(1000); await driver.activateApp(pkg); await driver.pause(3500) } catch { /* */ }
}
async function waitForContent(driver, re = /₹/, timeout = 15000) {
  const end = Date.now() + timeout
  while (Date.now() < end) { try { if (re.test(await driver.getPageSource())) return true } catch { /* */ } await driver.pause(1000) }
  return false
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const driver = await remote(wdOpts)
  try {
    await goHome(driver); await waitForContent(driver)
    await audit(driver, 'smoke-home')

    // Categories tab
    if (await tapFirst(driver, ['~Categories'], 'Categories tab')) { await driver.pause(2500); await audit(driver, 'smoke-categories') }

    // PLP via a category tile (Perfumes exists on home; also try from categories)
    await goHome(driver); await waitForContent(driver)
    if (await tapFirst(driver, ['~Perfumes', '//*[@content-desc="Perfumes"]', '~Shop All'], 'category tile -> PLP')) {
      await driver.pause(3000); await audit(driver, 'smoke-plp')
    }

    // Crazy Deals tab
    await goHome(driver); await waitForContent(driver)
    if (await tapFirst(driver, ['~Crazy Deals'], 'Crazy Deals tab')) { await driver.pause(3000); await audit(driver, 'smoke-crazydeals') }

    // Offers tab
    await goHome(driver); await waitForContent(driver)
    if (await tapFirst(driver, ['~Offers'], 'Offers tab')) { await driver.pause(3000); await audit(driver, 'smoke-offers') }

    // Hamburger / menu — hunt by common labels + top-left icon fallback
    await goHome(driver); await waitForContent(driver)
    const menuFound = await tapFirst(driver, [
      '~Menu', '~menu', '~Hamburger', '~Open menu', '~Navigation',
      '//*[contains(@content-desc,"Menu")]', '//*[contains(@content-desc,"menu")]',
      '//android.widget.ImageButton', '//*[@content-desc="More options"]'
    ], 'hamburger/menu')
    if (menuFound) { await driver.pause(2000); await audit(driver, 'smoke-menu') }
    else { console.log('  (no hamburger/menu control found — this app may use bottom-nav only)') }

    console.log('\nDONE')
  } finally {
    await driver.deleteSession()
  }
}
main().catch((e) => { console.error('explore failed:', e?.message || e); process.exit(1) })
