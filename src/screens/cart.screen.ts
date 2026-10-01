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
}
