import { BaseScreen } from './base.screen.js'

/**
 * HomeScreen — the storefront landing (bottom-nav "Home"), which is itself a
 * product-listing feed with category tiles.
 *
 * INTERIM SELECTORS: text-based accessibility labels validated live via
 * scripts/explore.mjs. Replace with real RN `testID`s once dev backfills them.
 */
export class HomeScreen extends BaseScreen {
  private readonly shopAllTile = '~Shop All'
  // Search-bar placeholder text rotates ("Skin Care", "Perfume", …), so match
  // the stable prefix rather than the exact label.
  private readonly searchEntry = '//*[contains(@content-desc,"Search for")]'
  // "View Cart, N Items" bar — only present on listing screens when the cart
  // is non-empty. This is the app's only cart entry point (no bottom-nav cart).
  private readonly cartBar = '//*[contains(@content-desc,"View Cart")]'
  private readonly quickAddButton = '~Add To Cart'
  // A product card's accessibility label carries its price, so a ₹ is a
  // reliable "this is a product card" marker.
  private readonly productCard = '//*[contains(@content-desc,"₹")]'

  async isLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.shopAllTile)
    return this.isDisplayed(this.shopAllTile)
  }

  async openSearch(): Promise<void> {
    await this.tap(this.searchEntry)
  }

  async tapCategory(label: string): Promise<void> {
    await this.tap(`~${label}`)
  }

  async productCardCount(): Promise<number> {
    return (await this.els(this.productCard)).length
  }

  async openFirstProduct(): Promise<void> {
    await this.tap(this.productCard)
  }

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
