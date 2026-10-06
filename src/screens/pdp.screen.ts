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

  // ---- Quantity stepper + section tabs (tagged in build v5.780) ----
  // plus/minus carry a content-desc (~ resolves them); the value node is
  // tagged resource-id only (empty content-desc), like the cart stepper.
  private readonly qtyPlus = '~pdp-qty-plus'
  private readonly qtyMinus = '~pdp-qty-minus'
  private readonly qtyValue = 'android=new UiSelector().resourceIdMatches(".*pdp-qty-value")'

  async incrementQty(): Promise<void> {
    await this.tap(this.qtyPlus)
  }

  async decrementQty(): Promise<void> {
    await this.tap(this.qtyMinus)
  }

  /** Current quantity shown in the stepper (0 if unreadable). */
  async getQty(): Promise<number> {
    const el = this.el(this.qtyValue)
    const raw =
      ((await el.getText().catch(() => '')) || '') +
      ' ' + ((await el.getAttribute('content-desc').catch(() => '')) || '')
    const m = raw.match(/\d+/)
    return m ? Number(m[0]) : 0
  }

  /**
   * Sticky section tabs are tagged as Android resource-id only (empty
   * content-desc), so they must be matched via resourceIdMatches, not ~.
   */
  sectionTabSel(slug: string): string {
    return `android=new UiSelector().resourceIdMatches(".*pdp-tab-${slug}")`
  }

  /** Tap a sticky section tab: "overview" | "reviews" | "view-similar". */
  async tapSectionTab(slug: string): Promise<void> {
    await this.tap(this.sectionTabSel(slug))
  }

  async isSectionTabDisplayed(slug: string): Promise<boolean> {
    return this.isDisplayed(this.sectionTabSel(slug))
  }

  /** Scroll down until the sticky section-tab bar is on screen. */
  async revealTabs(): Promise<void> {
    for (let i = 0; i < 4; i++) {
      if (await this.isSectionTabDisplayed('reviews')) return
      await this.swipeDown()
      await driver.pause(600)
    }
  }
}
