# Bellavita App — Quick Ask for the Dev Team (QA Automation)

**TL;DR:** Automated tests can currently cover only ~30 of the 204 high-priority
cases — not because the app is broken, but because most buttons have no stable
"name tag" (`testID`) for automation to find, and a few controls are invisible to
automation entirely. The fixes below are small and mostly one line each. Every tag
you add maps to a test that's **already written** and switches on automatically —
no rework on QA's side.

*(Full element-by-element list with exact test IDs and the cases each one unlocks is
in `DEV_TESTID_BACKFILL.md`.)*

---

## Priority 1 — Hamburger menu (highest impact)

- The ☰ button opens by tapping but has **no reliable `testID`** → add
  `testID="menu-open"` **and** `accessibilityLabel="menu-open"`.
- 🔴 **Bug:** every menu link (Shop All, Perfumes, Skincare, …) shows its name as
  **"undefined-title"** — screen readers literally announce "undefined-title".
  Give each menu row its real title + a `testID` (`menu-shop-all`, `menu-perfumes`, …).
- **Why it matters:** this one fix also unblocks **Sort & Filter**, because that PLP
  is only reachable through the menu.

## Priority 2 — Expose the "invisible" controls

These don't appear to automation at all. Add a `testID` **and** make sure they're not
hidden from accessibility:
**PDP Add-to-Cart, Sort, Filter, Wishlist, the quantity +/- stepper, and variant pop-ups.**

## Priority 3 — Tag the visible-but-untagged elements

Add a `testID` to: product cards + their **price / MRP**, the **quick-add** button,
home **banners / section arrows / category cards**, and the cart **bill-detail rows**
(Items total, Saved, Delivery, Grand Total).

## One technical note (important)

In React Native, `testID` maps to Android's **resource-id only**. Please also set
`accessibilityLabel` to the **same value**, so the tests work on both Android and iOS.

**Convention:** `screen-element`, e.g. `pdp-add-to-cart`, `plp-sort-button`,
`cart-qty-plus`. Don't rename a `testID` once it ships — renaming breaks the test.

---

## Phase 2 (later — not now)

- Login / OTP: a staging test account with a fixed/bypass OTP (or an OTP inbox/API
  we can read).
- Checkout (GoKwik) runs in a webview — needs stable ids inside it.

---

## Quick confirmations already received (thanks)

- Hamburger menu exists (top-left ☰). ✅
- "Offers" tab renamed to **"Sale"** — intentional (carnival). ✅
- Sort / Filter **do** exist on the Hamburger → Shop All PLP. ✅ (blocked today only by
  the "undefined-title" menu bug above)
