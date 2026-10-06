import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { PlpScreen } from '@screens/plp.screen.js'
import { PdpScreen } from '@screens/pdp.screen.js'

/**
 * PDP Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "11 PDP Module"), mapped to
 * their BV_PDP_* IDs.
 *
 * The doc's PDP High cases are almost entirely add-to-cart / variant / quantity
 * / sticky-tab / carousel interactions — none of which are exposed in the PDP
 * accessibility tree (the add-to-cart control is absent entirely). So only
 * BV_PDP_POS_006 (back navigation) is automatable; the rest are it.skip with
 * reasons. A few framework-smoke checks (PDP renders / price / tax line) are
 * kept below, clearly marked as NOT doc High cases. expect-webdriverio matchers.
 */
describe('PDP Module (High)', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const plp = new PlpScreen()
  const pdp = new PdpScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Start each test on a PDP (Home → Perfumes → first product).
  beforeEach(async () => {
    for (let i = 0; i < 5 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await driver.pause(600)
    }
    // Wait for the category-chip row to render (it lazy-loads after the
    // product cards, so waiting on ~Shop All is more reliable than a ₹ card).
    await home.isLoaded().catch(() => undefined)
    await driver.pause(500)
    await home.tapCategory('Perfumes')
    await plp.isLoaded()
    await plp.openFirstProduct()
    await pdp.isLoaded()
    await driver.pause(500)
  })

  // ---- ✅ Auto-now (implemented) ------------------------------------------

  it('BV_PDP_POS_006 back arrow navigates to the previous screen', async () => {
    await pdp.goBack()
    // Returned to the product listing (₹ grid shown).
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  // Unblocked in v5.777: PDP add-to-cart is tagged (~pdp-add-to-cart) and works.
  it('BV_PDP_POS_060 sticky ADD TO CART adds the product to the cart', async () => {
    await pdp.addToCart()
    await driver.pause(2500)
    // A "View Cart, N Items" bar appears once the item is in the cart.
    await expect($('//*[contains(@content-desc,"View Cart")]')).toBeDisplayed()
  })

  // Unblocked in v5.780: quantity stepper + sticky section tabs are tagged.
  // Selectors updated to resource-id (PdpScreen.sectionTabSel / qtyValue) to
  // match v5.780 tagging — the SAME pattern verified green on the Cart module.
  // Left as it.skip because they could NOT be confirmed green this session:
  // the PDP spec is navigation-heavy and, under current host memory pressure,
  // each case blows past Mocha's 180s test timeout (full run ~30m, with a
  // UiAutomator2 instrumentation crash). Flip back to `it(` to re-verify on a
  // healthy emulator / the CI runner. Implementations kept below for that.
  it.skip('BV_PDP_POS_015 quantity + increments the quantity — PENDING: verify on healthy emulator (180s timeouts under memory pressure)', async () => {
    const before = await pdp.getQty()
    await pdp.incrementQty()
    await driver.waitUntil(async () => (await pdp.getQty()) > before, {
      timeout: 8000, interval: 800, timeoutMsg: `qty did not increase from ${before}`,
    })
  })

  it.skip('BV_PDP_POS_066 REVIEWS tab is available and tappable — PENDING: verify on healthy emulator (180s timeouts under memory pressure)', async () => {
    await pdp.revealTabs()
    await expect($(pdp.sectionTabSel('reviews'))).toBeDisplayed()
    await pdp.tapSectionTab('reviews')
  })

  it.skip('BV_PDP_POS_067 VIEW SIMILAR tab is available and tappable — PENDING: verify on healthy emulator (180s timeouts under memory pressure)', async () => {
    await pdp.revealTabs()
    await expect($(pdp.sectionTabSel('view-similar'))).toBeDisplayed()
    await pdp.tapSectionTab('view-similar')
  })

  // ---- ⏭️ Blocked: not exposed — add-to-cart / variant / qty / tabs -------
  it.skip('BV_PDP_POS_001 swipe image carousel to next image — BLOCKED: carousel pagination dynamic; image id untagged', () => {})
  it.skip('BV_PDP_POS_020 shade swatch updates variant + image — BLOCKED: variant swatch untagged', () => {})
  it.skip('BV_PDP_POS_026 fragrance-note updates description — BLOCKED: note chips/description untagged for change detection', () => {})
  it.skip('BV_PDP_POS_030 "Add Combo" adds both bundled products — BLOCKED: combo card/CTA untagged', () => {})
  it.skip('BV_PDP_POS_038 "Key Benefits" tab toggles content — BLOCKED: content tabs not in a11y tree', () => {})
  it.skip('BV_PDP_POS_050 "WRITE A REVIEW" opens review form — BLOCKED: control not exposed (likely login-gated)', () => {})
  it.skip('BV_PDP_POS_055 ATC on a Similar Products card — BLOCKED: quick-add not card-bound', () => {})
  it.skip('BV_PDP_POS_056 "X Variant" on Similar card opens popup — BLOCKED: variant CTA/popup untagged', () => {})
  it.skip('BV_PDP_E2E_065 PDP → variant → qty → add → cart — BLOCKED: add-to-cart/variant/qty not exposed', () => {})
  it.skip('BV_PDP_SEC_081 script in review fields is sanitized — BLOCKED: review submission not reachable (form untagged/login)', () => {})

  // ---- 🔎 Framework smoke (NOT doc High cases) — PDP render integrity -----
  it('[smoke] PDP renders its detail (add-to-cart control present)', async () => {
    // Universal "PDP loaded" marker (present on every product, unlike the
    // rating/Reviews line which some 0-review products lack).
    await expect($('~pdp-add-to-cart')).toBeDisplayed()
  })

  it('[smoke] PDP shows a price and the "Inclusive of all taxes" line', async () => {
    await expect($('//*[contains(@text,"₹")]')).toBeDisplayed()
    await expect($('//*[@text="Inclusive of all taxes"]')).toBeDisplayed()
  })

  it('[smoke] PDP shows no ₹0 price (WL-01)', async () => {
    const prices = await pdp.getDisplayedPrices()
    expect(prices.length).toBeGreaterThan(0)
    expect(prices.filter((p) => p.amount === 0).length).toBe(0)
  })
})
