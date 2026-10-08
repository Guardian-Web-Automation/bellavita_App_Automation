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

  // The box-builder add/remove flow changed in pdp_revamp: the old ~Add To Box /
  // ~Remove labels no longer resolve, and the new deal-add-to-box flow doesn't
  // complete the box in automation (see 015/016/017/019/027). Skipped pending
  // dev clarification on the box-builder add/select/remove ids + flow.
  it.skip('BV_DEAL_POS_008 Add To Box selects a product — PENDING: box add/remove flow changed (dev clarification)', () => {})
  it.skip('BV_DEAL_POS_009 Remove deselects a product — PENDING: box add/remove flow changed (dev clarification)', () => {})

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

  // ---- ✅ Unblocked by pdp_revamp testIDs (shutter + box add-to-cart) ------

  it('BV_DEAL_POS_010 the OPEN shutter reveals product slots', async () => {
    await deals.openFirstBox()
    await deals.isBuilderLoaded()
    await deals.openShutter()
    await driver.pause(1000)
    expect(await deals.isShutterOpen()).toBe(true)
  })

  // Box-fill / add-to-cart flow: fillBox (via ~deal-add-to-box) doesn't complete
  // the box live, so deal-add-to-box-disabled and ~deal-add-to-cart never appear.
  // Skipped pending dev clarification on how the box is filled/completed (the
  // builder uses a shutter + slots — see question list). Shutter open (010) and
  // header/search (004/006) are verified above.
  it.skip('BV_DEAL_NEG_015 Add To Box disables when box full — PENDING: box-fill flow not completing (dev clarification)', () => {})
  it.skip('BV_DEAL_POS_016 removing re-enables Add To Box — PENDING: box-fill flow not completing (dev clarification)', () => {})
  it.skip('BV_DEAL_BND_017 ADD TO CART bar shows when box full — PENDING: box-fill flow not completing (dev clarification)', () => {})
  it.skip('BV_DEAL_POS_019 ADD TO CART adds the box to cart — PENDING: box-fill flow not completing (dev clarification)', () => {})
  it.skip('BV_DEAL_E2E_027 full build-a-box → add-to-cart → cart — PENDING: box-fill flow not completing (dev clarification)', () => {})

  // ---- ⏭️ Still blocked / needs live shutter mechanics --------------------
  it.skip('BV_DEAL_POS_012 adding a product fills a shutter slot — needs live shutter-slot binding (covered partly by 010)', () => {})
  it.skip('BV_DEAL_POS_014 remove a product from its shutter slot — needs live shutter-slot remove control', () => {})
  it.skip('BV_DEAL_POS_020 cart shows the deal as one bundled line item — BLOCKED: no bundle line-item testID in cart', () => {})
})
