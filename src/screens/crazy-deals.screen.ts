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
}
