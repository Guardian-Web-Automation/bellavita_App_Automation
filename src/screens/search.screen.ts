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
}
