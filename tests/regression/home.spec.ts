import { NavigationScreen } from '@screens/navigation.screen.js'
import { HomeScreen } from '@screens/home.screen.js'
import { PdpScreen } from '@screens/pdp.screen.js'

/**
 * Home Page Module — High-priority cases from
 * Bellavita_App_QA_TestCases_AllModules.xlsx (sheet "10 Home Page Module"),
 * mapped to their BV_HOME_* IDs.
 *
 * The home feed exposes only the category-tab row (~Shop All / ~Perfumes / …)
 * and product-card blurbs (₹). Section arrows, hero-banner CTAs ("Shop Now"),
 * "Shop by Category" cards and merchandising banners are UNTAGGED / dynamic
 * (UUID) — so those cases are scaffolded as it.skip with reasons. Tab-switch
 * cases can only assert the feed stays in-place (theme/section changes are
 * untagged). Assertions use expect-webdriverio auto-waiting matchers.
 */
describe('Home Page Module (High)', () => {
  const nav = new NavigationScreen()
  const home = new HomeScreen()
  const pdp = new PdpScreen()

  before(async () => {
    const deadline = Date.now() + 60000
    while (Date.now() < deadline) {
      const count = await $$('//*[contains(@content-desc,"₹")]').length
      if (count > 0) break
      await driver.pause(2000)
    }
  })

  // Return to Home (Shop All tab) before each test.
  beforeEach(async () => {
    for (let i = 0; i < 5 && !(await nav.isTabDisplayed('Home')); i++) {
      await driver.back()
      await driver.pause(600)
    }
    if (await nav.isTabDisplayed('Home')) {
      await nav.tapHome()
      await home.isLoaded().catch(() => undefined)
      await driver.pause(600)
    }
  })

  // ---- ✅ Auto-now (implemented) ------------------------------------------

  it('BV_HOME_POS_001 Home loads on the Shop All tab with product content', async () => {
    // NOTE: theme colour / active-tab highlight are not exposed in the a11y
    // tree, so we assert the Shop All tab row + product grid render.
    await expect($('~Shop All')).toBeDisplayed()
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  // POS_002–006: tapping a category tab switches the feed in-place (the tab row
  // persists — we don't leave Home). Theme/section content is untagged.
  it('BV_HOME_POS_002 Perfumes tab switches the feed in-place', async () => {
    await home.tapCategory('Perfumes')
    await expect($('~Shop All')).toBeDisplayed()
    await expect($('//*[contains(@content-desc,"₹")]')).toBeDisplayed()
  })

  it('BV_HOME_POS_003 Gifting tab switches the feed in-place', async () => {
    await home.tapCategory('Gifting')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_004 Skincare tab switches the feed in-place', async () => {
    await home.tapCategory('Skincare')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_005 Bath & Body tab switches the feed in-place', async () => {
    await home.tapCategory('Bath & Body')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_006 Cosmetics tab switches the feed in-place', async () => {
    await home.tapCategory('Cosmetics')
    await expect($('~Shop All')).toBeDisplayed()
  })

  it('BV_HOME_POS_015 tapping a product card opens its PDP', async () => {
    await home.openFirstProduct()
    await expect($('//*[contains(@content-desc,"Reviews")]')).toBeDisplayed()
  })

  // NOTE: Home carousel quick-add doesn't reliably morph into a verifiable
  // qty stepper from the feed (unlike the Search results grid and the PLP),
  // so 014/048 stay skipped. The add-to-cart capability itself IS covered —
  // via Search (BV_SRCH_POS_012/039) and PLP (BV_PLP_POS_005/049).
  it.skip('BV_HOME_POS_014 Add to Cart in a carousel — BLOCKED: home carousel quick-add not reliably verifiable (covered on Search/PLP)', () => {})
  it.skip('BV_HOME_E2E_048 Perfumes carousel → add to cart → confirm in Cart — BLOCKED: home carousel quick-add not reliably verifiable (covered on Search/PLP)', () => {})

  // ---- ✅ Appmaker banners / heroes / card rows (stable UUID ids) ----------
  // Dev-provided ids (stable unless a banner is re-created in Appmaker). Heroes
  // for Skincare/Bath&Body/Cosmetics live on their own category tab. Tapping a
  // banner/card navigates to a collection (a ₹ product grid without ~Shop All).
  const BANNER = {
    heroShopAll: 'appmaker_slider-item-b0d751ab-0378-4cab-96bf-9a806b2fb393',
    bestsellersArrow: 'appmaker_banner-60f25aa3-0f8d-4d16-a7e7-6b2f0c4a216f',
    trendingArrow: 'appmaker_banner-92cee131-4509-4aca-a6f3-5660d498ff8b',
    newArrivalsArrow: 'appmaker_banner-52f4ab79-4264-47fc-bdb0-32726fdd2347',
    skincareHero: 'appmaker_banner-a9315d33-da9f-4cb4-b7ba-381d59bf7bff',
    bathBodyHero: 'appmaker_banner-003e1005-77de-4ca4-83b1-de5012edb9c8',
    cosmeticsHero: 'appmaker_banner-42a3c8ed-a830-44f3-9a5b-48f8a37823c0',
  }
  const ROW = {
    perfumesCategory: 'appmaker_imagescroller-1b0245d7-b95c-4aa7-9a43-0b1a8eebc271',
    skincareCategory: 'appmaker_imagescroller-1fdc90c4-4365-4dda-9c36-1a224e2bd449',
    bathBodyCategory: 'appmaker_imagescroller-554bd9d2-027c-4a26-9e43-3cfe28b1ba11',
    cosmeticsFeature: 'appmaker_imagescroller-6d16b3b0-304f-4ad4-aef5-5a1dcb647730',
    cosmeticsCategory2: 'appmaker_imagescroller-eb74532b-e66d-4a92-8927-87d4f0ccd298',
  }
  const grid = () => $('//*[contains(@content-desc,"₹")]')

  it('BV_HOME_POS_011 tapping the top hero banner opens a collection', async () => {
    await home.tapBanner(BANNER.heroShopAll)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_012 the "Shop Bestsellers" banner opens a collection', async () => {
    await home.tapBanner(BANNER.bestsellersArrow)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_019 the "Trending Now" banner opens a collection', async () => {
    await home.tapBanner(BANNER.trendingArrow)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_026 the "New Arrivals" banner opens a collection', async () => {
    await home.tapBanner(BANNER.newArrivalsArrow)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_028 Perfumes "Shop by Category" card opens a collection', async () => {
    await home.tapCategory('Perfumes')
    await driver.pause(1000)
    await home.tapCardInRow(ROW.perfumesCategory, 1)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_057 Skincare "Shop Now" hero opens a collection', async () => {
    await home.tapCategory('Skincare')
    await driver.pause(1000)
    await home.tapBanner(BANNER.skincareHero)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_058 Skincare "Shop by Category" card opens a collection', async () => {
    await home.tapCategory('Skincare')
    await driver.pause(1000)
    await home.tapCardInRow(ROW.skincareCategory, 1)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_065 Bath & Body "Shop Now" hero opens a collection', async () => {
    await home.tapCategory('Bath & Body')
    await driver.pause(1000)
    await home.tapBanner(BANNER.bathBodyHero)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_066 Bath & Body "Shop by Category" card opens a collection', async () => {
    await home.tapCategory('Bath & Body')
    await driver.pause(1000)
    await home.tapCardInRow(ROW.bathBodyCategory, 1)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_075 Cosmetics "Shop Now" hero opens a collection', async () => {
    await home.tapCategory('Cosmetics')
    await driver.pause(1000)
    await home.tapBanner(BANNER.cosmeticsHero)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_076 Cosmetics "Shop by Feature" card opens a collection', async () => {
    await home.tapCategory('Cosmetics')
    await driver.pause(1000)
    await home.tapCardInRow(ROW.cosmeticsFeature, 1)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  it('BV_HOME_POS_080 Cosmetics 2nd "Shop by Category" card opens a collection', async () => {
    await home.tapCategory('Cosmetics')
    await driver.pause(1000)
    await home.tapCardInRow(ROW.cosmeticsCategory2, 1)
    await driver.pause(2500)
    await expect(grid()).toBeDisplayed()
  })

  // 040–043 ("hero + cards + carousel pattern") assert each category tab renders
  // its merchandising feed; the specific hero/card taps are covered above.
  it('BV_HOME_POS_040 Gifting tab renders its merchandising feed', async () => {
    await home.tapCategory('Gifting')
    await expect(grid()).toBeDisplayed()
  })
  it('BV_HOME_POS_041 Skincare tab renders its merchandising feed', async () => {
    await home.tapCategory('Skincare')
    await expect(grid()).toBeDisplayed()
  })
  it('BV_HOME_POS_042 Bath & Body tab renders its merchandising feed', async () => {
    await home.tapCategory('Bath & Body')
    await expect(grid()).toBeDisplayed()
  })
  it('BV_HOME_POS_043 Cosmetics tab renders its merchandising feed', async () => {
    await home.tapCategory('Cosmetics')
    await expect(grid()).toBeDisplayed()
  })

  // Home carousel quick-add still doesn't reliably morph a stepper (covered on
  // Search/PLP), so these two remain skipped.
  it.skip('BV_HOME_POS_014 Add to Cart in a carousel — covered on Search/PLP', () => {})
  it.skip('BV_HOME_E2E_048 Perfumes carousel → add to cart → Cart — covered on Search/PLP', () => {})
})
