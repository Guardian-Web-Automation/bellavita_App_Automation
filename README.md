# Bellavita App Automation

Appium + WebdriverIO + TypeScript regression framework for the Bellavita
React Native app. Page Object Model, mirroring the web framework's structure.
**Android-first (local emulator); iOS deferred to Phase 3 (device farm).**

## What's in here

    config/                 WDIO configs (shared + android + ios)
    src/screens/            Page objects (base = functional; rest = stubs)
    src/utils/              context-manager (functional), gmail-otp + slack (port), logger
    src/data/               test data
    src/helpers/            staging API setup (seed points/coupons)
    tests/regression/       YOU author specs here (none shipped)

**Functional out of the box:** WDIO config (pre-seeded with the proven
emulator caps), `BaseScreen` interactions/gestures, `ContextManager` for the
GoKwik webview, Winston logger, Allure wiring.

**Stubs to fill in:** the five screen page objects (need real `testID`s),
`GmailOtp` + `SlackNotifier` (port from the web framework), `ApiSetup`, and
all specs.

## Prerequisites (already done in your setup)

Node, JDK, Android SDK + API-34 image, AVD, AEHD acceleration, Appium 3 +
uiautomator2 driver. App package: `com.bellavita.shopifyapps`.

## Setup

    npm install
    cp .env.example .env      # fill in device + credentials
    npm run typecheck         # sanity-check the scaffold compiles

## Run

Boot the emulator, then:

    npm run android           # runs specs under tests/regression/

(The `appium` service auto-starts the server. Remove it from
`wdio.shared.conf.ts` if you'd rather run `appium` yourself.)

    npm run report            # generate + open the Allure report

## Critical dependency — testID coverage

Selectors key off RN `testID` (the `~name` accessibility-id selector, which
works on both platforms). Untagged critical screens = a flaky suite. Audit
coverage on Login / Search / PDP / Cart / Loyalty / Checkout and get the dev
team to backfill — track it in parallel with authoring the golden-path spec.

## Watch-list coverage (from the Bellavita KB)

- **WL-01** ₹0 add-to-cart pricing — assert in `cart.screen.ts` (first app coverage)
- **WL-02 / WL-04** BellaPoints redemption — `loyalty.screen.ts` + `api-setup.ts` seeding
