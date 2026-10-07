import { NavigationScreen } from '@screens/navigation.screen.js'
import { CrazyDealsScreen } from '@screens/crazy-deals.screen.js'

/**
 * Crazy Deals / Build Your Box Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "09 Crazy Deals Module"),
 * mapped to their BV_DEAL_* IDs.
 *
 * Implemented cases use the confirmed deal cards (~Build Your Box), the builder
 * STEP-1 indicator, and the ~Add To Box / ~Remove toggle. The side-shutter
 * slots, "Choose Any N" instruction, disabled-after-count state, and the bundle
 * add-to-cart bar are NOT in the a11y tree — those are it.skip with reasons.
 * expect-webdriverio auto-waiting matchers.
 */
describe('Crazy Deals / Build Your Box Module (High)', () => {
  const nav = new NavigationScreen()
  const deals = new CrazyDealsScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Start each test on the Crazy Deals page.
  beforeEach(async () => {
    for (let i = 0; i < 5 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await driver.pause(600)
    }
    await nav.tapCrazyDeals()
    await deals.isLoaded()
    await driver.pause(500)
  })

  // ---- ✅ Auto-now (implemented) ------------------------------------------

  it('BV_DEAL_POS_001 Crazy Deals page shows a grid of deal cards', async () => {
    await expect($('~Build Your Box')).toBeDisplayed()
  })

  it('BV_DEAL_POS_003 tapping Build Your Box opens the box builder', async () => {
    await deals.openFirstBox()
    await expect($('//*[@text="STEP 1"]')).toBeDisplayed()
  })

  it('BV_DEAL_POS_005 the box builder shows the STEP 1 indicator', async () => {
    await deals.openFirstBox()
    await expect($('//*[@text="STEP 1"]')).toBeDisplayed()
    // NOTE: the "Choose Any N" required-count text + checkmark are untagged, so
    // only the STEP-1 indicator itself is asserted here.
  })

  it('BV_DEAL_POS_008 Add To Box selects a product (button changes to Remove)', async () => {
    await deals.openFirstBox()
    await deals.isBuilderLoaded()
    await deals.addFirstToBox()
    await expect($('~Remove')).toBeDisplayed()
  })

  it('BV_DEAL_POS_009 Remove deselects a product (count of selected drops)', async () => {
    await deals.openFirstBox()
    await deals.isBuilderLoaded()
    await deals.addFirstToBox()
    await driver.pause(500)
    const before = await deals.selectedCount()
    expect(before).toBeGreaterThan(0)
    await deals.removeFirstFromBox()
    await driver.pause(500)
    const after = await deals.selectedCount()
    expect(after).toBeLessThan(before)
  })

  // ---- ✅ Unblocked via hybrid (builder header + search reachable by text) -

  it('BV_DEAL_POS_004 the box builder header shows the deal price + required count', async () => {
    await deals.openFirstBox()
    await deals.isBuilderLoaded()
    expect(await deals.isHeaderDisplayed()).toBe(true)
  })

  it('BV_DEAL_POS_006 the deal set has a search box that accepts input', async () => {
    await deals.openFirstBox()
    await deals.isBuilderLoaded()
    await expect($('//android.widget.EditText[@text="Search what you desire"]')).toBeDisplayed()
    await deals.searchInDeal('perfume')
    await driver.pause(1500)
    // Still on the builder (STEP 1) after searching — input handled, no crash.
    await expect($('//*[@text="STEP 1"]')).toBeDisplayed()
  })

  // ---- ⏭️ Blocked: untagged builder internals -----------------------------
  it.skip('BV_DEAL_POS_010 "OPEN" shutter reveals product slots — BLOCKED: side shutter untagged', () => {})
  it.skip('BV_DEAL_POS_012 adding a product fills a shutter slot — BLOCKED: shutter slots untagged', () => {})
  it.skip('BV_DEAL_POS_014 remove a product from its shutter slot — BLOCKED: shutter slots untagged', () => {})
  it.skip('BV_DEAL_NEG_015 Add To Box disables after required count — BLOCKED: disabled state untagged', () => {})
  it.skip('BV_DEAL_POS_016 removing re-enables disabled Add To Box — BLOCKED: disabled state untagged', () => {})
  it.skip('BV_DEAL_BND_017 Add-to-Cart bar hidden at N-1, shown at N — BLOCKED: add-to-cart bar not exposed', () => {})
  it.skip('BV_DEAL_POS_019 ADD TO CART adds the box as one bundled item — BLOCKED: add-to-cart bar not exposed', () => {})
  it.skip('BV_DEAL_POS_020 cart shows the deal as one bundled line item — BLOCKED: bundle line-item untagged', () => {})
  it.skip('BV_DEAL_E2E_027 full build-a-box → add-to-cart journey — BLOCKED: shutter/add-to-cart-bar not exposed', () => {})
})
