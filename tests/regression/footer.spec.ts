import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { CrazyDealsScreen } from '@screens/crazy-deals.screen.js'

/**
 * Footer / Bottom-Navigation Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "08 Footer Module"),
 * mapped to their BV_FTR_* IDs.
 *
 * Implemented cases use confirmed bottom-nav labels (~Home / ~Categories /
 * ~Offers / ~Crazy Deals) and destination markers we validated live
 * (~Shop All for home, ~Build Your Box for Crazy Deals). Cases that depend on
 * dynamic/UUID offer banners are scaffolded as it.skip with the reason.
 * Assertions use expect-webdriverio auto-waiting matchers.
 */
describe('Footer / Bottom Navigation Module (High)', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const crazy = new CrazyDealsScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home before each test.
  beforeEach(async () => {
    for (let i = 0; i < 4 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await home.isLoaded().catch(() => undefined)
      await driver.pause(600)
    }
  })

  it('BV_FTR_POS_001 bottom nav stays fixed while the page scrolls', async () => {
    // Bottom-nav now uses stable testIDs (v5.780) instead of text labels.
    for (const tab of ['nav-home', 'nav-categories', 'nav-offers', 'nav-crazy-deals']) {
      await expect($(`~${tab}`)).toBeDisplayed()
    }
    await home.swipeDown()
    await driver.pause(500)
    await home.swipeUp()
    await driver.pause(500)
    // Nav bar is still present after scrolling in both directions.
    await expect($('~nav-home')).toBeDisplayed()
    await expect($('~nav-crazy-deals')).toBeDisplayed()
  })

  it('BV_FTR_POS_003 tapping Home from another tab returns to Home', async () => {
    await nav.tapCrazyDeals()
    await expect($('~Build Your Box')).toBeDisplayed()
    await nav.tapHome()
    // Home feed marker (Shop All category row) confirms we are back on Home.
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_FTR_POS_004 tapping Categories opens the Categories page', async () => {
    await nav.tapCategories()
    await expect($('~nav-categories')).toBeDisplayed()
    // We left the Home feed (Shop All is a home-only element). NOTE: the
    // category grid tiles themselves are UUID-only (untagged) — deeper grid
    // assertions are blocked pending testIDs.
    await expect($('~Shop All')).not.toBeDisplayed()
  })

  // NOTE: the doc's "Offers" tab is labelled "Sale" in the live app, and the
  // Sale page does not retain the Sale nav button, so we assert navigation by
  // confirming we left the Home feed (offer banners themselves are dynamic/UUID
  // and untagged, so banner-content assertions are blocked pending testIDs).
  it('BV_FTR_POS_005 tapping Offers (labelled "Sale") opens the Offers page', async () => {
    await nav.tapOffers()
    await expect($('~Shop All')).not.toBeDisplayed()
  })

  it('BV_FTR_POS_007 tapping Crazy Deals opens the Crazy Deals page', async () => {
    await nav.tapCrazyDeals()
    await expect($('~Build Your Box')).toBeDisplayed()
  })

  // ---- ⏭️ Blocked: dynamic/UUID offer banners ----------------------------
  it.skip('BV_FTR_POS_006 tap an offer banner opens its PDP — BLOCKED: offer banners are dynamic/UUID (not reliably tappable/identifiable)', () => {})
  it.skip('BV_FTR_E2E_014 full nav journey via an offer PDP — BLOCKED: depends on BV_FTR_POS_006 (dynamic offer banner → PDP)', () => {})
})
