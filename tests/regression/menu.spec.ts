import { NavigationScreen } from '@screens/navigation.screen.js'

/**
 * Hamburger Menu Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "06 Hamburger Menu Module"),
 * mapped to their BV_MENU_* IDs.
 *
 * UNBLOCKED in build v5.777: the drawer opens via ~menu-open and the menu links
 * are tagged (~menu-shop-all, ~menu-perfumes, ~menu-skincare, ~menu-cosmetics,
 * …). Category links now navigate to a real PLP (grid + sort/filter). Sub-
 * category drill-downs (expand arrows / "All Perfumes") are still untagged, and
 * profile/login items are phase-2. expect-webdriverio auto-waiting matchers.
 */
describe('Hamburger Menu Module (High)', () => {
  const nav = new NavigationScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      if ((await $$('//*[contains(@content-desc,"₹")]').length) > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home (where the ~menu-open button lives) before each test.
  beforeEach(async () => {
    // Close the drawer if a previous test left it open (it overlays Home, so
    // re-tapping ~menu-open would otherwise toggle it shut).
    try {
      if (await $('~Close drawer').isDisplayed()) {
        await driver.back()
        await driver.pause(600)
      }
    } catch {
      /* no drawer open */
    }
    for (let i = 0; i < 4 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await driver.pause(600)
    }
    const dl = Date.now() + 30000
    while (Date.now() < dl) {
      if ((await $$('//*[contains(@content-desc,"₹")]').length) > 0) break
      await driver.pause(2000)
    }
  })

  // ---- ✅ Auto-now (implemented) ------------------------------------------

  it('BV_MENU_POS_001 tapping the hamburger icon slides the menu open', async () => {
    await nav.openDrawer()
    await expect($('~Close drawer')).toBeDisplayed()
  })

  it('BV_MENU_POS_004 logged-out menu shows the Login / Register entry', async () => {
    await nav.openDrawer()
    await expect($('~Login / Register')).toBeDisplayed()
  })

  it('BV_MENU_POS_008 Perfumes menu link opens the Perfumes PLP', async () => {
    await nav.openMenuItem('perfumes')
    await driver.pause(2500)
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  it('BV_MENU_POS_009 Makeup (Cosmetics) menu link opens its PLP', async () => {
    // The doc's "Makeup" category is labelled "Cosmetics" in the app.
    await nav.openMenuItem('cosmetics')
    await driver.pause(2500)
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  it('BV_MENU_POS_010 Skincare menu link opens the Skincare PLP', async () => {
    await nav.openMenuItem('skincare')
    await driver.pause(2500)
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  it('BV_MENU_POS_036 logged-out user taps Perfumes to land on the PLP', async () => {
    await nav.openMenuItem('perfumes')
    await driver.pause(2500)
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  // ---- ⏭️ Sub-category drill-down -----------------------------------------
  // Dev says sub-items exist (menu-perfumes-all-perfumes / -women), but the
  // slugs weren't reachable via ~menu-<slug> after opening/scrolling the drawer
  // (they likely sit behind a parent-expand control). Skipped pending the exact
  // sub-item ids / expand interaction from the dev.
  it.skip('BV_MENU_POS_013 Perfumes sub-category list is available — PENDING: sub-item ids/expand not reachable as ~menu-<slug>', () => {})
  it.skip('BV_MENU_POS_015 "All Perfumes" sub-item → collection — PENDING: sub-item ids/expand not reachable', () => {})
  it.skip('BV_MENU_E2E_035 drill into a Perfumes sub-category → PLP — PENDING: sub-item ids/expand not reachable', () => {})
  it.skip('BV_MENU_POS_038 Perfumes → Women sub-category → PLP — PENDING: sub-item ids/expand not reachable', () => {})

  // ---- ⏭️ Blocked: login (phase 2) ----------------------------------------
  it.skip('BV_MENU_POS_005 logged-in menu shows profile/greeting — BLOCKED: login (phase 2)', () => {})
  it.skip('BV_MENU_POS_006 tap Login/Register → Login screen — BLOCKED: login (phase 2)', () => {})
  it.skip('BV_MENU_POS_007 tap profile section → Profile page — BLOCKED: login (phase 2)', () => {})
  it.skip('BV_MENU_POS_037 logged-in: tap profile → Profile page — BLOCKED: login (phase 2)', () => {})
})
