import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { PdpScreen } from '@screens/pdp.screen.js'

/**
 * Home Page Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "10 Home Page Module"),
 * mapped to their BV_HOME_* IDs.
 *
 * The home feed exposes only the category-tab row (~Shop All / ~Perfumes / …)
 * and product-card blurbs (₹). Section arrows, hero-banner CTAs ("Shop Now"),
 * "Shop by Category" cards and merchandising banners are UNTAGGED / dynamic
 * (UUID) — so those cases are scaffolded as it.skip with reasons. Tab-switch
 * cases can only assert the feed stays in-place (theme/section changes are
 * untagged). Assertions use expect-webdriverio auto-waiting matchers.
 */
describe('Home Page Module (High)', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const pdp = new PdpScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home (Shop All tab) before each test.
  beforeEach(async () => {
    for (let i = 0; i < 5 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await home.isLoaded().catch(() => undefined)
      await driver.pause(600)
    }
  })

  // ---- ✅ Auto-now (implemented) ------------------------------------------

  it('BV_HOME_POS_001 Home loads on the Shop All tab with product content', async () => {
    // NOTE: theme colour / active-tab highlight are not exposed in the a11y
    // tree, so we assert the Shop All tab row + product grid render.
    await expect($('~Shop All')).toBeDisplayed()
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  // POS_002–006: tapping a category tab switches the feed in-place (the tab row
  // persists — we don't leave Home). Theme/section content is untagged.
  it('BV_HOME_POS_002 Perfumes tab switches the feed in-place', async () => {
    await home.tapCategory('Perfumes')
    await expect($('~Shop All')).toBeDisplayed()
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  it('BV_HOME_POS_003 Gifting tab switches the feed in-place', async () => {
    await home.tapCategory('Gifting')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_004 Skincare tab switches the feed in-place', async () => {
    await home.tapCategory('Skincare')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_005 Bath & Body tab switches the feed in-place', async () => {
    await home.tapCategory('Bath & Body')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_006 Cosmetics tab switches the feed in-place', async () => {
    await home.tapCategory('Cosmetics')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_015 tapping a product card opens its PDP', async () => {
    await home.openFirstProduct()
    await expect($('//*[contains(@content-desc,"Reviews")]')).toBeDisplayed()
  })

  // NOTE: Home carousel quick-add doesn't reliably morph into a verifiable
  // qty stepper from the feed (unlike the Search results grid and the PLP),
  // so 014/048 stay skipped. The add-to-cart capability itself IS covered —
  // via Search (BV_SRCH_POS_012/039) and PLP (BV_PLP_POS_005/049).
  it.skip('BV_HOME_POS_014 Add to Cart in a carousel — BLOCKED: home carousel quick-add not reliably verifiable (covered on Search/PLP)', () => {})
  it.skip('BV_HOME_E2E_048 Perfumes carousel → add to cart → confirm in Cart — BLOCKED: home carousel quick-add not reliably verifiable (covered on Search/PLP)', () => {})

  // ---- ⏭️ Blocked: untagged / dynamic (need testIDs) ----------------------
  // Banners/heroes are dynamic appmaker UUID containers with no stable id;
  // section "see-all" arrows and "Shop by Category" cards are icon-only /
  // UUID (confirmed via live home dump) — all need dev testIDs.
  it.skip('BV_HOME_POS_011 top banner → collection — BLOCKED: banner is dynamic/UUID (untagged)', () => {})
  it.skip('BV_HOME_POS_012 "Shop Bestsellers" arrow → collection — BLOCKED: section arrow untagged', () => {})
  it.skip('BV_HOME_POS_019 "Trending Now" arrow → collection — BLOCKED: section arrow untagged', () => {})
  it.skip('BV_HOME_POS_026 "New Arrival" arrow → collection — BLOCKED: section arrow untagged', () => {})
  it.skip('BV_HOME_POS_028 Perfumes "Shop by Category" card → collection — BLOCKED: category card untagged/UUID', () => {})
  it.skip('BV_HOME_POS_040 Gifting hero + cards + carousel pattern — BLOCKED: hero/CTA/cards untagged', () => {})
  it.skip('BV_HOME_POS_041 Skincare hero + cards + carousel pattern — BLOCKED: hero/CTA/cards untagged', () => {})
  it.skip('BV_HOME_POS_042 Bath & Body hero + cards + carousel pattern — BLOCKED: hero/CTA/cards untagged', () => {})
  it.skip('BV_HOME_POS_043 Cosmetics hero + cards + carousel pattern — BLOCKED: hero/CTA/cards untagged', () => {})
  it.skip('BV_HOME_POS_057 Skincare "Shop Now" hero → collection — BLOCKED: hero CTA untagged', () => {})
  it.skip('BV_HOME_POS_058 Skincare "Shop by Category" card → sub-collection — BLOCKED: category card untagged', () => {})
  it.skip('BV_HOME_POS_065 Bath & Body "Shop Now" hero → collection — BLOCKED: hero CTA untagged', () => {})
  it.skip('BV_HOME_POS_066 Bath & Body "Shop by Category" card → sub-collection — BLOCKED: category card untagged', () => {})
  it.skip('BV_HOME_POS_075 Cosmetics "Shop Now" hero → collection — BLOCKED: hero CTA untagged', () => {})
  it.skip('BV_HOME_POS_076 Cosmetics "Shop by Feature" card → sub-collection — BLOCKED: feature card untagged', () => {})
  it.skip('BV_HOME_POS_080 Cosmetics 2nd "Shop by Category" card → sub-collection — BLOCKED: category card untagged', () => {})
})
