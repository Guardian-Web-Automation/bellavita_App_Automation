/**
 * Temporary multi-screen testID-audit script.
 *
 * Walks a short golden-path-ish flow on the currently-open Bellavita app
 * (local emulator), and for each screen it reaches:
 *   - saves the raw page-source XML to scripts/audit-output/<screen>.xml
 *   - prints the usable selectors grouped into:
 *       (a) real testIDs            — stable, semantic ids
 *       (b) text-based a11y labels  — usable but tied to visible copy
 *       (c) dynamic / UUID / chrome — avoid, they change per build/session
 *
 * Flow: home (current) -> search -> PDP -> cart -> loyalty (best-effort).
 * Navigation is best-effort: a step that can't find its target is logged and
 * skipped, the run continues. Pauses between navigations so you can watch it.
 *
 * Standalone + read-only — imports no framework files, writes only under
 * scripts/audit-output/. Needs an Appium server already running on 4723.
 *
 *   node scripts/audit.mjs
 *   AUDIT_PAUSE_MS=4000 node scripts/audit.mjs   # slower, easier to watch
 */
import { remote } from 'webdriverio'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, 'audit-output')
const PAUSE = Number(process.env.AUDIT_PAUSE_MS) || 2500

// Android caps mirrored from config/wdio.android.conf.ts (env-overridable).
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

const wdOpts = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: Number(process.env.APPIUM_PORT) || 4723,
  path: '/',
  logLevel: 'warn',
  capabilities
}

// ---- classification helpers -------------------------------------------------

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** Strip the `pkg:id/` namespace off a resource-id. */
function ridName(rid) {
  return rid && rid.includes(':id/') ? rid.split(':id/')[1] : rid
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`))
  return m ? m[1] : ''
}

function isChrome(rid) {
  if (!rid) return false
  return (
    rid.startsWith('android:id/') ||
    /(action_bar_root|navigationBarBackground|statusBarBackground)$/.test(rid)
  )
}

// A slug-like identifier a dev would set as testID: has a separator, no spaces.
const isSlug = (s) => !!s && /^[a-zA-Z][\w.]*[-_][\w.-]*$/.test(s) && !/\s/.test(s)

/**
 * Classify one element into a group + a recommended selector.
 * Returns { group: 'a'|'b'|'c', selector, reason, cls, text, rid, cd }.
 */
function classify(rid, cd, cls, text) {
  const name = ridName(rid)
  const dynamic =
    UUID.test(rid || '') ||
    UUID.test(cd || '') ||
    (name && name.toLowerCase().startsWith('appmaker')) ||
    (cd && cd.toLowerCase().startsWith('appmaker'))

  const base = { cls, text, rid, cd }

  if (dynamic) {
    return { ...base, group: 'c', reason: 'dynamic / UUID', selector: cd ? `~${cd}` : `android=new UiSelector().resourceId("${rid}")` }
  }
  if (isChrome(rid) && !cd) {
    return { ...base, group: 'c', reason: 'framework chrome', selector: `android=new UiSelector().resourceId("${rid}")` }
  }

  // Real testID: a slug-like accessibility id, or a semantic app resource-id.
  if (cd && isSlug(cd)) {
    return { ...base, group: 'a', reason: 'accessibility id (slug)', selector: `~${cd}` }
  }
  if (name && !isChrome(rid) && (isSlug(name) || /^[a-zA-Z][\w.]*$/.test(name)) && name !== 'content') {
    return { ...base, group: 'a', reason: 'resource-id', selector: `android=new UiSelector().resourceId("${rid}")` }
  }

  // Text-based accessibility label (mirrors visible copy) — usable but brittle.
  if (cd) {
    return { ...base, group: 'b', reason: 'text label', selector: `~${cd}` }
  }
  // resource-id we couldn't make sense of.
  if (rid) {
    return { ...base, group: 'c', reason: 'non-semantic id', selector: `android=new UiSelector().resourceId("${rid}")` }
  }
  return null
}

function trunc(s, n = 72) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ---- per-screen audit -------------------------------------------------------

async function auditScreen(driver, name) {
  const context = await driver.getContext()
  const xml = await driver.getPageSource()
  const file = join(OUT_DIR, `${name}.xml`)
  writeFileSync(file, xml, 'utf8')

  const tags = xml.match(/<[^/][^>]*?\/?>/g) || []
  const groups = { a: [], b: [], c: [] }
  const seen = new Set()

  for (const tag of tags) {
    const rid = attr(tag, 'resource-id')
    const cd = attr(tag, 'content-desc')
    if (!rid && !cd) continue
    const c = classify(rid, cd, attr(tag, 'class'), attr(tag, 'text'))
    if (!c) continue
    if (seen.has(c.selector)) continue
    seen.add(c.selector)
    groups[c.group].push(c)
  }

  const rel = `scripts/audit-output/${name}.xml`
  console.log(`\n${'='.repeat(70)}`)
  console.log(`SCREEN: ${name}   (context: ${context})`)
  console.log(`Raw XML: ${rel}`)
  console.log(`Usable: ${groups.a.length + groups.b.length + groups.c.length}  ` +
    `(a:${groups.a.length}  b:${groups.b.length}  c:${groups.c.length})`)
  console.log('='.repeat(70))

  printGroup('(a) Real testIDs', groups.a, true)
  printGroup('(b) Text-based accessibility labels', groups.b, true)
  printGroup('(c) Dynamic / UUID / framework ids to AVOID', groups.c, false)

  return { name, context, ...groups }
}

function printGroup(title, rows, showText) {
  console.log(`\n  ${title}  (${rows.length})`)
  if (!rows.length) {
    console.log('    — none —')
    return
  }
  rows.forEach((r, i) => {
    console.log(`    ${String(i + 1).padStart(2)}. ${r.selector}`)
    const extras = [`[${r.reason}]`]
    if (r.cls) extras.push(r.cls.replace(/^android\.(widget|view)\./, ''))
    if (showText && r.text && r.text !== r.cd) extras.push(`text="${trunc(r.text, 40)}"`)
    console.log(`        ${extras.join('  ')}`)
  })
}

// ---- navigation (best-effort) ----------------------------------------------

async function pause(driver, whatNext) {
  console.log(`\n  ⏸  pausing ${PAUSE}ms — next: ${whatNext}`)
  await driver.pause(PAUSE)
}

/** Try each selector; click the first displayed match. Returns true on success. */
async function tapFirst(driver, candidates, label) {
  for (const sel of candidates) {
    let els = []
    try {
      els = await driver.$$(sel)
    } catch {
      continue
    }
    for (const el of els) {
      try {
        if (await el.isDisplayed()) {
          await el.click()
          console.log(`  ✓ ${label}: tapped ${sel}`)
          return true
        }
      } catch {
        /* stale / not clickable — try next */
      }
    }
  }
  console.log(`  ✗ ${label}: no matching element (${candidates[0]} …)`)
  return false
}

/** Scroll the screen content downward one viewport (reveal lower content). */
async function scrollDown(driver) {
  try {
    const { width, height } = await driver.getWindowSize()
    await driver.execute('mobile: scrollGesture', {
      left: Math.round(width * 0.5),
      top: Math.round(height * 0.2),
      width: Math.round(width * 0.4),
      height: Math.round(height * 0.6),
      direction: 'down',
      percent: 0.9
    })
  } catch {
    /* ignore — some screens aren't scrollable */
  }
}

/**
 * Find an element from the LIVE page source whose content-desc or resource-id
 * matches `regex` (and does NOT match `exclude`), and tap it. More robust than
 * guessing exact labels. `exclude` filters out false positives such as product
 * blurbs that merely mention "Bellacash".
 */
async function tapByRegex(driver, regex, label, exclude = null) {
  let xml = ''
  try {
    xml = await driver.getPageSource()
  } catch {
    return false
  }
  const tags = xml.match(/<[^/][^>]*?\/?>/g) || []
  for (const tag of tags) {
    const rid = attr(tag, 'resource-id')
    const cd = attr(tag, 'content-desc')
    if (exclude && ((cd && exclude.test(cd)) || (rid && exclude.test(rid)))) continue
    if (cd && regex.test(cd)) {
      if (await tapFirst(driver, [`~${cd}`], `${label} ("${trunc(cd, 30)}")`)) return true
    } else if (rid && regex.test(rid)) {
      if (await tapFirst(driver, [`android=new UiSelector().resourceId("${rid}")`], `${label} (${rid})`)) return true
    }
  }
  console.log(`  ✗ ${label}: nothing matched ${regex}`)
  return false
}

/** Scroll until a regex target is tappable, or give up after `maxScrolls`. */
async function scrollUntilTap(driver, regex, label, maxScrolls = 6, exclude = null) {
  for (let i = 0; i <= maxScrolls; i++) {
    if (await tapByRegex(driver, regex, label, exclude)) return true
    if (i < maxScrolls) {
      console.log(`  … scrolling to find ${label} (${i + 1}/${maxScrolls})`)
      await scrollDown(driver)
      await driver.pause(800)
    }
  }
  return false
}

/** Poll the page source until `re` appears (async RN content) or timeout. */
async function waitForContent(driver, re = /₹/, timeout = 15000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      if (re.test(await driver.getPageSource())) return true
    } catch {
      /* ignore */
    }
    await driver.pause(1000)
  }
  console.log(`  ! content ${re} did not render within ${timeout}ms`)
  return false
}

/** Relaunch the app to a known home state (defeats noReset drift between runs). */
async function goHome(driver) {
  const pkg = capabilities['appium:appPackage']
  try {
    await driver.terminateApp(pkg)
    await driver.pause(1000)
    await driver.activateApp(pkg)
    await driver.pause(3500)
    console.log('  ↺ relaunched app to home')
  } catch (e) {
    console.log(`  ! could not relaunch app: ${e?.message || e}`)
  }
}

async function typeSearch(driver, term) {
  let inputs = []
  try {
    inputs = await driver.$$('//android.widget.EditText')
  } catch {
    /* ignore */
  }
  if (!inputs.length) {
    console.log('  ✗ search input: no EditText found')
    return false
  }
  try {
    await inputs[0].setValue(term)
    console.log(`  ✓ typed "${term}" into search`)
    try {
      await driver.execute('mobile: performEditorAction', { action: 'search' })
    } catch {
      await driver.pressKeyCode(66) // ENTER
    }
    return true
  } catch (e) {
    console.log(`  ✗ search input: ${e?.message || e}`)
    return false
  }
}

// ---- main -------------------------------------------------------------------

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const driver = await remote(wdOpts)
  const results = []

  try {
    // 1) HOME — relaunch first so every run starts from the same place
    //    (noReset keeps the app installed but would otherwise reattach to
    //    whatever screen the previous run left open).
    await goHome(driver)
    await waitForContent(driver) // home feed loads async
    results.push(await auditScreen(driver, 'home'))

    // 2) SEARCH
    await pause(driver, 'open search')
    const onSearch = await tapFirst(driver, [
      '~Search for “Skin Care”',
      '//*[contains(@content-desc,"Search for")]',
      '~Search',
      '//*[contains(@content-desc,"Search")]'
    ], 'search entry')
    if (onSearch) {
      await driver.pause(1500)
      results.push(await auditScreen(driver, 'search'))
      // populate results so we can reach a PDP
      await pause(driver, 'type a search term')
      await typeSearch(driver, process.env.AUDIT_SEARCH_TERM || 'perfume')
      await driver.pause(2500)
    }

    // 3) PDP — tap a product card (content-desc carries a ₹ price blurb)
    await pause(driver, 'open a product (PDP)')
    let onPdp = await tapFirst(driver, [
      '//*[contains(@content-desc,"₹") and contains(@content-desc,"Earn")]',
      '//*[contains(@content-desc,"₹")]'
    ], 'product card')
    if (!onPdp) {
      // fall back to a product card on home
      console.log('  … falling back to a product card on home')
      await tapFirst(driver, ['~Home'], 'home tab')
      await driver.pause(1500)
      onPdp = await tapFirst(driver, ['//*[contains(@content-desc,"₹")]'], 'product card (home)')
    }
    if (onPdp) {
      await driver.pause(2500)
      results.push(await auditScreen(driver, 'pdp'))
    }

    // 4) CART — NOTE: the PDP exposes no add-to-cart control in its own
    //    accessibility tree (testID gap). The reliable path is a listing's
    //    quick-add `~Add To Cart`, after which a "View Cart, N Items" bar
    //    appears on listing screens — that bar is the real cart entry.
    await pause(driver, 'add to cart (listing quick-add) + open cart')
    await goHome(driver)
    await waitForContent(driver)
    const added = await tapFirst(driver, [
      '~Add To Cart', '~Add to Cart', '~ADD TO CART',
      '//*[contains(@content-desc,"Add To Cart")]'
    ], 'quick-add (listing)')
    await driver.pause(3000)
    // Open the real cart. Exclude the "Add To Cart" buttons (they contain "cart").
    const onCart = await tapByRegex(
      driver,
      /view cart|(^|\W)cart(\W|$)|\bbag\b|checkout/i,
      'open cart',
      /add to cart/i
    )
    await driver.pause(2000)
    results.push(await auditScreen(driver, onCart ? 'cart' : 'cart-postadd'))

    // 5) LOYALTY / BellaPoints — best-effort. Exclude product blurbs that merely
    //    mention "Bellacash" (they carry ₹ / Earn / Saving text).
    await pause(driver, 'open loyalty / BellaPoints (best-effort)')
    const loyaltyRe = /bellacash|bellapoints|bella\s*points|loyalty|rewards|redeem/i
    const notProduct = /₹|earn|saving|bestseller|new\s*launch|reviews?/i
    let onLoyalty = await scrollUntilTap(driver, loyaltyRe, 'loyalty entry', 4, notProduct)
    if (!onLoyalty) {
      await goHome(driver)
      onLoyalty = await tapByRegex(driver, loyaltyRe, 'loyalty entry (home)', notProduct)
    }
    if (onLoyalty) {
      await driver.pause(2500)
      results.push(await auditScreen(driver, 'loyalty'))
    } else {
      console.log('  (no labelled loyalty/BellaPoints control reachable — skipped)')
    }

    // ---- summary ----
    console.log(`\n${'#'.repeat(70)}`)
    console.log(`AUDIT COMPLETE — ${results.length} screen(s) captured`)
    console.log('#'.repeat(70))
    for (const r of results) {
      console.log(`  ${r.name.padEnd(9)} testIDs=${r.a.length}  labels=${r.b.length}  avoid=${r.c.length}  -> scripts/audit-output/${r.name}.xml`)
    }
    console.log('')
  } finally {
    await driver.deleteSession()
  }
}

main().catch((err) => {
  console.error('Audit failed:', err?.message || err)
  process.exit(1)
})
