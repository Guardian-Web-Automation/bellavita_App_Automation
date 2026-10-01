/**
 * Temporary collection/PLP audit (Home -> Shop All). Reuses the audit.mjs
 * classification. Dumps raw XML to scripts/audit-output/collection.xml, prints
 * usable selectors grouped a/b/c, and runs a targeted scan for the specific
 * PLP controls: sort, filter, product cards, quick-add, price, wishlist, and
 * a load-more / scroll control. Read-only; touches nothing under src/ or config/.
 *
 *   node scripts/audit-collection.mjs
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
const trunc = (s, n = 80) => (!s ? '' : s.length > n ? s.slice(0, n - 1) + '…' : s)

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

/** Parse every element into {rid, cd, text, cls} once, for reuse. */
function parseElements(xml) {
  const tags = xml.match(/<[^/][^>]*?\/?>/g) || []
  return tags.map((t) => ({ rid: attr(t, 'resource-id'), cd: attr(t, 'content-desc'), text: attr(t, 'text'), cls: attr(t, 'class') }))
}

function auditGroups(elements) {
  const g = { a: [], b: [], c: [] }
  const seen = new Set()
  for (const e of elements) {
    if (!e.rid && !e.cd) continue
    const c = classify(e.rid, e.cd, e.cls)
    if (!c || seen.has(c.selector)) continue
    seen.add(c.selector); g[c.group].push(c)
  }
  return g
}

function printGroups(g) {
  for (const [key, title] of [['a', '(a) REAL testIDs'], ['b', '(b) TEXT-based labels'], ['c', '(c) DYNAMIC / AVOID']]) {
    console.log(`\n  ${title}  (${g[key].length})`)
    if (!g[key].length) { console.log('    — none —'); continue }
    g[key].forEach((r) => console.log(`    ${r.selector}\n        [${r.reason}] ${(r.cls || '').replace(/^android\.(widget|view)\./, '')}`))
  }
}

/** Targeted scan: for each PLP control, is it individually tagged? */
function featureScan(elements) {
  const features = [
    ['SORT', /\bsort\b/i],
    ['FILTER', /\bfilter\b|refine/i],
    ['QUICK-ADD', /add to (cart|bag)|add_to_cart/i],
    ['PRICE (standalone node)', /^[₹]\s?\d[\d,.]*$/],
    ['WISHLIST / SAVE', /wishlist|wish list|favou?rite|\bheart\b|\bsave\b/i],
    ['LOAD-MORE / PAGINATION', /load more|view more|show more|see more|pagination|_pagination|load-more/i]
  ]
  console.log(`\n${'-'.repeat(66)}\nTARGETED CONTROL SCAN (individually tagged?)\n${'-'.repeat(66)}`)
  for (const [label, re] of features) {
    const hits = []
    for (const e of elements) {
      const fields = [e.cd, e.text, ridName(e.rid)].filter(Boolean)
      if (fields.some((f) => re.test(f))) {
        const c = classify(e.rid, e.cd, e.cls)
        hits.push({ cd: e.cd, text: e.text, rid: e.rid, group: c ? c.group : '?', reason: c ? c.reason : 'n/a' })
      }
    }
    if (!hits.length) { console.log(`\n  ${label}: NOT FOUND / not tagged`); continue }
    console.log(`\n  ${label}: ${hits.length} match(es)`)
    hits.slice(0, 6).forEach((h) => {
      const id = h.cd ? `content-desc="${trunc(h.cd)}"` : h.rid ? `resource-id="${h.rid}"` : `text="${trunc(h.text)}"`
      console.log(`    [${h.group}/${h.reason}] ${id}${h.text && h.cd ? `  text="${trunc(h.text, 30)}"` : ''}`)
    })
  }
}

async function tapFirst(driver, cands, label) {
  for (const sel of cands) {
    let els = []
    try { els = await driver.$$(sel) } catch { continue }
    for (const el of els) { try { if (await el.isDisplayed()) { await el.click(); console.log(`  ✓ ${label}: ${sel}`); return true } } catch { /* next */ } }
  }
  console.log(`  ✗ ${label}: none matched`); return false
}
async function goHome(driver) {
  const pkg = capabilities['appium:appPackage']
  try { await driver.terminateApp(pkg); await driver.pause(1000); await driver.activateApp(pkg); await driver.pause(3500) } catch { /* */ }
}
async function waitForContent(driver, re = /₹/, timeout = 30000) {
  const end = Date.now() + timeout
  while (Date.now() < end) { try { if (re.test(await driver.getPageSource())) return true } catch { /* */ } await driver.pause(1500) }
  console.log(`  ! content ${re} not seen in ${timeout}ms`); return false
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const driver = await remote(wdOpts)
  try {
    await goHome(driver)
    await waitForContent(driver)
    console.log('  → tapping Shop All')
    await tapFirst(driver, ['~Shop All', '//*[@content-desc="Shop All"]', '//*[contains(@content-desc,"Shop All")]'], 'Shop All')
    await driver.pause(3500)
    await waitForContent(driver) // let the collection grid populate

    const xml = await driver.getPageSource()
    writeFileSync(join(OUT_DIR, 'collection.xml'), xml, 'utf8')
    const elements = parseElements(xml)
    const g = auditGroups(elements)

    console.log(`\n${'='.repeat(66)}\nCOLLECTION / PLP (Home -> Shop All)  context: ${await driver.getContext()}`)
    console.log(`Raw XML: scripts/audit-output/collection.xml`)
    console.log(`Usable selectors: a:${g.a.length}  b:${g.b.length}  c:${g.c.length}\n${'='.repeat(66)}`)
    printGroups(g)
    featureScan(elements)
    console.log('\nDONE')
  } finally {
    await driver.deleteSession()
  }
}
main().catch((e) => { console.error('collection audit failed:', e?.message || e); process.exit(1) })
