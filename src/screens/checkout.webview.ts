import { BaseScreen } from './base.screen.js'
import { ContextManager } from '@utils/context-manager.js'

/**
 * GoKwikCheckoutScreen — the GoKwik checkout renders inside a WEBVIEW, so this
 * screen does NOT use native (~testID) selectors. Everything inside
 * `runInWebview` runs against the web DOM with CSS/xpath — which is exactly
 * why the GoKwik page-object logic from the Playwright web framework should
 * largely transfer here.
 *
 * STUB: fill in the real GoKwik web selectors + flow. Payments are sandbox-only.
 */
export class GoKwikCheckoutScreen extends BaseScreen {
  private ctx = new ContextManager()

  // Native trigger that hands off to the webview (this one IS a native testID).
  private readonly checkoutButton = '~checkout-button' // TODO: confirm real testID

  /** Tap the native "checkout" control that opens the GoKwik webview. */
  async openCheckout(): Promise<void> {
    await this.tap(this.checkoutButton)
    await this.ctx.waitForWebview()
  }

  /**
   * Drive the GoKwik web checkout. Port selectors from the Playwright
   * GoKwik page object. Runs in webview context, then restores native.
   */
  async completeCheckout(/* details: CheckoutDetails */): Promise<void> {
    await this.ctx.runInWebview(async () => {
      // TODO: port from web framework, e.g.:
      // await $('input#mobile').setValue(details.phone)
      // await $('button=Continue').click()
      // ...OTP, address, sandbox payment...
    })
  }

  /** Read the order-confirmation state (decide: native screen or webview?). */
  async getOrderConfirmation(): Promise<string> {
    // TODO: implement once the post-payment screen is known
    return ''
  }
}
