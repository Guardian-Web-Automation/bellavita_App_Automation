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
  private readonly quickAddButton = '~product-quick-add' // was '~Add To Cart'; tagged in v5.780
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

  // ---- Carousel quick-add (hybrid) ----
  // Tapping a card's quick-add morphs it into a qty stepper (pdp-qty-* ids);
  // the "N Items" bar counts distinct items only and doesn't live-update, so a
  // new stepper is the reliable "added" signal.
  private readonly quickAdd = '//*[@content-desc="product-quick-add"]'
  private readonly cardStepper = '~pdp-qty-plus'

  private async count(selector: string): Promise<number> {
    return (await this.els(selector)).length
  }

  // ---- Appmaker banners / hero CTAs / card rows (stable UUID ids) ----
  // These come from the Appmaker SDK; dev confirmed stable resource-id +
  // content-desc per banner/row. Tap the banner itself ("Shop Now" / arrows are
  // part of the image). Card rows have no per-card id — tap by position.

  /** Scroll the feed until an element (by ~id) is visible. */
  async revealById(id: string, max = 10): Promise<boolean> {
    for (let i = 0; i < max; i++) {
      if (await this.isDisplayed(`~${id}`)) return true
      await this.swipeDown()
      await driver.pause(500)
    }
    return this.isDisplayed(`~${id}`)
  }

  /** Reveal and tap an Appmaker banner / hero by its id. */
  async tapBanner(id: string): Promise<void> {
    await this.revealById(id)
    await this.tap(`~${id}`)
  }

  /** Reveal a card row by id and tap the Nth clickable card inside it (1-based). */
  async tapCardInRow(rowId: string, position = 1): Promise<void> {
    await this.revealById(rowId)
    await this.tap(`(//*[@resource-id='${rowId}']//*[@clickable='true'])[${position}]`)
  }

  /** Quick-add the first in-stock carousel card; true once a stepper appears. */
  async quickAddFromCarousel(): Promise<boolean> {
    const before = await this.count(this.cardStepper)
    let tried = 0
    for (const btn of await this.els(this.quickAdd)) {
      if (tried >= 4) break
      tried++
      await btn.click().catch(() => undefined)
      const ok = await driver
        .waitUntil(async () => (await this.count(this.cardStepper)) > before, {
          timeout: 3000,
          interval: 500,
        })
        .then(() => true)
        .catch(() => false)
      if (ok) return true
    }
    return false
  }
}
