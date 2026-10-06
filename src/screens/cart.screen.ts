import { BaseScreen } from './base.screen.js'

/**
 * CartScreen — cart / line items.
 *
 * Reached via the "View Cart, N Items" bar on listing screens (HomeScreen /
 * PlpScreen); there is no bottom-nav cart. INTERIM SELECTORS validated via
 * scripts/audit.mjs — `~PLACE ORDER` is the stable "cart loaded" marker and
 * each line item's accessibility label carries its price. Replace with
 * testIDs when dev backfills them.
 *
 * WATCH-LIST: WL-01 (₹0 add-to-cart pricing) is asserted here via
 * `hasZeroPricedItem`. That is a *targeted* check, deliberately NOT part of
 * the smoke suite — a legitimately-free gift can read ₹0 and would make smoke
 * flaky; run it as its own functional test.
 */
export class CartScreen extends BaseScreen {
  private readonly placeOrderButton = '~PLACE ORDER'
  private readonly lineItem = '//*[contains(@content-desc,"₹")]'

  async isLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.placeOrderButton)
    return this.isDisplayed(this.placeOrderButton)
  }

  /** Every cart line item's accessibility label (carries name + prices). */
  async getLineItemLabels(): Promise<string[]> {
    const items = await this.els(this.lineItem)
    const labels: string[] = []
    for (const item of items) {
      const label = await item.getAttribute('content-desc')
      labels.push(label ?? '')
    }
    return labels
  }

  /** WL-01 guard (targeted, not smoke): true if any line item is priced ₹0. */
  async hasZeroPricedItem(): Promise<boolean> {
    const labels = await this.getLineItemLabels()
    return labels.some((label) => /(^|[,\s])₹0(\D|$)/.test(label))
  }

  // ---- Quantity stepper, bill details, bundle (tagged in build v5.780) ----
  // cart-qty-plus/minus and cart-bundle-add carry a content-desc, so the ~
  // (accessibility-id) selector resolves them. cart-qty-value, cart-item and
  // the cart-bill-* rows are tagged as Android resource-id ONLY (empty
  // content-desc), so they must be matched via resourceIdMatches — see v5.780
  // backfill notes. Public selectors are exposed for the spec's expect($()).
  private readonly qtyPlus = '~cart-qty-plus'
  private readonly qtyMinus = '~cart-qty-minus'
  private readonly qtyValue = 'android=new UiSelector().resourceIdMatches(".*cart-qty-value")'
  private readonly bundleAdd = '~cart-bundle-add'

  readonly billItemsSel = 'android=new UiSelector().resourceIdMatches(".*cart-bill-items")'
  readonly billSavedSel = 'android=new UiSelector().resourceIdMatches(".*cart-bill-saved")'
  readonly billDeliverySel = 'android=new UiSelector().resourceIdMatches(".*cart-bill-delivery")'
  readonly billGrandSel = 'android=new UiSelector().resourceIdMatches(".*cart-bill-grand-total")'
  readonly bundleAddSel = '~cart-bundle-add'
  private readonly itemSel = 'android=new UiSelector().resourceIdMatches(".*cart-item")'

  async incrementQty(): Promise<void> {
    await this.tap(this.qtyPlus)
  }

  async decrementQty(): Promise<void> {
    await this.tap(this.qtyMinus)
  }

  /** Read the numeric qty from one stepper value node (0 if unreadable). */
  private async qtyOf(el: WebdriverIO.Element): Promise<number> {
    const raw = ((await el.getText().catch(() => '')) || '')
    const m = raw.match(/\d+/)
    return m ? Number(m[0]) : 0
  }

  async getQty(): Promise<number> {
    // The value node can render a beat after the cart opens; wait so a race
    // doesn't read 0. It's resource-id only, so read .text (content-desc empty).
    await this.isDisplayed(this.qtyValue).catch(() => undefined)
    const el = this.el(this.qtyValue)
    await el.waitForDisplayed({ timeout: 8000 }).catch(() => undefined)
    const raw =
      ((await el.getText().catch(() => '')) || '') +
      ' ' + ((await el.getAttribute('content-desc').catch(() => '')) || '')
    const m = raw.match(/\d+/)
    return m ? Number(m[0]) : 0
  }

  /** Sum of every line-item quantity (bundle/combo items are qty-locked). */
  async totalQty(): Promise<number> {
    const els = await this.els(this.qtyValue)
    let sum = 0
    for (const el of els) sum += await this.qtyOf(el)
    return sum
  }

  /**
   * Tap the +/- on the item that actually responds. A persisted cart can have
   * a qty-locked bundle/combo as its first item, so we try each stepper until
   * the cart's total quantity moves in the requested direction.
   * @returns true if some item's qty changed.
   */
  async stepAnyItem(dir: 'inc' | 'dec'): Promise<boolean> {
    const btnSel = dir === 'inc' ? this.qtyPlus : this.qtyMinus
    const btns = await this.els(btnSel)
    for (const btn of btns) {
      const before = await this.totalQty()
      await btn.click().catch(() => undefined)
      const ok = await driver
        .waitUntil(
          async () => {
            const now = await this.totalQty()
            return dir === 'inc' ? now > before : now < before
          },
          { timeout: 4000, interval: 600 },
        )
        .then(() => true)
        .catch(() => false)
      if (ok) return true
    }
    return false
  }

  /** Scroll the cart until `selector` is on screen (bill rows / bundle sit low). */
  async reveal(selector: string, max = 6): Promise<boolean> {
    for (let i = 0; i < max; i++) {
      if (await this.isDisplayed(selector)) return true
      await this.swipeDown()
      await driver.pause(500)
    }
    return this.isDisplayed(selector)
  }

  async addBundleSuggestion(): Promise<void> {
    await this.tap(this.bundleAdd)
  }

  /** Read a ₹ amount from a bill-detail row by its testID slug. */
  private async billAmount(slug: string): Promise<number> {
    const el = this.el(`android=new UiSelector().resourceIdMatches(".*cart-bill-${slug}")`)
    const text = ((await el.getText().catch(() => '')) || '') +
      ' ' + ((await el.getAttribute('content-desc').catch(() => '')) || '')
    const m = text.match(/₹\s?([\d,]+(?:\.\d+)?)/)
    return m ? Number(m[1].replace(/,/g, '')) : NaN
  }

  async getItemsTotal(): Promise<number> {
    return this.billAmount('items')
  }

  async getDeliveryCharge(): Promise<number> {
    return this.billAmount('delivery')
  }

  async getGrandTotal(): Promise<number> {
    return this.billAmount('grand-total')
  }

  async isBillDetailsDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.billGrandSel)
  }

  async isBundleSectionDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.bundleAdd)
  }

  /** Number of cart line items (tagged ~cart-item in build v5.780). */
  async itemCount(): Promise<number> {
    return (await this.els(this.itemSel)).length
  }
}
