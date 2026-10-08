import { BaseScreen } from './base.screen.js'

/**
 * NavigationScreen — the bottom tab bar (Home / Categories / Offers / Crazy Deals).
 *
 * Build v5.780+: the tabs now have real testIDs (~nav-home, ~nav-categories,
 * ~nav-offers, ~nav-crazy-deals, ~nav-whatsapp) — so we no longer key off the
 * visible labels (which flip-flopped between "Offers" and "Sale").
 */
export class NavigationScreen extends BaseScreen {
  private readonly homeTab = '~nav-home'
  private readonly categoriesTab = '~nav-categories'
  private readonly offersTab = '~nav-offers'
  private readonly crazyDealsTab = '~nav-crazy-deals'

  // Map the human labels tests pass to the stable nav testIDs.
  private tabSelector(label: string): string {
    const map: Record<string, string> = {
      Home: this.homeTab,
      Categories: this.categoriesTab,
      Offers: this.offersTab,
      Sale: this.offersTab,
      'Crazy Deals': this.crazyDealsTab,
      WhatsApp: '~nav-whatsapp'
    }
    return map[label] ?? `~${label}`
  }

  async tapHome(): Promise<void> {
    await this.tap(this.homeTab)
  }

  async tapCategories(): Promise<void> {
    await this.tap(this.categoriesTab)
  }

  async tapOffers(): Promise<void> {
    await this.tap(this.offersTab)
  }

  async tapCrazyDeals(): Promise<void> {
    await this.tap(this.crazyDealsTab)
  }

  /** Is the tab with the given label (or nav testID) currently displayed? */
  async isTabDisplayed(label: string): Promise<boolean> {
    return this.isDisplayed(this.tabSelector(label))
  }

  // ---- Hamburger drawer (top-left) ----
  // Fixed in build v5.777: the drawer button now has a real testID
  // (~menu-open) and the menu links are tagged (~menu-shop-all, ~menu-perfumes,
  // …) instead of the old "undefined-title".
  private readonly drawerButton = '~menu-open'
  private readonly closeDrawerButton = '~Close drawer'

  async openDrawer(): Promise<void> {
    await this.tap(this.drawerButton)
  }

  async closeDrawer(): Promise<void> {
    await this.tap(this.closeDrawerButton)
  }

  async isDrawerButtonDisplayed(): Promise<boolean> {
    return this.isDisplayed(this.drawerButton)
  }

  async waitForDrawerButton(timeout = 20000): Promise<void> {
    await this.waitForDisplayed(this.drawerButton, timeout)
  }

  /** Open the drawer and tap a menu link by its testID slug (e.g. "shop-all"). */
  async openMenuItem(slug: string): Promise<void> {
    await this.openDrawer()
    await this.tap(`~menu-${slug}`)
  }

  async isMenuItemDisplayed(slug: string): Promise<boolean> {
    return this.isDisplayed(`~menu-${slug}`)
  }

  /**
   * Open the drawer and scroll it until a (sub-)menu item is visible.
   * Sub-category items use slugs like "perfumes-all-perfumes", "perfumes-women".
   */
  async revealMenuItem(slug: string, max = 6): Promise<boolean> {
    if (!(await this.isDisplayed(this.closeDrawerButton))) {
      await this.openDrawer()
      await driver.pause(800)
    }
    for (let i = 0; i < max; i++) {
      if (await this.isMenuItemDisplayed(slug)) return true
      await this.swipeDown()
      await driver.pause(500)
    }
    return this.isMenuItemDisplayed(slug)
  }

  /** Open the drawer, reveal a (sub-)menu item, and tap it. */
  async openMenuItemScrolled(slug: string): Promise<void> {
    await this.revealMenuItem(slug)
    await this.tap(`~menu-${slug}`)
  }
}
