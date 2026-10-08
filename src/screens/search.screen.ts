import { BaseScreen } from './base.screen.js'

/**
 * SearchScreen — Wizzy-powered search.
 *
 * INTERIM SELECTORS validated live via scripts/explore.mjs: the input exposes
 * `~Search input` (a real EditText); result cards carry a ₹ price in their
 * accessibility label. Replace with dedicated testIDs once dev backfills them.
 */
export class SearchScreen extends BaseScreen {
  private readonly searchEntry = '//*[contains(@content-desc,"Search for")]'
  private readonly searchInput = '~Search input'
  private readonly resultCard = '//*[contains(@content-desc,"₹")]'

  async open(): Promise<void> {
    await this.tap(this.searchEntry)
  }

  async isLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.searchInput)
    return this.isDisplayed(this.searchInput)
  }

  /** Type into the search input WITHOUT submitting (for live-suggestion tests). */
  async typeQuery(term: string): Promise<void> {
    await this.type(this.searchInput, term)
  }

  async search(term: string): Promise<void> {
    await this.type(this.searchInput, term)
    // Submit via the IME "search" action; fall back to the ENTER key.
    try {
      await driver.execute('mobile: performEditorAction', { action: 'search' })
    } catch {
      await driver.execute('mobile: pressKey', { keycode: 66 })
    }
  }

  async getResultCount(): Promise<number> {
    return (await this.els(this.resultCard)).length
  }

  async openResult(index = 0): Promise<void> {
    const cards = await this.els(this.resultCard)
    await cards[index].click()
  }

  // ---- Reachable via text/content-desc (hybrid selectors) ----

  // Trending chips are Buttons carrying the chip label as content-desc.
  private readonly trendingChip = '//android.widget.Button[string-length(@content-desc)>0]'
  // The "Categories" suggestion section shown while typing.
  readonly categoriesHeading = '//*[@text="Categories"]'
  // Category-suggestion rows are Buttons whose content-desc is ", <name>, ";
  // Related Searches rows are Buttons under that heading. Category rows depend
  // on a live suggestion API and can be absent, so we fall back to a Related
  // Searches button (reliably present once results start loading).
  private readonly categorySuggestion = '//android.widget.Button[contains(@content-desc,", ")]'
  private readonly relatedSuggestion = '//*[@text="Related Searches"]/following::android.widget.Button[1]'
  // Per-card quick-add (resource-id + content-desc "product-quick-add").
  private readonly quickAdd = '//*[@content-desc="product-quick-add"]'
  // Tapping quick-add morphs the card into a qty stepper (pdp-qty-* ids).
  private readonly cardStepper = '~pdp-qty-plus'
  private readonly cartBar = '//*[contains(@content-desc,"View Cart")]'

  /** Tap the first Trending Searches chip. */
  async tapTrendingChip(): Promise<void> {
    await this.tap(this.trendingChip)
  }

  async isCategoriesSectionDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.categoriesHeading)
  }

  /**
   * Tap a suggestion row to open results: a Category suggestion when present,
   * otherwise a Related Searches suggestion. Returns true if one was tapped.
   */
  async tapSuggestion(): Promise<boolean> {
    for (const sel of [this.categorySuggestion, this.relatedSuggestion]) {
      for (const el of await this.els(sel)) {
        if (await el.isDisplayed().catch(() => false)) {
          await el.click().catch(() => undefined)
          return true
        }
      }
    }
    return false
  }

  private async count(selector: string): Promise<number> {
    return (await this.els(selector)).length
  }

  /**
   * Quick-add the first in-stock card and confirm it worked. The reliable
   * signal is that the tapped card's quick-add button morphs into a qty
   * stepper (pdp-qty-*), since the "N Items" bar counts distinct items only
   * and does not live-update. Out-of-stock tiles don't morph, so we try a few.
   */
  async quickAddInStock(): Promise<boolean> {
    const steppersBefore = await this.count(this.cardStepper)
    let tried = 0
    for (const btn of await this.els(this.quickAdd)) {
      if (tried >= 4) break
      tried++
      await btn.click().catch(() => undefined)
      const ok = await driver
        .waitUntil(async () => (await this.count(this.cardStepper)) > steppersBefore, {
          timeout: 3000,
          interval: 500,
        })
        .then(() => true)
        .catch(() => false)
      if (ok) return true
    }
    return false
  }

  async openCartBar(): Promise<void> {
    await this.tap(this.cartBar)
  }

  // ---- Filter / Sort (appear AFTER submitting a search; same ids as PLP) ----
  async openFilter(): Promise<void> {
    await this.tap('~filter-button')
  }
  async isFilterPanelOpen(): Promise<boolean> {
    return this.isDisplayed('~filter-apply')
  }
  async selectFilterTab(index: number): Promise<void> {
    await this.tap(`~filter-item-list-${index}`)
  }
  async selectFilterOption(index: number): Promise<void> {
    await this.tap(`~filter-option-${index}`)
  }
  async selectFilterOptionByValue(value: string): Promise<void> {
    await this.tap(`~filter-option-${value}`)
  }
  async isFilterOptionDisplayed(value: string): Promise<boolean> {
    return this.isDisplayed(`~filter-option-${value}`)
  }
  async applyFilter(): Promise<void> {
    await this.tap('~filter-apply')
  }
  async openSort(): Promise<void> {
    await this.tap('~sort-button')
  }
  async isSortSheetOpen(): Promise<boolean> {
    return this.isDisplayed('~sort-close')
  }
  async selectSortOption(index: number): Promise<void> {
    await this.tap(`~sort-option-${index}`)
  }

  /** Selling price of each result card in grid order (first ₹ in each blurb). */
  async getResultPricesInOrder(): Promise<number[]> {
    const prices: number[] = []
    for (const card of await this.els(this.resultCard)) {
      const label = (await card.getAttribute('content-desc').catch(() => '')) ?? ''
      const m = label.match(/₹\s?([\d,]+(?:\.\d+)?)/)
      if (m) prices.push(Number(m[1].replace(/,/g, '')))
    }
    return prices
  }

  // ---- Recent Searches (populate after at least one search) ----
  readonly recentHeading = '//*[@text="Recent Searches"]'
  async isRecentSearchesDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.recentHeading)
  }
  /** Tap the first Recent Searches chip (Button under the heading). */
  async tapFirstRecentSearch(): Promise<void> {
    await this.tap('//*[@text="Recent Searches"]/following::android.widget.Button[1]')
  }

  // ---- Variant popup on a search card (same ids as PLP) ----
  private readonly variantPopup = '~variant-popup'
  private readonly anyVariantOption = '//*[contains(@content-desc,"variant-option-")]'
  async isVariantPopupOpen(): Promise<boolean> {
    return this.isDisplayed(this.variantPopup)
  }
  async openVariantPopup(maxCards = 8): Promise<boolean> {
    let tried = 0
    for (const btn of await this.els(this.quickAdd)) {
      if (tried >= maxCards) break
      tried++
      await btn.click().catch(() => undefined)
      const opened = await driver
        .waitUntil(async () => this.isVariantPopupOpen(), { timeout: 2500, interval: 500 })
        .then(() => true)
        .catch(() => false)
      if (opened) return true
    }
    return false
  }
  async selectFirstVariantOption(): Promise<void> {
    await this.tap(this.anyVariantOption)
  }
  async confirmVariant(): Promise<void> {
    await this.tap('~variant-confirm')
  }
  async closeVariantPopup(): Promise<void> {
    await this.tap('~variant-close')
  }
}
