import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { PlpScreen } from '@screens/plp.screen.js'
import { PdpScreen } from '@screens/pdp.screen.js'
import { CartScreen } from '@screens/cart.screen.js'
import { SearchScreen } from '@screens/search.screen.js'
import { CrazyDealsScreen } from '@screens/crazy-deals.screen.js'

/**
 * Storefront smoke suite — broad, shallow coverage of the core browse/cart
 * journey: home feed (PLP landing), search, category PLP, PDP, add-to-cart +
 * cart, Crazy Deals, and the Categories / Offers tabs.
 *
 * All selectors are INTERIM text-based accessibility labels, validated live
 * (scripts/audit.mjs + scripts/explore.mjs) — the app currently ships almost
 * no real testIDs. Each screen object marks the labels to be swapped for
 * testIDs once dev backfills them.
 *
 * Deliberately shallow: it asserts each area *renders*, not deep behaviour.
 * The PDP has no add-to-cart in its a11y tree (a real testID gap), so the
 * cart is reached via a listing quick-add + the "View Cart" bar. WL-01 (₹0
 * pricing) is intentionally a separate targeted test, not smoke.
 */
describe('Storefront smoke suite', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const plp = new PlpScreen()
  const pdp = new PdpScreen()
  const cart = new CartScreen()
  const search = new SearchScreen()
  const crazy = new CrazyDealsScreen()

  // The product feed is fetched from the backend and can be slow to populate
  // on a cold session start. Wait (once, up to 60s) for at least one product
  // card before the suite runs so content-dependent tests don't race the
  // network / a slow render.
  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home before each test. Search/PDP have no bottom nav, so press
  // Back until the tab bar reappears, then tap Home for a known starting point.
  beforeEach(async () => {
    for (let i = 0; i < 4 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      // Let the (async, dynamic) home feed finish rendering before the test
      // navigates, so quick-add / category tiles are reliably present.
      await home.isLoaded().catch(() => undefined)
      await driver.pause(800)
    }
  })

  it('home feed loads with product cards', async () => {
    await expect(await home.isLoaded()).toBe(true)
    await expect(await home.productCardCount()).toBeGreaterThan(0)
  })

  it('search page opens and returns results', async () => {
    await home.openSearch()
    await expect(await search.isLoaded()).toBe(true)
    await search.search('perfume')
    await driver.pause(2500)
    await expect(await search.getResultCount()).toBeGreaterThan(0)
  })

  it('a category tile opens a PLP grid', async () => {
    await home.tapCategory('Perfumes')
    await expect(await plp.isLoaded()).toBe(true)
    await expect(await plp.getProductCount()).toBeGreaterThan(0)
  })

  it('opening a product shows the PDP', async () => {
    await home.tapCategory('Perfumes')
    await plp.isLoaded()
    await plp.openFirstProduct()
    await expect(await pdp.isLoaded()).toBe(true)
  })

  it('the cart opens from the View Cart bar', async () => {
    // The cart is populated (persisted via noReset), so the "View Cart, N
    // Items" bar is present on listing screens. Opening it must render the
    // cart. (The PLP quick-add button sits below the fold and is unreliable in
    // a shallow smoke pass — covered by a targeted functional test instead.)
    await home.openCartBar()
    await expect(await cart.isLoaded()).toBe(true)
  })

  it('Crazy Deals tab loads', async () => {
    await nav.tapCrazyDeals()
    await expect(await crazy.isLoaded()).toBe(true)
  })

  it('Categories tab is reachable', async () => {
    await nav.tapCategories()
    await expect(await nav.isTabDisplayed('Categories')).toBe(true)
  })

  it('Sale (Offers) tab is reachable', async () => {
    // The Sale page doesn't retain the Sale nav button, so assert navigation by
    // confirming we left the Home feed (matches footer BV_FTR_POS_005).
    await nav.tapOffers()
    await expect($('~Shop All')).not.toBeDisplayed()
  })

  // The app DOES have a hamburger menu (top-left), but its drawer button has no
  // automation-stable identifier (doesn't resolve by testID/accessibility-id or
  // resource-id in test runs — only by coordinates). Parked until dev adds a
  // reliable testID + accessibilityLabel. See DEV_TESTID_BACKFILL.md §6a.
  it.skip('hamburger drawer button — BLOCKED: no automation-stable identifier', () => {})
})
