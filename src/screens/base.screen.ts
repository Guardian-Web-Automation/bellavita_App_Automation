/**
 * BaseScreen — shared interactions every page object inherits.
 *
 * This is fully implemented (generic, reusable) — you should not need to
 * touch it often. Selector convention across the framework:
 *   RN `testID` maps to the accessibility id on BOTH platforms, so the
 *   `~foo` selector (WDIO shorthand for accessibility id) is cross-platform.
 *   Prefer `~testID`; fall back to xpath/UiSelector only when a screen
 *   isn't tagged (and log that gap for the testID-audit backlog).
 */
export class BaseScreen {
  protected get defaultTimeout(): number {
    return 15000
  }

  /** Resolve a selector string to a WDIO element. */
  protected el(selector: string): ChainablePromiseElement {
    return $(selector)
  }

  protected els(selector: string): ChainablePromiseArray {
    return $$(selector)
  }

  async waitForDisplayed(selector: string, timeout = this.defaultTimeout): Promise<void> {
    await this.el(selector).waitForDisplayed({ timeout })
  }

  async isDisplayed(selector: string): Promise<boolean> {
    try {
      return await this.el(selector).isDisplayed()
    } catch {
      return false
    }
  }

  async tap(selector: string, timeout = this.defaultTimeout): Promise<void> {
    const element = this.el(selector)
    // NOTE: `waitForClickable` is web/webview-only in WDIO — it throws in a
    // native Appium context. For native taps, wait for the element to be
    // displayed (available natively), then click.
    await element.waitForDisplayed({ timeout })
    await element.click()
  }

  async type(selector: string, text: string, timeout = this.defaultTimeout): Promise<void> {
    const element = this.el(selector)
    await element.waitForDisplayed({ timeout })
    await element.setValue(text)
  }

  async getText(selector: string, timeout = this.defaultTimeout): Promise<string> {
    const element = this.el(selector)
    await element.waitForDisplayed({ timeout })
    return element.getText()
  }

  /** Hide the soft keyboard if it's up (no-op if it isn't). */
  async hideKeyboard(): Promise<void> {
    try {
      if (await driver.isKeyboardShown()) {
        await driver.hideKeyboard()
      }
    } catch {
      /* not all contexts support this; ignore */
    }
  }

  // ---- Gestures (UiAutomator2 mobile: commands; add iOS equivalents in Phase 3) ----

  async swipeUp(): Promise<void> {
    await this.scrollGesture('up')
  }

  async swipeDown(): Promise<void> {
    await this.scrollGesture('down')
  }

  private async scrollGesture(direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
    const { width, height } = await driver.getWindowSize()
    await driver.execute('mobile: scrollGesture', {
      left: Math.round(width * 0.1),
      top: Math.round(height * 0.2),
      width: Math.round(width * 0.8),
      height: Math.round(height * 0.6),
      direction,
      percent: 0.75
    })
  }

  /**
   * Scroll a scrollable container until an element with the given text is
   * visible (Android UiScrollable). Handy for long PDPs / cart lists.
   */
  async scrollToText(text: string): Promise<void> {
    const selector =
      `android=new UiScrollable(new UiSelector().scrollable(true))` +
      `.scrollIntoView(new UiSelector().textContains("${text}"))`
    await this.el(selector).waitForExist({ timeout: this.defaultTimeout })
  }
}
