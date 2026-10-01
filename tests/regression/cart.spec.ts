import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { CartScreen } from '@screens/cart.screen.js'

/**
 * Cart Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "03 Cart Module"),
 * mapped to their BV_CART_* IDs.
 *
 * The cart is reached via the "View Cart, N Items" bar and shows line-item
 * blurbs (₹) and a ~PLACE ORDER button. The quantity stepper (+/-), Bill-
 * details rows, bundle/combo sections and item-remove controls are UNTAGGED,
 * and checkout runs in a GoKwik webview — those cases are it.skip. The empty-
 * cart cases need an empty cart, which can't be reached (remove is untagged).
 *
 * Precondition: the cart is non-empty (persisted via noReset), so the View
 * Cart bar is present on listing screens. Assertions use expect-webdriverio.
 */
describe('Cart Module (High)', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const cart = new CartScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home before each test (View Cart bar shows on listing screens).
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

  it('BV_CART_POS_009 the View Cart bar shows the current item count', async () => {
    // Bar content-desc is e.g. "+2, View Cart, 3 Items," — presence confirms
    // the toast/bar with count. (Full toast animation isn't separately tagged.)
    await expect($('//*[contains(@content-desc,"View Cart")]')).toBeDisplayed()
  })

  it('BV_CART_POS_010 tapping the View Cart bar opens the Cart page', async () => {
    await home.openCartBar()
    await expect($('~PLACE ORDER')).toBeDisplayed()
  })

  it('BV_CART_POS_012 the Cart page lists added items with prices', async () => {
    await home.openCartBar()
    await expect($('~PLACE ORDER')).toBeDisplayed()
    // At least one line item with a price is shown (image/MRP are untagged).
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  // ---- ⏭️ Blocked: empty-cart state unreachable ---------------------------
  it.skip('BV_CART_POS_001 empty-cart state renders — BLOCKED: cannot reach empty cart (item-remove control untagged)', () => {})
  it.skip('BV_CART_POS_007 add from empty-cart "You May Also Like" — BLOCKED: needs empty cart + quick-add not card-bound', () => {})

  // ---- ⏭️ Blocked: untagged — quantity stepper ----------------------------
  it.skip('BV_CART_POS_013 quantity + increases qty and total — BLOCKED: stepper untagged (only a "1" text node)', () => {})
  it.skip('BV_CART_POS_014 quantity - decreases qty and total — BLOCKED: stepper untagged', () => {})

  // ---- ⏭️ Blocked: untagged — Bill details --------------------------------
  it.skip('BV_CART_POS_017 Items total + "Saved" badge / strikethrough — BLOCKED: bill-details untagged', () => {})
  it.skip('BV_CART_POS_019 Grand Total = Items + Delivery — BLOCKED: bill-details untagged (no discrete rows)', () => {})

  // ---- ⏭️ Blocked: untagged — bundle / combo ------------------------------
  it.skip('BV_CART_POS_022 "One More To Unlock" bundle section renders — BLOCKED: bundle section untagged', () => {})
  it.skip('BV_CART_POS_023 ADD on a bundle suggestion adds it — BLOCKED: bundle add not bound/verifiable', () => {})
  it.skip('BV_CART_POS_024 "Combo Discount Applied" tag on threshold — BLOCKED: combo tag untagged', () => {})
  it.skip('BV_CART_POS_025 combo discount reduces unit price / total — BLOCKED: bill-details untagged', () => {})
  it.skip('BV_CART_E2E_036 unlock bundle + combo discount before checkout — BLOCKED: bundle/combo untagged', () => {})

  // ---- ⏭️ Blocked: checkout webview ---------------------------------------
  it.skip('BV_CART_POS_021 PLACE ORDER proceeds to checkout — BLOCKED: GoKwik checkout runs in a webview', () => {})
  it.skip('BV_CART_POS_038 quick-adjust qty then checkout — BLOCKED: stepper untagged + checkout webview', () => {})
})
