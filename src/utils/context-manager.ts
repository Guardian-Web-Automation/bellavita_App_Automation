/**
 * ContextManager — native <-> webview context switching for the GoKwik
 * checkout handoff. Fully implemented; this is the one genuinely new piece
 * versus the web framework.
 *
 * Appium exposes 'NATIVE_APP' plus one or more 'WEBVIEW_*' contexts. GoKwik
 * runs in a WEBVIEW; switch in, drive it as a normal web DOM, switch back.
 */
export class ContextManager {
  static readonly NATIVE = 'NATIVE_APP'

  async getContexts(): Promise<string[]> {
    const contexts = await driver.getContexts()
    // WDIO types this loosely; normalise to string ids.
    return contexts.map((c) => (typeof c === 'string' ? c : c.id))
  }

  async currentContext(): Promise<string> {
    return driver.getContext() as Promise<string>
  }

  /** Poll until a WEBVIEW_* context appears (it lags the page load). */
  async waitForWebview(timeout = 20000, interval = 1000): Promise<string> {
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      const webview = (await this.getContexts()).find((c) => c.startsWith('WEBVIEW'))
      if (webview) return webview
      await driver.pause(interval)
    }
    throw new Error(`No WEBVIEW context appeared within ${timeout}ms`)
  }

  async switchToWebview(): Promise<void> {
    const webview = await this.waitForWebview()
    await driver.switchContext(webview)
  }

  async switchToNative(): Promise<void> {
    await driver.switchContext(ContextManager.NATIVE)
  }

  /**
   * Run a block in the webview context, guaranteeing a return to native
   * even if the block throws.
   */
  async runInWebview<T>(fn: () => Promise<T>): Promise<T> {
    await this.switchToWebview()
    try {
      return await fn()
    } finally {
      await this.switchToNative()
    }
  }
}
