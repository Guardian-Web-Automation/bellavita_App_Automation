import { BaseScreen } from './base.screen.js'

/**
 * CollectionScreen — the collection / product-listing view reached via
 * Home → "Shop All". (Audit note: "Shop All" is the home feed's default tab,
 * not a dedicated collection screen — see docs/test-cases/plp-collection.md §1.)
 *
 * INTERIM SELECTORS: every selector here is a text-based accessibility label,
 * confirmed live via scripts/audit.mjs / audit-collection.mjs. The app exposes
 * NO real testIDs on this screen. Replace each with the real testID from the
 * backfill list in the doc (§14) once dev adds them, e.g.:
 *   productCard      -> ~product-card
 *   quickAddButton   -> ~product-quick-add
 *   (price/MRP/sort/filter/wishlist controls -> see §14)
 */
export class CollectionScreen extends BaseScreen {
  private readonly shopAllTile = '~Shop All'                                  // TODO: dedicated collection testID
  // A product card is a single ViewGroup whose content-desc is the whole blurb
  // (name, rating, savings, price, MRP, Bellacash). The ₹ is the reliable
  // "this is a product card" marker. No per-card / child-node testIDs exist.
  private readonly productCard = '//*[contains(@content-desc,"₹")]'           // TODO: ~product-card
  private readonly quickAddButton = '~Add To Cart'                            // TODO: ~product-quick-add
  private readonly cartBar = '//*[contains(@content-desc,"View Cart")]'       // TODO: ~cart-bar
  private readonly searchEntry = '//*[contains(@content-desc,"Search for")]'  // TODO: ~search-entry

  /** From home, open the collection view. */
  async open(): Promise<void> {
    await this.tap(this.shopAllTile)
  }

  /** True if at least one product card is present. */
  async isGridDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.productCard)
  }

  /** The currently-rendered product-card elements (whole-card blurb nodes). */
  async getVisibleCards() {
    return this.els(this.productCard)
  }

  /**
   * Parse ₹N.NN values out of the visible card blurbs. Returns one entry per
   * price token, tagging each with the full card label so callers can exclude
   * specific cards (e.g. FREE gifts) — see WL-01 in the spec.
   */
  async getVisiblePrices(): Promise<{ label: string; amount: number }[]> {
    const cards = await this.els(this.productCard)
    const prices: { label: string; amount: number }[] = []
    for (const card of cards) {
      const label = (await card.getAttribute('content-desc')) ?? ''
      for (const match of label.matchAll(/₹\s?([\d,]+(?:\.\d+)?)/g)) {
        prices.push({ label, amount: Number(match[1].replace(/,/g, '')) })
      }
    }
    return prices
  }

  /** Tap a category tab (e.g. "Perfumes", "Skincare"). */
  async switchCategory(label: string): Promise<void> {
    await this.tap(`~${label}`)
  }

  /** Tap the first product card (its whole-card blurb node) to open its PDP. */
  async openFirstProduct(): Promise<void> {
    await this.tap(this.productCard)
  }

  /**
   * Quick-add the first available product. The quick-add button often sits
   * below the fold, so nudge the grid down a few times to reveal one before
   * giving up (bounded — no runaway UiScrollable search).
   */
  async quickAddFirstAvailable(): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const buttons = await this.els(this.quickAddButton)
      for (const button of buttons) {
        if (await button.isDisplayed()) {
          await button.click()
          return
        }
      }
      await this.swipeDown()
      await driver.pause(600)
    }
    // Final attempt — tap() waits/throws with a clear message if truly absent.
    await this.tap(this.quickAddButton)
  }

  /** Read the "View Cart, N Items" bottom-bar count (0 if the bar is absent). */
  async getCartBarCount(): Promise<number> {
    const count = await this.els(this.cartBar).length
    if (count === 0) return 0
    const label = (await this.el(this.cartBar).getAttribute('content-desc')) ?? ''
    const match = label.match(/(\d+)\s*Items?/i)
    return match ? Number(match[1]) : 0
  }

  /** Open the cart via the View Cart bottom bar. */
  async openCart(): Promise<void> {
    await this.tap(this.cartBar)
  }

  /** Open search from the collection view. */
  async openSearch(): Promise<void> {
    await this.tap(this.searchEntry)
  }

  /** Scroll the grid down one viewport (reuses BaseScreen's gesture). */
  async scrollGridOnce(): Promise<void> {
    await this.swipeDown()
  }

  // ---- Sort / Filter (real PLP, reached via Hamburger -> Shop All) ----
  // Tagged in build v5.777: ~sort-button / ~filter-button open bottom sheets;
  // sort options are ~sort-option-<n> (2 = Price Low→High, 3 = Price High→Low);
  // filter tabs ~filter-item-list-<n>, options ~filter-option-<n>, ~filter-apply.
  private readonly sortButton = '~sort-button'
  private readonly filterButton = '~filter-button'
  private readonly filterApply = '~filter-apply'

  async openSort(): Promise<void> {
    await this.tap(this.sortButton)
  }

  async isSortSheetOpen(): Promise<boolean> {
    return this.isDisplayed('~sort-close')
  }

  /** Select a sort option by index (2 = Price Low→High, 3 = Price High→Low). */
  async selectSortOption(index: number): Promise<void> {
    await this.tap(`~sort-option-${index}`)
  }

  async openFilter(): Promise<void> {
    await this.tap(this.filterButton)
  }

  async isFilterPanelOpen(): Promise<boolean> {
    return this.isDisplayed(this.filterApply)
  }

  async selectFilterTab(index: number): Promise<void> {
    await this.tap(`~filter-item-list-${index}`)
  }

  async selectFilterOption(index: number): Promise<void> {
    await this.tap(`~filter-option-${index}`)
  }

  async applyFilter(): Promise<void> {
    await this.tap(this.filterApply)
  }

  /**
   * The selling price of each product card in grid order (the first ₹ in each
   * card blurb is the selling price; the second is the struck MRP). Used to
   * verify sort ordering.
   */
  async getSellingPricesInOrder(): Promise<number[]> {
    const cards = await this.els(this.productCard)
    const prices: number[] = []
    for (const card of cards) {
      const label = (await card.getAttribute('content-desc')) ?? ''
      const match = label.match(/₹\s?([\d,]+(?:\.\d+)?)/)
      if (match) prices.push(Number(match[1].replace(/,/g, '')))
    }
    return prices
  }
}
