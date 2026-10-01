# Bellavita App — Automation Enablement Request (for the Dev Team)

**From:** QA Automation · **App:** `com.bellavita.shopifyapps` (Android) · **Date:** 2026-09-28

---

## 1. In plain words (read this first)

Our automated tests find a button or field by a small, invisible **name tag** on it
(called a `testID`). It's one extra word in the code per element, and it never shows
to the user.

Right now:
- **Most buttons in the app have no name tag**, so tests have to guess them by the
  visible text ("Add To Cart", "Sale", …). That's fragile — e.g. marketing recently
  renamed the **"Offers" tab to "Sale"** and it instantly broke a test.
- **Some important buttons are completely invisible to automation** — the tools
  literally cannot see them in the screen's structure. This includes the **Add to
  Cart button on the product page, Sort, Filter, Wishlist, the quantity +/- stepper,
  variant pop-ups, and the product-page tabs.**

Because of this, a large share of the high-priority test cases **cannot be automated
yet** — they're written but "parked" (skipped) with the reason recorded.

**What we need:** add a name tag (`testID`) to the elements listed below, and make the
currently-invisible controls visible to accessibility. Each is a small, local change.
Once done, the parked tests start working with no rework on our side — and they stop
breaking when button text changes.

---

## 2. The three kinds of fixes

| Priority | Problem | Fix | Effort |
|---|---|---|---|
| **P1** | Element is on screen but has **no `testID`** | Add a `testID` | 1 line each |
| **P2** | Control is **not in the accessibility tree at all** (tests can't see it) | Make it accessible **and** add a `testID` | small, per control |
| **P3** | Element has a **random/UUID id** that changes each build | Give it a **stable `testID`** | 1 line each |

> How to add one (React Native) — use the **same string** for both props so our
> cross-platform `~selector` works on Android and iOS:
> ```jsx
> // before
> <TouchableOpacity onPress={addToCart}> … </TouchableOpacity>
> // after
> <TouchableOpacity testID="pdp-add-to-cart" accessibilityLabel="pdp-add-to-cart" accessible onPress={addToCart}> … </TouchableOpacity>
> ```
> For **P2** controls, also make sure no ancestor hides them from accessibility
> (`accessibilityElementsHidden`, `importantForAccessibility="no-hide-descendants"`),
> and that the control itself is `accessible`.
>
> **Naming convention:** `screen-element`, kebab-case, e.g. `pdp-add-to-cart`,
> `plp-sort-button`, `cart-qty-plus`. Once set, treat it as a contract — renaming it
> breaks the test that uses it.

---

## 3. P2 — Make these controls accessible + add a `testID` (biggest unlock)

These controls are **absent from the accessibility tree**, so no test can reach them.
This is the highest-value bucket.

| Control | Screen | `testID` to add | Unlocks (example case IDs) |
|---|---|---|---|
| **Add to Cart (sticky bottom bar)** | PDP | `pdp-add-to-cart` | BV_PDP_POS_060, 015, 065; BV_HOME_014; BV_SRCH_012/039; BV_PLP_005 |
| Quantity **+ / −** stepper | PDP & Cart | `pdp-qty-plus` / `pdp-qty-minus`, `cart-qty-plus` / `cart-qty-minus` | BV_PDP_015; BV_CART_013/014/038 |
| **Sort** button + options | PLP & Search | `plp-sort-button`, `sort-option-price-asc`, `sort-option-price-desc`, … | BV_PLP_029-036; BV_SRCH_055-059 |
| **Filter** button + panel/tabs/apply | PLP & Search | `plp-filter-button`, `filter-tab-<name>`, `filter-option-<name>`, `filter-apply` | BV_PLP_014-025; BV_SRCH_044-051 |
| **Variant pop-up** (Select Option/Color) + CTA | PLP, Search, PDP | `product-variant-cta`, `variant-popup`, `variant-option-<name>`, `variant-confirm` | BV_PLP_006-009/048; BV_SRCH_013/015/040; BV_PDP_020/056 |
| Product-page **tabs** (Key Benefits / Reviews / View Similar) | PDP | `pdp-tab-<name>` | BV_PDP_038/066/067 |
| **Wishlist / Save** toggle | PLP, PDP | `product-wishlist` | (PLP/PDP wishlist cases) |
| **Write a Review** + form fields | PDP | `pdp-write-review`, `review-rating`, `review-title`, `review-description`, `review-add-image` | BV_PDP_050/SEC_081 |
| **Add Combo / bundle** add | PDP, Cart | `pdp-add-combo`, `cart-bundle-add` | BV_PDP_030; BV_CART_022-025/036 |
| **Remove item** from cart | Cart | `cart-remove-item` | BV_CART_001/007 (needed to reach the empty-cart state) |

---

## 4. P1 — Add a `testID` (element is visible but untagged)

| Element | Screen | `testID` to add | Unlocks (example case IDs) |
|---|---|---|---|
| **Quick-add "Add To Cart"** on a card (bound to its card) | Home, PLP, Search | `product-quick-add` | BV_HOME_014; BV_PLP_005; BV_SRCH_012/039 |
| **Product card** (each) + child **price** / **MRP** | Home, PLP, Search, Cart | `product-card`, `product-price`, `product-mrp` | BV_PLP price integrity; BV_CART_012; card→PDP reliability |
| **Section "see more" arrows** (Shop Bestsellers / Trending / New Arrival) | Home | `home-section-arrow-<name>` | BV_HOME_012/019/026 |
| **"Shop by Category" cards** (Face Wash, Shower Gels, …) | Home | `home-category-card-<name>` | BV_HOME_028/058/066/076/080 |
| **Hero-banner "Shop Now" CTA** | Home | `home-hero-cta` | BV_HOME_040-043/057/065/075 |
| **Bill-details rows** (Items total, Saved, Delivery, Grand Total) | Cart | `cart-bill-items`, `cart-bill-saved`, `cart-bill-delivery`, `cart-bill-grand-total` | BV_CART_017/019/025 |
| **Combo-discount tag** on eligible items | Cart | `cart-combo-tag` | BV_CART_024/025 |
| **Recent-search** items + **Trending** chips + **Category** suggestions | Search | `search-recent-item`, `search-trending-chip`, `search-suggestion-category` | BV_SRCH_003/006/009/022/023 |
| **Bottom-nav tabs** (currently keyed by text — fragile) | All | `nav-home`, `nav-categories`, `nav-sale`, `nav-crazy-deals`, `nav-whatsapp` | Footer module + prevents label-drift breakage |
| **Selected/active** state on tabs & chips | Home, PLP | expose active state (e.g. `accessibilityState={{selected:true}}`) | active-tab-highlight assertions (BV_HOME_001, BV_FTR_003) |
| **Image carousel** + current index | PDP | `pdp-carousel`, `pdp-carousel-image` | BV_PDP_001 |
| **Out-of-stock** state on a card | PLP | `product-out-of-stock` (+ disabled ATC) | BV_PLP_NEG_012 |

---

## 5. P3 — Replace random/UUID ids with stable `testID`s

These render today with ids like `appmaker_banner-60f25aa3-…` or bare UUIDs that
change per build/session, so tests can't rely on them.

| Element | Screen | Give it | Unlocks |
|---|---|---|---|
| Home/Offers **merchandising banners** | Home, Offers | `home-banner-<slug>` / `offer-banner-<slug>` | BV_HOME_011; BV_FTR_006/014 |
| **Category grid tiles** (Bestsellers, New Treasures, …) | Categories page | `category-tile-<slug>` | BV_FTR_004 (deep grid) |
| Home **image sliders / scrollers** | Home | `home-slider-<slug>` | banner-driven navigation cases |

---

## 6. Bigger items outside the current "no-login" automation scope

These block whole modules and need more than a tag:

1. **Login / phone-OTP** is not automatable end-to-end yet. To enable it we need
   **either** a test account with a fixed/bypass OTP in staging, **or** OTP delivered
   to an inbox/API our harness can read. This unblocks the **Login, Profile,
   BellaCash** modules and every logged-in Cart/Checkout case (~40+ cases).
2. **Checkout (GoKwik) runs in a webview.** The webview's inputs/buttons need stable
   ids (or a documented sandbox flow) for us to drive payment/address/coupon steps.
   Unblocks the **Checkout module** (~27 cases).
3. **Product/spec confirmations — ANSWERED by the team (2026-09-28):**
   - Hamburger menu **does exist** (top-left ☰). Its button carries an id
     (`home-drawer-button`) but **automation can't resolve it** — see §6a; it needs
     a reliable `testID` **and** `accessibilityLabel`.
   - "Offers" → **"Sale"** is intentional (carnival sale). *No action; but see the
     nav-testID ask in §4 so text renames stop breaking tests.*
   - **Sort / Filter DO exist** on the PLP reached via **Hamburger → Shop All**
     (a different screen from the home "Shop All" tab). They still need testIDs — §3.

---

## 6a. 🔴 Hamburger menu — two blockers found

### (i) The drawer button isn't resolvable by automation
The top-left ☰ button can only be tapped by raw screen coordinates today. In test
runs it did **not** resolve by accessibility-id (`~home-drawer-button`) **or** by
resource-id — so a stable test can't open the menu. **Fix:** give the drawer button
a real `testID="menu-open"` **and** `accessibilityLabel="menu-open"` (same string),
and make sure it's consistently present on the Home landing.

### (ii) Menu links have no accessible title

When the drawer is open, every category/collection link (Shop All, Perfumes, Makeup,
Skincare, sub-categories, …) exposes its accessibility name as the literal string
**`undefined-title`** instead of its real text. Effects:

- **Screen readers announce "undefined-title"** for every menu row — an accessibility
  defect for real users, not just automation.
- Automation **cannot select any menu category by name**, which blocks the whole
  Hamburger-navigation path **and** the Sort/Filter PLP (only reachable via
  Hamburger → Shop All). This single bug blocks ~10+ high-priority cases.

**Fix:** give each drawer menu row its real title and a `testID`, e.g.
`menu-shop-all`, `menu-perfumes`, `menu-makeup`, `menu-skincare`, and for the
expand arrows `menu-expand-perfumes`, sub-items `menu-perfumes-women`, etc.
(Properly-labelled drawer items like `Login / Register`, `My Orders`, `FAQs`,
`Support` already work — the category rows are the broken ones.)

> Fixing this **also unblocks Sort & Filter** automation, because their PLP is only
> reachable through this menu.

---

## 7. Roughly what each bucket unlocks

| If dev does… | Approx. High-priority cases that become automatable |
|---|---|
| **P1 + P3** (add tags / stable ids) | the bulk of Home, Search, PLP, Cart browse + quick-add + bill cases |
| **P2** (expose hidden controls + tag) | PDP add-to-cart, variants, quantity, sort, filter, wishlist, tabs |
| **Login/OTP** (#6.1) | Login, Profile, BellaCash, logged-in Cart |
| **Checkout webview** (#6.2) | Checkout module |

**Today (no changes):** ~26 of the 204 High cases are automatable, because so little
is tagged/exposed. With **P1–P3 done**, the large majority of the browse/PLP/PDP/Cart
High cases open up; login + checkout are the remaining big rocks.

---

## 8. TL;DR for the dev

1. Add `testID` (same string as `accessibilityLabel`) to every element in §3, §4, §5.
2. For §3 items, also ensure they're **visible to accessibility** (not hidden by a
   parent), because tests can't even see them today.
3. Answer the three product questions in §6.3.
4. Use the `screen-element` kebab-case convention and don't rename tags once shipped.

Anything tagged here maps 1:1 to a parked test that will start running the moment the
tag lands — no extra QA work required to "connect" them.
