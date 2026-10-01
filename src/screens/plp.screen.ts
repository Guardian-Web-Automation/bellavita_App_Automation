import { BaseScreen } from './base.screen.js'

/**
 * PlpScreen — product-listing grid reached from a category tile.
 *
 * INTERIM SELECTORS (see scripts/explore.mjs): the grid has no semantic
 * container id, so we key off the product cards themselves — each card's
 * accessibility label carries a ₹ price. Replace with testIDs when available.
 */
export class PlpScreen extends BaseScreen {
  private readonly productCard = '//*[contains(@content-desc,"₹")]'
  // Every PLP card exposes an inline quick-add (unlike the home feed, whose
  // layout is dynamic). The "View Cart, N Items" bar appears here once the
  // cart is non-empty — the app's only cart entry point.
  private readonly quickAddButton = '~Add To Cart'
  private readonly cartBar = '//*[contains(@content-desc,"View Cart")]'

  async isLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.productCard)
    return this.isDisplayed(this.productCard)
  }

  async getProductCount(): Promise<number> {
    return (await this.els(this.productCard)).length
  }

  async openFirstProduct(): Promise<void> {
    await this.tap(this.productCard)
  }

  /**
   * Quick-add the first product. NOTE: the quick-add button frequently sits
   * below the fold on this app and is unreliable to reach in a shallow smoke
   * test, so the smoke suite opens the (already-populated) cart via the
   * View Cart bar instead. Kept for targeted/functional tests.
   */
  async quickAddFirstProduct(): Promise<void> {
    await this.tap(this.quickAddButton)
  }

  async isCartBarDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.cartBar)
  }

  async openCartBar(): Promise<void> {
    await this.tap(this.cartBar)
  }
}
