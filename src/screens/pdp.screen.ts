import { BaseScreen } from './base.screen.js'

/**
 * PdpScreen — product detail page.
 *
 * IMPORTANT testID GAP (found via scripts/audit.mjs): the PDP exposes NO
 * add-to-cart / buy control in its native accessibility tree — not as a
 * content-desc, not as text, even after scrolling. Until dev tags that CTA,
 * PDP → cart is unreachable in automation (see the it.skip cases in
 * pdp.spec.ts). The assertable surface is: the rating/"Reviews" line, the
 * price text nodes (₹N), and the stable "Inclusive of all taxes" label.
 *
 * INTERIM SELECTORS (text-based accessibility labels); replace with the real
 * testIDs from the backfill list once dev adds them, e.g.:
 *   priceText -> ~pdp-price / ~pdp-mrp, add-to-cart -> ~pdp-add-to-cart.
 */
export class PdpScreen extends BaseScreen {
  // Every PDP shows a rating line "<n>, <m> Reviews" — a stable "PDP loaded"
  // marker that is product-independent.
  private readonly reviewsMarker = '//*[contains(@content-desc,"Reviews")]'
  // Stable label present on every priced PDP.
  private readonly taxLine = '//*[@text="Inclusive of all taxes"]'
  // Price is rendered in bare text nodes ("₹349", "₹399") with no testID and
  // no content-desc, so selling vs MRP can't be told apart by identifier.
  private readonly priceText = '//*[contains(@text,"₹")]'

  async isLoaded(): Promise<boolean> {
    // ~pdp-add-to-cart is present on every PDP (v5.777), so it's a more
    // reliable "PDP loaded" marker than the rating/Reviews line, which is
    // absent on products with no reviews.
    await this.waitForDisplayed(this.addToCartButton)
    return this.isDisplayed(this.addToCartButton)
  }

  async isTaxLineDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.taxLine)
  }

  /** Parse the ₹ price values shown on the PDP (untagged text nodes). */
  async getDisplayedPrices(): Promise<{ text: string; amount: number }[]> {
    const nodes = await this.els(this.priceText)
    const prices: { text: string; amount: number }[] = []
    for (const node of nodes) {
      const text = (await node.getAttribute('text')) ?? ''
      for (const match of text.matchAll(/₹\s?([\d,]+(?:\.\d+)?)/g)) {
        prices.push({ text, amount: Number(match[1].replace(/,/g, '')) })
      }
    }
    return prices
  }

  /** Navigate back to the previous screen (PDP has no bottom nav). */
  async goBack(): Promise<void> {
    await driver.back()
  }

  // ---- Add to cart (tagged + functional in build v5.777) ----
  private readonly addToCartButton = '~pdp-add-to-cart'

  async isAddToCartDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.addToCartButton)
  }

  async addToCart(): Promise<void> {
    await this.tap(this.addToCartButton)
  }
}
