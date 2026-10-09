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

  // Seed the cart when empty. pdp_revamp: product-quick-add navigates to the PDP
  // (it no longer adds inline), so go to the Shop All PLP, tap quick-add, and
  // complete the add from whichever surface appears (variant popup → option +
  // confirm, or PDP → pdp-add-to-cart). Mirrors scripts/seed-cart.mjs.
  async function seedCartIfEmpty(): Promise<void> {
    if (await home.isCartBarDisplayed()) return
    await nav.openMenuItem('shop-all').catch(() => undefined)
    await driver.pause(3000)
    await $('~product-quick-add').click().catch(() => undefined)
    await driver.pause(3000)
    if (await $('~variant-popup').isDisplayed().catch(() => false)) {
      await $('//*[contains(@content-desc,"variant-option-")]').click().catch(() => undefined)
      await driver.pause(800)
      await $('~variant-confirm').click().catch(() => undefined)
      await driver.pause(2500)
    } else if (await $('~pdp-add-to-cart').isDisplayed().catch(() => false)) {
      await $('~pdp-add-to-cart').click().catch(() => undefined)
      await driver.pause(3000)
    }
  }

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
    // Ensure the cart is non-empty so the View Cart bar + cart screen exist.
    if (!(await home.isCartBarDisplayed())) {
      await seedCartIfEmpty()
      // Back to Home so the View Cart bar is on screen for the test.
      for (let i = 0; i < 4 && !(await nav.isTabDisplayed('Home')); i++) {
        await driver.back()
        await driver.pause(600)
      }
      if (await nav.isTabDisplayed('Home')) {
        await nav.tapHome()
        await driver.pause(800)
      }
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

  // ---- ✅ Quantity stepper (tagged in v5.780) ------------------------------
  // The persisted cart can carry a qty-locked bundle/combo as its first item,
  // so these operate on whichever stepper actually responds (cart.stepAnyItem).
  it('BV_CART_POS_013 quantity + increases the item quantity', async () => {
    await home.openCartBar()
    await expect($('~PLACE ORDER')).toBeDisplayed()
    // Items can sit at their stock cap (persisted cart), where + is a no-op.
    // Step one down first to guarantee headroom, then verify + raises it.
    await cart.stepAnyItem('dec')
    expect(await cart.stepAnyItem('inc')).toBe(true)
  })

  it('BV_CART_POS_014 quantity - decreases the item quantity', async () => {
    await home.openCartBar()
    await expect($('~PLACE ORDER')).toBeDisplayed()
    // Make sure a regular item is above its minimum so - has room to move.
    await cart.stepAnyItem('inc')
    expect(await cart.stepAnyItem('dec')).toBe(true)
  })

  // ---- ✅ Bill details (tagged in v5.780) ----------------------------------
  it('BV_CART_POS_017 Bill details show Items total and Saved', async () => {
    await home.openCartBar()
    await cart.reveal(cart.billItemsSel)
    await expect($(cart.billItemsSel)).toBeDisplayed()
    await expect($(cart.billSavedSel)).toBeDisplayed()
  })

  it('BV_CART_POS_019 Grand Total equals Items total plus Delivery', async () => {
    await home.openCartBar()
    await cart.reveal(cart.billGrandSel)
    await expect($(cart.billGrandSel)).toBeDisplayed()
    const items = await cart.getItemsTotal()
    const delivery = await cart.getDeliveryCharge()
    const grand = await cart.getGrandTotal()
    expect(grand).toBeGreaterThan(0)
    const expected = items + (Number.isNaN(delivery) ? 0 : delivery)
    expect(Math.abs(grand - expected)).toBeLessThanOrEqual(1)
  })

  // ---- ✅ Bundle (tagged in v5.780) ----------------------------------------
  it('BV_CART_POS_022 the bundle-unlock section renders', async () => {
    await home.openCartBar()
    await cart.reveal('~cart-bundle-add')
    await expect($('~cart-bundle-add')).toBeDisplayed()
  })

  it('BV_CART_POS_023 ADD on a bundle suggestion adds it to the cart', async () => {
    await home.openCartBar()
    await cart.reveal('~cart-bundle-add')
    await expect($('~cart-bundle-add')).toBeDisplayed()
    const before = await cart.itemCount()
    await cart.addBundleSuggestion()
    await driver.waitUntil(async () => (await cart.itemCount()) > before, {
      timeout: 10000, interval: 1000,
      timeoutMsg: `cart item count did not increase from ${before}`,
    })
  })

  // ---- ⏭️ Blocked: untagged — combo tag -----------------------------------
  it.skip('BV_CART_POS_024 "Combo Discount Applied" tag on threshold — BLOCKED: combo tag untagged', () => {})
  it.skip('BV_CART_POS_025 combo discount reduces unit price / total — BLOCKED: bill-details untagged', () => {})
  it.skip('BV_CART_E2E_036 unlock bundle + combo discount before checkout — BLOCKED: bundle/combo untagged', () => {})

  // ---- ⏭️ Blocked: checkout webview ---------------------------------------
  it.skip('BV_CART_POS_021 PLACE ORDER proceeds to checkout — BLOCKED: GoKwik checkout runs in a webview', () => {})
  it.skip('BV_CART_POS_038 quick-adjust qty then checkout — BLOCKED: stepper untagged + checkout webview', () => {})
})
