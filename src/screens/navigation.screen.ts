import { BaseScreen } from './base.screen.js'

/**
 * NavigationScreen — the bottom tab bar (Home / Categories / Offers / Crazy Deals).
 *
 * INTERIM SELECTORS: these key off the tabs' visible accessibility labels
 * (`~Home`, etc.), validated live via scripts/audit.mjs. They are text-based
 * and therefore tied to the current copy — replace each with a real, stable
 * RN `testID` (e.g. `~nav-home`) once the dev team backfills them. Track this
 * in the testID-audit backlog alongside the other screens.
 */
export class NavigationScreen extends BaseScreen {
  private readonly homeTab = '~Home'                // TODO: replace with ~nav-home testID
  private readonly categoriesTab = '~Categories'    // TODO: replace with ~nav-categories testID
  // The 3rd tab's label flip-flops between "Offers" and "Sale" across builds
  // (carnival campaigns) — a live example of why text labels are brittle. Match
  // either so the tests survive the rename until a real testID is added.
  private readonly offersTab = 'android=new UiSelector().descriptionMatches("Offers|Sale")' // TODO: ~nav-offers testID
  private readonly crazyDealsTab = '~Crazy Deals'   // TODO: replace with ~nav-crazy-deals testID

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

  /** Is the tab with the given visible label currently displayed? */
  async isTabDisplayed(label: string): Promise<boolean> {
    return this.isDisplayed(`~${label}`)
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
}
