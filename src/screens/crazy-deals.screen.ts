import { BaseScreen } from './base.screen.js'

/**
 * CrazyDealsScreen — the "Crazy Deals" bottom-nav destination.
 *
 * INTERIM SELECTOR (see scripts/explore.mjs): "Build Your Box" is the one
 * stable, distinctive label on this screen. Replace with a testID later.
 */
export class CrazyDealsScreen extends BaseScreen {
  private readonly buildYourBox = '~Build Your Box'
  // Box-builder controls (validated via scripts/audit-crazydeals.mjs). The
  // shutter slots, "Choose Any N" instruction, disabled state and the bundle
  // add-to-cart bar are NOT in the a11y tree — see crazy-deals.spec skips.
  private readonly stepIndicator = '//*[@text="STEP 1"]'
  private readonly addToBox = '~Add To Box'
  private readonly removeFromBox = '~Remove'

  async isLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.buildYourBox)
    return this.isDisplayed(this.buildYourBox)
  }

  /** Open the first deal's box builder. */
  async openFirstBox(): Promise<void> {
    await this.tap(this.buildYourBox)
  }

  /** True once the box-builder screen is showing (STEP 1 indicator). */
  async isBuilderLoaded(): Promise<boolean> {
    await this.waitForDisplayed(this.stepIndicator)
    return this.isDisplayed(this.stepIndicator)
  }

  /** Tap the first "Add To Box" on a builder product card. */
  async addFirstToBox(): Promise<void> {
    await this.tap(this.addToBox)
  }

  /** Tap the first "Remove" (deselect a product from the box). */
  async removeFirstFromBox(): Promise<void> {
    await this.tap(this.removeFromBox)
  }

  /** How many products are currently selected (i.e. show a "Remove" button). */
  async selectedCount(): Promise<number> {
    return (await this.els(this.removeFromBox)).length
  }

  // ---- Builder header + search (reachable via text, hybrid selectors) ----
  // The builder header shows the deal name, a ₹ price and the "Select Any N"
  // instruction as plain text; the deal set has a "Search what you desire" box.
  private readonly builderPrice = '//*[contains(@text,"₹")]'
  private readonly requiredCountText = '//*[contains(@text,"Select Any")]'
  private readonly builderSearch = '//android.widget.EditText[@text="Search what you desire"]'

  /** True if the builder header shows a ₹ price and the required-count line. */
  async isHeaderDisplayed(): Promise<boolean> {
    return (
      (await this.isDisplayed(this.builderPrice)) &&
      (await this.isDisplayed(this.requiredCountText))
    )
  }

  async isSearchBoxDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.builderSearch)
  }

  /** Type into the deal-set search box (does not submit). */
  async searchInDeal(term: string): Promise<void> {
    await this.type(this.builderSearch, term)
  }

  // ---- Shutter + box add-to-cart (tagged in pdp_revamp build) ----
  private readonly shutterOpen = '~deal-shutter-open'
  private readonly shutterClose = '~deal-shutter-close'
  private readonly anyShutterSlot = '//*[contains(@content-desc,"deal-shutter-slot-")]'
  private readonly addToBoxNew = '~deal-add-to-box'
  private readonly addToBoxDisabled = '~deal-add-to-box-disabled'
  private readonly addBoxToCartBtn = '~deal-add-to-cart'

  async openShutter(): Promise<void> {
    await this.tap(this.shutterOpen)
  }
  async closeShutter(): Promise<void> {
    await this.tap(this.shutterClose)
  }
  async isShutterOpen(): Promise<boolean> {
    return this.isDisplayed(this.anyShutterSlot)
  }
  async shutterSlotCount(): Promise<number> {
    return (await this.els(this.anyShutterSlot)).length
  }

  /** Number of "Add To Box" buttons still enabled (new deal-add-to-box id). */
  private async addButtonCount(): Promise<number> {
    return (await this.els(this.addToBoxNew)).length
  }

  /** Add products until the box is full (the add buttons become disabled). */
  async fillBox(max = 6): Promise<void> {
    for (let i = 0; i < max; i++) {
      if (await this.isAddToBoxDisabled()) return
      const btns = await this.els(this.addToBoxNew)
      let tapped = false
      for (const b of btns) {
        if (await b.isDisplayed().catch(() => false)) {
          await b.click().catch(() => undefined)
          tapped = true
          break
        }
      }
      if (!tapped) return
      await driver.pause(1000)
    }
  }

  async isAddToBoxDisabled(): Promise<boolean> {
    return this.isDisplayed(this.addToBoxDisabled)
  }

  async isAddToCartBarVisible(): Promise<boolean> {
    return this.isDisplayed(this.addBoxToCartBtn)
  }

  async addBoxToCart(): Promise<void> {
    await this.tap(this.addBoxToCartBtn)
  }
}
